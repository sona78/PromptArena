'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Terminal } from "lucide-react";

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  execution_time?: number;
}

interface ResultsPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
}

export function ResultsPanel({ result, isRunning }: ResultsPanelProps) {
  if (isRunning) {
    return (
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="flex items-center space-x-2 text-blue-400">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <Terminal className="w-4 h-4" />
          <span className="text-sm">Click "Test Prompt" to run your code</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm font-medium text-gray-300">
            Execution {result.success ? 'Successful' : 'Failed'}
          </span>
          {result.execution_time && (
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              {result.execution_time.toFixed(2)}s
            </Badge>
          )}
        </div>
      </div>

      {/* Output */}
      {result.output && (
        <Card className="bg-gray-800 border-gray-700 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-medium text-gray-300">Output</span>
          </div>
          <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono overflow-x-auto">
            {result.output}
          </pre>
        </Card>
      )}

      {/* Error */}
      {result.error && (
        <Card className="bg-red-950/20 border-red-800/50 p-3">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-xs font-medium text-red-300">Error</span>
          </div>
          <pre className="text-xs text-red-200 whitespace-pre-wrap font-mono overflow-x-auto">
            {result.error}
          </pre>
        </Card>
      )}
    </div>
  );
}
