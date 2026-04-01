"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { AlertCircle, Store, User, Building, KeyRound, Loader2, Mail, Lock } from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    locationName: "",
    adminName: "",
    pin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "pin" && value.length > 4) return;
    if (name === "pin" && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw new Error(error.message);
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google login.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim() || !formData.businessName.trim() || !formData.locationName.trim() || !formData.adminName.trim() || formData.pin.length !== 4) {
      setError("Please properly fill out all fields and ensure the PIN is 4 digits.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Step A: Register the User via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw new Error(authError.message || "Failed to securely register user profile.");
      if (!authData.user) throw new Error("Authentication failed to provide a valid user token.");

      const ownerId = authData.user.id;
      const orgSlug = slugify(formData.businessName);
      const locSlug = slugify(formData.locationName);

      // Step B: Atomically initialize organization, location, and staff via RPC
      console.log('Provisioning Workspace Atomically for User ID:', ownerId);
      const { error: rpcError } = await supabase.rpc(
        "initialize_new_organization",
        {
          p_owner_id: ownerId,
          p_org_name: formData.businessName,
          p_org_slug: orgSlug,
          p_loc_name: formData.locationName,
          p_loc_slug: locSlug,
          p_admin_name: formData.adminName,
          p_pin_code: formData.pin,
        }
      );

      if (rpcError) {
        console.error("Workspace initialization error:", rpcError);
        throw new Error(rpcError.message || "Failed to provision workspace. Your business name or PIN may be invalid.");
      }

      // Success -> navigate to Manager Dashboard
      router.push(`/admin/dashboard`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during setup.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] mb-4">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#45464d] hover:text-[#0d1c2d] transition-colors">
          ← Back to Home
        </a>
      </div>
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#c6c6cd]/10 overflow-hidden shadow-sm">
        <div className="px-8 pt-8 pb-5 border-b border-[#c6c6cd]/20">
          <p className="text-2xl font-extrabold tracking-tighter text-[#0F172A] mb-5">AuditShield</p>
          <h1 className="text-xl font-black tracking-tight text-[#0d1c2d] mb-1.5">Create your workspace</h1>
          <p className="text-sm text-[#45464d] leading-[1.5]">Set up your organization, store location, and Kiosk admin profile in seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-10 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] text-[13px] rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-[1px]" />
              <div className="leading-[1.4]">{error}</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-[52px] bg-white border border-[#c6c6cd] text-[#0d1c2d] rounded-xl text-[15px] font-bold transition-all hover:bg-[#f8f9ff] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.86 16.79 15.69 17.57V20.34H19.26C21.34 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4" />
              <path d="M12 23C14.97 23 17.46 22.02 19.26 20.34L15.69 17.57C14.71 18.23 13.46 18.63 12 18.63C9.17 18.63 6.75 16.72 5.88 14.16H2.21V17C4.01 20.57 7.72 23 12 23Z" fill="#34A853" />
              <path d="M5.88 14.16C5.66 13.49 5.53 12.76 5.53 12C5.53 11.24 5.66 10.51 5.88 9.84V7H2.21C1.46 8.5 1 10.2 1 12C1 13.8 1.46 15.5 2.21 17L5.88 14.16Z" fill="#FBBC05" />
              <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.34 3.88C17.45 2.12 14.97 1 12 1C7.72 1 4.01 3.43 2.21 7L5.88 9.84C6.75 7.28 9.17 5.38 12 5.38Z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-[1px] flex-1 bg-[#c6c6cd]/20"></div>
            <span className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-wider">Or register manually</span>
            <div className="h-[1px] flex-1 bg-[#c6c6cd]/20"></div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <Mail size={14} className="text-[#94a3b8]" /> Administrator Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@joesdiner.com"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <Lock size={14} className="text-[#94a3b8]" /> Dashboard Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd]"
            />
          </div>

          <div className="h-[1px] bg-[#c6c6cd]/20 my-2 w-[calc(100%+64px)] -ml-8" />

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <Building size={14} className="text-[#94a3b8]" /> Business Name
            </label>
            <input
              type="text"
              name="businessName"
              placeholder="e.g., Joe's Diner"
              value={formData.businessName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <Store size={14} className="text-[#94a3b8]" /> Store Location
            </label>
            <input
              type="text"
              name="locationName"
              placeholder="e.g., Downtown Main St"
              value={formData.locationName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd]"
            />
          </div>

          <div className="h-[1px] bg-[#c6c6cd]/20 my-2 w-[calc(100%+64px)] -ml-8" />

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <User size={14} className="text-[#94a3b8]" /> Admin Name
            </label>
            <input
              type="text"
              name="adminName"
              placeholder="Your full name"
              value={formData.adminName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#0d1c2d] mb-2 flex items-center gap-2">
              <KeyRound size={14} className="text-[#94a3b8]" /> 4-Digit PIN
            </label>
            <input
              type="password"
              name="pin"
              placeholder="••••"
              value={formData.pin}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-[#c6c6cd] rounded-lg px-4 text-[20px] tracking-[0.2em] outline-none transition-colors focus:border-[#2563EB] shadow-sm placeholder:text-[#c6c6cd] placeholder:tracking-normal placeholder:text-[14px] text-center"
            />
            <p className="text-xs text-[#45464d] mt-2.5 leading-[1.4]">This PIN is securely required for accessing the Kiosk later.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#0F172A] text-white rounded-xl text-[15px] font-bold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-3"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Provisioning workspace...</> : "Complete Setup"}
          </button>

          <p className="text-center text-sm text-[#45464d] mt-3">
            Already have an account? <a href="/login" className="text-[#2563EB] font-medium hover:underline">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
