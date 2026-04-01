"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { AlertCircle, Store, Building, KeyRound, Loader2 } from "lucide-react";

export default function FinishSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    locationName: "",
    pin: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUserAndOrg = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !sessionData.user) {
        router.push("/login");
        return;
      }
      setUser(sessionData.user);

      // Check if they already have an org
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", sessionData.user.id)
        .maybeSingle();

      if (orgData) {
        router.push("/admin/dashboard");
      } else {
        setLoading(false);
      }
    };
    
    checkUserAndOrg();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "pin" && value.length > 4) return;
    if (name === "pin" && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.locationName.trim() || formData.pin.length !== 4) {
      setError("Please fill out all fields and ensure the PIN is 4 digits.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      if (!user) throw new Error("Authentication missing. Please reload.");

      const ownerId = user.id;
      const orgSlug = slugify(formData.businessName);
      const locSlug = slugify(formData.locationName);

      // Step A: Insert into organizations with linked owner_id
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          owner_id: ownerId,
          name: formData.businessName,
          slug: orgSlug,
        })
        .select("id")
        .single();

      if (orgError) throw new Error(orgError.message || "Failed to create organization.");

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

      if (locError) throw new Error(locError.message || "Failed to create location.");

      // Step C: Insert into staff
      const { error: staffError } = await supabase.rpc('create_admin_staff', {
        p_location_id: locData.id,
        p_full_name: user?.email ? user.email.split('@')[0] : "Admin",
        p_pin: formData.pin,
        p_role: 'admin'
      });

      if (staffError) throw new Error(staffError.message || "Failed to register admin staff profile.");

      // Success -> navigate to Manager Dashboard
      router.push(`/admin/dashboard`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during setup.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#c6c6cd]/10 overflow-hidden shadow-sm">
        <div className="px-8 pt-8 pb-5 border-b border-[#c6c6cd]/20">
          <p className="text-2xl font-extrabold tracking-tighter text-[#0F172A] mb-5">AuditShield</p>
          <h1 className="text-xl font-black tracking-tight text-[#0d1c2d] mb-1.5">Finish your setup</h1>
          <p className="text-sm text-[#45464d] leading-[1.5]">You're almost there! Complete your organization profile to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-10 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] text-[13px] rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-[1px]" />
              <div className="leading-[1.4]">{error}</div>
            </div>
          )}

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
            <p className="text-xs text-[#45464d] mt-2.5 leading-[1.4]">This PIN is required for the Admin profile on the Kiosk.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[52px] bg-[#0F172A] text-white rounded-xl text-[15px] font-bold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-3"
          >
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Provisioning...</> : "Finish Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
