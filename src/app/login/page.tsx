"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please fill out both email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw new Error(authError.message || "Invalid login credentials.");
      if (!authData.user) throw new Error("Authentication failed.");

      // Query organizations table to verify setup
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", authData.user.id)
        .single();
        
      if (orgError || !orgData) {
        throw new Error("No organization found for this user. Please complete onboarding instead.");
      }

      // Success -> navigate to Manager Dashboard
      router.push(`/admin/dashboard`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-4 selection:bg-[#EAF3DE] selection:text-[#3B6D11]">
      <div className="w-full max-w-[400px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative animate-in fade-in zoom-in-[0.98] duration-500">
        <div className="px-8 pt-8 pb-5 border-b border-black/5">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="w-[42px] h-[42px] rounded-[11px] bg-[#111] flex items-center justify-center mb-5 shadow-sm">
              <div className="w-5 h-5 border-[3px] border-white rounded-[4px] relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:w-[6px] after:h-[6px] after:bg-white after:rounded-[1.5px]"></div>
            </div>
          </Link>
          <h1 className="text-[22px] font-medium text-[#111110] tracking-tight mb-1.5">Welcome back</h1>
          <p className="text-[14px] text-[#6b6b67] leading-[1.5]">Log in to your AuditShield dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-10 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] text-[13px] rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-sm">
              <AlertCircle size={16} className="shrink-0 mt-[1px]" />
              <div className="leading-[1.4]">{error}</div>
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <Mail size={14} className="text-[#888]" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@joesdiner.com"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] focus:bg-[#fcfbf9]"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <Lock size={14} className="text-[#888]" /> Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] focus:bg-[#fcfbf9]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#111] text-white rounded-xl text-[15px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-3 shadow-md"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Authenticating...</> : "Log In"}
          </button>
          
          <p className="text-center text-[13px] text-[#6b6b67] mt-3">
            Don't have an account? <Link href="/onboard" className="text-[#111110] font-medium hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
