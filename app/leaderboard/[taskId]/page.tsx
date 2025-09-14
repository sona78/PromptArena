"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Medal, Award, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface TaskLeaderboardEntry {
  rank: number;
  username: string;
  user_id: string;
  score: number;
  numPrompts: number;
  model: string;
  lastSubmission: string;
}

interface Task {
  task_id: string;
  name: string;
  description: string;
  type: number;
}

export default function TaskLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [leaderboard, setLeaderboard] = useState<TaskLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("All Models");

  const models = ["All Models", "Claude-3.5-Sonnet", "GPT-4", "GPT-3.5", "Other"];

  useEffect(() => {
    if (taskId) {
      fetchTaskAndLeaderboard();
    }
  }, [taskId]);

  const fetchTaskAndLeaderboard = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/leaderboard/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching leaderboard:', data.error);
        return;
      }

      setTask(data.task);
      
      // Process leaderboard data with formatted dates
      const processedData: TaskLeaderboardEntry[] = data.leaderboard.map((entry: any) => ({
        ...entry,
        lastSubmission: new Date(entry.lastSubmission).toLocaleDateString()
      }));
      
      setLeaderboard(processedData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
            {rank}
          </div>
        );
    }
  };

  const filteredLeaderboard = selectedModel === "All Models" 
    ? leaderboard 
    : leaderboard.filter(entry => entry.model === selectedModel);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">Loading leaderboard...</div>
        </div>
      </AuthGuard>
    );
  }

  if (!task) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 mb-4">Task not found</div>
            <Button onClick={() => router.push('/challenges')}>
              Back to Challenges
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{task.name} - Leaderboard</h1>
            <p className="text-gray-600">Rankings for this specific challenge with raw scores.</p>
          </div>

          {/* Model Filter */}
          <Card className="bg-white border border-gray-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedModel}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {models.map((model) => (
                      <DropdownMenuItem key={model} onClick={() => setSelectedModel(model)}>
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Table */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-0">
              {filteredLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No submissions found for this task yet.
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                      <div className="text-left">Rank</div>
                      <div className="text-left">Username</div>
                      <div className="text-center">Score</div>
                      <div className="text-center">Prompts Used</div>
                      <div className="text-center">Model</div>
                      <div className="text-center">Last Submission</div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {filteredLeaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`grid grid-cols-6 gap-4 px-6 py-4 text-sm hover:bg-gray-50 ${
                          index < 3 ? 'bg-blue-50/30' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getRankIcon(entry.rank)}
                          <span className="text-gray-700">#{entry.rank}</span>
                        </div>
                        <div className="text-gray-900 font-medium">{entry.username}</div>
                        <div className="text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {entry.score}
                          </span>
                        </div>
                        <div className="text-center text-gray-700">{entry.numPrompts}</div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {entry.model}
                          </Badge>
                        </div>
                        <div className="text-center text-gray-500 text-xs">{entry.lastSubmission}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
