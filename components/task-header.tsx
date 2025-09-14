'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap } from "lucide-react";

export function TaskHeader() {
  return (
    <div className="bg-white/40 backdrop-blur-sm border-b border-stone-200/30 px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-stone-600" />
              </div>
              <h1 className="text-2xl font-light text-stone-800 tracking-wide">
                Creative Writing Challenge
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-light px-3 py-1">
                Active
              </Badge>
              <Badge variant="outline" className="border-stone-300 text-stone-600 font-light px-3 py-1">
                Difficulty: Medium
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-stone-600 font-light text-lg leading-relaxed max-w-4xl">
          <p>Write a prompt that generates the most creative short story. You'll be ranked against other humans on prompt effectiveness through mindful evaluation.</p>
        </div>
      </div>
    </div>
  );
}
