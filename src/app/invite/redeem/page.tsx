"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// This page fires after Google OAuth completes for an invite flow.
// It reads the token from the URL and completes redemption.

function RedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const redeem = async () => {
      if (!token) {
        router.replace("/invite?error=no_token");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/invite?error=not_signed_in");
        return;
      }

      const { data: invite } = await supabase
        .from("manager_invites")
        .select("id, organization_id, accepted, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (!invite || invite.accepted || new Date(invite.expires_at) < new Date()) {
        router.replace("/invite?error=invalid");
        return;
      }

      const { error: memberErr } = await supabase
        .from("organization_members")
        .insert({ organization_id: invite.organization_id, user_id: user.id, role: "manager" });

      if (memberErr && !memberErr.message.includes("duplicate")) {
        router.replace("/invite?error=join_failed");
        return;
      }

      await supabase.from("manager_invites").update({ accepted: true }).eq("id", invite.id);
      router.replace("/admin/dashboard");
    };

    redeem();
  }, [router, token]);

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0F172A]/30 mx-auto mb-4" />
        <p className="text-[15px] text-[#45464d]">Completing setup…</p>
      </div>
    </div>
  );
}

export default function InviteRedeemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#0F172A]/30 mx-auto mb-4" />
          <p className="text-[15px] text-[#45464d]">Loading…</p>
        </div>
      </div>
    }>
      <RedeemContent />
    </Suspense>
  );
}
