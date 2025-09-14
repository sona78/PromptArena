import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    const supabase = await createClient();

    let query = supabase
      .from('Sessions')
      .select(`
        session_id,
        user_id,
        task_id,
        score,
        prompts,
        feedback,
        Tasks!Sessions_task_id_fkey(task_id, name, type)
      `)
      .not('score', 'is', null)
      .gt('score', 0);

    // Filter by specific task if provided
    if (taskId && taskId !== 'all') {
      query = query.eq('task_id', taskId);
    }

    const { data: sessionsData, error: sessionsError } = await query;

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

    // Get all tasks for the challenge filter
    const { data: tasksData, error: tasksError } = await supabase
      .from('Tasks')
      .select('task_id, name, type')
      .order('name');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    const tasks = tasksData || [];

    // Calculate user statistics
    const userStats = new Map();

    (sessionsData || []).forEach(session => {
      const userId = session.user_id;
      const username = usernameMap.get(userId) || `User${userId.slice(0, 8)}`;

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_id: userId,
          username: username,
          scores: [],
          totalPrompts: 0,
          sessions: 0,
          lastSubmission: session.updated_at,
          challenges: new Set(),
          taskTypes: new Set()
        });
      }

      const user = userStats.get(userId);
      user.scores.push(session.score);
      user.totalPrompts += Array.isArray(session.prompts) ? session.prompts.length : 0;
      user.sessions += 1;
      user.challenges.add(session.task_id);
      if (session.Tasks && session.Tasks.type !== undefined) {
        user.taskTypes.add(session.Tasks.type);
      }

      // Keep track of most recent submission
      if (new Date(session.updated_at) > new Date(user.lastSubmission)) {
        user.lastSubmission = session.updated_at;
      }
    });

    // Calculate average scores and create leaderboard
    const leaderboardData = Array.from(userStats.values()).map(user => {
      const averageScore = user.scores.length > 0
        ? Math.round(user.scores.reduce((sum, score) => sum + score, 0) / user.scores.length)
        : 0;

      const maxScore = user.scores.length > 0
        ? Math.max(...user.scores)
        : 0;

      // Calculate detailed metrics from feedback
      let avgPromptQuality = 0;
      let avgCodeEvaluation = 0;
      let avgAccuracy = 0;
      let avgPromptChaining = 0;
      let avgFinalScore = 0;
      let tokenInputTotal = 0;
      let tokenOutputTotal = 0;

      // Extract metrics from sessions
      const sessionsForUser = (sessionsData || []).filter(s => s.user_id === user.user_id);
      const validFeedback = sessionsForUser
        .map(s => s.feedback)
        .filter(f => f && typeof f === 'object' && f.type === 'prompt_analysis');

      if (validFeedback.length > 0) {
        // Calculate averages for each score component
        avgPromptQuality = validFeedback.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / validFeedback.length;
        avgCodeEvaluation = validFeedback.reduce((sum, f) => sum + ((f.codeEvaluationScore || 0) * 100), 0) / validFeedback.length;
        avgAccuracy = validFeedback.reduce((sum, f) => sum + ((f.codeAccuracyScore || 0) * 100), 0) / validFeedback.length;
        avgPromptChaining = validFeedback.reduce((sum, f) => sum + ((f.promptChainingScore || 0) * 100), 0) / validFeedback.length;

        // Extract final score from metrics object
        const finalScores = validFeedback
          .map(f => f.metrics && f.metrics['final score'] ? f.metrics['final score'] : 0)
          .filter(score => score > 0);
        avgFinalScore = finalScores.length > 0
          ? finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length
          : 0;

        tokenInputTotal = validFeedback.reduce((sum, f) => sum + (f.promptTokenCount || 0), 0);
        tokenOutputTotal = validFeedback.reduce((sum, f) => sum + (f.responseTokenCount || 0), 0);
      }

      return {
        user_id: user.user_id,
        username: user.username,
        averageScore: averageScore,
        maxScore: maxScore,
        totalSessions: user.sessions,
        totalPrompts: user.totalPrompts,
        challengesCompleted: user.challenges.size,
        taskTypesCompleted: user.taskTypes.size,
        avgPromptQuality: Math.round(avgPromptQuality * 10) / 10,
        avgCodeEvaluation: Math.round(avgCodeEvaluation * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        avgPromptChaining: Math.round(avgPromptChaining * 10) / 10,
        avgFinalScore: Math.round(avgFinalScore * 10) / 10,
        tokenInputTotal: tokenInputTotal,
        tokenOutputTotal: tokenOutputTotal,
        lastSubmission: user.lastSubmission
      };
    });

    // Sort by average score (descending)
    leaderboardData.sort((a, b) => b.averageScore - a.averageScore);

    // Add ranks
    const rankedData = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedData,
      tasks: tasks,
      totalUsers: rankedData.length,
      filterApplied: taskId || 'all'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}