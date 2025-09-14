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
  Clock,
  History,
  File,
  Mic,
  MicOff,
  Loader2
} from "lucide-react";
import { useEditor } from "./editor-context";
import { supabase } from '@/lib/supabase';
import { useVoiceRecording } from '@/hooks/use-voice-recording';
import * as tokenizer from '@anthropic-ai/tokenizer';

interface PromptPanelProps {
  sessionId: string;
}


export function PromptPanel({ sessionId }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [lastPromptTokenCount, setLastPromptTokenCount] = useState(0);
  const [lastResponseTokenCount, setLastResponseTokenCount] = useState(0);
  const { code, setCode, isLoading, setIsLoading, promptQualityScore, setPromptQualityScore, promptMetrics, setPromptMetrics, activeFile } = useEditor();
  
  // Voice recording hook
  const { 
    isRecording, 
    isTranscribing, 
    startRecording, 
    stopRecording, 
    error: voiceError 
  } = useVoiceRecording();

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

  // Function to save feedback (prompt metrics) to database
  const saveFeedbackToDatabase = async (metrics: any, qualityScore: number) => {
    if (!sessionId) return;

    try {
      // Get current session feedback
      const { data: session, error: sessionError } = await supabase
        .from('Sessions')
        .select('feedback')
        .eq('session_id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session feedback:', sessionError);
        return;
      }

      // Create feedback entry
      const feedbackEntry = {
        timestamp: new Date().toISOString(),
        type: 'prompt_analysis',
        data: {
          metrics: metrics,
          qualityScore: qualityScore,
          promptTokenCount: lastPromptTokenCount,
          responseTokenCount: lastResponseTokenCount
        }
      };

      // Add to existing feedback object
      const currentFeedback = session?.feedback || {};
      const feedbackKey = `analysis_${Date.now()}`;
      const updatedFeedback = { ...currentFeedback, [feedbackKey]: feedbackEntry };

      // Update session with new feedback
      const { error: updateError } = await supabase
        .from('Sessions')
        .update({ feedback: updatedFeedback })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error updating feedback:', updateError);
        return;
      }

      console.log('Feedback saved successfully');
    } catch (error) {
      console.error('Error saving feedback:', error);
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

  // Function to fetch feedback data
  const fetchFeedbackData = async () => {
    if (!sessionId) return;

    try {
      const { data: session, error } = await supabase
        .from('Sessions')
        .select('feedback')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching feedback:', error);
        return;
      }

      const feedback = session.feedback || {};

      // Get the most recent prompt analysis feedback
      const feedbackEntries = Object.values(feedback)
        .filter((item: any) => item.type === 'prompt_analysis')
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recentAnalysis = feedbackEntries[0];

      if (recentAnalysis && recentAnalysis.data) {
        // Restore the metrics and scores from the most recent analysis
        if (recentAnalysis.data.metrics) {
          setPromptMetrics(recentAnalysis.data.metrics);
        }
        if (recentAnalysis.data.qualityScore) {
          setPromptQualityScore(recentAnalysis.data.qualityScore);
        }
        if (recentAnalysis.data.promptTokenCount) {
          setLastPromptTokenCount(recentAnalysis.data.promptTokenCount);
        }
        if (recentAnalysis.data.responseTokenCount) {
          setLastResponseTokenCount(recentAnalysis.data.responseTokenCount);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  // Fetch prompt history and feedback data on component mount
  useEffect(() => {
    fetchPromptHistory();
    fetchFeedbackData();
  }, [sessionId]);

  // Calculate token count using Anthropic tokenizer
  const tokenCount = useMemo(() => {
    // Simple estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(prompt.length / 4);
  }, [prompt]);

  // Handle voice recording toggle
  const handleVoiceToggle = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setPrompt(prev => prev + (prev ? ' ' : '') + transcribedText);
      }
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    // Store the token count of the submitted prompt using simple estimation
    const submittedTokenCount = Math.ceil(prompt.length / 4);
    setLastPromptTokenCount(submittedTokenCount);

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

        // Count tokens in Claude's response using simple estimation
        const responseTokenCount = Math.ceil(cleanedCode.length / 4);
        setLastResponseTokenCount(responseTokenCount);

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
            let finalScore = 0;
            if (
              Object.prototype.hasOwnProperty.call(evaluation, 'final score') &&
              typeof evaluation['final score'] === 'number'
            ) {
              finalScore = evaluation['final score'];
              setPromptQualityScore(finalScore);
            }

            // Save feedback to database
            await saveFeedbackToDatabase(evaluation, finalScore);
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


  const tabs = [
    { id: 'write', label: 'Write Prompt', icon: MessageSquare },
    { id: 'analyze', label: 'Analysis', icon: Brain },
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
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-300">
                    Your Prompt
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 transition-colors ${
                      isRecording 
                        ? 'text-red-400 hover:text-red-300' 
                        : isTranscribing
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={handleVoiceToggle}
                    disabled={isTranscribing || isLoading}
                    title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice recording'}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-3 h-3" />
                    ) : (
                      <Mic className="w-3 h-3" />
                    )}
                  </Button>
                </div>
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
              <div className="flex items-center justify-between">
                <div className="text-xs text-blue-400 font-medium">
                  {tokenCount} tokens
                </div>
                {voiceError && (
                  <div className="text-xs text-red-400">
                    {voiceError}
                  </div>
                )}
                {isRecording && (
                  <div className="flex items-center space-x-1 text-xs text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span>Recording...</span>
                  </div>
                )}
                {isTranscribing && (
                  <div className="flex items-center space-x-1 text-xs text-blue-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Transcribing...</span>
                  </div>
                )}
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

      </div>
    </div>
  );
}