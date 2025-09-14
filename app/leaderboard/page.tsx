"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trophy, Users, BarChart3, Settings, ChevronDown, Crown, Medal, Award } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { LogoutButton } from "@/components/logout-button";

interface LeaderboardEntry {
  rank: number;
  username: string;
  verbiageScore: number;
  numberOfPrompts: number;
  tokenInput: number;
  codePerformance: number;
}

// Mock data for demonstration
const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "PromptMaster2024",
    verbiageScore: 98.5,
    numberOfPrompts: 247,
    tokenInput: 15420,
    codePerformance: 95.2,
  },
  {
    rank: 2,
    username: "CodeWhisperer",
    verbiageScore: 97.8,
    numberOfPrompts: 189,
    tokenInput: 12300,
    codePerformance: 93.8,
  },
  {
    rank: 3,
    username: "AIOptimizer",
    verbiageScore: 96.9,
    numberOfPrompts: 201,
    tokenInput: 14100,
    codePerformance: 92.1,
  },
  {
    rank: 4,
    username: "PromptEngineer",
    verbiageScore: 95.7,
    numberOfPrompts: 156,
    tokenInput: 11800,
    codePerformance: 90.5,
  },
  {
    rank: 5,
    username: "TokenEconomist",
    verbiageScore: 94.2,
    numberOfPrompts: 178,
    tokenInput: 10900,
    codePerformance: 89.3,
  },
];

export default function LeaderboardPage() {
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedMetric, setSelectedMetric] = useState("Overall Score");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 95) return "bg-emerald-900 text-emerald-200 border-emerald-700";
    if (performance >= 90) return "bg-blue-900 text-blue-200 border-blue-700";
    if (performance >= 85) return "bg-purple-900 text-purple-200 border-purple-700";
    return "bg-gray-900 text-gray-200 border-gray-700";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                <Trophy className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PromptArena
                </span>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                  Beta
                </Badge>
              </Link>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="text-white bg-gray-800 hover:bg-gray-700">
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

        {/* Leaderboard Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center justify-center space-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 min-w-[180px]">
                    {selectedModel}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-200">
                  <DropdownMenuItem onClick={() => setSelectedModel("All Models")}>All Models</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedModel("GPT-4")}>GPT-4</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedModel("Claude-3")}>Claude-3</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedModel("Gemini")}>Gemini</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 min-w-[200px]">
                    {selectedCategory}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-200">
                  <DropdownMenuItem onClick={() => setSelectedCategory("All Categories")}>All Categories</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory("Frontend")}>Frontend</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory("Backend")}>Backend</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCategory("ML")}>ML</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 min-w-[180px]">
                    {selectedMetric}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-200">
                  <DropdownMenuItem onClick={() => setSelectedMetric("Overall Score")}>Overall Score</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMetric("Verbiage Score")}>Verbiage Score</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMetric("Code Performance")}>Code Performance</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedMetric("Token Efficiency")}>Token Efficiency</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="flex-1 w-full p-6">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-center text-white">
                  DASHBOARD
                </CardTitle>
                <p className="text-center text-gray-400 mt-2">
                  Username, Verbiage Score, Number of Prompts, Token Input (Prompt), Code Performance (PERCENTILE)
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-800 rounded-lg text-sm font-semibold text-gray-300">
                    <div className="text-center">Rank</div>
                    <div>Username</div>
                    <div className="text-center">Verbiage Score</div>
                    <div className="text-center">Prompts</div>
                    <div className="text-center">Token Input</div>
                    <div className="text-center">Performance</div>
                  </div>

                  {/* Leaderboard Entries */}
                  {mockLeaderboardData.map((entry, index) => (
                    <div
                      key={entry.username}
                      className={`grid grid-cols-6 gap-4 px-4 py-4 rounded-lg transition-all hover:bg-gray-800 ${
                        entry.rank <= 3 ? 'bg-gray-850 border border-gray-700' : 'bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium text-white">{entry.username}</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-blue-400 font-semibold">{entry.verbiageScore.toFixed(1)}</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-gray-300">{entry.numberOfPrompts}</span>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-gray-300">{entry.tokenInput.toLocaleString()}</span>
                      </div>
                      
                      <div className="text-center">
                        <Badge className={`${getPerformanceBadge(entry.codePerformance)} font-semibold`}>
                          {entry.codePerformance.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
