"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffManager({ locationId }: { locationId: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [pin, setPin] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    
    if (pin.length !== 4) {
      setErrorMsg("PIN must be exactly 4 digits.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc('create_admin_staff', {
      p_location_id: locationId,
      p_full_name: `${firstName} ${lastName}`,
      p_pin: pin,
      p_role: role || 'staff'
    });

    setLoading(false);

    if (error) {
      setErrorMsg("Failed to add staff member. Please try again.");
      return;
    }
    setSuccessMsg(`Successfully added ${firstName} ${lastName}!`);
    setFirstName("");
    setLastName("");
    setRole("");
    setPin("");
  };

  return (
    <div className="bg-[#f8f9ff] border border-black/10 rounded-2xl p-8 mt-8 print:hidden shadow-sm text-[#0d1c2d]">
      <h2 className="text-[20px] font-bold tracking-tight mb-6">Staff Roster Management</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.05em] mb-2 opacity-80">First Name</label>
            <input 
              required 
              type="text" 
              className="w-full bg-white border border-black/10 rounded-xl h-[46px] px-4 outline-none focus:border-black/40 transition-colors shadow-sm" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.05em] mb-2 opacity-80">Last Name</label>
            <input 
              required 
              type="text" 
              className="w-full bg-white border border-black/10 rounded-xl h-[46px] px-4 outline-none focus:border-black/40 transition-colors shadow-sm" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.05em] mb-2 opacity-80">Role</label>
            <input 
              required 
              type="text" 
              placeholder="e.g., Prep Staff"
              className="w-full bg-white border border-black/10 rounded-xl h-[46px] px-4 outline-none focus:border-black/40 transition-colors shadow-sm" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold uppercase tracking-[0.05em] mb-2 opacity-80">Secure 4-Digit PIN</label>
            <input 
              required 
              type="password" 
              maxLength={4}
              pattern="[0-9]{4}"
              inputMode="numeric"
              placeholder="••••"
              className="w-full bg-white border border-black/10 rounded-xl h-[46px] px-4 outline-none focus:border-black/40 transition-colors shadow-sm tracking-[0.2em] font-medium" 
              value={pin} 
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))} 
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-[13.5px] font-medium rounded">
            {errorMsg && <p className="text-[#ba1a1a]">{errorMsg}</p>}
            {successMsg && <p className="text-[#1D9E75]">{successMsg}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#0F172A] text-white rounded-xl h-[48px] px-6 font-medium text-[15px] hover:opacity-85 active:scale-95 disabled:opacity-50 transition-all shadow-md ml-auto"
          >
            {loading ? "Saving..." : "Add Staff Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
