'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-stone-700 transition-colors duration-300">
              <Trophy className="w-4 h-4 text-stone-50" />
            </div>
            <span className="text-2xl font-extralight tracking-wide text-stone-800">
              PromptArena
            </span>
            <Badge variant="outline" className="text-xs border-stone-300 text-stone-500 bg-stone-50 font-light">
              Beta
            </Badge>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/leaderboard">
              <button className="text-stone-600 hover:text-stone-800 transition-colors duration-300 text-sm font-light tracking-wide">
                Leaderboard
              </button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-3 text-sm text-stone-500">
            <span className="font-light">Rank</span>
            <Badge className="bg-stone-100 text-stone-700 border-stone-200 font-light">
              #1,247
            </Badge>
          </div>
          
          <button className="p-2 text-stone-500 hover:text-stone-700 transition-colors duration-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
