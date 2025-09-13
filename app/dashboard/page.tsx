import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap, Users, Trophy, BookOpen, Code, Lightbulb, Settings, BarChart3, LogOut } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";

const challenges = [
  {
    id: 1,
    title: "Creative Writing Challenge",
    description: "Write a prompt that generates the most creative short story. You'll be ranked against other humans on prompt effectiveness.",
    difficulty: "Medium",
    timeRemaining: "15:42",
    points: 250,
    participants: 1247,
    category: "Creative",
    icon: BookOpen,
    status: "Active",
    statusColor: "bg-emerald-900 text-emerald-200 border-emerald-700"
  },
  {
    id: 2,
    title: "Code Generation Battle",
    description: "Create prompts that generate the most efficient Python algorithms. Compete with other developers.",
    difficulty: "Hard",
    timeRemaining: "08:15",
    points: 400,
    participants: 892,
    category: "Programming",
    icon: Code,
    status: "Active",
    statusColor: "bg-emerald-900 text-emerald-200 border-emerald-700"
  },
  {
    id: 3,
    title: "Innovation Prompt Contest",
    description: "Design prompts for breakthrough business ideas. Winner gets featured on the leaderboard.",
    difficulty: "Easy",
    timeRemaining: "2d 4h",
    points: 150,
    participants: 2156,
    category: "Business",
    icon: Lightbulb,
    status: "Upcoming",
    statusColor: "bg-blue-900 text-blue-200 border-blue-700"
  },
  {
    id: 4,
    title: "Technical Documentation",
    description: "Write prompts that generate clear and comprehensive technical documentation.",
    difficulty: "Medium",
    timeRemaining: "1d 12h",
    points: 300,
    participants: 543,
    category: "Technical",
    icon: Target,
    status: "Active",
    statusColor: "bg-emerald-900 text-emerald-200 border-emerald-700"
  }
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  return (
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

            <form action={signOutAction}>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </form>
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
              <span>4,838 participants online</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-400">
          <p>Choose a challenge to test your prompt engineering skills against other humans.</p>
        </div>
      </div>
      
      {/* Main Content - Challenge Cards */}
      <div className="flex-1 w-full p-6">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {challenges.map((challenge) => {
            const IconComponent = challenge.icon;
            return (
              <Card key={challenge.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5 text-blue-400" />
                      <Badge className={challenge.statusColor}>
                        {challenge.status}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                      {challenge.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{challenge.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {challenge.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Target className="w-3 h-3" />
                      <span>Difficulty: {challenge.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{challenge.participants.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{challenge.timeRemaining}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>+{challenge.points}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/editor" className="block">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      size="sm"
                    >
                      Start Challenge
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}