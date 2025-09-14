import modal
import sys
import io
import traceback
import subprocess
import tempfile
import os
from contextlib import redirect_stdout, redirect_stderr
from typing import Dict, Any
from pydantic import BaseModel

# Create Modal app
app = modal.App("code-executor")

# Define the image with necessary packages
image = modal.Image.debian_slim().pip_install([
    "anthropic",
    "numpy",
    "pandas", 
    "matplotlib",
    "requests",
    "beautifulsoup4",
    "pillow",
    "scikit-learn",
    "seaborn",
])

# Separate web image for endpoints
web_image = modal.Image.debian_slim().pip_install([
    "fastapi[all]",
    "anthropic"
])

@app.function(
    image=image,
    timeout=30,  # 30 second timeout
    memory=1024,  # 1GB memory limit
)
def execute_code(code: str, language: str = "python") -> Dict[str, Any]:
    """
    Execute single file code (legacy function for backward compatibility)
    """
    return execute_multi_file({"main": code}, language, "test")

@app.function(
    image=image,
    timeout=30,  # 30 second timeout
    memory=1024,  # 1GB memory limit
)
def execute_multi_file(files: Dict[str, str], language: str = "python", entry_point: str = "test") -> Dict[str, Any]:
    """
    Execute multi-file code with interdependencies in a sandboxed environment.
    
    Args:
        files: Dictionary mapping file names to their content
        language: Programming language (currently supports 'python', 'javascript', 'bash')
        entry_point: The main file to execute (key in files dict)
    
    Returns:
        Dictionary with execution results including output, errors, and success status
    """
    print(f"[DEBUG] execute_multi_file called with:")
    print(f"[DEBUG] Language: {language}")
    print(f"[DEBUG] Entry point: {entry_point}")
    print(f"[DEBUG] Files: {list(files.keys())}")
    for filename, content in files.items():
        print(f"[DEBUG] File '{filename}': {content[:100]}...")
    
    result = {
        "success": False,
        "output": "",
        "error": "",
        "execution_time": 0,
        "files_created": []
    }
    
    try:
        import time
        start_time = time.time()
        
        if language.lower() == "python":
            result = _execute_python_multi_file(files, entry_point)
        elif language.lower() in ["javascript", "js", "node"]:
            result = _execute_javascript_multi_file(files, entry_point)
        elif language.lower() in ["bash", "shell", "sh"]:
            result = _execute_bash_multi_file(files, entry_point)
        else:
            result["error"] = f"Unsupported language: {language}"
            return result
            
        result["execution_time"] = time.time() - start_time
        
    except Exception as e:
        result["error"] = f"Execution failed: {str(e)}"
        result["success"] = False
    
    return result

def _execute_python_multi_file(files: Dict[str, str], entry_point: str) -> Dict[str, Any]:
    """Execute Python code with multiple files and dependencies."""
    result = {"success": False, "output": "", "error": "", "files_created": []}
    
    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    # Create temporary directory for files
    temp_dir = tempfile.mkdtemp()
    created_files = []
    
    try:
        # Redirect output streams
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
        
        # Write all files to temporary directory
        for filename, content in files.items():
            # Ensure proper file extension
            if not filename.endswith('.py'):
                filename = f"{filename}.py"
            
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, 'w') as f:
                f.write(content)
            created_files.append(file_path)
            result["files_created"].append(filename)
        
        # Add temp directory to Python path for imports
        sys.path.insert(0, temp_dir)
        
        # Create a restricted globals environment
        safe_globals = {
            "__builtins__": {
                "print": print,
                "len": len,
                "range": range,
                "str": str,
                "int": int,
                "float": float,
                "list": list,
                "dict": dict,
                "tuple": tuple,
                "set": set,
                "bool": bool,
                "abs": abs,
                "max": max,
                "min": min,
                "sum": sum,
                "sorted": sorted,
                "enumerate": enumerate,
                "zip": zip,
                "map": map,
                "filter": filter,
                "type": type,
                "isinstance": isinstance,
                "hasattr": hasattr,
                "getattr": getattr,
                "setattr": setattr,
                "dir": dir,
                "help": help,
                "__import__": __import__,
                "input": lambda prompt="": "",
                "ValueError": ValueError,
                "TypeError": TypeError,
                "KeyError": KeyError,
                "IndexError": IndexError,
                "AttributeError": AttributeError,
                "NameError": NameError,
                "ZeroDivisionError": ZeroDivisionError,
                "FileNotFoundError": FileNotFoundError,
                "Exception": Exception,
                "BaseException": BaseException,
            },
            "__name__": "__main__",
            "__file__": os.path.join(temp_dir, f"{entry_point}.py")
        }
        
        # Allow common safe imports
        safe_globals.update({
            "math": __import__("math"),
            "random": __import__("random"),
            "json": __import__("json"),
            "datetime": __import__("datetime"),
            "time": __import__("time"),
            "re": __import__("re"),
            "os": __import__("os"),
            "sys": __import__("sys"),
        })
        
        # Try to import optional packages if available
        try:
            safe_globals["numpy"] = __import__("numpy")
            safe_globals["np"] = __import__("numpy")
        except ImportError:
            pass
            
        try:
            safe_globals["pandas"] = __import__("pandas")
            safe_globals["pd"] = __import__("pandas")
        except ImportError:
            pass
            
        try:
            safe_globals["matplotlib"] = __import__("matplotlib")
            safe_globals["plt"] = __import__("matplotlib.pyplot")
        except ImportError:
            pass
        
        # Execute the entry point file
        entry_file = entry_point if entry_point.endswith('.py') else f"{entry_point}.py"
        if entry_file not in [os.path.basename(f) for f in created_files]:
            result["error"] = f"Entry point '{entry_point}' not found in provided files"
            return result
        
        entry_code = files.get(entry_point, files.get(entry_file.replace('.py', '')))
        exec(entry_code, safe_globals)
        
        result["output"] = stdout_capture.getvalue()
        error_output = stderr_capture.getvalue()
        
        if error_output:
            result["error"] = error_output
        else:
            result["success"] = True
            
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
    finally:
        # Restore original streams
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # Clean up temporary files and directory
        for file_path in created_files:
            try:
                os.unlink(file_path)
            except:
                pass
        try:
            os.rmdir(temp_dir)
        except:
            pass
        
        # Remove temp directory from Python path
        if temp_dir in sys.path:
            sys.path.remove(temp_dir)
    
    return result

def _execute_python(code: str) -> Dict[str, Any]:
    """Execute Python code safely."""
    result = {"success": False, "output": "", "error": ""}
    
    # Capture stdout and stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    try:
        # Redirect output streams
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
        
        # Create a restricted globals environment
        safe_globals = {
            "__builtins__": {
                "print": print,
                "len": len,
                "range": range,
                "str": str,
                "int": int,
                "float": float,
                "list": list,
                "dict": dict,
                "tuple": tuple,
                "set": set,
                "bool": bool,
                "abs": abs,
                "max": max,
                "min": min,
                "sum": sum,
                "sorted": sorted,
                "enumerate": enumerate,
                "zip": zip,
                "map": map,
                "filter": filter,
                "type": type,
                "isinstance": isinstance,
                "hasattr": hasattr,
                "getattr": getattr,
                "setattr": setattr,
                "dir": dir,
                "help": help,
                "__import__": __import__,
                "input": lambda prompt="": "", # Mock input that returns empty string
                "ValueError": ValueError,
                "TypeError": TypeError,
                "KeyError": KeyError,
                "IndexError": IndexError,
                "AttributeError": AttributeError,
                "NameError": NameError,
                "ZeroDivisionError": ZeroDivisionError,
                "FileNotFoundError": FileNotFoundError,
                "Exception": Exception,
                "BaseException": BaseException,
            },
            "__name__": "__main__"
        }
        
        # Allow common safe imports
        safe_globals.update({
            "math": __import__("math"),
            "random": __import__("random"),
            "json": __import__("json"),
            "datetime": __import__("datetime"),
            "time": __import__("time"),
            "re": __import__("re"),
            "os": __import__("os"),
            "sys": __import__("sys"),
        })
        
        # Try to import optional packages if available
        try:
            safe_globals["numpy"] = __import__("numpy")
            safe_globals["np"] = __import__("numpy")
        except ImportError:
            pass
            
        try:
            safe_globals["pandas"] = __import__("pandas")
            safe_globals["pd"] = __import__("pandas")
        except ImportError:
            pass
            
        try:
            safe_globals["matplotlib"] = __import__("matplotlib")
            safe_globals["plt"] = __import__("matplotlib.pyplot")
        except ImportError:
            pass
        
        # Execute the code
        exec(code, safe_globals)
        
        result["output"] = stdout_capture.getvalue()
        error_output = stderr_capture.getvalue()
        
        if error_output:
            result["error"] = error_output
        else:
            result["success"] = True
            
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
    finally:
        # Restore original streams
        sys.stdout = old_stdout
        sys.stderr = old_stderr
    
    return result

def _execute_javascript_multi_file(files: Dict[str, str], entry_point: str) -> Dict[str, Any]:
    """Execute JavaScript code with multiple files and dependencies using Node.js."""
    result = {"success": False, "output": "", "error": "", "files_created": []}
    
    # Create temporary directory for files
    temp_dir = tempfile.mkdtemp()
    created_files = []
    
    try:
        # Write all files to temporary directory
        for filename, content in files.items():
            # Ensure proper file extension
            if not filename.endswith('.js'):
                filename = f"{filename}.js"
            
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, 'w') as f:
                f.write(content)
            created_files.append(file_path)
            result["files_created"].append(filename)
        
        # Determine entry point file
        entry_file = entry_point if entry_point.endswith('.js') else f"{entry_point}.js"
        entry_path = os.path.join(temp_dir, entry_file)
        
        if not os.path.exists(entry_path):
            result["error"] = f"Entry point '{entry_point}' not found in provided files"
            return result
        
        # Execute using Node.js from the temp directory
        process = subprocess.run(
            ['node', entry_file],
            capture_output=True,
            text=True,
            timeout=25,  # 25 second timeout for subprocess
            cwd=temp_dir  # Run from temp directory to allow relative imports
        )
        
        result["output"] = process.stdout
        if process.stderr:
            result["error"] = process.stderr
        
        if process.returncode == 0:
            result["success"] = True
        else:
            if not result["error"]:
                result["error"] = f"Process exited with code {process.returncode}"
                
    except subprocess.TimeoutExpired:
        result["error"] = "Code execution timed out"
    except FileNotFoundError:
        result["error"] = "Node.js not found. JavaScript execution not supported."
    except Exception as e:
        result["error"] = f"JavaScript execution failed: {str(e)}"
    finally:
        # Clean up temporary files and directory
        for file_path in created_files:
            try:
                os.unlink(file_path)
            except:
                pass
        try:
            os.rmdir(temp_dir)
        except:
            pass
    
    return result

def _execute_javascript(code: str) -> Dict[str, Any]:
    """Execute JavaScript code using Node.js."""
    result = {"success": False, "output": "", "error": ""}
    
    try:
        # Create a temporary file for the JavaScript code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute using Node.js
            process = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=25  # 25 second timeout for subprocess
            )
            
            result["output"] = process.stdout
            if process.stderr:
                result["error"] = process.stderr
            
            if process.returncode == 0:
                result["success"] = True
            else:
                if not result["error"]:
                    result["error"] = f"Process exited with code {process.returncode}"
                    
        finally:
            # Clean up temp file
            os.unlink(temp_file)
            
    except subprocess.TimeoutExpired:
        result["error"] = "Code execution timed out"
    except FileNotFoundError:
        result["error"] = "Node.js not found. JavaScript execution not supported."
    except Exception as e:
        result["error"] = f"JavaScript execution failed: {str(e)}"
    
    return result

def _execute_bash_multi_file(files: Dict[str, str], entry_point: str) -> Dict[str, Any]:
    """Execute Bash scripts with multiple files and dependencies."""
    result = {"success": False, "output": "", "error": "", "files_created": []}
    
    # List of dangerous commands to block
    dangerous_commands = [
        'rm', 'rmdir', 'del', 'format', 'fdisk', 'mkfs',
        'dd', 'shutdown', 'reboot', 'halt', 'poweroff',
        'sudo', 'su', 'passwd', 'chmod', 'chown',
        'wget', 'curl', 'nc', 'netcat', 'ssh', 'scp',
        'kill', 'killall', 'pkill'
    ]
    
    # Check all files for dangerous commands
    for filename, content in files.items():
        content_lower = content.lower()
        for dangerous in dangerous_commands:
            if dangerous in content_lower:
                result["error"] = f"Command '{dangerous}' in file '{filename}' is not allowed for security reasons"
                return result
    
    # Create temporary directory for files
    temp_dir = tempfile.mkdtemp()
    created_files = []
    
    try:
        # Write all files to temporary directory
        for filename, content in files.items():
            # Ensure proper file extension
            if not filename.endswith('.sh'):
                filename = f"{filename}.sh"
            
            file_path = os.path.join(temp_dir, filename)
            with open(file_path, 'w') as f:
                f.write(content)
            # Make script executable
            os.chmod(file_path, 0o755)
            created_files.append(file_path)
            result["files_created"].append(filename)
        
        # Determine entry point file
        entry_file = entry_point if entry_point.endswith('.sh') else f"{entry_point}.sh"
        entry_path = os.path.join(temp_dir, entry_file)
        
        if not os.path.exists(entry_path):
            result["error"] = f"Entry point '{entry_point}' not found in provided files"
            return result
        
        # Execute the entry point script
        process = subprocess.run(
            ['bash', entry_file],
            capture_output=True,
            text=True,
            timeout=25,  # 25 second timeout
            cwd=temp_dir  # Run from temp directory
        )
        
        result["output"] = process.stdout
        if process.stderr:
            result["error"] = process.stderr
        
        if process.returncode == 0:
            result["success"] = True
        else:
            if not result["error"]:
                result["error"] = f"Process exited with code {process.returncode}"
                
    except subprocess.TimeoutExpired:
        result["error"] = "Command execution timed out"
    except Exception as e:
        result["error"] = f"Bash execution failed: {str(e)}"
    finally:
        # Clean up temporary files and directory
        for file_path in created_files:
            try:
                os.unlink(file_path)
            except:
                pass
        try:
            os.rmdir(temp_dir)
        except:
            pass
    
    return result

def _execute_bash(code: str) -> Dict[str, Any]:
    """Execute Bash commands safely."""
    result = {"success": False, "output": "", "error": ""}
    
    # List of dangerous commands to block
    dangerous_commands = [
        'rm', 'rmdir', 'del', 'format', 'fdisk', 'mkfs',
        'dd', 'shutdown', 'reboot', 'halt', 'poweroff',
        'sudo', 'su', 'passwd', 'chmod', 'chown',
        'wget', 'curl', 'nc', 'netcat', 'ssh', 'scp',
        'kill', 'killall', 'pkill'
    ]
    
    # Check for dangerous commands
    code_lower = code.lower()
    for dangerous in dangerous_commands:
        if dangerous in code_lower:
            result["error"] = f"Command '{dangerous}' is not allowed for security reasons"
            return result
    
    try:
        process = subprocess.run(
            code,
            shell=True,
            capture_output=True,
            text=True,
            timeout=25,  # 25 second timeout
            cwd=tempfile.gettempdir()  # Run in temp directory
        )
        
        result["output"] = process.stdout
        if process.stderr:
            result["error"] = process.stderr
        
        if process.returncode == 0:
            result["success"] = True
        else:
            if not result["error"]:
                result["error"] = f"Process exited with code {process.returncode}"
                
    except subprocess.TimeoutExpired:
        result["error"] = "Command execution timed out"
    except Exception as e:
        result["error"] = f"Bash execution failed: {str(e)}"
    
    return result

@app.function(
    image=image,
    timeout=60,  # 60 second timeout for API calls
    memory=1024,
)
def call_claude_api(prompt: str, model: str = "claude-sonnet-4-20250514") -> Dict[str, Any]:
    """
    Call the Claude API with a given prompt.
    
    Args:
        prompt: The prompt to send to Claude
        model: The Claude model to use (default: claude-sonnet-4-20250514)
    
    Returns:
        Dictionary with API response including content, success status, and any errors
    """
    import anthropic
    result = {
        "success": False,
        "content": "",
        "error": "",
        "model": model,
        "usage": {}
    }

    CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
    
    try:
        # Initialize the Anthropic client
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        
        # Make the API call
        response = client.messages.create(
            model=model,
            max_tokens=4000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Extract the response content
        if response.content and len(response.content) > 0:
            result["content"] = response.content[0].text
            result["success"] = True
            
            # Add usage information if available
            if hasattr(response, 'usage'):
                result["usage"] = {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
        else:
            result["error"] = "No content received from Claude API"
            
    except Exception as e:
        result["error"] = f"Claude API call failed: {str(e)}"
    
    return result

# Web endpoint for single-file execution (backward compatibility)
@app.function(image=web_image)
@modal.fastapi_endpoint(method="POST")
async def execute_code_endpoint(code: str, language: str = "python"):
    """
    Web endpoint to execute code via HTTP POST request.
    
    Expected JSON payload:
    {
        "code": "print('Hello, World!')",
        "language": "python"
    }
    """
    if not code:
        return {"error": "No code provided", "success": False}
    
    # Execute the code
    result = await execute_code.remote.aio(code, language)
    return result

# Pydantic model for multi-file execution request
class MultiFileRequest(BaseModel):
    files: Dict[str, str]
    language: str = "python"
    entry_point: str = "test"

# Web endpoint for multi-file execution
@app.function(image=web_image)
@modal.fastapi_endpoint(method="POST")
async def execute_multi_file_endpoint(request: MultiFileRequest):
    """
    Web endpoint to execute multi-file code via HTTP POST request.
    
    Expected JSON payload:
    {
        "files": {
            "main": "from utils import helper\nprint(helper())",
            "utils": "def helper():\n    return 'Hello from utils!'"
        },
        "language": "python",
        "entry_point": "test"
    }
    """
    try:
        print(f"[DEBUG] Multi-file execution request received:")
        print(f"[DEBUG] Language: {request.language}")
        print(f"[DEBUG] Entry point: {request.entry_point}")
        print(f"[DEBUG] Number of files: {len(request.files)}")
        print(f"[DEBUG] File names: {list(request.files.keys())}")
        
        for filename, content in request.files.items():
            print(f"[DEBUG] File '{filename}' content ({len(content)} chars):")
            print(f"[DEBUG] Content preview: {content[:200]}...")
        
        if not request.files:
            return {"error": "No files provided", "success": False}
        
        if request.entry_point not in request.files:
            return {"error": f"Entry point '{request.entry_point}' not found in provided files", "success": False}
        
        # Execute the multi-file code
        print(f"[DEBUG] Calling execute_multi_file with files: {list(request.files.keys())}, language: {request.language}, entry_point: {request.entry_point}")
        result = await execute_multi_file.remote.aio(request.files, request.language, request.entry_point)
        print(f"[DEBUG] Execution result: {result}")
        return result
        
    except Exception as e:
        print(f"[DEBUG] Exception in execute_multi_file_endpoint: {str(e)}")
        return {"error": f"Request parsing failed: {str(e)}", "success": False}

# Web endpoint for Claude API calls
@app.function(image=web_image)
@modal.fastapi_endpoint(method="POST")
async def claude_api_endpoint(prompt: str, model: str = "claude-sonnet-4-20250514"):
    """
    Web endpoint to call Claude API via HTTP POST request.
    
    Expected JSON payload:
    {
        "prompt": "Tell me a story about a dog.",
        "model": "claude-sonnet-4-20250514"
    }
    """
    if not prompt:
        return {"error": "No prompt provided", "success": False}
    
    # Call Claude API
    result = await call_claude_api.remote.aio(prompt, model)
    return result

if __name__ == "__main__":
    # For local testing
    '''
    test_code = """
print("Hello from Modal!")
import math
print(f"Pi is approximately {math.pi}")
for i in range(3):
    print(f"Count: {i}")
"""
    result = execute_code.local(test_code, "python")
    print("Test result:", result)
    '''
    test_prompt = "Tell me a story about a dog."
    result = call_claude_api.local(test_prompt)
    print("Test result:", result)
