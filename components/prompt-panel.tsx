'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase';

interface PromptPanelProps {
  sessionId: string;
}
import * as tokenizer from '@anthropic-ai/tokenizer';

export function PromptPanel({ sessionId }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [lastPromptTokenCount, setLastPromptTokenCount] = useState(0);
  const [lastResponseTokenCount, setLastResponseTokenCount] = useState(0);
  const { code, setCode, isLoading, setIsLoading, promptQualityScore, setPromptQualityScore, promptMetrics, setPromptMetrics, activeFile } = useEditor();

  // Function to save prompt to database
  const savePromptToDatabase = async (promptText: string) => {
    if (!sessionId) return;

    try {
      // Get current session data
      const { data: session, error: sessionError } = await supabase
        .from('Sessions')
        .select('prompts')
        .eq('session_id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      // Add new prompt to existing prompts array
      const updatedPrompts = [...(session.prompts || []), promptText];

      // Update session with new prompts array
      const { error: updateError } = await supabase
        .from('Sessions')
        .update({ prompts: updatedPrompts })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error updating prompts:', updateError);
        return;
      }

      // Update local state
      setPromptHistory(updatedPrompts);
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  // Function to fetch prompt history
  const fetchPromptHistory = async () => {
    if (!sessionId) return;

    try {
      const { data: session, error } = await supabase
        .from('Sessions')
        .select('prompts')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching prompt history:', error);
        return;
      }

      setPromptHistory(session.prompts || []);
    } catch (error) {
      console.error('Error fetching prompt history:', error);
    }
  };

  // Fetch prompt history on component mount
  useEffect(() => {
    fetchPromptHistory();
  }, [sessionId]);

  // Calculate token count using Anthropic tokenizer
  const tokenCount = useMemo(() => {
    try {
      console.log('Attempting to count tokens for:', prompt);
      console.log('tokenizer object:', tokenizer);
      console.log('Available methods:', Object.keys(tokenizer));
      
      // Test the tokenizer with a simple example first
      const testTokens = tokenizer.countTokens("Hello world");
      console.log('Test tokenizer works:', testTokens);
      
      const tokens = tokenizer.countTokens(prompt);
      console.log('Token count:', tokens, 'for prompt:', prompt);
      return tokens;
    } catch (error) {
      console.error('Error counting tokens:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Fallback: rough estimation (1 token ≈ 4 characters for English text)
      const estimatedTokens = Math.ceil(prompt.length / 4);
      console.log('Using fallback estimation:', estimatedTokens);
      return estimatedTokens;
    }
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    // Store the token count of the submitted prompt
    try {
      const submittedTokenCount = tokenizer.countTokens(prompt);
      setLastPromptTokenCount(submittedTokenCount);
      console.log('Stored token count for submitted prompt:', submittedTokenCount);
    } catch (error) {
      console.error('Error counting tokens for submitted prompt:', error);
      // Fallback estimation
      const estimatedTokens = Math.ceil(prompt.length / 4);
      setLastPromptTokenCount(estimatedTokens);
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
      // Fix: add logic for when there is no active file
      finalPrompt = `Write code according to this request: ${prompt}

Return only the complete code, no explanations.`;
    }

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

        // Count tokens in Claude's response
        try {
          const responseTokenCount = tokenizer.countTokens(cleanedCode);
          setLastResponseTokenCount(responseTokenCount);
          console.log('Claude response token count:', responseTokenCount);
        } catch (error) {
          console.error('Error counting response tokens:', error);
          // Fallback estimation
          const estimatedTokens = Math.ceil(cleanedCode.length / 4);
          setLastResponseTokenCount(estimatedTokens);
        }

        // Update the editor with cleaned response
        // This will trigger the auto-save system if there's an active file
        setCode(cleanedCode.trim());

        // Save prompt to database
        await savePromptToDatabase(prompt);

        // Clear the prompt after successful submission
        setPrompt('');
      } else {
        // Handle error - show in editor
        setCode(`# Error calling Claude API

**Error:** ${codeData.error}

**Original Prompt:**
${prompt}



zPlease try again or check your configuration.`);
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
            if (
              Object.prototype.hasOwnProperty.call(evaluation, 'final score') &&
              typeof evaluation['final score'] === 'number'
            ) {
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
      const errorMessage = activeFile
        ? `# Network Error for ${activeFile.name}\n\n**Error:** Failed to connect to Claude API\n\n**Original Prompt:**\n${prompt}\n\nPlease check your internet connection and try again.`
        : `# Network Error\n\n**Error:** Failed to connect to Claude API\n\n**Original Prompt:**\n${prompt}\n\nPlease check your internet connection and try again.`;

      setCode(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Real data fetcher for prompt history
  const fetchPromptHistoryPaginated = async (page: number, limit: number) => {
    // Get all prompts and paginate locally since we store them as a simple array
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Transform prompt history into the expected format
    const allPrompts = promptHistory.map((promptText, index) => ({
      id: index + 1,
      prompt: promptText,
      score: 0, // We don't store scores per prompt currently
      timestamp: new Date(), // We don't store timestamps per prompt currently
      status: 'completed'
    })).reverse(); // Show newest first

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
              <div className="text-xs text-blue-400 font-medium">
                {tokenCount} tokens
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

            {promptHistory.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <History className="w-4 h-4 mr-1 text-blue-400" />
                  Recent Prompts ({promptHistory.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {promptHistory.slice(-3).reverse().map((historyPrompt, index) => (
                    <div
                      key={index}
                      className="bg-gray-900 border border-gray-700 rounded p-2 cursor-pointer hover:bg-gray-800 transition-colors"
                      onClick={() => setPrompt(historyPrompt)}
                    >
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {historyPrompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {activeTab === 'history' && (
          <div className="flex-1 overflow-hidden">
            <InfiniteScrollContainer
              fetchData={fetchPromptHistoryPaginated}
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

        {activeTab === 'analyze' && (
          <div className="p-4 space-y-4">
            <Card className="bg-gray-900 border-gray-700 p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Token Counts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Prompt:</span>
                    <div className="text-lg font-bold text-blue-400">
                      {lastPromptTokenCount}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Response:</span>
                    <div className="text-lg font-bold text-green-400">
                      {lastResponseTokenCount}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total:</span>
                    <div className="text-lg font-bold text-purple-400">
                      {lastPromptTokenCount + lastResponseTokenCount}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {lastPromptTokenCount > 0 ? 'From last submitted prompt and response' : 'No prompts submitted yet'}
              </div>
            </Card>

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