"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { StationForm, StationConfig } from "@/components/StationForm";
import PinPadModal from "@/components/PinPadModal";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  sessionToken?: string;
};

type ScheduleInstance = {
  id: string;
  station_id: string;
  window_start: string;
  window_end: string;
  status: string;
  station_name?: string;
};

const GOOD_MESSAGES = [
  "✅ All stations compliant — great work today.",
  "✅ No overdue checks. Your team is on it.",
  "✅ Every check logged on time. Keep it up.",
  "✅ Clean compliance record so far today.",
  "✅ Logs are up to date. That's the standard.",
];

export default function KioskPage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [liveStaff, setLiveStaff] = useState<Staff[]>([]);
  const params = useParams() as { orgSlug: string; locSlug: string };
  const [orgId, setOrgId] = useState<string>("");
  const [locId, setLocId] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loggedInStaff, setLoggedInStaff] = useState<Staff | null>(null);
  const [stations, setStations] = useState<StationConfig[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationConfig | null>(null);
  const [schedules, setSchedules] = useState<ScheduleInstance[]>([]);
  const [tickerMsg, setTickerMsg] = useState<{ text: string; isWarn: boolean }>({ text: "", isWarn: false });
  const [goodMsgIndex, setGoodMsgIndex] = useState(0);

  const computeTicker = useCallback((scheduleList: ScheduleInstance[]) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const overdue: string[] = [];

    scheduleList.forEach(sc => {
      if (sc.status === 'COMPLETED') return;
      const windowEnd = new Date(`${todayStr}T${sc.window_end}`);
      const graceEnd = new Date(windowEnd.getTime() + 15 * 60000);
      if (now > graceEnd) {
        const minsLate = Math.round((now.getTime() - windowEnd.getTime()) / 60000);
        const name = sc.station_name || 'Station';
        overdue.push(`⚠️ ${name} check overdue by ${minsLate} min`);
      }
    });

    if (overdue.length > 0) {
      setTickerMsg({ text: overdue.join('   •   '), isWarn: true });
    } else {
      setTickerMsg({ text: GOOD_MESSAGES[goodMsgIndex % GOOD_MESSAGES.length], isWarn: false });
    }
  }, [goodMsgIndex]);

  useEffect(() => {
    const fetchKioskData = async () => {
      const { data, error } = await supabase.rpc('get_kiosk_data', {
        p_org_slug: params.orgSlug,
        p_loc_slug: params.locSlug
      });

      if (error || !data || data.error) {
        console.error("Failed to load kiosk data:", error || data?.error);
        return;
      }

      setOrgId(data.organization_id || "");
      setLocId(data.location_id || "");

      if (data.staff && Array.isArray(data.staff)) {
        const combined: Staff[] = data.staff.map((d: any) => {
          const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown';
          const names = name.split(" ");
          const first = names[0];
          const last = names.length > 1 ? names[names.length - 1] : "";
          return {
            id: d.id,
            name,
            role: d.role || 'Staff Member',
            initials: `${first[0] || ''}${last[0] || ''}`.toUpperCase(),
            color: "bg-[#22C55E]/10 text-[#006e2f]"
          };
        });
        setLiveStaff(combined);
      }

      const pendingMap: Record<string, { count: number; instance_id: string | null }> = {};
      const scheduleList: ScheduleInstance[] = [];

      if (data.schedules && Array.isArray(data.schedules)) {
        data.schedules.forEach((sc: any) => {
          scheduleList.push({
            id: sc.id,
            station_id: sc.station_id,
            window_start: sc.window_start,
            window_end: sc.window_end,
            status: sc.status || 'PENDING',
            station_name: sc.station_name,
          });
          if (!pendingMap[sc.station_id]) {
            pendingMap[sc.station_id] = { count: 0, instance_id: null };
          }
          pendingMap[sc.station_id].count += 1;
          if (!pendingMap[sc.station_id].instance_id) {
            pendingMap[sc.station_id].instance_id = sc.id;
          }
        });
      }
      setSchedules(scheduleList);

      if (data.stations && Array.isArray(data.stations)) {
        const dynamicStations: StationConfig[] = data.stations.map((st: any) => {
          const pending = pendingMap[st.id] || { count: 0, instance_id: null };
          return {
            id: st.id,
            label: st.name,
            icon: st.icon || "✓",
            iconBg: "bg-[#eef4ff]",
            iconColor: "text-[#0d1c2d]",
            desc: pending.count > 0 ? `${pending.count} check${pending.count > 1 ? 's' : ''} due` : "All checks complete",
            fields: Array.isArray(st.sop_config) ? st.sop_config : [],
            pending_count: pending.count,
            pending_instance_id: pending.instance_id,
          };
        });
        setStations(dynamicStations);
        computeTicker(scheduleList);
      }
    };

    if (params.orgSlug && params.locSlug) fetchKioskData();

    const clockInterval = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 10000);

    const d = new Date();
    setCurrentTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

    return () => clearInterval(clockInterval);
  }, [params.orgSlug, params.locSlug]);


  // Rotate good messages every 8 seconds when no warnings
  useEffect(() => {
    if (tickerMsg.isWarn) return;
    const interval = setInterval(() => {
      setGoodMsgIndex(i => i + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, [tickerMsg.isWarn]);

  // Recompute ticker when good message index rotates
  useEffect(() => {
    computeTicker(schedules);
  }, [goodMsgIndex]);

  // Recheck overdue status every 60 seconds
  useEffect(() => {
    if (schedules.length === 0) return;
    const interval = setInterval(() => computeTicker(schedules), 60000);
    return () => clearInterval(interval);
  }, [schedules]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
    <div className="w-full max-w-[440px] bg-white rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative isolate flex flex-col">

      {/* Dynamic Ticker Bar */}
      {tickerMsg.text && (
        <div className={`w-full border-b text-[12px] font-medium py-2 px-4 text-center shrink-0 z-20 overflow-hidden ${
          tickerMsg.isWarn
            ? 'bg-[#ffdad6] border-[#ba1a1a]/20 text-[#ba1a1a]'
            : 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#006e2f]'
        }`}>
          <span className={tickerMsg.isWarn ? '' : 'inline-block animate-none'}>
            {tickerMsg.text}
          </span>
        </div>
      )}

      {/* Top Bar */}
      <div className="px-6 pt-5 pb-4 border-b border-[#c6c6cd]/20 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[15px] font-extrabold tracking-tighter text-[#0F172A]">AuditShield</div>
          <div className="text-[11px] text-[#45464d] mt-[1px]">Food Safety Log</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-[#22C55E] animate-[pulse_2s_infinite]"></div>
          <span className="text-xs text-[#45464d]">{currentTime}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 pb-10">
        {!loggedInStaff ? (
          <>
            <div className="text-[11px] font-medium text-[#45464d] tracking-[0.07em] uppercase mb-4 pt-2">
              Staff authentication
            </div>
            <div className="grid gap-2.5">
              {liveStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className="flex items-center gap-3 p-3.5 border border-[#c6c6cd]/20 rounded-xl bg-white cursor-pointer text-left w-full transition-colors hover:border-[#c6c6cd]/40 hover:bg-[#eef4ff] group shadow-sm"
                >
                  <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[15px] font-medium shrink-0 ${staff.color}`}>
                    {staff.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-[#0d1c2d] group-hover:text-[#0F172A]">{staff.name}</div>
                    <div className="text-[12px] text-[#45464d] mt-[1px]">{staff.role}</div>
                  </div>
                  <div className="w-[22px] h-[22px] rounded-full border-[1.5px] border-[#c6c6cd]/40 flex items-center justify-center shrink-0 transition-colors group-hover:border-[#c6c6cd]"></div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6 bg-[#eef4ff] p-[10px] rounded-xl border border-[#c6c6cd]/20">
              <div className="flex items-center gap-3 pl-1">
                <div className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-sm font-medium ${loggedInStaff.color}`}>
                  {loggedInStaff.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#0d1c2d]">{loggedInStaff.name}</div>
                  <div className="text-[11px] text-[#45464d]">{loggedInStaff.role}</div>
                </div>
              </div>
              <button
                onClick={() => { setLoggedInStaff(null); setSelectedStation(null); }}
                className="w-[34px] h-[34px] flex items-center justify-center text-[#45464d] hover:text-[#0d1c2d] bg-white hover:bg-[#eef4ff] rounded-[10px] border border-[#c6c6cd]/20 transition-colors shadow-sm"
              >
                <LogOut size={16} className="ml-0.5" />
              </button>
            </div>

            <div className="text-[11px] font-medium text-[#45464d] tracking-[0.07em] uppercase mb-4">
              Select station
            </div>
            <div className="grid gap-2.5">
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`flex items-center gap-3.5 p-3.5 border rounded-xl cursor-pointer text-left w-full transition-colors ${
                    selectedStation?.id === st.id
                      ? 'border-[#0F172A] bg-[#eef4ff] shadow-md'
                      : 'border-[#c6c6cd]/20 bg-white hover:border-[#c6c6cd]/40 hover:bg-[#eef4ff] shadow-sm'
                  }`}
                >
                  <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[18px] shrink-0 ${st.iconBg} ${st.iconColor}`}>
                    {st.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="text-[14px] font-medium text-[#0d1c2d] tracking-tight">{st.label}</div>
                    <div className={`text-[12px] mt-[2px] font-medium ${st.pending_count && st.pending_count > 0 ? 'text-[#f97316]' : 'text-[#006e2f]'}`}>
                      {st.desc}
                    </div>
                  </div>
                  <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    selectedStation?.id === st.id
                      ? 'bg-[#0F172A] border-[#0F172A] after:content-["✓"] after:text-white after:text-[12px] after:font-medium'
                      : 'border-[#c6c6cd]/40'
                  }`} />
                </button>
              ))}
            </div>

            {selectedStation && (
              <StationForm
                key={selectedStation.id}
                station={selectedStation}
                staffId={loggedInStaff.id}
                orgSlug={params.orgSlug}
                locSlug={params.locSlug}
                instanceId={selectedStation.pending_instance_id}
                sessionToken={loggedInStaff.sessionToken ?? ""}
                onReset={() => setSelectedStation(null)}
              />
            )}
          </div>
        )}
      </div>

      <PinPadModal
        isOpen={selectedStaff !== null}
        onClose={() => setSelectedStaff(null)}
        staff={selectedStaff}
        onSuccess={(staff, sessionToken) => {
          setLoggedInStaff({ ...staff, sessionToken });
          setSelectedStaff(null);
        }}
      />
    </div>
    </div>
  );
}
