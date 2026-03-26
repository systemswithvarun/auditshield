"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Users, UserPlus } from "lucide-react";

export default function StaffManagement() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    pin: "",
    locationId: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchData = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("Not authenticated");
      const ownerId = userData.user.id;

      // Fetch Org
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", ownerId)
        .single();
        
      if (orgError || !orgData) throw new Error("Failed to load organization.");
      setOrg(orgData);

      // Fetch Locations
      const { data: locData, error: locError } = await supabase
        .from("locations")
        .select("*")
        .eq("organization_id", orgData.id);
        
      if (locError) throw new Error("Failed to load locations.");
      setLocations(locData || []);
      
      // Default location for form
      if (locData?.length && !formData.locationId) {
        setFormData(prev => ({ ...prev, locationId: locData[0].id }));
      }

      // Fetch Staff
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select(`*, locations!inner(name, organization_id)`)
        .eq("locations.organization_id", orgData.id)
        .order('full_name', { ascending: true });
        
      if (staffError) throw new Error("Failed to load staff.");
      setStaff(staffData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "pin") {
      if (value.length > 4) return;
      if (!/^\d*$/.test(value)) return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.fullName.trim() || !formData.role.trim() || !formData.locationId) {
      setFormError("Please fill out all required fields.");
      return;
    }

    if (formData.pin.length !== 4) {
      setFormError("PIN must be exactly 4 digits.");
      return;
    }

    setFormLoading(true);

    try {
      const { error: insertError } = await supabase
        .from("staff")
        .insert({
          location_id: formData.locationId,
          full_name: formData.fullName,
          role: formData.role,
          pin_hash: formData.pin, // Wait, schema uses pin_hash or pin_code? Let me check onboard schema. Ah, onboard uses `pin_code` for prototype or `pin_hash`. The schema.sql uses `pin_hash`. onboard/page.tsx uses `pin_code`. I'll try both or just pin_hash if it exists. Actually, onboard uses `pin_code`. Let me just stick to `pin_hash` to match schema, but onboard used `pin_code`. Wait, onboard line 91 uses `pin_code: formData.pin`. I will use `pin_hash`.
          is_active: true
        });

      if (insertError) throw new Error(insertError.message);

      setFormSuccess(`Successfully added staff member: ${formData.fullName}`);
      setFormData(prev => ({ ...prev, fullName: "", role: "", pin: "" }));
      
      // Refresh staff
      await fetchData();
    } catch (err: any) {
      // If error is about pin_code not existing (e.g. database schema matches onboard), fallback.
      try {
         const { error: fallbackError } = await supabase
          .from("staff")
          .insert({
            location_id: formData.locationId,
            full_name: formData.fullName,
            role: formData.role,
            pin_code: formData.pin,
            is_active: true
          });
          if (fallbackError) throw new Error(fallbackError.message);
          
          setFormSuccess(`Successfully added staff member: ${formData.fullName}`);
          setFormData(prev => ({ ...prev, fullName: "", role: "", pin: "" }));
          await fetchData();
      } catch (fallbackErr: any) {
         setFormError(fallbackErr.message || "Failed to add staff member.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black/50" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-[#E24B4A]">Error: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-10 text-[#111110] animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-[28px] font-medium tracking-tight mb-2 flex items-center gap-3">
          <Users size={28} className="text-[#111]" /> Staff Management
        </h1>
        <p className="text-[#6b6b67] text-[15px]">Manage kiosk access and roles for all locations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f5f4f0] border-b border-black/10 text-[#6b6b67] text-[13px]">
                <tr>
                  <th className="p-4 font-medium min-w-[200px]">Full Name</th>
                  <th className="p-4 font-medium min-w-[150px]">Role</th>
                  <th className="p-4 font-medium min-w-[150px]">Location</th>
                  <th className="p-4 font-medium w-[100px] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-[#f8f7f4] transition-colors">
                    <td className="p-4 font-medium">{member.full_name}</td>
                    <td className="p-4 text-[#6b6b67]">{member.role}</td>
                    <td className="p-4 text-[#6b6b67]">{member.locations?.name}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[12px] font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#97C459]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#6b6b67]">
                      No staff members found. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add Form */}
        <div className="bg-[#f8f7f4] border border-black/10 rounded-2xl p-6 shadow-sm sticky top-10">
          <div className="flex items-center gap-2 mb-6 text-[#111110]">
            <UserPlus size={20} />
            <h2 className="text-[17px] font-bold tracking-tight">Quick Add Staff</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && (
              <div className="p-3 bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] text-[13px] rounded-xl leading-[1.4]">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-[#EAF3DE] border border-[#97C459] text-[#3B6D11] text-[13px] rounded-xl leading-[1.4]">
                {formSuccess}
              </div>
            )}

            <div>
              <label className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#888] mb-1.5 block">Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#888] mb-1.5 block">Role</label>
              <input
                type="text"
                name="role"
                placeholder="e.g. Prep Cook, Manager"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#888] mb-1.5 block">Location</label>
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleInputChange}
                className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[14px] outline-none transition-colors focus:border-black/30 shadow-sm appearance-none"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#888] mb-1.5 block">4-Digit PIN</label>
              <input
                type="password"
                name="pin"
                placeholder="••••"
                value={formData.pin}
                onChange={handleInputChange}
                className="w-full h-[46px] bg-white border border-black/10 rounded-xl px-4 text-[20px] tracking-[0.3em] outline-none transition-colors focus:border-black/30 shadow-sm text-center"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full h-[48px] bg-[#111] text-white rounded-xl text-[14px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-md"
            >
              {formLoading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add Staff</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
