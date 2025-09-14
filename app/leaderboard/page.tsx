"use client";

import { AuthGuard } from "@/components/auth-guard";
import { JapandiLayout } from "@/components/japandi-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Medal, Award } from "lucide-react";
import { useState } from "react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  verbiageScore: number;
  numPrompts: number;
  tokenInput: number;
  codePerformance: number;
}

// Mock data for demonstration
const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "alice_dev",
    verbiageScore: 95.2,
    numPrompts: 147,
    tokenInput: 12450,
    codePerformance: 92.8,
  },
  {
    rank: 2,
    username: "bob_engineer",
    verbiageScore: 93.1,
    numPrompts: 134,
    tokenInput: 11230,
    codePerformance: 89.5,
  },
  {
    rank: 3,
    username: "charlie_ai",
    verbiageScore: 91.7,
    numPrompts: 128,
    tokenInput: 10890,
    codePerformance: 87.2,
  },
  {
    rank: 4,
    username: "diana_prompt",
    verbiageScore: 90.3,
    numPrompts: 115,
    tokenInput: 9876,
    codePerformance: 85.9,
  },
  {
    rank: 5,
    username: "eve_coder",
    verbiageScore: 88.9,
    numPrompts: 109,
    tokenInput: 9234,
    codePerformance: 84.1,
  },
];

export default function LeaderboardPage() {
  const [selectedModel, setSelectedModel] = useState("All Models");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedMetric, setSelectedMetric] = useState("Overall Score");

  const models = ["All Models", "GPT-4", "Claude-3", "Gemini", "LLaMA-2"];
  const categories = ["All Categories", "Frontend", "Backend", "ML"];
  const metrics = [
    "Overall Score",
    "Verbiage Score",
    "Number of Prompts",
    "Token Input",
    "Code Performance",
  ];

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
      <JapandiLayout
        title="Leaderboard"
        subtitle="Discover the most skilled prompt engineers in our community. Excellence through mindful practice."
      >
        <div className="space-y-12">
          {/* Filter Dropdowns */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-10">
              <div className="flex flex-wrap gap-6 justify-center">
                {/* Model Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[180px] justify-between bg-stone-50 border-stone-200 text-stone-700 font-light rounded-xl py-6 hover:bg-stone-100 transition-colors duration-300"
                    >
                      {selectedModel}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                    {models.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        onClick={() => setSelectedModel(model)}
                        className="text-stone-700 hover:bg-stone-50 font-light"
                      >
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Question Category Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[180px] justify-between bg-stone-50 border-stone-200 text-stone-700 font-light rounded-xl py-6 hover:bg-stone-100 transition-colors duration-300"
                    >
                      {selectedCategory}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="text-stone-700 hover:bg-stone-50 font-light"
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Metric Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[180px] justify-between bg-stone-50 border-stone-200 text-stone-700 font-light rounded-xl py-6 hover:bg-stone-100 transition-colors duration-300"
                    >
                      {selectedMetric}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                    {metrics.map((metric) => (
                      <DropdownMenuItem
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className="text-stone-700 hover:bg-stone-50 font-light"
                      >
                        {metric}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Table */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="bg-stone-50 px-10 py-6 border-b border-stone-200">
                  <div className="grid grid-cols-6 gap-4 text-sm font-light text-stone-600 tracking-wide">
                    <div className="text-left">Rank</div>
                    <div className="text-left">Username</div>
                    <div className="text-center">Verbiage Score</div>
                    <div className="text-center">Prompts</div>
                    <div className="text-center">Token Input</div>
                    <div className="text-center">Code Performance</div>
                  </div>
                </div>
                
                <div className="divide-y divide-stone-100">
                  {mockLeaderboardData.map((entry, index) => (
                    <div
                      key={entry.username}
                      className={`grid grid-cols-6 gap-4 px-10 py-6 text-sm hover:bg-stone-50/50 transition-colors duration-300 ${
                        index < 3 ? 'bg-stone-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getRankIcon(entry.rank)}
                        <span className="font-light text-stone-700">
                          #{entry.rank}
                        </span>
                      </div>
                      <div className="font-light text-stone-800">
                        {entry.username}
                      </div>
                      <div className="text-center">
                        <div className={`font-light ${getPercentileColor(entry.verbiageScore)}`}>
                          {entry.verbiageScore}%
                        </div>
                      </div>
                      <div className="text-center font-light text-stone-700">
                        {entry.numPrompts}
                      </div>
                      <div className="text-center font-light text-stone-700">
                        {entry.tokenInput.toLocaleString()}
                      </div>
                      <div className="text-center">
                        <div className={`font-light ${getPercentileColor(entry.codePerformance)}`}>
                          {entry.codePerformance}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </JapandiLayout>
    </AuthGuard>
  );
}