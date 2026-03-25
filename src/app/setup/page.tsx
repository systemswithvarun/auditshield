"use client";

import { useState, useEffect } from "react";
import { STATIONS } from "@/components/StationForm";
import { CheckCircle2, TabletSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("LOC_HQ");
  const [enabledStations, setEnabledStations] = useState<string[]>(STATIONS.map(s => s.id));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing config on mount
    const cfg = localStorage.getItem("auditshield_device_config");
    if (cfg) {
      try {
        const parsed = JSON.parse(cfg);
        if (parsed.location) setSelectedLocation(parsed.location);
        if (parsed.stations) setEnabledStations(parsed.stations);
      } catch(e) {}
    }
  }, []);

  const toggleStation = (id: string) => {
    setEnabledStations(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    localStorage.setItem("auditshield_device_config", JSON.stringify({
      location: selectedLocation,
      stations: enabledStations
    }));
    setSaved(true);
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen sm:min-h-[auto] sm:my-16 sm:rounded-2xl border-black/10 sm:border shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 text-[#111110]">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-black/10">
        <div className="w-[46px] h-[46px] bg-[#111] rounded-[12px] flex items-center justify-center text-white shrink-0 shadow-md">
          <TabletSmartphone size={24} className="stroke-[1.5]" />
        </div>
        <div>
          <h1 className="text-[22px] font-medium tracking-tight leading-tight">Device Setup</h1>
          <p className="text-[#6b6b67] text-[14px]">Provision this tablet</p>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[12px] font-bold text-[#111110] mb-2.5 uppercase tracking-[0.05em] opacity-80">
          Select Location
        </label>
        <select 
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full h-[52px] border border-black/10 rounded-xl px-4 text-[15px] outline-none focus:border-black/30 bg-[#f8f7f4] font-medium shadow-sm transition-colors"
        >
          <option value="LOC_HQ">Main Campus HQ (LOC_HQ)</option>
          <option value="LOC_NORTH">Northside Prep Facility (LOC_NORTH)</option>
          <option value="LOC_DOWNTOWN">Downtown Kitchen (LOC_DOWNTOWN)</option>
        </select>
      </div>

      <div className="mb-10">
        <label className="block text-[12px] font-bold text-[#111110] mb-3 uppercase tracking-[0.05em] opacity-80">
          Enabled Stations
        </label>
        <div className="flex flex-col gap-3">
          {STATIONS.map((st) => (
            <button
              key={st.id}
              onClick={() => toggleStation(st.id)}
              className={`flex items-center gap-3.5 p-4 border rounded-xl cursor-pointer text-left transition-all ${
                enabledStations.includes(st.id) 
                  ? 'border-[#111] bg-[#f8f7f4] shadow-sm' 
                  : 'border-black/10 bg-white hover:bg-black/5'
              }`}
            >
              <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 ${st.iconBg} ${st.iconColor} text-[16px]`}>
                {st.icon}
              </div>
              <div className="flex-1 text-[15px] font-medium">{st.label}</div>
              <div className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                enabledStations.includes(st.id) 
                  ? 'bg-[#111] border-[#111] text-white' 
                  : 'border-black/20 text-transparent'
              }`}>
                {enabledStations.includes(st.id) && <CheckCircle2 size={14} className="stroke-[3]" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={enabledStations.length === 0}
        className="w-full h-[54px] bg-[#111] text-white rounded-xl text-[16px] font-medium transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 shadow-md"
      >
        {saved ? "Saved! Redirecting..." : "Save Configuration"}
      </button>
      
      <p className="text-center text-[#9b9b97] text-[12px] mt-5">
        Configuration is firmly saved to browser local storage.
      </p>
    </div>
  );
}
