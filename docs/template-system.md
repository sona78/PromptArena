# Template System Documentation

## Overview

The template system allows you to create reusable starter code and files for different challenge tasks. When a user starts a new challenge, the system will automatically copy template files from the `templates` bucket to their session folder.

## Template Storage Structure

Templates are stored in the Supabase `templates` bucket with the following structure:

```
templates/
├── task_123/
│   ├── main.py
│   ├── requirements.txt
│   └── tests/
│       └── test_main.py
├── frontend/
│   └── task_456/
│       ├── index.html
│       ├── style.css
│       └── script.js
└── nested/
    └── path/
        └── task_789/
            └── README.md
```

## How It Works

### 1. Template Discovery

The system uses recursive search to find template folders matching a task ID:

- **Input**: Task ID (e.g., "task_123")
- **Process**:
  - Recursively searches through all folders in the `templates` bucket
  - Looks for any folder whose name exactly matches the task ID
  - Can be at any depth in the folder structure
- **Output**: Full path to the template folder (e.g., "task_123" or "frontend/task_456")

### 2. File Copying

Once a template folder is found:

1. **Recursive File Collection**: All files within the template folder are collected recursively
2. **Path Preservation**: Folder structure is maintained when copying to the session
3. **Destination Mapping**: Files are copied to `Sessions/{user_id}/{task_id}/...`

### 3. Fallback Behavior

If no template is found or copying fails:

- **Python Tasks** (types 0, 2): Creates `main.py` with comment "# Write your code here"
- **Other Tasks**: Creates `.keep` file to ensure folder exists

## API Endpoints

### POST `/api/copy-template`

Copies template files for a specific task to a session folder.

**Request Body:**
```json
{
  "taskId": "task_123",
  "sessionId": "user_id/task_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully copied 3 out of 3 files",
  "templateFolderPath": "frontend/task_123",
  "filesCopied": 3,
  "totalFiles": 3,
  "copyResults": [
    {
      "file": "frontend/task_123/index.html",
      "destination": "user_id/task_123/index.html",
      "success": true
    }
  ]
}
```

## Utility Functions

### `initializeSessionWithTemplate(taskId, sessionId, taskType?)`

High-level function that handles the complete initialization process:

1. Attempts to copy template files
2. Creates fallback files if needed
3. Returns comprehensive result information

**Usage:**
```typescript
import { initializeSessionWithTemplate } from '@/lib/template-utils';

const result = await initializeSessionWithTemplate(
  'task_123',
  'user_id/task_123',
  0 // task type for fallback file creation
);

console.log(`${result.filesCopied} files copied: ${result.message}`);
```

### `copyTemplateFiles(taskId, sessionId)`

Lower-level function that only handles template copying without fallback.

### `createFallbackStarterFile(sessionId, taskType?)`

Creates appropriate fallback files based on task type.

## Template Creation Guidelines

### 1. Folder Naming

- Template folders MUST be named exactly as the task ID
- Task IDs should be unique and descriptive
- Avoid special characters in folder names

### 2. File Organization

- Keep related files together in logical subfolder structures
- Use standard file extensions and naming conventions
- Include necessary configuration files (requirements.txt, package.json, etc.)

### 3. Content Guidelines

- Include helpful comments and TODO markers
- Provide basic structure without giving away solutions
- Include example test cases when appropriate

## Example Template Structures

### Python Data Science Task
```
templates/ml_regression_001/
├── main.py                 # Main implementation file
├── requirements.txt        # Python dependencies
├── data/
│   └── sample_data.csv    # Sample dataset
├── tests/
│   └── test_solution.py   # Unit tests
└── README.md              # Task-specific instructions
```

### Frontend Web Task
```
templates/frontend_portfolio/
├── index.html             # Main HTML file
├── css/
│   └── styles.css        # Stylesheet
├── js/
│   └── main.js           # JavaScript functionality
├── images/
│   └── .keep            # Placeholder for images
└── package.json          # Dependencies and scripts
```

### Backend API Task
```
templates/api_rest_service/
├── app.py                # Flask/FastAPI main file
├── requirements.txt      # Python dependencies
├── models/
│   └── __init__.py      # Database models
├── routes/
│   └── api.py           # API routes
├── tests/
│   └── test_api.py      # API tests
└── docker-compose.yml   # Development environment
```

## Error Handling

The system includes comprehensive error handling:

- **Template Not Found**: Falls back to default starter files
- **Copy Failures**: Individual file failures don't stop the entire process
- **Permission Issues**: Proper authentication checks
- **Network Errors**: Graceful degradation with fallbacks

## Performance Considerations

- Template discovery is cached during the search process
- Large template folders may take longer to copy
- Consider file size limits for template content
- Recursive search depth is reasonable for typical folder structures

## Debugging

Enable debug logging to troubleshoot template issues:

```typescript
// Check browser console for detailed logs
console.log('Template copy result:', result);
```

Common issues:
- Template folder not found: Check exact task ID matching
- Permission denied: Verify Supabase bucket permissions
- Copy failures: Check file sizes and bucket storage limits