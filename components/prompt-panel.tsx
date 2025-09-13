'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Users,
  Star,
  Clock
} from "lucide-react";
import { useEditor } from "./editor-context";

export function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const { setCode, isLoading, setIsLoading } = useEditor();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the editor with Claude's response
        setCode(data.content);
      } else {
        // Handle error - show in editor
        setCode(`# Error calling Claude API

**Error:** ${data.error}

**Original Prompt:**
${prompt}

Please try again or check your configuration.`);
      }
    } catch (error) {
      // Handle network error
      setCode(`# Network Error

**Error:** Failed to connect to Claude API

**Original Prompt:**
${prompt}

Please check your internet connection and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'write', label: 'Write Prompt', icon: MessageSquare },
    { id: 'analyze', label: 'Analysis', icon: Brain },
    { id: 'leaderboard', label: 'Rankings', icon: TrendingUp },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-950 border-l border-gray-800">
      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                className={`text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'write' && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Your Prompt
              </label>
              <Textarea
                placeholder="Write your creative writing prompt here. Be specific, engaging, and unique..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 bg-gray-900 border-gray-700 text-gray-100 resize-none focus:border-blue-500"
                disabled={isLoading}
              />
              <div className="text-xs text-gray-500">
                {prompt.length}/500 characters
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Prompt Style
              </label>
              <div className="flex flex-wrap gap-2">
                {['Creative', 'Structured', 'Open-ended', 'Detailed'].map((style) => (
                  <Badge
                    key={style}
                    variant="outline"
                    className="cursor-pointer border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400"
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Calling Claude...' : 'Submit Prompt'}
            </Button>

            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-yellow-400" />
                Prompt Tips
              </h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Be specific but leave room for creativity</li>
                <li>• Include emotional or conflict elements</li>
                <li>• Set clear constraints or parameters</li>
                <li>• Consider unique perspectives or settings</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="p-4 space-y-4">
            <Card className="bg-gray-900 border-gray-700 p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Prompt Quality Score
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>
                <span className="text-sm font-medium text-emerald-400">8.4/10</span>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-700 p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Predicted Performance
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Creativity Score:</span>
                  <span className="text-blue-400">High</span>
                </div>
                <div className="flex justify-between">
                  <span>Clarity:</span>
                  <span className="text-emerald-400">Excellent</span>
                </div>
                <div className="flex justify-between">
                  <span>Engagement:</span>
                  <span className="text-yellow-400">Very Good</span>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-700 p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Similar Prompts Performance
              </h3>
              <div className="text-xs text-gray-400">
                Prompts with similar structure scored an average of{' '}
                <span className="text-blue-400 font-medium">7.8/10</span>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Top Prompters This Week
            </h3>
            
            {[
              { rank: 1, name: 'Sarah Chen', score: 94.2, badge: '👑' },
              { rank: 2, name: 'Alex Rivera', score: 91.8, badge: '🥈' },
              { rank: 3, name: 'Jordan Kim', score: 89.5, badge: '🥉' },
              { rank: 4, name: 'You', score: 84.1, badge: '' },
              { rank: 5, name: 'Maya Patel', score: 82.7, badge: '' },
            ].map((user) => (
              <Card
                key={user.rank}
                className={`bg-gray-900 border-gray-700 p-3 ${
                  user.name === 'You' ? 'border-blue-500 bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-400">
                      #{user.rank}
                    </span>
                    <span className="text-sm text-gray-300">{user.name}</span>
                    {user.badge && <span>{user.badge}</span>}
                    {user.name === 'You' && (
                      <Badge className="bg-blue-900 text-blue-200 text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">
                      {user.score}
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="bg-gray-900 border-gray-700 p-3 mt-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Next reset:</span>
                </div>
                <span>3d 14h 22m</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
