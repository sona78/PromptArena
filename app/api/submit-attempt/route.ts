import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, prompt, score, metrics } = await request.json();

    if (!sessionId || !prompt || score === undefined) {
      return NextResponse.json(
        { error: 'Session ID, prompt, and score are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase
      .from('Sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update the session with the new prompt and score
    const updatedPrompts = Array.isArray(sessionData.prompts) 
      ? [...sessionData.prompts, prompt]
      : [prompt];

    const updatedFeedback = Array.isArray(sessionData.feedback)
      ? [...sessionData.feedback, metrics || {}]
      : [metrics || {}];

    // Update the session with the best score (keep highest score)
    const newScore = Math.max(sessionData.score || 0, score);

    const { data, error } = await supabase
      .from('Sessions')
      .update({
        prompts: updatedPrompts,
        feedback: updatedFeedback,
        score: newScore,
        state: 1, // Mark as active/in progress
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: data,
      newBestScore: newScore > (sessionData.score || 0)
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
