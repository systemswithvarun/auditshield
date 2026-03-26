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

      // Step B: Insert into organizations with linked owner_id
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          owner_id: ownerId,
          name: formData.businessName,
          slug: orgSlug,
        })
        .select("id")
        .single();

      if (orgError) throw new Error(orgError.message || "Failed to create organization. Business name may be taken.");

      // Step B: Insert into locations
      const { data: locData, error: locError } = await supabase
        .from("locations")
        .insert({
          organization_id: orgData.id,
          name: formData.locationName,
          slug: locSlug,
        })
        .select("id")
        .single();

      if (locError) {
        throw new Error(locError.message || "Failed to create location.");
      }

      // Step C: Insert into staff
      const { error: staffError } = await supabase
        .from("staff")
        .insert({
          location_id: locData.id,
          full_name: formData.adminName,
          role: "Admin",
          pin_code: formData.pin,
          is_active: true
        });

      if (staffError) throw new Error(staffError.message || "Failed to register admin profile.");

      // Success -> navigate to Manager Dashboard
      router.push(`/admin/dashboard`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during setup.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-4 selection:bg-[#EAF3DE] selection:text-[#3B6D11]">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative animate-in fade-in zoom-in-[0.98] duration-500">
        <div className="px-8 pt-8 pb-5 border-b border-black/5">
          <div className="w-[42px] h-[42px] rounded-[11px] bg-[#111] flex items-center justify-center mb-5 shadow-sm">
            <div className="w-5 h-5 border-[3px] border-white rounded-[4px] relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:w-[6px] after:h-[6px] after:bg-white after:rounded-[1.5px]"></div>
          </div>
          <h1 className="text-[22px] font-medium text-[#111110] tracking-tight mb-1.5">Create your workspace</h1>
          <p className="text-[14px] text-[#6b6b67] leading-[1.5]">Set up your organization, store location, and Kiosk admin profile in seconds.</p>
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
              <Mail size={14} className="text-[#888]" /> Administrator Email
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
              <Lock size={14} className="text-[#888]" /> Dashboard Password
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

          <div className="h-[1px] bg-black/5 my-2 w-[calc(100%+64px)] -ml-8" />

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <Building size={14} className="text-[#888]" /> Business Name
            </label>
            <input
              type="text"
              name="businessName"
              placeholder="e.g., Joe's Diner"
              value={formData.businessName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] focus:bg-[#fcfbf9]"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <Store size={14} className="text-[#888]" /> Store Location
            </label>
            <input
              type="text"
              name="locationName"
              placeholder="e.g., Downtown Main St"
              value={formData.locationName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] focus:bg-[#fcfbf9]"
            />
          </div>

          <div className="h-[1px] bg-black/5 my-2 w-[calc(100%+64px)] -ml-8" />

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <User size={14} className="text-[#888]" /> Admin Name
            </label>
            <input
              type="text"
              name="adminName"
              placeholder="Your full name"
              value={formData.adminName}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] focus:bg-[#fcfbf9]"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#111110] mb-2 flex items-center gap-2">
              <KeyRound size={14} className="text-[#888]" /> 4-Digit PIN
            </label>
            <input
              type="password"
              name="pin"
              placeholder="••••"
              value={formData.pin}
              onChange={handleInputChange}
              className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[20px] tracking-[0.2em] outline-none transition-colors focus:border-black/30 shadow-sm placeholder:text-[#ccc] placeholder:tracking-normal placeholder:text-[14px] focus:bg-[#fcfbf9] text-center"
            />
            <p className="text-[12px] text-[#888] mt-2.5 leading-[1.4]">This PIN is securely required for accessing the Kiosk later.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#111] text-white rounded-xl text-[15px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-3 shadow-md"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Provisioning workspace...</> : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
