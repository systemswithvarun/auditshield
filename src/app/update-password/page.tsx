"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, Lock, CheckCircle2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // When coming from an email link, Supabase sets the session in the URL hash
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill out both fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw new Error(updateError.message);
      
      setSuccess(true);
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          router.push("/login");
        });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please ensure your recovery link hasn't expired.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E]/10 selection:text-[#006e2f]">
      <div className="w-full max-w-[400px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative animate-in fade-in zoom-in-[0.98] duration-500">
        <div className="px-8 pt-8 pb-5 border-b border-black/5">
          <div className="w-[42px] h-[42px] rounded-[11px] bg-[#0F172A] flex items-center justify-center mb-5 shadow-sm">
            <div className="w-5 h-5 border-[3px] border-white rounded-[4px] relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:w-[6px] after:h-[6px] after:bg-white after:rounded-[1.5px]"></div>
          </div>
          <h1 className="text-[22px] font-medium text-[#0d1c2d] tracking-tight mb-1.5">Secure your account</h1>
          <p className="text-[14px] text-[#45464d] leading-[1.5]">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="p-8 pb-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-[#22C55E]/10 text-[#006e2f] rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-[18px] font-medium text-[#0d1c2d]">Password Updated</h2>
            <p className="text-[14px] text-[#45464d] leading-[1.5]">
              Your password has been successfully reset. Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pb-10 flex flex-col gap-5">
            {error && (
              <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] text-[13px] rounded-xl flex items-start gap-2.5 shadow-sm">
                <AlertCircle size={16} className="shrink-0 mt-[1px]" />
                <div className="leading-[1.4]">{error}</div>
              </div>
            )}

            <div>
              <label className="text-[13px] font-medium text-[#0d1c2d] mb-2 flex items-center gap-2">
                <Lock size={14} className="text-[#94a3b8]" /> New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#ccc]"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-[#0d1c2d] mb-2 flex items-center gap-2">
                <Lock size={14} className="text-[#94a3b8]" /> Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#ccc]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#0F172A] text-white rounded-xl text-[15px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-3 shadow-md"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
