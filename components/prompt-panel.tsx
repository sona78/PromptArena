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
  History
} from "lucide-react";
import { useEditor } from "./editor-context";
import { InfiniteScrollContainer } from "./infinite-scroll-container";

export function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const { code, setCode, isLoading, setIsLoading, promptQualityScore, setPromptQualityScore, promptMetrics, setPromptMetrics } = useEditor();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    
    const finalPrompt = `Modify the following code according to this request: ${prompt}

Return only the complete updated code, no explanations.

Current code:
\`\`\`
${code}
\`\`\``;

    const evaluationPrompt = `You are a prompt evaluation assistant. Given a user-supplied prompt (the “query”), you will evaluate its effectiveness according to the following metrics (derived from the Anthropic Prompt Engineering guidelines):

        1. Clarity & Directness — Is the prompt clear, unambiguous, and direct about what is asked?
        2. Role Definition / System Context — Does the prompt give you a role or system context (e.g. “You are …”) so you understand how to respond?
        3. Specificity / Constraints — Does the prompt include specific constraints (format, tone, length, domain, audience, etc.)?
        4. Use of Examples or Few-Shot Guidance — Does it use examples to illustrate what is wanted or show style/format?
        5. Chain of Thought / Reasoning Encouragement — Does it ask the model to think step by step or explain reasoning when needed?
        6. Prefilling / Preface / Structured Tags — Are there structured tags or prefilling that help guide response structure?
        7. Conciseness / Avoiding Redundancy — Is the prompt free from unnecessary words or confusing redundancy?
        8. Suitability of Tone / Audience — Is the tone and style appropriate for the target audience and use case?
        9. Success Criteria / Eval Metrics — Does the prompt define success criteria or what “good” looks like?

        ---

        Task:

        Given the user prompt below, evaluate it on each metric giving it a score out of 10.
        Then average the scores to get a final score out of 10.
        Return the final score in a json format. It should have 10 keys, one for each metric and the last as a final score.
        Your response should be in the following format:
        {
            "clarity": 10,
            "role definition": 10,
            "specificity": 10,
            "use of examples": 10,
            "chain of thought": 10,
            "prefilling": 10,
            "conciseness": 10,
            "suitability of tone": 10,
            "success criteria": 10
            "final score": 10,
        }

        EXAMPLE:
        User Prompt: "Write a prompt that generates a story about a dog."
        Response:
        {
            "clarity": 5,
            "role definition": 6,
            "specificity": 4,
            "use of examples": 0,
            "chain of thought": 8,
            "prefilling": 5,
            "conciseness": 10,
            "suitability of tone": 3,
            "success criteria": 4,
            "final score": 5.5,
        }

        ---

        User Prompt: ${prompt}`;

    try {
      // Run both the code modification and prompt evaluation in parallel
      const [codeResponse, evaluationResponse] = await Promise.all([
        fetch('/api/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: finalPrompt }),
        }),
        fetch('/api/claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: evaluationPrompt }),
        })
      ]);

      const [codeData, evaluationData] = await Promise.all([
        codeResponse.json(),
        evaluationResponse.json()
      ]);

      // Handle code modification response
      if (codeData.success) {
        // Strip markdown code blocks from Claude's response
        let cleanedCode = codeData.content;
        
        // Remove code block markers (```python, ```javascript, etc.)
        cleanedCode = cleanedCode.replace(/^```\w*\n?/gm, '');
        cleanedCode = cleanedCode.replace(/\n?```$/gm, '');
        
        // Update the editor with cleaned response
        setCode(cleanedCode.trim());
      } else {
        // Handle error - show in editor
        setCode(`# Error calling Claude API

**Error:** ${codeData.error}

**Original Prompt:**
${prompt}

Please try again or check your configuration.`);
      }

      // Handle evaluation response
      if (evaluationData.success) {
        try {
          // Extract JSON from Claude's response (it might have extra text)
          const content = evaluationData.content;
          const jsonMatch = content.match(/\{[\s\S]*?\}/);
          
          if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0]);
            
            // Store all metrics
            setPromptMetrics(evaluation);
            
            // Set the final score
            if (evaluation['final score'] && typeof evaluation['final score'] === 'number') {
              setPromptQualityScore(evaluation['final score']);
            }
          } else {
            // Fallback: try to extract just the number after "final score"
            const scoreMatch = content.match(/"final score":\s*(\d+(?:\.\d+)?)/);
            if (scoreMatch) {
              const score = parseFloat(scoreMatch[1]);
              setPromptQualityScore(score);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse evaluation response:', parseError);
          console.log('Raw response:', evaluationData.content);
        }
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
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(promptQualityScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-emerald-400">{promptQualityScore}/10</span>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-700 p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Evaluation Metrics
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                {promptMetrics ? (
                  Object.entries(promptMetrics)
                    .filter(([key]) => key !== 'final score')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className={`font-medium ${
                          typeof value === 'number' && value >= 8 ? 'text-emerald-400' :
                          typeof value === 'number' && value >= 6 ? 'text-yellow-400' :
                          typeof value === 'number' && value >= 4 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {typeof value === 'number' ? `${value}/10` : String(value)}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="text-gray-500 text-center py-2">
                    Submit a prompt to see detailed metrics
                  </div>
                )}
              </div>
            </Card>

            {promptMetrics && (
              <Card className="bg-gray-900 border-gray-700 p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Improvement Suggestions
                </h3>
                <div className="text-xs text-gray-400 space-y-1">
                  {Object.entries(promptMetrics)
                    .filter(([key, value]) => key !== 'final score' && typeof value === 'number' && value < 7)
                    .map(([key, value]) => (
                      <div key={key} className="text-orange-400">
                        • Improve {key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} (currently {String(value)}/10)
                      </div>
                    ))}
                  {Object.entries(promptMetrics)
                    .filter(([key, value]) => key !== 'final score' && typeof value === 'number' && value < 7)
                    .length === 0 && (
                    <div className="text-emerald-400">
                      Great job! All metrics are performing well.
                    </div>
                  )}
                </div>
              </Card>
            )}
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
