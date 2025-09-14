"use client";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <Card className="bg-white border-0 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="p-10 pb-8">
          <CardTitle className="text-3xl font-extralight text-stone-800 tracking-wide">Sign In</CardTitle>
          <CardDescription className="text-stone-600 font-light text-lg leading-relaxed mt-4">
            Enter your credentials to continue your mindful journey
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-8">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-stone-700 font-light tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-stone-200 bg-stone-50/50 rounded-xl py-6 px-4 text-stone-800 font-light focus:border-stone-400 focus:ring-stone-200 transition-colors duration-300"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-stone-700 font-light tracking-wide">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm text-stone-500 hover:text-stone-700 font-light tracking-wide transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-stone-200 bg-stone-50/50 rounded-xl py-6 px-4 text-stone-800 font-light focus:border-stone-400 focus:ring-stone-200 transition-colors duration-300"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-light">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-stone-800 hover:bg-stone-900 text-white border-0 rounded-xl py-6 font-light tracking-wide text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
            <div className="mt-8 text-center">
              <span className="text-stone-600 font-light">Don&apos;t have an account? </span>
              <Link
                href="/auth/sign-up"
                className="text-stone-800 hover:text-stone-900 font-light tracking-wide transition-colors duration-300"
              >
                Create one
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
