"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { X, Delete, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { StationForm, StationConfig } from "@/components/StationForm";
import PinPadModal from "@/components/PinPadModal";
import { NotificationHandler } from "@/services/alertService";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  pin_code?: string;
};

const fallbackStaff: Staff[] = [
  { id: "1", name: "Sarah Jenkins", role: "Store Manager", initials: "SJ", color: "bg-[#E6F1FB] text-[#245D91]", pin_code: "1234" },
  { id: "2", name: "Mike Chen", role: "Shift Supervisor", initials: "MC", color: "bg-[#FAEEDA] text-[#8C5D19]", pin_code: "1234" },
  { id: "3", name: "Alex Rivera", role: "Line Cook", initials: "AR", color: "bg-[#EAF3DE] text-[#3B6D11]", pin_code: "1234" },
  { id: "4", name: "Jessica Taylor", role: "Prep Staff", initials: "JT", color: "bg-[#FCEBEB] text-[#791F1F]", pin_code: "1234" },
];

export default function KioskPage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [liveStaff, setLiveStaff] = useState<Staff[]>([]);
  
  const params = useParams() as { orgSlug: string; locSlug: string };
  const [orgId, setOrgId] = useState<string>("");
  const [locId, setLocId] = useState<string>("");
  
  // Login State
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loggedInStaff, setLoggedInStaff] = useState<Staff | null>(null);

  // Station State
  const [stations, setStations] = useState<StationConfig[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationConfig | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [deviceConfig, setDeviceConfig] = useState<{ location: string; stations: string[] } | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      let resolvedOrgId = params.orgSlug;
      let resolvedLocId = params.locSlug;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(resolvedOrgId)) {
        const { data } = await supabase.from('organizations').select('id').eq('slug', resolvedOrgId).single();
        if (data) resolvedOrgId = data.id;
      }
      if (!uuidRegex.test(resolvedLocId)) {
        const { data } = await supabase.from('locations').select('id').eq('slug', resolvedLocId).single();
        if (data) resolvedLocId = data.id;
      }

      setOrgId(resolvedOrgId);
      setLocId(resolvedLocId);

      const { data, error } = await supabase.from('staff').select('*').eq('location_id', resolvedLocId);
      let combined: Staff[] = [];
      if (!error && data) {
        combined = data.map((d: any) => {
           // Provide fallback defaults for computed fields based on what columns actually exist
           const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown';
           const names = name.split(" ");
           const first = names[0];
           const last = names.length > 1 ? names[names.length - 1] : "";
           
           return {
             id: d.id,
             name: name,
             role: d.role || 'Staff Member',
             initials: `${first[0] || ''}${last[0] || ''}`.toUpperCase(),
             pin_code: d.pin_code,
             color: "bg-[#EAF3DE] text-[#3B6D11]"
           };
        });
      }
      setLiveStaff(combined.length > 0 ? combined : []);

      // Fetch dynamic stations for this location
      const { data: stationData, error: stationErr } = await supabase
        .from('stations')
        .select('*')
        .eq('location_id', resolvedLocId)
        .order('created_at', { ascending: true });

      if (!stationErr && stationData) {
        const dynamicStations: StationConfig[] = stationData.map(st => ({
          id: st.id,
          label: st.name,
          icon: st.icon || "✓",
          iconBg: "bg-[#f8f7f4]",
          iconColor: "text-[#111110]",
          desc: "Operating thresholds active",
          fields: st.sop_config || []
        }));
        setStations(dynamicStations);
      }
    };
    if (params.orgSlug && params.locSlug) {
      fetchStaff();
    }

    // Load config
    const cfg = localStorage.getItem("auditshield_device_config");
    if (cfg) {
      try {
        setDeviceConfig(JSON.parse(cfg));
      } catch (e) {}
    }

    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setAlerts(NotificationHandler.checkAlerts().level1);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStaffClick = (staff: Staff) => {
    setSelectedStaff(staff);
  };

  const handleStationClick = (station: StationConfig) => {
    // If we're changing stations, we can scroll or transition. Here we just set state.
    setSelectedStation(station);
  };

  const handleLogout = () => {
    setLoggedInStaff(null);
    setSelectedStation(null);
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative isolate flex flex-col">
      {alerts.length > 0 && (
        <div className="w-full bg-[#FCEBEB] border-b border-[#F09595] text-[#791F1F] text-[13px] font-medium py-2.5 px-4 text-center shrink-0 shadow-sm z-20">
          ⚠️ {alerts[0]} {alerts.length > 1 && ` (+${alerts.length - 1} more)`}
        </div>
      )}
      {/* Top Bar */}`
      <div className="px-6 pt-5 pb-4 border-b border-black/10 flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-[#111] flex items-center justify-center shrink-0">
          <div className="w-4 h-4 border-[2.5px] border-white rounded-[3px] relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1.5 after:h-1.5 after:bg-white after:rounded-[1px]"></div>
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-medium text-[#111110] tracking-[-0.3px]">AuditShield</div>
          <div className="text-[11px] text-[#6b6b67] mt-[1px]">Food Safety Log</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#1D9E75] animate-[pulse_2s_infinite]"></div>
          <span className="text-xs text-[#6b6b67]">{currentTime}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 pb-10">
        {!loggedInStaff ? (
          <>
            <div className="text-[11px] font-medium text-[#6b6b67] tracking-[0.07em] uppercase mb-4 pt-2">
              Staff authentication
            </div>

            <div className="grid gap-2.5">
              {liveStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffClick(staff)}
                  className="flex items-center gap-3 p-3.5 border border-black/10 rounded-xl bg-white cursor-pointer text-left w-full transition-colors hover:border-black/20 hover:bg-[#f8f7f4] group shadow-sm"
                >
                  <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[15px] font-medium shrink-0 ${staff.color}`}>
                    {staff.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#111110] group-hover:text-black">{staff.name}</div>
                    <div className="text-[12px] text-[#6b6b67] mt-[1px]">{staff.role}</div>
                  </div>
                  <div className="w-[22px] h-[22px] rounded-full border-[1.5px] border-black/20 flex items-center justify-center shrink-0 transition-colors group-hover:border-black/40"></div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6 bg-[#f8f7f4] p-[10px] rounded-xl border border-black/5">
              <div className="flex items-center gap-3 pl-1">
                <div className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-sm font-medium ${loggedInStaff.color}`}>
                  {loggedInStaff.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#111110]">{loggedInStaff.name}</div>
                  <div className="text-[11px] text-[#6b6b67]">{loggedInStaff.role}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-[34px] h-[34px] flex items-center justify-center text-[#6b6b67] hover:text-[#111110] bg-white hover:bg-[#f0efea] rounded-[10px] border border-black/10 transition-colors shadow-sm"
              >
                <LogOut size={16} className="ml-0.5" />
              </button>
            </div>

            <div className="text-[11px] font-medium text-[#6b6b67] tracking-[0.07em] uppercase mb-4">
              Select station
            </div>
            
            <div className="grid gap-2.5">
              {(deviceConfig ? stations.filter((s) => deviceConfig.stations.includes(s.id)) : stations).map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleStationClick(st)}
                  className={`flex items-center gap-3.5 p-3.5 border rounded-xl cursor-pointer text-left w-full transition-colors ${
                    selectedStation?.id === st.id
                      ? 'border-[#111] bg-[#f8f7f4] shadow-md'
                      : 'border-black/10 bg-white hover:border-black/20 hover:bg-[#f8f7f4] shadow-sm'
                  }`}
                >
                  <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] shrink-0 ${st.iconBg} ${st.iconColor}`}>
                    {st.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[14px] font-medium text-[#111110] tracking-tight">{st.label}</div>
                    <div className="text-[12px] text-[#6b6b67] mt-[2px]">{st.desc}</div>
                  </div>
                  <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    selectedStation?.id === st.id 
                      ? 'bg-[#111] border-[#111] after:content-["✓"] after:text-white after:text-[12px] after:font-medium' 
                      : 'border-black/20'
                  }`} />
                </button>
              ))}
            </div>

            {selectedStation && (
              <StationForm 
                key={selectedStation.id} 
                station={selectedStation} 
                staffId={loggedInStaff.id}
                organizationId={orgId}
                locationId={locId}
                onReset={() => setSelectedStation(null)} 
              />
            )}
          </div>
        )}
      </div>

      {/* PinPad Modal */}
      <PinPadModal
        isOpen={selectedStaff !== null}
        onClose={() => setSelectedStaff(null)}
        staff={selectedStaff}
        onSuccess={(staff) => {
          setLoggedInStaff(staff);
          setSelectedStaff(null);
        }}
      />
    </div>
  );
}
