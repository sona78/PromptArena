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
      <div className="bg-white border-t border-[#79797C] p-4">
        <div className="flex items-center space-x-2 text-[#3073B7]">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm font-serif">Executing code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white border-t border-[#79797C] p-4">
        <div className="flex items-center space-x-2 text-[#79797C]">
          <Terminal className="w-4 h-4" />
          <span className="text-sm font-serif">Click &quot;Test Prompt&quot; to run your code</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-[#00656B]" />
          ) : (
            <XCircle className="w-4 h-4 text-[#953640]" />
          )}
          <span className="text-sm font-serif font-medium text-[#28282D]">
            Execution {result.success ? 'Successful' : 'Failed'}
          </span>
          {result.execution_time && (
            <Badge variant="outline" className="text-xs border-[#79797C] text-[#79797C]">
              {result.execution_time.toFixed(2)}s
            </Badge>
          )}
        </div>
      </div>

      {/* Output */}
      {result.output && (
        <Card className="bg-[#C5AECF]/5 border-[#C5AECF] p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="w-3 h-3 text-[#00656B]" />
            <span className="text-xs font-serif font-medium text-[#28282D]">Output</span>
          </div>
          <pre className="text-xs text-[#28282D] whitespace-pre-wrap font-mono overflow-x-auto">
            {result.output}
          </pre>
        </Card>
      )}

      {/* Error */}
      {result.error && (
        <Card className="bg-[#953640]/5 border-[#953640] p-3">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="w-3 h-3 text-[#953640]" />
            <span className="text-xs font-serif font-medium text-[#953640]">Error</span>
          </div>
          <pre className="text-xs text-[#953640] whitespace-pre-wrap font-mono overflow-x-auto">
            {result.error}
          </pre>
        </Card>
      )}
    </div>
  );
}
