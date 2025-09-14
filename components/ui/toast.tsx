'use client';

import * as React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  className?: string;
}

export function Toast({ message, type, onClose, className }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg border min-w-[300px] animate-in slide-in-from-right-4 duration-300",
      type === 'success' 
        ? "bg-white border-[#00656B] text-[#28282D]" 
        : "bg-white border-[#953640] text-[#28282D]",
      className
    )}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-[#00656B] flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-[#953640] flex-shrink-0" />
      )}
      
      <p className="text-serif-sm flex-1">{message}</p>
      
      <button
        onClick={onClose}
        className="text-[#79797C] hover:text-[#28282D] flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast context and hook for managing toasts
interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
