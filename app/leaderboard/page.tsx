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
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Frontend":
        return "bg-[#C5AECF] text-white border-[#C5AECF]";
      case "Backend":
        return "bg-[#46295A] text-white border-[#46295A]";
      case "ML":
        return "bg-[#D79D00] text-white border-[#D79D00]";
      default:
        return "bg-white text-[#28282D] border-[#28282D]";
    }
  };
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
      <div className="min-h-screen bg-white">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-section-header-lg text-[#28282D] mb-2">LEADERBOARD</h1>
            <p className="text-serif-lg text-[#79797C]">Top performing prompt engineers in our community.</p>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="min-w-[180px] justify-between rounded-full font-display-serif font-bold tracking-wide text-base px-6 py-3 bg-white text-[#28282D] border-[#28282D] hover:bg-gray-50">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={`min-w-[180px] justify-between rounded-full font-display-serif font-bold tracking-wide text-base px-6 py-3 hover:opacity-90 ${getCategoryColor(selectedCategory)}`}>
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
                <Button className="min-w-[180px] justify-between rounded-full font-display-serif font-bold tracking-wide text-base px-6 py-3 bg-white text-[#28282D] border-[#28282D] hover:bg-gray-50">
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

          {/* Leaderboard Table */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="bg-[#79797C] px-6 py-4 border-b border-gray-200 shadow-md">
                  <div className="grid grid-cols-6 gap-4 font-display-serif font-bold tracking-wide text-sm text-white">
                    <div className="text-left">RANK</div>
                    <div className="text-left">USERNAME</div>
                    <div className="text-center">VERBIAGE SCORE</div>
                    <div className="text-center">PROMPTS</div>
                    <div className="text-center">TOKEN INPUT</div>
                    <div className="text-center">CODE PERFORMANCE</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {mockLeaderboardData.map((entry, index) => (
                    <div
                      key={entry.username}
                      className={`grid grid-cols-6 gap-4 px-6 py-4 text-body-sm hover:bg-gray-50 items-center ${
                        index < 3 ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getRankIcon(entry.rank)}
                        <span className="text-body text-gray-700">#{entry.rank}</span>
                      </div>
                      <div className="text-subtitle text-[#28282D]">{entry.username}</div>
                      <div className="text-center">
                        <span className={getPercentileColor(entry.verbiageScore)}>
                          {entry.verbiageScore}%
                        </span>
                      </div>
                      <div className="text-center text-body text-gray-700">{entry.numPrompts}</div>
                      <div className="text-center text-body text-gray-700">{entry.tokenInput.toLocaleString()}</div>
                      <div className="text-center">
                        <span className={getPercentileColor(entry.codePerformance)}>
                          {entry.codePerformance}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}