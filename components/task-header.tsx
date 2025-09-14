'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
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
      <div className="bg-white/40 backdrop-blur-sm border-b border-stone-200/30 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-stone-600 font-light">Loading task...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100/80 backdrop-blur-sm border-b border-slate-300/50 px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Target className="w-5 h-5 text-slate-700" />
              </div>
              <h1 className="text-2xl font-light text-stone-800 tracking-wide">
                {task?.name || 'Unknown Task'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-slate-600 text-slate-100 border-slate-600 font-light px-3 py-1">
                Active
              </Badge>
              <Badge variant="outline" className="border-stone-300 text-stone-600 font-light px-3 py-1">
                {task?.type === 0 ? 'Backend' : task?.type === 1 ? 'Frontend' : task?.type === 2 ? 'Machine Learning' : `Type ${task?.type || 0}`}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-stone-600 font-light text-lg leading-relaxed max-w-4xl">
          <p>{task?.description || 'No description available.'}</p>
        </div>
      </div>
    </div>
  );
}
