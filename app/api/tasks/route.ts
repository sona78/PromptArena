import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { name, description, type, criteria, entry_file, test_file } = body;

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
        criteria: criteria?.trim() || null,
        entry_file: entry_file?.trim() || '',
        test_file: test_file?.trim() || null,
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
