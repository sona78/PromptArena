"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <Button 
      onClick={logout}
      className="bg-[#28282D] hover:bg-gray-800 text-white font-display-serif font-bold tracking-wide text-sm rounded-full px-6"
    >
      LOGOUT
    </Button>
  );
}
