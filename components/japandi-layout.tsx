"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Settings } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { useRouter } from "next/navigation";

interface JapandiLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showNav?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "7xl";
}

export function JapandiLayout({ 
  children, 
  title, 
  subtitle, 
  showNav = true,
  maxWidth = "7xl"
}: JapandiLayoutProps) {
  const router = useRouter();
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "7xl": "max-w-7xl"
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-light">
      {showNav && (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-200/50 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-12">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-stone-700 transition-colors duration-300">
                  <Trophy className="w-4 h-4 text-stone-50" />
                </div>
                <span className="text-2xl font-extralight tracking-wide text-stone-800">
                  PromptArena
                </span>
                <Badge variant="outline" className="text-xs border-stone-300 text-stone-500 bg-stone-50 font-light">
                  Beta
                </Badge>
              </button>

              <div className="hidden md:flex items-center space-x-8">
                <button 
                  className="text-stone-600 hover:text-stone-800 transition-colors duration-300 text-sm font-light tracking-wide"
                  onClick={() => router.push('/dashboard')}
                >
                  Challenges
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="p-2 text-stone-500 hover:text-stone-700 transition-colors duration-300">
                <Settings className="w-4 h-4" />
              </button>
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}

      {(title || subtitle) && (
        <div className="bg-white/40 backdrop-blur-sm border-b border-stone-200/30 px-8 py-16">
          <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
            <div className="space-y-6">
              {title && (
                <h1 className="text-5xl font-extralight text-stone-800 tracking-wide leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-stone-600 font-light text-xl max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-12">
        <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
