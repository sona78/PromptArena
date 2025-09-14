'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Sparkles,
  Brain,
  History,
  File,
  Mic,
  MicOff,
  Loader2
} from "lucide-react";
import { useEditor } from "./editor-context";
import { supabase } from '@/lib/supabase';
import { useVoiceRecording } from '@/hooks/use-voice-recording';

interface PromptPanelProps {
  sessionId: string;
}

export function PromptPanel({ sessionId }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [lastPromptTokenCount, setLastPromptTokenCount] = useState(0);
  const [lastResponseTokenCount, setLastResponseTokenCount] = useState(0);
  const { code, setCode, isLoading, setIsLoading, promptQualityScore, setPromptQualityScore, promptMetrics, setPromptMetrics, activeFile, promptChainingScore, codeEvaluationScore, codeAccuracyScore, setPromptChainingScore, setCodeEvaluationScore, setCodeAccuracyScore } = useEditor();
  
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
  const saveFeedbackToDatabase = async (metrics: Record<string, unknown>, qualityScore: number) => {
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

      // Extract persistent fields from current feedback
      const currentFeedback = session?.feedback || {};
      const persistentFields: Record<string, unknown> = {};

      // Preserve persistent fields that should not be removed
      if (typeof currentFeedback === 'object' && currentFeedback !== null) {
        if ('promptChainingScore' in currentFeedback) {
          persistentFields.promptChainingScore = currentFeedback.promptChainingScore;
        }
        if ('codeEvaluationScore' in currentFeedback) {
          persistentFields.codeEvaluationScore = currentFeedback.codeEvaluationScore;
        }
        if ('codeAccuracyScore' in currentFeedback) {
          persistentFields.codeAccuracyScore = currentFeedback.codeAccuracyScore;
        }
      }

      // Overwrite feedback state with new submission, keeping persistent fields
      const updatedFeedback = {
        ...persistentFields,
        timestamp: new Date().toISOString(),
        type: 'prompt_analysis',
        data: {
          metrics: metrics,
          qualityScore: qualityScore,
          promptTokenCount: lastPromptTokenCount,
          responseTokenCount: lastResponseTokenCount,
          // Include current scores from state (these will be the latest values)
          promptChainingScore: promptChainingScore,
          codeEvaluationScore: codeEvaluationScore,
          codeAccuracyScore: codeAccuracyScore
        }
      };

      // Update session with new feedback (complete overwrite)
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
  const fetchPromptHistory = useCallback(async () => {
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
  }, [sessionId]);

  // Function to fetch feedback data
  const fetchFeedbackData = useCallback(async () => {
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

      // Since feedback is now a single object (not an array), check if it has the expected structure
      let recentAnalysis = null;
      if (typeof feedback === 'object' && feedback !== null && 'type' in feedback && feedback.type === 'prompt_analysis') {
        recentAnalysis = feedback;
      }

      if (
        recentAnalysis &&
        typeof recentAnalysis === "object" &&
        "data" in recentAnalysis &&
        recentAnalysis.data &&
        typeof recentAnalysis.data === "object"
      ) {
        const data = recentAnalysis.data as {
          metrics?: Record<string, unknown>;
          qualityScore?: number;
          promptTokenCount?: number;
          responseTokenCount?: number;
          promptChainingScore?: number;
          codeEvaluationScore?: number;
          codeAccuracyScore?: number;
        };

        // Restore the metrics and scores from the most recent analysis
        if (data.metrics) {
          setPromptMetrics(data.metrics);
        }
        if (data.qualityScore) {
          setPromptQualityScore(data.qualityScore);
        }
        if (data.promptTokenCount) {
          setLastPromptTokenCount(data.promptTokenCount);
        }
        if (data.responseTokenCount) {
          setLastResponseTokenCount(data.responseTokenCount);
        }
        // Restore prompt chaining data from feedback object
        // These will be displayed in the left file system panel
        if (data.promptChainingScore !== undefined) {
          setPromptChainingScore(data.promptChainingScore);
        }
        if (data.codeEvaluationScore !== undefined) {
          setCodeEvaluationScore(data.codeEvaluationScore);
        }
        if (data.codeAccuracyScore !== undefined) {
          setCodeAccuracyScore(data.codeAccuracyScore);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  }, [sessionId, setPromptMetrics, setPromptQualityScore, setLastPromptTokenCount, setLastResponseTokenCount, setPromptChainingScore, setCodeEvaluationScore, setCodeAccuracyScore]);

  // Fetch prompt history and feedback data on component mount
  useEffect(() => {
    fetchPromptHistory();
    fetchFeedbackData();
  }, [sessionId, fetchPromptHistory, fetchFeedbackData]);

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

    const evaluationPrompt = `You are a prompt evaluation assistant. Given a user-supplied prompt (the "query"), you will evaluate its effectiveness according to the following metrics (derived from the Anthropic Prompt Engineering guidelines):

        1. Clarity & Directness — Is the prompt clear, unambiguous, and direct about what is asked?
        2. Role Definition / System Context — Does the prompt give you a role or system context (e.g. "You are …") so you understand how to respond?
        3. Specificity / Constraints — Does the prompt include specific constraints (format, tone, length, domain, audience, etc.)?
        4. Use of Examples or Few-Shot Guidance — Does it use examples to illustrate what is wanted or show style/format?
        5. Chain of Thought / Reasoning Encouragement — Does it ask the model to think step by step or explain reasoning when needed?
        6. Prefilling / Preface / Structured Tags — Are there structured tags or prefilling that help guide response structure?
        7. Conciseness / Avoiding Redundancy — Is the prompt free from unnecessary words or confusing redundancy?
        8. Suitability of Tone / Audience — Is the tone and style appropriate for the target audience and use case?
        9. Success Criteria / Eval Metrics — Does the prompt define success criteria or what "good" looks like?

        ---

        Task:

        Given the user prompt below, evaluate it on each metric giving it a score out of 10 and a brief justification for that score.
        Then average the scores to get a final score out of 10.
        Return the evaluation in a json format with both scores and justifications.
        Your response should be in the following format:
        {
            "clarity": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "role definition": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "specificity": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "use of examples": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "chain of thought": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "prefilling": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "conciseness": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "suitability of tone": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "success criteria": {"score": 10, "justification": "Brief explanation of why this score was given"},
            "final score": 10
        }

        EXAMPLE:
        User Prompt: "Write a prompt that generates a story about a dog."
        Response:
        {
            "clarity": {"score": 5, "justification": "The request is clear but lacks specific details about story length, style, or target audience"},
            "role definition": {"score": 6, "justification": "No explicit role is defined, but the task implies a creative writing role"},
            "specificity": {"score": 4, "justification": "Very vague - no constraints on length, style, tone, or specific requirements"},
            "use of examples": {"score": 0, "justification": "No examples provided to illustrate desired output style or format"},
            "chain of thought": {"score": 8, "justification": "The request is straightforward and doesn't require complex reasoning steps"},
            "prefilling": {"score": 5, "justification": "No structured format or prefilling guidance provided"},
            "conciseness": {"score": 10, "justification": "Very brief and to the point without unnecessary words"},
            "suitability of tone": {"score": 3, "justification": "No tone specified, making it unclear what style is expected"},
            "success criteria": {"score": 4, "justification": "No clear definition of what makes a good story or successful output"},
            "final score": 5.5
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
          
          // Try multiple JSON extraction methods
          let evaluation = null;
          
          // Method 1: Try to parse the entire content as JSON
          try {
            evaluation = JSON.parse(content);
          } catch (e1) {
            // Method 2: Find JSON object with proper bracket matching
            const jsonStart = content.indexOf('{');
            if (jsonStart !== -1) {
              let bracketCount = 0;
              let jsonEnd = -1;
              
              for (let i = jsonStart; i < content.length; i++) {
                if (content[i] === '{') bracketCount++;
                if (content[i] === '}') bracketCount--;
                if (bracketCount === 0) {
                  jsonEnd = i;
                  break;
                }
              }
              
              if (jsonEnd !== -1) {
                const jsonString = content.substring(jsonStart, jsonEnd + 1);
                try {
                  evaluation = JSON.parse(jsonString);
                } catch (e2) {
                  // Method 3: Fallback to regex (original method)
                  const jsonMatch = content.match(/\{[\s\S]*?\}/);
                  if (jsonMatch) {
                    try {
                      evaluation = JSON.parse(jsonMatch[0]);
                    } catch (e3) {
                      // JSON parsing failed
                    }
                  }
                }
              }
            }
          }

          if (evaluation) {

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

              // Save the submission to database
              if (sessionId && finalScore > 0) {
                try {
                  await fetch('/api/submit-attempt', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      sessionId,
                      prompt,
                      score: finalScore,
                      metrics: evaluation
                    }),
                  });

                } catch (error) {
                  console.error('Failed to save submission:', error);
                }
              }
            }

            // Save feedback to database
            await saveFeedbackToDatabase(evaluation, finalScore);
          } else {
            // Fallback: try to extract just the number after "final score"
            const scoreMatch = content.match(/"final score":\s*(\d+(?:\.\d+)?)/);
            if (scoreMatch) {
              const score = parseFloat(scoreMatch[1]);
              setPromptQualityScore(score);
              
              // Save the submission to database
              if (sessionId && score > 0) {
                try {
                  await fetch('/api/submit-attempt', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      sessionId,
                      prompt,
                      score,
                      metrics: {}
                    }),
                  });

                } catch (error) {
                  console.error('Failed to save submission:', error);
                }
              }
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
    <div className="h-full flex flex-col bg-white border-l border-[#79797C]">
      {/* Tab Navigation */}
      <div className="bg-[#C5AECF]/10 border-b border-[#79797C] px-4 py-2">
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
                    ? 'bg-[#3073B7] text-white'
                    : 'text-[#79797C] hover:text-[#28282D] hover:bg-[#C5AECF]/20'
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
                  <label className="text-sm font-medium text-[#28282D]">
                    Your Prompt
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 transition-colors ${
                      isRecording 
                        ? 'text-red-600 hover:text-red-500' 
                        : isTranscribing
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-700'
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
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
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
                className="min-h-32 bg-white border-gray-300 text-gray-900 resize-none focus:border-blue-500"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-blue-600 font-medium">
                  {tokenCount} tokens
                </div>
                {voiceError && (
                  <div className="text-xs text-red-600">
                    {voiceError}
                  </div>
                )}
                {isRecording && (
                  <div className="flex items-center space-x-1 text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span>Recording...</span>
                  </div>
                )}
                {isTranscribing && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Transcribing...</span>
                  </div>
                )}
              </div>
            </div>


            <Button
                className="w-full bg-[#3073B7] hover:bg-[#3073B7]/80 text-white"
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
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <History className="w-4 h-4 mr-1 text-blue-600" />
                  Recent Prompts ({promptHistory.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {promptHistory.slice(-3).reverse().map((historyPrompt, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setPrompt(historyPrompt)}
                    >
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {historyPrompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-yellow-600" />
                Prompt Tips
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
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
            <Card className="bg-gray-50 border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Token Counts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Prompt:</span>
                    <div className="text-lg font-bold text-blue-600">
                      {lastPromptTokenCount}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Response:</span>
                    <div className="text-lg font-bold text-green-600">
                      {lastResponseTokenCount}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <div className="text-lg font-bold text-purple-600">
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

            <Card className="bg-gray-50 border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Carbon Emissions
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <div className="text-lg font-bold text-gray-800">
                  {((lastPromptTokenCount * 0.0001) + (lastResponseTokenCount * 0.0003)).toFixed(4)}
                </div>
                <span className="text-xs text-gray-500">g CO₂</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Based on 0.0001g per input token, 0.0003g per output token
              </div>
            </Card>

            <Card className="bg-gray-50 border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Prompt Quality Score
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(promptQualityScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-emerald-600">{promptQualityScore}/10</span>
              </div>
            </Card>

            <Card className="bg-gray-50 border-gray-200 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Evaluation Metrics
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                {promptMetrics ? (
                  Object.entries(promptMetrics)
                    .filter(([key]) => key !== 'final score')
                    .map(([key, value]) => {
                      const score = typeof value === 'number' ? value : (value as { score: number })?.score || 0;
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className={`font-medium ${
                            score >= 8 ? 'text-emerald-600' :
                            score >= 6 ? 'text-yellow-600' :
                            score >= 4 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {score}/10
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-gray-600 text-center py-2">
                    Submit a prompt to see detailed metrics
                  </div>
                )}
              </div>
            </Card>

            {promptMetrics && (
              <Card className="bg-gray-50 border-gray-200 p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Comments
                </h3>
                <div className="text-xs text-gray-600 space-y-3">
                  {Object.entries(promptMetrics)
                    .filter(([key]) => key !== 'final score')
                    .map(([key, value]) => {
                      const justification = typeof value === 'object' && value !== null && 'justification' in value 
                        ? (value as { justification: string }).justification 
                        : null;
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="font-medium text-gray-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </div>
                          {justification ? (
                            <div className="text-gray-600 pl-2 text-xs">
                              {justification}
                            </div>
                          ) : (
                            <div className="text-gray-400 pl-2 text-xs italic">
                              No justification available
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
}