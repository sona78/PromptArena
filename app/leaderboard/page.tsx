"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Medal, Award, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  averageScore: number;
  maxScore: number;
  totalSessions: number;
  totalPrompts: number;
  challengesCompleted: number;
  taskTypesCompleted: number;
  avgPromptQuality: number;
  avgCodeEvaluation: number;
  avgAccuracy: number;
  avgPromptChaining: number;
  avgFinalScore: number;
  tokenInputTotal: number;
  tokenOutputTotal: number;
  lastSubmission: string;
}

interface Task {
  task_id: string;
  name: string;
  type: number;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  tasks: Task[];
  totalUsers: number;
  filterApplied: string;
}


export default function LeaderboardPage() {
  const [selectedChallenge, setSelectedChallenge] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedMetric, setSelectedMetric] = useState("Average Score");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ["All Categories", "Frontend", "Backend", "ML"];
  const metrics = [
    "Average Score",
    "Max Score",
    "Final Score (Metrics)",
    "Prompt Chaining",
    "Code Evaluation",
    "Code Accuracy",
    "Total Sessions",
    "Challenges Completed",
  ];

  // Fetch leaderboard data
  const fetchLeaderboard = async (challengeFilter: string = "all") => {
    try {
      setLoading(true);
      setError(null);

      const url = challengeFilter === "all"
        ? '/api/leaderboard'
        : `/api/leaderboard?taskId=${challengeFilter}`;

      const response = await fetch(url);
      const data: LeaderboardResponse = await response.json();

      if (data.success) {
        setLeaderboardData(data.leaderboard);
        setTasks(data.tasks);
      } else {
        setError('Failed to load leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedChallenge);
  }, [selectedChallenge]);

  const handleChallengeChange = (challengeId: string) => {
    setSelectedChallenge(challengeId);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      case 2:
        return <Medal className="w-5 h-5 text-stone-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-stone-300 flex items-center justify-center text-xs font-light text-stone-700">
            {rank}
          </div>
        );
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-emerald-600";
    if (percentile >= 70) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-section-header-lg text-[#28282D] mb-2">LEADERBOARD</h1>
            <p className="text-serif-lg text-[#79797C]">Top performing prompt engineers in our community.</p>
          </div>

          {/* Filter Dropdowns */}
          <Card className="bg-white border border-gray-200 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedChallenge === "all" ? "All Challenges" :
                        tasks.find(t => t.task_id === selectedChallenge)?.name || "Select Challenge"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-60 overflow-y-auto">
                    <DropdownMenuItem onClick={() => handleChallengeChange("all")}>
                      All Challenges
                    </DropdownMenuItem>
                    {tasks.map((task) => (
                      <DropdownMenuItem key={task.task_id} onClick={() => handleChallengeChange(task.task_id)}>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{task.name}</span>
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            Type {task.type}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[160px] justify-between">
                      {selectedCategory}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {categories.map((category) => (
                      <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[160px] justify-between">
                      {selectedMetric}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {metrics.map((metric) => (
                      <DropdownMenuItem key={metric} onClick={() => setSelectedMetric(metric)}>
                        {metric}
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading leaderboard...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">
                  {error}
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No leaderboard data available for the selected challenge.
                </div>
              ) : (
                <div className="overflow-hidden overflow-x-auto">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-10 gap-3 text-subtitle-sm text-gray-700 min-w-[1200px]">
                      <div className="text-left">Rank</div>
                      <div className="text-left">Username</div>
                      <div className="text-center">Avg Score</div>
                      <div className="text-center">Final Score</div>
                      <div className="text-center">Chaining</div>
                      <div className="text-center">Code Eval</div>
                      <div className="text-center">Accuracy</div>
                      <div className="text-center">Sessions</div>
                      <div className="text-center">Prompts</div>
                      <div className="text-center">Challenges</div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {leaderboardData.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`grid grid-cols-10 gap-3 px-6 py-4 text-body-sm hover:bg-gray-50 min-w-[1200px] ${
                          index < 3 ? 'bg-blue-50/30' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {getRankIcon(entry.rank)}
                          <span className="text-body text-gray-700">#{entry.rank}</span>
                        </div>
                        <div className="text-subtitle text-gray-900 truncate">{entry.username}</div>
                        <div className="text-center">
                          <span className={getPercentileColor(entry.averageScore)}>
                            {entry.averageScore}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className={getPercentileColor(entry.avgFinalScore * 10)}>
                            {entry.avgFinalScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className={getPercentileColor(entry.avgPromptChaining)}>
                            {entry.avgPromptChaining.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-center">
                          <span className={getPercentileColor(entry.avgCodeEvaluation)}>
                            {entry.avgCodeEvaluation.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-center">
                          <span className={getPercentileColor(entry.avgAccuracy)}>
                            {entry.avgAccuracy.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-center text-body text-gray-700">{entry.totalSessions}</div>
                        <div className="text-center text-body text-gray-700">{entry.totalPrompts}</div>
                        <div className="text-center text-body text-gray-700">{entry.challengesCompleted}</div>
                      </div>
                    ))}
                  </div>

                  {leaderboardData.length > 0 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-sm text-gray-600">
                      Showing {leaderboardData.length} users • Ranked by average score across all sessions
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}