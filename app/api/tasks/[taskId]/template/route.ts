import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;

    // Get the current user from the session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First check if the task exists and has template files
    const { data: task, error: taskError } = await supabase
      .from('Tasks')
      .select('task_id, name, has_template_files, test_file_name')
      .eq('task_id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (!task.has_template_files) {
      return NextResponse.json({
        success: true,
        files: {},
        task_info: {
          name: task.name,
          test_file_name: task.test_file_name
        }
      });
    }

    // List all files in the task's template folder
    const { data: fileList, error: listError } = await supabase.storage
      .from('Templates')
      .list(taskId, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing template files:', listError);
      return NextResponse.json(
        { error: 'Failed to retrieve template files' },
        { status: 500 }
      );
    }

    // Download each file's content
    const files: Record<string, string> = {};
    
    if (fileList && fileList.length > 0) {
      const downloadPromises = fileList.map(async (file: any) => {
        if (file.name && !file.name.endsWith('/')) { // Skip directories
          try {
            const { data, error } = await supabase.storage
              .from('Templates')
              .download(`${taskId}/${file.name}`);

            if (!error && data) {
              const content = await data.text();
              files[file.name] = content;
            }
          } catch (err) {
            console.warn(`Failed to download file ${file.name}:`, err);
          }
        }
      });

      await Promise.allSettled(downloadPromises);
    }

    return NextResponse.json({
      success: true,
      files,
      task_info: {
        name: task.name,
        test_file_name: task.test_file_name
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to get a specific file from the template
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;
    const { file_path } = await request.json();

    // Get the current user from the session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!file_path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Download the specific file
    const { data, error } = await supabase.storage
      .from('Templates')
      .download(`${taskId}/${file_path}`);

    if (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const content = await data.text();

    return NextResponse.json({
      success: true,
      file_path,
      content
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
