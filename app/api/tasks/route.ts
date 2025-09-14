import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { name, description, type, test_file_name, file_structure, has_files } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Get the current user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert the new task into the database
    const { data, error } = await supabase
      .from('Tasks')
      .insert([{
        name: name.trim(),
        description: description.trim(),
        type: parseInt(type) || 0,
        test_file_name: test_file_name?.trim() || null,
        has_template_files: has_files || false,
        leaderboard: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // Upload files to Supabase Storage if provided
    if (has_files && file_structure && data?.task_id) {
      try {
        const taskId = data.task_id;
        const uploadPromises = [];

        for (const [filePath, fileContent] of Object.entries(file_structure)) {
          // Create a blob from the file content
          const blob = new Blob([fileContent], { type: 'text/plain' });
          
          // Upload to Templates bucket with task_id as folder
          const storagePath = `${taskId}/${filePath}`;
          
          const uploadPromise = supabase.storage
            .from('Templates')
            .upload(storagePath, blob, {
              contentType: 'text/plain',
              upsert: true
            });
          
          uploadPromises.push(uploadPromise);
        }

        // Wait for all uploads to complete
        const uploadResults = await Promise.allSettled(uploadPromises);
        
        // Check if any uploads failed
        const failedUploads = uploadResults.filter(result => result.status === 'rejected');
        if (failedUploads.length > 0) {
          console.warn('Some files failed to upload:', failedUploads);
          // Don't fail the entire request, just log the warning
        }

        console.log(`Successfully uploaded ${uploadResults.length - failedUploads.length} files for task ${taskId}`);
      } catch (uploadError) {
        console.error('Error uploading files to storage:', uploadError);
        // Don't fail the task creation, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      task: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all tasks
    const { data, error } = await supabase
      .from('Tasks')
      .select('*')
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
