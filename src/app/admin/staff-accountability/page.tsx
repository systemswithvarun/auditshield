"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, MapPin, Users } from "lucide-react";

type StaffRecord = {
  id: string;
  full_name: string;
  role: string;
};

type LogRecord = {
  id: string;
  staff_id: string;
  staff_name: string;
  station_name: string;
  is_breach: boolean;
  created_at: string;
};

type Location = {
  id: string;
  name: string;
};

export default function StaffAccountabilityPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<string>("");

  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [logs, setLogs] = useState<LogRecord[]>([]);

  // 1. Initial Data Fetch (Org -> Locations)
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) throw new Error("Not authenticated");

        const { data: orgData } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", userData.user.id)
          .maybeSingle();

        if (!orgData) throw new Error("Org not found");

        const { data: locData } = await supabase
          .from("locations")
          .select("id, name")
          .eq("organization_id", orgData.id);

        setLocations(locData || []);
        if (locData && locData.length > 0) {
          setActiveLocation(locData[0].id);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // 2. Fetch Staff and Logs for Active Location
  useEffect(() => {
    if (!activeLocation) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Staff
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, full_name, role")
          .eq("location_id", activeLocation)
          .eq("is_active", true)
          .order("full_name", { ascending: true });

        // Fetch Logs (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logData } = await supabase
          .from("logs")
          .select("id, staff_id, staff_name, station_name, is_breach, created_at")
          .eq("location_id", activeLocation)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: false });

        setStaff(staffData || []);
        setLogs((logData as LogRecord[]) || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeLocation]);

  // 3. Compute Per-Staff Stats
  const staffStats = useMemo(() => {
    return staff.map(s => {
      const memberLogs = logs.filter(l => l.staff_id === s.id);
      const totalLogs = memberLogs.length;
      const breachCount = memberLogs.filter(l => l.is_breach).length;
      const safeCount = totalLogs - breachCount;
      const complianceRate = totalLogs === 0 ? null : Math.round((safeCount / totalLogs) * 100);

      const stationsSet = new Set(memberLogs.map(l => l.station_name));
      const stationsLogged = Array.from(stationsSet).filter(Boolean) as string[];

      const recentLogs = memberLogs.slice(0, 5);
      const lastActive = recentLogs.length > 0 ? recentLogs[0].created_at : null;

      return {
        ...s,
        totalLogs,
        breachCount,
        complianceRate,
        stationsLogged,
        recentLogs,
        lastActive
      };
    });
  }, [staff, logs]);

  // 4. Compute Aggregate Stats
  const aggregateStats = useMemo(() => {
    const totalStaff = staff.length;
    const totalLogs = logs.length;
    const totalBreaches = logs.filter(l => l.is_breach).length;
    let breachRate = 0;
    if (totalLogs > 0) {
      breachRate = Math.round((totalBreaches / totalLogs) * 100);
    }

    let mostActiveStaff = "N/A";
    let highestLogs = -1;
    staffStats.forEach(s => {
      if (s.totalLogs > highestLogs) {
        highestLogs = s.totalLogs;
        mostActiveStaff = s.full_name;
      }
    });

    return { totalStaff, totalLogs, breachRate: `${breachRate}%`, mostActiveStaff: highestLogs > 0 ? mostActiveStaff : "N/A" };
  }, [staff, logs, staffStats]);

  const getTimeAgo = (dateStr: string) => {
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < msPerHour) return `${Math.round(diff / msPerMinute)} mins ago`;
    if (diff < msPerDay) return `${Math.round(diff / msPerHour)} hours ago`;
    if (diff < msPerDay * 7) return `${Math.round(diff / msPerDay)} days ago`;

    return date.toLocaleDateString();
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-8 animate-in fade-in duration-500 text-[#0d1c2d]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight mb-1">Staff Accountability</h1>
          <p className="text-[#45464d] text-[15px]">30-day compliance record per staff member.</p>
        </div>

        {locations.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl p-1.5 shadow-sm w-fit">
            <MapPin size={16} className="text-[#94a3b8] ml-2" />
            <select
              value={activeLocation}
              onChange={(e) => setActiveLocation(e.target.value)}
              className="bg-transparent text-[14px] font-medium outline-none pr-3 cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex bg-white border border-black/10 rounded-xl px-4 py-3 shadow-sm mb-8 gap-6 md:gap-12 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[12px] uppercase text-[#94a3b8] font-bold tracking-wider">Total Staff</span>
          <span className="text-[18px] font-black">{aggregateStats.totalStaff}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] uppercase text-[#94a3b8] font-bold tracking-wider">Total Logs</span>
          <span className="text-[18px] font-black">{aggregateStats.totalLogs}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] uppercase text-[#94a3b8] font-bold tracking-wider">Breach Rate</span>
          <span className="text-[18px] font-black">{aggregateStats.breachRate}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] uppercase text-[#94a3b8] font-bold tracking-wider">Most Active</span>
          <span className="text-[18px] font-black">{aggregateStats.mostActiveStaff}</span>
        </div>
      </div>

      {loading && staff.length === 0 ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
        </div>
      ) : staffStats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-12 flex flex-col justify-center items-center text-center">
           <Users size={32} className="text-[#94a3b8] mb-3" />
           <div className="font-bold text-[16px] text-[#0d1c2d] mb-1">No staff found for this location.</div>
           <div className="text-[14px] text-[#45464d]">Switch locations or add staff from the Staff directory.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {staffStats.map(s => {
            let badgeClass = "bg-[#f1f5f9] text-[#94a3b8] border border-[#cbd5e1]";
            let badgeText = "No Data";

            if (s.complianceRate !== null) {
              if (s.complianceRate >= 90) {
                badgeClass = "bg-[#22C55E]/10 text-[#006e2f] border border-[#22C55E]";
                badgeText = `${s.complianceRate}% compliant`;
              } else if (s.complianceRate >= 70) {
                badgeClass = "bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30";
                badgeText = `${s.complianceRate}% compliant`;
              } else {
                badgeClass = "bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20";
                badgeText = `${s.complianceRate}% compliant`;
              }
            }

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 flex flex-col text-[#0d1c2d]">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-[17px] font-bold leading-none mb-1">{s.full_name}</h3>
                    <p className="text-[13px] text-[#45464d]">{s.role}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap mt-1 ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] rounded-xl p-3 text-center mb-6">
                  <div className="flex flex-col border-r border-[#black/5]">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Total Logs</span>
                    <span className="text-[16px] font-black leading-none">{s.totalLogs}</span>
                  </div>
                  <div className="flex flex-col border-r border-[#black/5]">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Breaches</span>
                    <span className={`text-[16px] font-black leading-none ${s.breachCount > 0 ? "text-[#ba1a1a]" : ""}`}>
                      {s.breachCount}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Stations</span>
                    <span className="text-[16px] font-black leading-none">{s.stationsLogged.length}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Stations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.stationsLogged.length > 0 ? (
                      s.stationsLogged.map((station, idx) => (
                        <span key={idx} className="text-[12px] font-medium bg-[#f1f5f9] border border-[#cbd5e1] text-[#45464d] px-2.5 py-1 rounded-md">
                          {station}
                        </span>
                      ))
                    ) : (
                      <span className="text-[12px] text-[#94a3b8] italic">No activity in this period</span>
                    )}
                  </div>
                </div>

                {s.recentLogs.length > 0 && (
                  <div className="flex flex-col mb-5 flex-1">
                    <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Recent Activity</div>
                    <div className="flex flex-col gap-2">
                      {s.recentLogs.map((log) => (
                        <div key={log.id} className="flex justify-between items-center text-[13px]">
                           <div className="flex items-center gap-2 font-medium">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${log.is_breach ? 'bg-[#ba1a1a]' : 'bg-[#22C55E]'}`} />
                              {log.station_name || 'Unknown'}
                           </div>
                           <span className="text-[#94a3b8] font-mono whitespace-nowrap ml-2 text-[12px]">
                              {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(log.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {s.recentLogs.length === 0 && <div className="flex-1" />}

                <div className="text-[12px] text-[#94a3b8] pt-4 mt-auto border-t border-black/5 font-medium">
                  {s.lastActive ? `Last active: ${getTimeAgo(s.lastActive)}` : "Never logged in this period"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
