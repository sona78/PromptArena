"use client";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
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
