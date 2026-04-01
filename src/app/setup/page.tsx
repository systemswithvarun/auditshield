"use client";

import { useState, useEffect } from "react";
import { TabletSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("LOC_HQ");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing config on mount
    const cfg = localStorage.getItem("auditshield_device_config");
    if (cfg) {
      try {
        const parsed = JSON.parse(cfg);
        if (parsed.location) setSelectedLocation(parsed.location);
      } catch(e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("auditshield_device_config", JSON.stringify({
      location: selectedLocation,
    }));
    setSaved(true);
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen sm:min-h-[auto] sm:my-16 sm:rounded-2xl border-[#c6c6cd] sm:border shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 text-[#0d1c2d]">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#c6c6cd]">
        <div className="w-[46px] h-[46px] bg-[#0F172A] rounded-[12px] flex items-center justify-center text-white shrink-0 shadow-md">
          <TabletSmartphone size={24} className="stroke-[1.5]" />
        </div>
        <div>
          <h1 className="text-[22px] font-medium tracking-tight leading-tight">Device Setup</h1>
          <p className="text-[#45464d] text-[14px]">Provision this tablet</p>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[12px] font-bold text-[#0d1c2d] mb-2.5 uppercase tracking-[0.05em] opacity-80">
          Select Location
        </label>
        <select 
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full h-[52px] border border-[#c6c6cd] rounded-xl px-4 text-[15px] outline-none focus:border-[#2563EB] bg-[#f8f9ff] font-medium shadow-sm transition-colors"
        >
          <option value="LOC_HQ">Main Campus HQ (LOC_HQ)</option>
          <option value="LOC_NORTH">Northside Prep Facility (LOC_NORTH)</option>
          <option value="LOC_DOWNTOWN">Downtown Kitchen (LOC_DOWNTOWN)</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-full h-[54px] bg-[#0F172A] text-white rounded-xl text-[16px] font-medium transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 shadow-md"
      >
        {saved ? "Saved! Redirecting..." : "Save Configuration"}
      </button>
      
      <p className="text-center text-[#9b9b97] text-[12px] mt-5">
        Configuration is firmly saved to browser local storage. Stations are now managed remotely via the Admin Portal.
      </p>
    </div>
  );
}
