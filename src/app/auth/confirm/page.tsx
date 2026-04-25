"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthConfirm() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/onboard");
        return;
      }

      // Check if user owns an org
      const { data: ownedOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownedOrg) {
        router.replace("/admin/dashboard");
        return;
      }

      // Check if user is an invited member of an org
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        router.replace("/admin/dashboard");
        return;
      }

      // No org ownership or membership — new user, needs onboarding
      router.replace("/onboard/finish-setup");
    };

    check();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
    </div>
  );
}
