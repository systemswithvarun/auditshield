"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "signing_in" | "error" | "success">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const redeem = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid invite link — no token found.");
        return;
      }

      try {
        // Check if the invite exists and is still valid
        const { data: invite, error: inviteErr } = await supabase
          .from("manager_invites")
          .select("id, organization_id, email, accepted, expires_at")
          .eq("token", token)
          .maybeSingle();

        if (inviteErr || !invite) {
          setStatus("error");
          setMessage("This invite link is invalid or has already been used.");
          return;
        }

        if (invite.accepted) {
          setStatus("error");
          setMessage("This invite has already been accepted.");
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setStatus("error");
          setMessage("This invite link has expired. Ask your manager to send a new one.");
          return;
        }

        // Check if user is already signed in
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setStatus("signing_in");
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/invite/callback?token=${token}` },
          });
          return;
        }

        // User is signed in — redeem the invite
        await redeemInvite(invite, user.id);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
      }
    };

    redeem();
  }, [token]);

  const redeemInvite = async (invite: any, userId: string) => {
    // Add to organization_members
    const { error: memberErr } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invite.organization_id,
        user_id: userId,
        role: "manager",
        invited_by: null,
      });

    if (memberErr && !memberErr.message.includes("duplicate")) {
      setStatus("error");
      setMessage("Failed to join organization: " + memberErr.message);
      return;
    }

    // Mark invite as accepted
    await supabase
      .from("manager_invites")
      .update({ accepted: true })
      .eq("id", invite.id);

    setStatus("success");
    setTimeout(() => router.replace("/admin/dashboard"), 2000);
  };


  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
      <div className="bg-white border border-black/10 rounded-2xl p-8 max-w-[420px] w-full text-center shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-[#0F172A]/30 mx-auto mb-4" />
            <p className="text-[15px] text-[#45464d]">Validating your invite…</p>
          </>
        )}
        {status === "signing_in" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-[#245D91] mx-auto mb-4" />
            <p className="text-[15px] font-medium">Redirecting to Google sign-in…</p>
            <p className="text-[13px] text-[#94a3b8] mt-2">Sign in with the email address this invite was sent to.</p>
          </>
        )}
        {status === "success" && (
          <>
            <ShieldCheck className="w-12 h-12 text-[#22C55E] mx-auto mb-4" />
            <h2 className="text-[18px] font-bold mb-2">You're in.</h2>
            <p className="text-[14px] text-[#45464d]">Taking you to the dashboard…</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-10 h-10 text-[#ba1a1a] mx-auto mb-4" />
            <h2 className="text-[17px] font-bold mb-2">Invite error</h2>
            <p className="text-[14px] text-[#45464d] mb-5">{message}</p>
            <a href="/onboard" className="text-[14px] font-medium text-[#245D91] hover:underline">
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
