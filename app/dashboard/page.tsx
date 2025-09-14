"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, Trophy, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { JapandiLayout } from "@/components/japandi-layout";
import { supabase } from "@/lib/supabase";

interface Task {
  task_id: string;
  name: string;
  description: string;
  type: number;
  testcases: string;
  leaderboard: string[] | null;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('Tasks')
        .select('*')
        .order('name');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    setStartingTask(taskId);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      // Create session_id in format {user_id}/{task_id}
      const sessionId = `${user.id}/${taskId}`;

      // Check if session already exists
      const { data: existingSession, error: sessionError } = await supabase
        .from('Sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected when no session exists
        console.error('Error checking session:', sessionError);
        return;
      }

      if (!existingSession) {
        // Create new session
        const { error: createError } = await supabase
          .from('Sessions')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            task_id: taskId,
            prompts: [],
            feedback: [],
            state: 0,
            score: 0
          });

        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }

        // Create folder in storage bucket with appropriate starter file
        const task = tasks.find(t => t.task_id === taskId);
        const shouldCreatePython = task && (task.type === 0 || task.type === 2);

        const fileName = shouldCreatePython ? 'main.py' : '.keep';
        const fileContent = shouldCreatePython ? '# Write your code here\n' : '';

        const { error: storageError } = await supabase.storage
          .from('Sessions')
          .upload(`${sessionId}/${fileName}`, new Blob([fileContent], { type: 'text/plain' }));

        if (storageError) {
          console.error('Error creating storage folder:', storageError);
          // Don't return here as session was already created successfully
        }
      }

      // Navigate to editor with session
      router.push(`/editor?session=${sessionId}`);
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setStartingTask(null);
    }
  };

  return (
    <AuthGuard>
      <JapandiLayout
        title="Challenges"
        subtitle="Explore thoughtfully crafted prompting challenges. Each task is designed to enhance your skills through mindful practice and focused attention."
      >
        <div className="space-y-8">
          <div className="flex items-center space-x-3 text-sm text-stone-500">
            <div className="w-2 h-2 rounded-full bg-stone-400"></div>
            <span className="font-light tracking-wide">{tasks.length} challenges available</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-stone-500 font-light text-xl tracking-wide">Loading challenges...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {tasks.map((task) => (
                <Card key={task.task_id} className="group bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-700 rounded-3xl overflow-hidden">
                  <CardHeader className="p-10 pb-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors duration-500">
                        <Target className="w-6 h-6 text-stone-600" />
                      </div>
                      <Badge variant="outline" className="border-stone-200 text-stone-500 text-xs font-light bg-stone-50 px-3 py-1">
                        Type {task.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-stone-800 text-2xl font-light leading-relaxed tracking-wide">
                      {task.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-10 pb-10">
                    <div className="space-y-8">
                      <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                      <Button
                        className="w-full bg-stone-800 hover:bg-stone-900 text-white border-0 rounded-2xl py-7 font-light tracking-wide text-lg transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5"
                        onClick={() => handleStartTask(task.task_id)}
                        disabled={startingTask === task.task_id}
                      >
                        {startingTask === task.task_id ? "Preparing..." : "Begin Challenge"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </JapandiLayout>
    </AuthGuard>
  );
}