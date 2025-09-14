'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap } from "lucide-react";

export function TaskHeader() {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white">
              Creative Writing Challenge
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className="bg-emerald-900 text-emerald-200 border-emerald-700">
              Active
            </Badge>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              Difficulty: Medium
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Removed time remaining, points, and submit prompt button */}
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-400">
        <p>Write a prompt that generates the most creative short story. You'll be ranked against other humans on prompt effectiveness.</p>
      </div>
    </div>
  );
}
