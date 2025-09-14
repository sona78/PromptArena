'use client';

import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();

  const isActivePage = (path: string) => {
    if (path === '/challenges' && pathname === '/challenges') return true;
    if (path === '/leaderboard' && pathname?.startsWith('/leaderboard')) return true;
    if (path === '/create-task' && pathname === '/create-task') return true;
    if (path === '/best-practices' && pathname === '/best-practices') return true;
    return false;
  };

  const getLinkClassName = (path: string) => {
    const baseClasses = "font-display-serif font-bold tracking-wide text-sm transition-colors duration-200";
    if (isActivePage(path)) {
      return `${baseClasses} text-[#28282D]`;
    }
    return `${baseClasses} text-[#79797C] hover:text-[#28282D]`;
  };

  return (
    <nav className={`bg-white border-b border-[#79797C] px-6 py-4 ${className || ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/challenges" className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#28282D]" />
            <span className="text-logo text-[#28282D]">
              PromptArena
            </span>
            <Badge variant="outline" className="text-xs">
              Beta
            </Badge>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/challenges">
              <button className={getLinkClassName('/challenges')}>
                CHALLENGES
              </button>
            </Link>
            <Link href="/leaderboard">
              <button className={getLinkClassName('/leaderboard')}>
                LEADERBOARD
              </button>
            </Link>
            <Link href="/create-task">
              <button className={getLinkClassName('/create-task')}>
                CREATE TASK
              </button>
            </Link>
            <Link href="/best-practices">
              <button className={getLinkClassName('/best-practices')}>
                BEST PRACTICES
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
