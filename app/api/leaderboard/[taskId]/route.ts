import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch task details
    const { data: taskData, error: taskError } = await supabase
      .from('Tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (taskError) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Fetch leaderboard data from Sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('Sessions')
      .select(`
        session_id,
        user_id,
        task_id,
        score,
        prompts,
        feedback,
        created_at,
        updated_at
      `)
      .eq('task_id', taskId)
      .not('score', 'is', null)
      .gt('score', 0)
      .order('score', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    // Get user profiles for usernames
    const userIds = [...new Set(sessionsData?.map(session => session.user_id) || [])];
    
    const usernameMap = new Map();
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (!profilesError && profilesData) {
        profilesData.forEach(profile => {
          usernameMap.set(profile.id, profile.username || `User${profile.id.slice(0, 8)}`);
        });
      }
    }

    // Process leaderboard data
    const leaderboardData = (sessionsData || []).map((session, index) => {
      // Extract score components from feedback
      let promptQuality = 0;
      let codeEvaluation = 0;
      let accuracy = 0;
      let promptChaining = 0;
      let finalScore = 0;
      let tokenInput = 0;
      let tokenOutput = 0;

      if (session.feedback && typeof session.feedback === 'object' && session.feedback.type === 'prompt_analysis') {
        const f = session.feedback;
        promptQuality = f.qualityScore || 0;
        codeEvaluation = (f.codeEvaluationScore || 0) * 100;
        accuracy = (f.codeAccuracyScore || 0) * 100;
        promptChaining = (f.promptChainingScore || 0) * 100;
        finalScore = f.metrics && f.metrics['final score'] ? f.metrics['final score'] : 0;
        tokenInput = f.promptTokenCount || 0;
        tokenOutput = f.responseTokenCount || 0;
      }

      return {
        rank: index + 1,
        username: usernameMap.get(session.user_id) || `User${session.user_id.slice(0, 8)}`,
        user_id: session.user_id,
        score: session.score,
        numPrompts: Array.isArray(session.prompts) ? session.prompts.length : 0,
        promptQuality: Math.round(promptQuality * 10) / 10,
        codeEvaluation: Math.round(codeEvaluation * 10) / 10,
        accuracy: Math.round(accuracy * 10) / 10,
        promptChaining: Math.round(promptChaining * 10) / 10,
        finalScore: Math.round(finalScore * 10) / 10,
        tokenInput: tokenInput,
        tokenOutput: tokenOutput,
        model: "Claude-3.5-Sonnet", // Default for now, could be extracted from session data
        lastSubmission: session.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      task: taskData,
      leaderboard: leaderboardData
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
