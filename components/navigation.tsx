'use client';

import { Badge } from "@/components/ui/badge";
import { Settings, Trophy } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  showRank?: boolean;
  className?: string;
}

export function Navigation({ showRank = true, className }: NavigationProps) {
  const pathname = usePathname();

  const isActivePage = (path: string) => {
    if (path === '/challenges' && pathname === '/challenges') return true;
    if (path === '/leaderboard' && pathname?.startsWith('/leaderboard')) return true;
    if (path === '/create-task' && pathname === '/create-task') return true;
    if (path === '/best-practices' && pathname === '/best-practices') return true;
    return false;
  };

  const getLinkClassName = (path: string) => {
    const baseClasses = "text-subtitle-sm transition-colors duration-200";
    if (isActivePage(path)) {
      return `${baseClasses} text-[#28282D] font-medium`;
    }
    return `${baseClasses} text-[#79797C] hover:text-[#28282D]`;
  };

  return (
    <nav className={`bg-white border-b border-[#79797C] px-6 py-4 ${className || ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/challenges" className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#28282D]" />
            <span className="text-title text-[#28282D]">
              PromptArena
            </span>
            <Badge variant="outline" className="text-xs">
              Beta
            </Badge>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/challenges">
              <button className={getLinkClassName('/challenges')}>
                Challenges
              </button>
            </Link>
            <Link href="/leaderboard">
              <button className={getLinkClassName('/leaderboard')}>
                Leaderboard
              </button>
            </Link>
            <Link href="/create-task">
              <button className={getLinkClassName('/create-task')}>
                Create Task
              </button>
            </Link>
            <Link href="/best-practices">
              <button className={getLinkClassName('/best-practices')}>
                Best Practices
              </button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
