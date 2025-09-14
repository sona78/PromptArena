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
  Clock,
  History,
  File
} from "lucide-react";
import { useEditor } from "./editor-context";
import { InfiniteScrollContainer } from "./infinite-scroll-container";

export function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const { code, setCode, isLoading, setIsLoading, activeFile } = useEditor();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    
    // Create context-aware prompt based on whether we have an active file
    let finalPrompt;
    if (activeFile) {
      finalPrompt = `Modify the file "${activeFile.name}" according to this request: ${prompt}

Return only the complete updated code, no explanations.

Current file content:
\`\`\`${activeFile.language}
${code}
\`\`\``;
    } else {
      finalPrompt = `Create code according to this request: ${prompt}

Return only the complete code, no explanations.`;
    }

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const data = await response.json();

      if (data.success) {
        // Strip markdown code blocks from Claude's response
        let cleanedCode = data.content;
        
        // Remove code block markers (```python, ```javascript, etc.)
        cleanedCode = cleanedCode.replace(/^```\w*\n?/gm, '');
        cleanedCode = cleanedCode.replace(/\n?```$/gm, '');
        
        // Update the editor with cleaned response
        // This will trigger the auto-save system if there's an active file
        setCode(cleanedCode.trim());

        // Clear the prompt after successful submission
        setPrompt('');
      } else {
        // Handle error - show in editor
        const errorMessage = activeFile
          ? `# Error calling Claude API for ${activeFile.name}\n\n**Error:** ${data.error}\n\n**Original Prompt:**\n${prompt}\n\nPlease try again or check your configuration.`
          : `# Error calling Claude API\n\n**Error:** ${data.error}\n\n**Original Prompt:**\n${prompt}\n\nPlease try again or check your configuration.`;

        setCode(errorMessage);
      }
    } catch (error) {
      // Handle network error
      const errorMessage = activeFile
        ? `# Network Error for ${activeFile.name}\n\n**Error:** Failed to connect to Claude API\n\n**Original Prompt:**\n${prompt}\n\nPlease check your internet connection and try again.`
        : `# Network Error\n\n**Error:** Failed to connect to Claude API\n\n**Original Prompt:**\n${prompt}\n\nPlease check your internet connection and try again.`;

      setCode(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data fetcher for prompt history
  const fetchPromptHistory = async (page: number, limit: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock data - in real app, this would fetch from Supabase
    const allPrompts = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      prompt: `Example prompt ${i + 1}: Write a creative story about ${['dragons', 'robots', 'magic', 'space', 'time travel'][i % 5]}`,
      score: Math.floor(Math.random() * 100) + 1,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 60),
      status: ['pending', 'completed', 'failed'][i % 3]
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageData = allPrompts.slice(startIndex, endIndex);

    return {
      data: pageData,
      hasMore: endIndex < allPrompts.length,
      nextPage: page + 1
    };
  };

  const tabs = [
    { id: 'write', label: 'Write Prompt', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
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
        {activeTab === 'history' && (
          <div className="flex-1 overflow-hidden">
            <InfiniteScrollContainer
              fetchData={fetchPromptHistory}
              renderItem={(item: any) => (
                <Card className="bg-gray-900 border-gray-700 p-3 mx-4 mb-2">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-300 flex-1 pr-2">
                        {item.prompt}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.status === 'completed'
                            ? 'border-green-600 text-green-400'
                            : item.status === 'pending'
                            ? 'border-yellow-600 text-yellow-400'
                            : 'border-red-600 text-red-400'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp.toLocaleString()}</span>
                      </div>
                      {item.status === 'completed' && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span>{item.score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              renderEmpty={() => (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                  <History className="w-12 h-12 mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No prompt history</h3>
                  <p className="text-sm text-center">Your submitted prompts will appear here</p>
                </div>
              )}
              limit={10}
              threshold={50}
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'write' && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Your Prompt
                </label>
                {activeFile && (
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <File className="w-3 h-3" />
                    <span>Editing: {activeFile.name}</span>
                  </div>
                )}
              </div>
              <Textarea
                placeholder={
                  activeFile
                    ? `Describe how you want to modify "${activeFile.name}"...`
                    : "Describe what code you want to generate..."
                }
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
              {isLoading
                ? 'Calling Claude...'
                : activeFile
                  ? `Modify ${activeFile.name}`
                  : 'Generate Code'
              }
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
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Top Prompters This Week
              </h3>
              <Card className="bg-gray-900 border-gray-700 p-2 mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Next reset:</span>
                  </div>
                  <span>3d 14h 22m</span>
                </div>
              </Card>
            </div>

            <div className="flex-1 overflow-hidden">
              <InfiniteScrollContainer
                fetchData={async (page: number, limit: number) => {
                  await new Promise(resolve => setTimeout(resolve, 600));

                  const allUsers = Array.from({ length: 500 }, (_, i) => ({
                    rank: i + 1,
                    name: i === 3 ? 'You' : `User ${i + 1}`,
                    score: Math.floor(Math.random() * 50) + 50 + (500 - i) * 0.1,
                    badge: i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
                    streak: Math.floor(Math.random() * 30) + 1,
                    submissions: Math.floor(Math.random() * 100) + 10
                  }));

                  const startIndex = (page - 1) * limit;
                  const endIndex = startIndex + limit;
                  const pageData = allUsers.slice(startIndex, endIndex);

                  return {
                    data: pageData,
                    hasMore: endIndex < allUsers.length
                  };
                }}
                renderItem={(user: any) => (
                  <Card
                    className={`bg-gray-900 border-gray-700 p-3 mx-4 mb-2 ${
                      user.name === 'You' ? 'border-blue-500 bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-400 min-w-[32px]">
                          #{user.rank}
                        </span>
                        <span className="text-sm text-gray-300">{user.name}</span>
                        {user.badge && <span className="text-lg">{user.badge}</span>}
                        {user.name === 'You' && (
                          <Badge className="bg-blue-900 text-blue-200 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-300">
                              {user.score.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.submissions} prompts
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                renderEmpty={() => (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-4 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No rankings available</h3>
                    <p className="text-sm text-center">Complete some prompts to see the leaderboard</p>
                  </div>
                )}
                limit={20}
                threshold={100}
                className="h-full pt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
