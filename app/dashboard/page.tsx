"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, Trophy, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { LogoutButton } from "@/components/logout-button";
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
            file_system: null,
            state: 0,
            score: 0
          });

        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }

        // Create folder in storage bucket
        const { error: storageError } = await supabase.storage
          .from('Sessions')
          .upload(`${sessionId}/.keep`, new Blob([''], { type: 'text/plain' }));

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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PromptArena
              </span>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                Beta
              </Badge>
            </div>

            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <BarChart3 className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Users className="w-4 h-4 mr-2" />
                Battles
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Rank:</span>
              <Badge className="bg-blue-900 text-blue-200 border-blue-700">
                #1,247
              </Badge>
            </div>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
              <Settings className="w-4 h-4" />
            </Button>

            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                Challenge Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{tasks.length} tasks available</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-400">
          <p>Choose a task to test your prompt engineering skills.</p>
        </div>
      </div>

      {/* Main Content - Task Cards */}
      <div className="flex-1 w-full p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {tasks.map((task) => (
              <Card key={task.task_id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <Badge className="bg-emerald-900 text-emerald-200 border-emerald-700">
                        Active
                      </Badge>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      Type {task.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{task.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    onClick={() => handleStartTask(task.task_id)}
                    disabled={startingTask === task.task_id}
                  >
                    {startingTask === task.task_id ? "Starting..." : "Start Task"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}