"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffManager() {
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

    // Using a dummy location_id for the prototype
    const DUMMY_LOCATION_ID = "00000000-0000-0000-0000-000000000000";

    const { error } = await supabase.from("staff").insert([{
      first_name: firstName,
      last_name: lastName,
      role: role,
      pin_code: pin,
      location_id: DUMMY_LOCATION_ID
    }]);

    setLoading(false);

    if (error) {
      // Setup local mock save if Supabase is unavailable (e.g., no .env.local DB initialized yet)
      const mockKey = "auditshield_mock_staff";
      const existing = localStorage.getItem(mockKey);
      let list = existing ? JSON.parse(existing) : [];
      list.push({
        id: Math.random().toString(36).substr(2, 9),
        first_name: firstName,
        last_name: lastName,
        role,
        pin_code: pin
      });
      localStorage.setItem(mockKey, JSON.stringify(list));
      setSuccessMsg("Staff added locally! (Mock fallback triggered since Supabase is unconfigured)");
      
      setFirstName("");
      setLastName("");
      setRole("");
      setPin("");
    } else {
      setSuccessMsg(`Successfully added ${firstName} ${lastName}!`);
      setFirstName("");
      setLastName("");
      setRole("");
      setPin("");
    }
  };

  return (
    <div className="bg-[#f8f7f4] border border-black/10 rounded-2xl p-8 mt-8 print:hidden shadow-sm text-[#111110]">
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
            {errorMsg && <p className="text-[#E24B4A]">{errorMsg}</p>}
            {successMsg && <p className="text-[#1D9E75]">{successMsg}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#111] text-white rounded-xl h-[48px] px-6 font-medium text-[15px] hover:opacity-85 active:scale-95 disabled:opacity-50 transition-all shadow-md ml-auto"
          >
            {loading ? "Saving..." : "Add Staff Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
