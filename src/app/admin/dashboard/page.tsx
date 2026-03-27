"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, CheckCircle, Clock, Calendar, Filter, Printer, AlertCircle as AlertCircleIcon, MapPin, Activity, FileText, BarChart3, Search } from "lucide-react";

type Org = { id: string; name: string };
type Location = { id: string; name: string };
type Station = { id: string; name: string; icon: string };
type Staff = { id: string; full_name: string };

type ScheduleInstance = {
  id: string;
  station_id: string;
  window_start: string;
  window_end: string;
  grace_period_minutes: number;
  status: string;
  stations: { name: string };
};

type LogRecord = {
  id: string;
  created_at: string;
  is_breach: boolean;
  entry_data: any[];
  staff: { id: string; full_name: string };
  stations: { id: string; name: string; icon: string };
};

export default function OperationalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [org, setOrg] = useState<Org | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<string>("");

  const [stations, setStations] = useState<Station[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [todayLogs, setTodayLogs] = useState<LogRecord[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<LogRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogRecord[]>([]);
  const [schedulesToday, setSchedulesToday] = useState<ScheduleInstance[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // Filter states
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStation, setFilterStation] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<LogRecord[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // 1. Initial Identity & Locations Load
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("Not authenticated");

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("owner_id", userData.user.id)
          .maybeSingle();

        if (orgData) {
          // Passively execute our daily generator (Simulated CRON)
          await supabase.rpc('generate_daily_schedules');
        }

        const { data: locData, error: locErr } = await supabase
          .from("locations")
          .select("id, name")
          .eq("organization_id", orgData?.id);

        if (locErr) throw locErr;
        setLocations(locData || []);
        
        if (locData && locData.length > 0) {
          setActiveLocation(locData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, [router]);

  // 2. Load Location specific baseline datsets (Stations, Staff, Today metrics)
  useEffect(() => {
    if (!activeLocation) return;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        // A. Fetch Stations
        const { data: stData } = await supabase
          .from("stations")
          .select("id, name, icon")
          .eq("location_id", activeLocation);
        setStations(stData || []);

        // B. Fetch Staff
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, full_name")
          .eq("location_id", activeLocation);
        setStaffList(staffData || []);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // C. Fetch Today's Logs for the widgets
        const { data: tLogs } = await supabase
          .from("logs")
          .select(`
            id, created_at, is_breach, entry_data,
            staff (id, full_name),
            stations (id, name, icon)
          `)
          .eq("stations.location_id", activeLocation)
          .gte("created_at", startOfToday)
          .order("created_at", { ascending: false });
        
        // Need to filter out null stations if join fails due to location constraint
        const validTodayLogs = (tLogs as any[] || []).filter(l => l.stations !== null) as LogRecord[];
        setTodayLogs(validTodayLogs);

        // D. Fetch Critical Alerts (last 24h, is_breach = true)
        const { data: cLogs } = await supabase
          .from("logs")
          .select(`
            id, created_at, is_breach, entry_data,
            staff (id, full_name),
            stations (id, name, icon)
          `)
          .eq("stations.location_id", activeLocation)
          .eq("is_breach", true)
          .gte("created_at", yesterday)
          .order("created_at", { ascending: false });
        
        const validCriticalLogs = (cLogs as any[] || []).filter(l => l.stations !== null) as LogRecord[];
        setCriticalAlerts(validCriticalLogs);

        // E. Fetch Recent Activity (Last 10 overall)
        const { data: rLogs } = await supabase
          .from("logs")
          .select(`
            id, created_at, is_breach, entry_data,
            staff (id, full_name),
            stations (id, name, icon)
          `)
          .eq("stations.location_id", activeLocation)
          .order("created_at", { ascending: false })
          .limit(10);
        
        const validRecentLogs = (rLogs as any[] || []).filter(l => l.stations !== null) as LogRecord[];
        setRecentLogs(validRecentLogs);

        // F. Fetch Today's Schedules for the Compliance Pulse
        const { data: pulseData } = await supabase
          .from("schedule_instances")
          .select(`
            id, station_id, window_start, window_end, grace_period_minutes, status,
            stations!inner(name, location_id)
          `)
          .eq("stations.location_id", activeLocation)
          .eq("target_date", startOfToday.split('T')[0]);
        
        setSchedulesToday((pulseData as any[]) || []);

      } catch (err: any) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeLocation]);

  // 3. Dynamic Filtering Logic for "All Logs" Table
  useEffect(() => {
    if (!activeLocation || !filterDate) return;

    const fetchFiltered = async () => {
      setIsFiltering(true);
      try {
        // Build start/end bounds for the selected date
        const startDate = new Date(filterDate);
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

        let query = supabase
          .from("logs")
          .select(`
            id, created_at, is_breach, entry_data,
            staff!inner(id, full_name),
            stations!inner(id, name, icon)
          `)
          .eq("stations.location_id", activeLocation)
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString())
          .order("created_at", { ascending: false });

        if (filterStation) query = query.eq("station_id", filterStation);
        if (filterStaff) query = query.eq("staff_id", filterStaff);

        const { data } = await query;
        setFilteredLogs((data as any[]) || []);
      } catch (e) {
        console.error("Filter error", e);
      } finally {
        setIsFiltering(false);
      }
    };

    fetchFiltered();
  }, [activeLocation, filterDate, filterStation, filterStaff]);


  // Derived View: Station Statuses for 'Today View'
  const stationStatuses = useMemo(() => {
    return stations.map(station => {
      const logsForStation = todayLogs.filter(l => l.stations?.id === station.id);
      
      let status: "PENDING" | "SAFE" | "BREACH" | "DUE_SOON" = "PENDING";
      
      if (logsForStation.length > 0) {
        status = logsForStation.some(l => l.is_breach) ? "BREACH" : "SAFE";
      }

      if (status === 'PENDING') {
         const now = new Date();
         const todayStr = new Date().toISOString().split('T')[0];
         const pendingSchedules = schedulesToday.filter(s => s.station_id === station.id && s.status === 'PENDING');
         for (const s of pendingSchedules) {
            const dStart = new Date(`${todayStr}T${s.window_start}`);
            const dStartMinus15 = new Date(dStart.getTime() - 15 * 60000);
            const dEnd = new Date(`${todayStr}T${s.window_end}`);
            
            // Trigger Due Soon if we are 15m away or actively inside the window
            if (now >= dStartMinus15 && now <= dEnd) {
               status = "DUE_SOON";
               break;
            }
         }
      }

      return {
        ...station,
        status,
        logCount: logsForStation.length
      };
    });
  }, [stations, todayLogs, schedulesToday]);

  const handlePrintReport = () => {
    alert("PDF Compilation initiating... (To be implemented with a PDF engine)");
  };

  if (loading && stations.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircleIcon size={18} />
          {error}
        </div>
      </div>
    );
  }

  // Precompute global Missed triggers natively validating grace spans
  const activeMissesCount = schedulesToday.filter(
    (sc) => {
       if (sc.status === 'MISSED') return true;
       if (sc.status === 'PENDING') {
          const now = new Date();
          const dEnd = new Date(`${todayStr}T${sc.window_end}`);
          const dGrace = new Date(dEnd.getTime() + ((sc.grace_period_minutes || 15) * 60000));
          return now > dGrace;
       }
       return false;
    }
  ).length;

  // Precompute Progress Bar metrics
  const completedCount = schedulesToday.filter(s => s.status === 'COMPLETED' || s.status === 'LATE').length;
  const totalSchedulesCount = schedulesToday.length;
  const progressPercent = totalSchedulesCount === 0 ? 0 : Math.round((completedCount / totalSchedulesCount) * 100);
  
  let progressColor = "bg-[#E24B4A]"; // red < 50
  if (progressPercent > 50 && progressPercent < 90) progressColor = "bg-[#E28800]"; // yellow
  if (progressPercent >= 90) progressColor = "bg-[#3B6D11]"; // green

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-8 animate-in fade-in duration-500 text-[#111110]">
      
      {/* Real-time Triage Banner */}
      {!bannerDismissed && activeMissesCount > 0 && (
         <div className="mb-8 bg-[#E24B4A] text-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(226,75,74,0.3)] relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} strokeWidth={2.5} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-[18px] font-bold tracking-tight mb-1">Warning: Scheduled Compliance Missed</h2>
                    <p className="text-[14px] text-white/90 font-medium max-w-xl leading-relaxed">
                       {activeMissesCount} active {activeMissesCount === 1 ? 'station' : 'stations'} at <strong>{locations.find(l => l.id === activeLocation)?.name}</strong> failed to log temperatures inside their mandatory operational window natively. Review parameters immediately.
                    </p>
                 </div>
              </div>
              
              <button 
                 onClick={() => setBannerDismissed(true)}
                 className="h-10 px-5 bg-white text-[#E24B4A] hover:bg-[#fffcfc] rounded-xl text-[14px] font-bold tracking-wide transition-colors shrink-0 shadow-sm"
              >
                 Acknowledge Alert
              </button>
           </div>
         </div>
      )}
      
      {/* Header & Global Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight mb-1">Operational Control</h1>
          <p className="text-[#6b6b67] text-[15px]">{org?.name} • Live Fleet Status</p>
        </div>
        
        {locations.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl p-1.5 shadow-sm w-fit">
            <MapPin size={16} className="text-[#888] ml-2" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column: Pulse & Today View */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Compliance Pulse */}
          <section className="bg-white rounded-2xl border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-[17px] font-bold tracking-tight mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#97C459]" />
              Daily Compliance Pulse
            </h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-[13px] font-bold text-[#6b6b67] uppercase tracking-wider">Completion Rate</span>
                 <span className="text-[20px] font-bold tracking-tight">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-[#f5f4f0] rounded-full overflow-hidden flex">
                 <div 
                   className={`h-full ${progressColor} transition-all duration-1000 ease-out`} 
                   style={{ width: `${progressPercent}%` }}
                 />
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
               {schedulesToday.length === 0 ? (
                 <div className="text-[13px] text-[#888] font-medium py-2">
                   No compliance schedules mapped for today. Configure windows in Schedules module.
                 </div>
               ) : (
                 <div className="overflow-x-auto relative rounded-xl border border-black/10">
                   <table className="w-full text-left border-collapse text-[13px]">
                     <thead>
                       <tr className="bg-[#fcfbf9] border-b border-black/10">
                         <th className="font-bold text-[#888] uppercase tracking-wider px-4 py-3">Station</th>
                         <th className="font-bold text-[#888] uppercase tracking-wider px-4 py-3">Time Window</th>
                         <th className="font-bold text-[#888] uppercase tracking-wider px-4 py-3">Status</th>
                         <th className="font-bold text-[#888] uppercase tracking-wider px-4 py-3 text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {schedulesToday.map(sc => {
                         let displayStatus = sc.status;
                         
                         const now = new Date();
                         const dEnd = new Date(`${todayStr}T${sc.window_end}`);
                         const dGrace = new Date(dEnd.getTime() + ((sc.grace_period_minutes || 15) * 60000));
                         
                         if (sc.status === 'PENDING' && now > dGrace) {
                            displayStatus = 'MISSED';
                         }

                         // Action routing link
                         const kioskHref = org ? `/${org.id}/${activeLocation}` : '#';

                         return (
                           <tr key={sc.id} className="border-b border-black/5 last:border-0 hover:bg-[#f8f7f4] transition-colors">
                             <td className="px-4 py-3 font-bold text-[#111]">{sc.stations?.name}</td>
                             <td className="px-4 py-3 text-[#888] font-mono whitespace-nowrap">
                                {sc.window_start.substring(0,5)} - {sc.window_end.substring(0,5)}
                                <span className="ml-1 opacity-50 text-[10px] uppercase">(+{sc.grace_period_minutes || 15}m)</span>
                             </td>
                             <td className="px-4 py-3">
                               {displayStatus === 'COMPLETED' && (
                                 <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] border border-[#97C459] px-2 py-0.5 rounded-md">
                                    <CheckCircle size={10} strokeWidth={3} /> Safe
                                 </span>
                               )}
                               {displayStatus === 'LATE' && (
                                 <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#AF5B00] bg-[#FFF8EB] border border-[#F2C17D] px-2 py-0.5 rounded-md">
                                    <Clock size={10} strokeWidth={3} /> Late
                                 </span>
                               )}
                               {displayStatus === 'PENDING' && (
                                 <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6b6b67] bg-[#f5f4f0] border border-black/10 px-2 py-0.5 rounded-md">
                                    <Activity size={10} strokeWidth={3} /> PENDING
                                 </span>
                               )}
                               {displayStatus === 'MISSED' && (
                                 <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#E24B4A] bg-[#FFF4F4] border border-[#F09595] px-2 py-0.5 rounded-md">
                                    <AlertTriangle size={10} strokeWidth={3} /> Missed
                                 </span>
                               )}
                             </td>
                             <td className="px-4 py-3 text-right">
                                {displayStatus === 'PENDING' ? (
                                   <Link href={kioskHref} className="text-[#245D91] hover:underline font-bold text-[12px]">Go to Kiosk &rarr;</Link>
                                ) : (
                                   <span className="text-[#ccc] text-[12px] font-medium">—</span>
                                )}
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </section>
          
          {/* Today View */}
          <section className="bg-white rounded-2xl border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-[17px] font-bold tracking-tight mb-5 flex items-center gap-2">
              <Activity size={18} className="text-[#245D91]" />
              Today's Station Status
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stationStatuses.map(st => (
                <div key={st.id} className="p-4 border border-black/5 bg-[#fcfbf9] rounded-xl flex flex-col gap-3">
                  <div className={`flex items-center gap-2 ${st.status === 'DUE_SOON' ? 'text-[#AF5B00]' : ''}`}>
                    <span className="text-[18px]">{st.icon}</span>
                    <span className="font-semibold text-[14px] truncate">{st.name}</span>
                  </div>
                  <div>
                    {st.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#6b6b67] bg-black/5 px-2.5 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#888] shrink-0" />
                        Pending
                      </span>
                    )}
                    {st.status === 'DUE_SOON' && (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#AF5B00] bg-[#FFF8EB] border border-[#F2C17D] px-2.5 py-1 rounded-md animate-pulse">
                        <Clock size={12} strokeWidth={3} />
                        Due Soon
                      </span>
                    )}
                    {st.status === 'SAFE' && (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] border border-[#97C459] px-2.5 py-1 rounded-md">
                        <CheckCircle size={12} strokeWidth={3} />
                        All Good
                      </span>
                    )}
                    {st.status === 'BREACH' && (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#791F1F] bg-[#FCEBEB] border border-[#F09595] px-2.5 py-1 rounded-md">
                        <AlertTriangle size={12} strokeWidth={3} />
                        Breach Logged
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#888] mt-1">{st.logCount} records today</div>
                </div>
              ))}
              {stationStatuses.length === 0 && (
                <div className="col-span-full py-6 text-center text-[#888] text-[13px]">
                  No stations configured for this location natively.
                </div>
              )}
            </div>
          </section>

          {/* Critical Alerts (24h) */}
          {criticalAlerts.length > 0 && (
            <section className="bg-[#FFF4F4] border border-[#F09595] rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E24B4A]"></div>
              <h2 className="text-[16px] font-bold text-[#791F1F] tracking-tight mb-4 flex items-center gap-2">
                <AlertTriangle size={18} strokeWidth={2.5} />
                Critical Alerts (Last 24 hrs)
              </h2>
              
              <div className="flex flex-col gap-3">
                {criticalAlerts.map(alert => {
                  // unpack the actual unsafe entry
                  const unsafeEntry = alert.entry_data?.find((d: any) => d.status === 'UNSAFE');
                  return (
                    <div key={alert.id} className="bg-white/80 p-4 rounded-xl border border-[#F09595]/40 text-[14px]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-[#791F1F]">
                          {alert.stations?.name} • <span className="text-[#111]">{unsafeEntry?.entry_value}°</span>
                        </div>
                        <span className="text-[12px] text-[#791F1F]/70 font-medium">
                          {new Date(alert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#111110] leading-relaxed mb-2">
                        <span className="font-semibold opacity-70">Corrective Action:</span> {unsafeEntry?.corrective_action || "None provided"}
                      </p>
                      <div className="text-[11.5px] text-[#6b6b67] font-medium">
                        Logged by {alert.staff?.full_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Recent Activity Log */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-2xl border border-black/10 p-6 h-full shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-[17px] font-bold tracking-tight mb-5 flex items-center gap-2">
              <Clock size={18} className="text-[#888]" />
              Recent Activity
            </h2>
            
            <div className="flex flex-col gap-0 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-black/10">
              {recentLogs.map((log) => {
                const isFail = log.is_breach;
                // Just grab the first reading for summary view
                const mainReading = log.entry_data && log.entry_data.length > 0 ? log.entry_data[0].entry_value : "✓";
                
                return (
                  <div key={log.id} className="relative pl-8 py-3 group">
                    <div className={`absolute left-[7px] top-[18px] w-[9px] h-[9px] rounded-full ring-4 ring-white ${isFail ? 'bg-[#E24B4A]' : 'bg-[#97C459]'}`}></div>
                    <div className="bg-[#fcfbf9] border border-black/5 group-hover:bg-[#f5f4f0] transition-colors rounded-xl p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[13px]">{log.stations?.name}</span>
                        <span className={`font-mono text-[13px] font-bold ${isFail ? 'text-[#E24B4A]' : 'text-[#3B6D11]'}`}>
                          {mainReading}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] text-[#888]">
                        <span>{log.staff?.full_name}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentLogs.length === 0 && (
                <div className="pl-6 text-[13px] text-[#888]">No activity logged yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Filtered Logs Table */}
      <section className="bg-white rounded-2xl border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-black/10 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-[#fcfbf9]">
          <div className="flex-1">
            <h2 className="text-[17px] font-bold tracking-tight mb-1 flex items-center gap-2">
              <FileText size={18} />
              Compliance Record Database
            </h2>
            <p className="text-[#6b6b67] text-[13px]">Explore historical logs securely.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden h-9 shadow-sm">
              <div className="px-3 text-[#888] bg-[#f8f7f4] border-r border-black/10 h-full flex items-center"><Calendar size={14} /></div>
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                className="text-[13px] px-3 h-full outline-none font-medium text-[#111]"
              />
            </div>

            <select 
              value={filterStation} 
              onChange={e => setFilterStation(e.target.value)}
              className="h-9 bg-white border border-black/15 rounded-lg px-3 text-[13px] font-medium text-[#111] outline-none shadow-sm cursor-pointer"
            >
              <option value="">All Stations</option>
              {stations.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>

            <select 
              value={filterStaff} 
              onChange={e => setFilterStaff(e.target.value)}
              className="h-9 bg-white border border-black/15 rounded-lg px-3 text-[13px] font-medium text-[#111] outline-none shadow-sm cursor-pointer"
            >
              <option value="">All Staff</option>
              {staffList.map(st => <option key={st.id} value={st.id}>{st.full_name}</option>)}
            </select>

            <button 
              onClick={handlePrintReport}
              className="h-9 bg-[#fcfbf9] hover:bg-[#111] text-[#111] hover:text-white border border-black/15 hover:border-[#111] transition-colors rounded-lg px-4 text-[13px] font-bold shadow-sm flex items-center gap-2 ml-auto md:ml-2"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {isFiltering && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-black/50" />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-black/10">
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Time</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Station</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Staff</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Reading</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {filteredLogs.length > 0 ? filteredLogs.map(log => {
                const readingObj = log.entry_data && log.entry_data.length > 0 ? log.entry_data[0] : null;
                const readingVal = readingObj ? readingObj.entry_value : "—";
                
                return (
                  <tr key={log.id} className="border-b border-black/5 last:border-0 hover:bg-[#f8f7f4] transition-colors">
                    <td className="px-6 py-4 text-[#6b6b67] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#111]">{log.stations?.name}</td>
                    <td className="px-6 py-4 text-[#6b6b67]">{log.staff?.full_name}</td>
                    <td className="px-6 py-4 font-mono font-bold">{readingVal}°</td>
                    <td className="px-6 py-4">
                      {log.is_breach ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#791F1F] bg-[#FCEBEB] px-2 py-0.5 rounded">
                          Unsafe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded">
                          Safe
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#888] text-[14px]">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Search size={24} className="opacity-40" />
                       No records found for the selected criteria.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
