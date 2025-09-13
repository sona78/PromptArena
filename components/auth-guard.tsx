"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setShouldRedirect(true);
          return;
        }

        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        setShouldRedirect(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setShouldRedirect(true);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setShouldRedirect(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (shouldRedirect && !loading) {
      router.push("/auth/login");
    }
  }, [shouldRedirect, loading, router]);

  if (loading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (shouldRedirect || !user) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <>{children}</>;
}