'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Target, Monitor, Server, Brain } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Task {
  task_id: string;
  name: string;
  description: string;
  type: number;
}

interface TaskHeaderProps {
  sessionId: string;
}

export function TaskHeader({ sessionId }: TaskHeaderProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskInfo = async () => {
      if (!sessionId) return;

      try {
        // Get task_id from the session
        const { data: session, error: sessionError } = await supabase
          .from('Sessions')
          .select('task_id')
          .eq('session_id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        // Get task details
        const { data: taskData, error: taskError } = await supabase
          .from('Tasks')
          .select('task_id, name, description, type')
          .eq('task_id', session.task_id)
          .single();

        if (taskError) {
          console.error('Error fetching task:', taskError);
          return;
        }

        setTask(taskData);
      } catch (error) {
        console.error('Error fetching task info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskInfo();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white border-b border-[#79797C] px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-body text-[#79797C]">Loading task...</div>
        </div>
      </div>
    );
  }

  const getTaskIcon = (taskType: number) => {
    switch (taskType) {
      case 0: // Frontend
        return <Monitor className="w-5 h-5 text-white" />;
      case 1: // Backend
        return <Server className="w-5 h-5 text-white" />;
      case 2: // Machine Learning
        return <Brain className="w-5 h-5 text-white" />;
      default:
        return <Target className="w-5 h-5 text-white" />;
    }
  };

  const getTaskIconBackground = (taskType: number) => {
    switch (taskType) {
      case 0: // Frontend
        return "bg-[#C5AECF]";
      case 1: // Backend
        return "bg-[#46295A]";
      case 2: // Machine Learning
        return "bg-[#D79D00]";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="bg-white border-b border-[#79797C] px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${getTaskIconBackground(task?.type || 0)} flex items-center justify-center`}>
                {getTaskIcon(task?.type || 0)}
              </div>
              <h1 className="font-display-serif font-bold tracking-wide text-2xl text-[#28282D]">
                {task?.name || 'Unknown Task'}
              </h1>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-body-lg text-[#79797C] max-w-4xl">
          <p>{task?.description || 'No description available.'}</p>
        </div>
      </div>
    </div>
  );
}
