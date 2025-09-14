'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  return (
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
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <BarChart3 className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
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
        </div>
      </div>
    </nav>
  );
}
