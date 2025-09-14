"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Users, Trophy, Settings, BarChart3, ChevronLeft, ChevronRight, Search, Monitor, Server, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { supabase } from "@/lib/supabase";

interface Task {
  task_id: string;
  name: string;
  description: string;
  type: number;
  testcases: string;
  leaderboard: string[] | null;
}

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  taskTypes: number[];
  searchPlaceholder: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState({
    frontend: "",
    backend: "",
    ml: ""
  });
  const router = useRouter();

  const categories: CategoryConfig[] = [
    {
      title: "FRONTEND",
      icon: Monitor,
      taskTypes: [0], // Frontend tasks
      searchPlaceholder: "Search frontend challenges..."
    },
    {
      title: "BACKEND", 
      icon: Server,
      taskTypes: [1], // Backend tasks
      searchPlaceholder: "Search backend challenges..."
    },
    {
      title: "MACHINE LEARNING",
      icon: Brain,
      taskTypes: [2], // ML tasks
      searchPlaceholder: "Search ML challenges..."
    }
  ];

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

  const getFilteredTasks = (category: CategoryConfig, searchQuery: string) => {
    return tasks.filter(task => {
      const matchesType = category.taskTypes.includes(task.type);
      const matchesSearch = searchQuery === "" || 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const handleSearchChange = (categoryKey: string, value: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [categoryKey]: value
    }));
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

  const renderChallengeCard = (task: Task) => (
    <Card key={task.task_id} className="flex-shrink-0 w-80 bg-white border border-gray-200 hover:border-gray-300">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-gray-600" />
          </div>
          <Badge variant="outline" className="text-xs">
            Type {task.type}
          </Badge>
        </div>
        <CardTitle className="text-subtitle text-gray-900 line-clamp-2">
          {task.name}
        </CardTitle>
        <p className="text-body-sm text-gray-600 line-clamp-3 mt-2">
          {task.description}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <Button
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-body-sm"
          onClick={() => handleStartTask(task.task_id)}
          disabled={startingTask === task.task_id}
        >
          {startingTask === task.task_id ? "Preparing..." : "Begin Challenge"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderCategory = (category: CategoryConfig, categoryKey: string) => {
    const IconComponent = category.icon;
    const searchQuery = searchQueries[categoryKey as keyof typeof searchQueries];
    const filteredTasks = getFilteredTasks(category, searchQuery);

    return (
      <div key={categoryKey} className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-6 h-6 text-gray-700" />
            <h2 className="text-subtitle-lg text-gray-900">
              {category.title}
            </h2>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={category.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(categoryKey, e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0"
            />
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-body text-gray-500">
            {searchQuery ? `No challenges found matching "${searchQuery}"` : "No challenges available in this category"}
          </div>
        ) : (
          <div className="relative">
            <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4">
              {filteredTasks.map(renderChallengeCard)}
            </div>
            
            {filteredTasks.length > 3 && (
              <>
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white border border-gray-200 rounded-full p-2 shadow-sm hover:shadow-md transition-shadow">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        {/* Navigation Bar */}
        <Navigation />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-title-lg text-gray-900 mb-2">CHALLENGES</h1>
            <p className="text-body-lg text-gray-600">Test your prompt engineering skills with these organized challenges.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="text-body text-gray-500">Loading challenges...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((category, index) => 
                renderCategory(category, ['frontend', 'backend', 'ml'][index])
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}