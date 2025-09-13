import modal
import sys
import io
import traceback
import subprocess
import tempfile
import os
from contextlib import redirect_stdout, redirect_stderr
from typing import Dict, Any
import anthropic

# Create Modal app
app = modal.App("code-executor")

# Define the image with necessary packages
image = modal.Image.debian_slim().pip_install([
    "numpy",
    "pandas", 
    "matplotlib",
    "requests",
    "beautifulsoup4",
    "pillow",
    "scikit-learn",
    "seaborn",
    "anthropic"
])

from config import CLAUDE_API_KEY

@app.function(
    image=image,
    timeout=30,  # 30 second timeout
    memory=1024,  # 1GB memory limit
)
def execute_code(code: str, language: str = "python") -> Dict[str, Any]:
    """
    Execute user-provided code in a sandboxed environment.
    
    Args:
        code: The code to execute
        language: Programming language (currently supports 'python', 'javascript', 'bash')
    
    Returns:
        Dictionary with execution results including output, errors, and success status
    """
    result = {
        "success": False,
        "output": "",
        "error": "",
        "execution_time": 0
    }
    
    try:
        import time
        start_time = time.time()
        
        if language.lower() == "python":
            result = _execute_python(code)
        elif language.lower() in ["javascript", "js", "node"]:
            result = _execute_javascript(code)
        elif language.lower() in ["bash", "shell", "sh"]:
            result = _execute_bash(code)
        else:
            result["error"] = f"Unsupported language: {language}"
            return result
            
        result["execution_time"] = time.time() - start_time
        
    except Exception as e:
        result["error"] = f"Execution failed: {str(e)}"
        result["success"] = False
    
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
            }
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
    result = {
        "success": False,
        "content": "",
        "error": "",
        "model": model,
        "usage": {}
    }
    
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

# Web endpoint for HTTP requests
@app.function()
@modal.fastapi_endpoint(method="POST")
def execute_code_endpoint(code: str, language: str = "python"):
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
    result = execute_code.remote(code, language)
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
