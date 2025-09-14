"use client";

import React from "react";
import { Navigation } from "@/components/navigation";

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
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "7xl": "max-w-7xl"
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-light transition-all duration-500 ease-out">
      {showNav && (
        <Navigation className="bg-white/80 backdrop-blur-sm border-stone-200/50 animate-in slide-in-from-top-4 duration-700 ease-out" />
      )}

      {(title || subtitle) && (
        <div className="bg-white/40 backdrop-blur-sm border-b border-stone-200/30 px-8 py-16 animate-in slide-in-from-top-8 duration-1000 ease-out">
          <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
            <div className="space-y-6">
              {title && (
                <h1 className="text-5xl font-extralight text-stone-800 tracking-loose leading-tight animate-in fade-in-50 slide-in-from-bottom-4 duration-1200 ease-out">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-stone-600 font-light text-xl max-w-3xl leading-relaxed animate-in fade-in-30 slide-in-from-bottom-4 duration-1400 delay-200 ease-out">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-12 animate-in fade-in-50 slide-in-from-bottom-8 duration-1000 delay-300 ease-out">
        <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
