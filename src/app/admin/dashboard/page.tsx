"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, CheckCircle, Clock, Calendar, Filter, Printer, AlertCircle as AlertCircleIcon, MapPin, Activity, FileText, BarChart3, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  staff_name: string;
  station_name: string;
  station_id: string;
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
  const [filterPreset, setFilterPreset] = useState<'TODAY' | 'WEEK' | 'CUSTOM'>('TODAY');
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStation, setFilterStation] = useState("");
  const [filterStaff, setFilterStaff] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<LogRecord[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const pageSize = 50;

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
          setOrg(orgData);
        } else {
          router.push("/onboard/finish-setup");
          return;
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
  }, []);

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
          .select(`id, created_at, is_breach, entry_data, staff_name, station_name, station_id`)
          .eq("location_id", activeLocation)
          .gte("created_at", startOfToday)
          .order("created_at", { ascending: false });

        // Need to filter out null stations if join fails due to location constraint
        const validTodayLogs = (tLogs as any[] || []).filter(l => l.stations !== null) as LogRecord[];
        setTodayLogs(validTodayLogs);

        // D. Fetch Critical Alerts (last 24h, is_breach = true)
        const { data: cLogs } = await supabase
          .from("logs")
          .select(`id, created_at, is_breach, entry_data, staff_name, station_name, station_id`)
          .eq("location_id", activeLocation)
          .eq("is_breach", true)
          .gte("created_at", yesterday)
          .order("created_at", { ascending: false });

        const validCriticalLogs = (cLogs as any[] || []).filter(l => l.stations !== null) as LogRecord[];
        setCriticalAlerts(validCriticalLogs);

        // E. Fetch Recent Activity (Last 10 overall)
        const { data: rLogs } = await supabase
          .from("logs")
          .select(`id, created_at, is_breach, entry_data, staff_name, station_name, station_id`)
          .eq("location_id", activeLocation)
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

  // 3. Automated 60s Polling for Compliance Pulse 
  // Runs silently in background grabbing live instance updates without blocking UI maps
  useEffect(() => {
    if (!activeLocation) return;

    const fetchPulseSilently = async () => {
      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const { data: pulseData } = await supabase
          .from("schedule_instances")
          .select(`
              id, station_id, window_start, window_end, grace_period_minutes, status,
              stations!inner(name, location_id)
            `)
          .eq("stations.location_id", activeLocation)
          .eq("target_date", startOfToday.split('T')[0]);

        if (pulseData) setSchedulesToday(pulseData as any[]);
      } catch (err) {
        console.error("Silent 60s polling failed to map schedules natively.", err);
      }
    };

    const intervalId = setInterval(fetchPulseSilently, 60000);
    return () => clearInterval(intervalId);
  }, [activeLocation]);

  // 4. Dynamic Filtering Logic for "All Logs" Table
  useEffect(() => {
    if (!activeLocation || !filterDate) return;

    const fetchFiltered = async () => {
      setIsFiltering(true);
      try {
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        if (filterPreset === 'TODAY') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        } else if (filterPreset === 'WEEK') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else {
          startDate = new Date(filterDate);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }

        let query = supabase
          .from("logs")
          .select(`id, created_at, is_breach, entry_data, staff_name, station_name, station_id`, { count: 'exact' })
          .eq("location_id", activeLocation)
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString())
          .order("created_at", { ascending: false });

        if (filterStation) query = query.eq("station_id", filterStation);
        if (filterStaff) query = query.eq("staff_id", filterStaff);

        // Limit results dynamically via range
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, count } = await query;
        setFilteredLogs((data as any[]) || []);
        if (count !== null) setTotalLogs(count);
      } catch (e) {
        console.error("Filter error", e);
      } finally {
        setIsFiltering(false);
      }
    };

    fetchFiltered();
  }, [activeLocation, filterPreset, filterDate, filterStation, filterStaff, currentPage]);


  // Derived View: Station Statuses for 'Today View'
  const stationStatuses = useMemo(() => {
    return stations.map(station => {
      const logsForStation = todayLogs.filter(l => l.station_id === station.id);

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
    try {
      const doc = new jsPDF();

      // Header: Logo Text
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AuditShield", 14, 20);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Compliance Report", 14, 28);

      // Org Details
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Organization: ${org?.name || "N/A"}`, 14, 38);
      const activeLocName = locations.find(l => l.id === activeLocation)?.name || "All Locations";
      doc.text(`Location: ${activeLocName}`, 14, 43);

      let dateRangeStr = "Today";
      if (filterPreset === 'WEEK') dateRangeStr = "Last 7 Days";
      else if (filterPreset === 'CUSTOM') dateRangeStr = filterDate;
      doc.text(`Date Range: ${dateRangeStr}`, 14, 48);

      // Table mapping
      const tableColumn = ["Timestamp", "Station", "Value", "Staff", "Status"];
      const tableRows: any[] = [];

      filteredLogs.forEach((log) => {
        const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(log.created_at).toLocaleDateString();
        const readingObj = log.entry_data && log.entry_data.length > 0 ? log.entry_data[0] : null;
        const readingVal = readingObj ? `${readingObj.value}°` : "—";
        const statusText = log.is_breach ? "Breach" : "Safe";

        // Store pure string values for autoTable calculations
        tableRows.push([
          `${dateStr} ${timeStr}`,
          log.station_name || "Unknown",
          readingVal,
          log.staff_name || "Unknown",
          statusText
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [17, 17, 16], textColor: [255, 255, 255] },
        didParseCell: function (data) {
          // Highlight Breach rows
          if (data.section === 'body') {
            const statusVal = data.row.raw ? (data.row.raw as unknown as any[])[4] : null;
            if (statusVal === "Breach") {
              data.cell.styles.fillColor = [252, 235, 235]; // Light red
              data.cell.styles.textColor = [121, 31, 31];   // Dark red text
            }
          }
        }
      });

      // Name format: AuditShield_Report_[Date].pdf
      const safeDate = filterDate || new Date().toISOString().split('T')[0];
      doc.save(`AuditShield_Report_${safeDate}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
    }
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

  // Derived Global Status KPI Header
  const globalKPI = useMemo(() => {
    if (schedulesToday.length === 0) return { label: 'Awaiting Targets', color: 'bg-[#f5f4f0] text-[#6b6b67] border-black/10', icon: <Activity size={24} /> };
    if (schedulesToday.some(s => s.status === 'MISSED')) {
      return { label: 'Critical Misses Detected', color: 'bg-[#FFF4F4] text-[#E24B4A] border-[#F09595]', icon: <AlertTriangle size={24} strokeWidth={2.5} /> };
    }
    if (schedulesToday.some(s => s.status === 'PENDING')) {
      return { label: 'Checks Pending', color: 'bg-[#FFF8EB] text-[#AF5B00] border-[#F2C17D]', icon: <Clock size={24} strokeWidth={2.5} /> };
    }
    return { label: '100% Compliant', color: 'bg-[#EAF3DE] text-[#3B6D11] border-[#97C459]', icon: <CheckCircle size={24} strokeWidth={2.5} /> };
  }, [schedulesToday]);

  // Group schedules natively for Compliance Checklist widget
  const schedulesByStation = useMemo(() => {
    const grouped: Record<string, { stationName: string, schedules: ScheduleInstance[] }> = {};
    schedulesToday.forEach(sc => {
      if (!grouped[sc.station_id]) {
        grouped[sc.station_id] = { stationName: sc.stations?.name || 'Unknown', schedules: [] };
      }
      grouped[sc.station_id].schedules.push(sc);
    });

    // Chronological Sort overriding native DB mapping
    Object.values(grouped).forEach(g => {
      g.schedules.sort((a, b) => a.window_start.localeCompare(b.window_start));
    });
    return Object.values(grouped);
  }, [schedulesToday]);

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
      <div className="flex flex-col mb-8 gap-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
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

        {/* Global KPI Banner */}
        <div className={`border rounded-2xl p-6 shadow-sm flex items-center justify-center gap-4 transition-colors duration-500 ${globalKPI.color}`}>
          <span className="shrink-0">{globalKPI.icon}</span>
          <span className="text-[24px] tracking-tight font-extrabold">{globalKPI.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Left Column: Pulse & Today View */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Compliance Checklist Grouped View */}
          <section className="bg-white rounded-2xl border border-black/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-[17px] font-bold tracking-tight mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#97C459]" />
              Compliance Checklist
            </h2>

            <div className="flex flex-col gap-4">
              {schedulesByStation.length === 0 ? (
                <div className="text-[13px] text-[#888] font-medium py-2">
                  No schedules configured for today.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedulesByStation.map(group => (
                    <div key={group.stationName} className="border border-black/10 rounded-xl overflow-hidden bg-[#fcfbf9]">
                      <div className="bg-black/[0.03] border-b border-black/5 px-4 py-2 font-bold text-[14px] flex items-center justify-between">
                        {group.stationName}
                        <span className="text-[11px] font-medium opacity-60 bg-black/5 px-2 py-0.5 rounded-full">{group.schedules.length} logs expected</span>
                      </div>

                      <div className="flex flex-col p-2 space-y-1">
                        {group.schedules.map(sc => {
                          let icon = <span className="w-2.5 h-2.5 rounded-full bg-[#ccc]"></span>; // Pending Default (White/Gray)
                          let textColor = "text-[#6b6b67]";

                          if (sc.status === 'COMPLETED') {
                            icon = <span className="w-2.5 h-2.5 rounded-full bg-[#97C459] shadow-[0_0_8px_#97C459]"></span>; // Green
                            textColor = "text-[#3B6D11] font-bold";
                          } else if (sc.status === 'LATE' || sc.status === 'PENDING') {
                            // We highlight yellow for PENDING effectively identifying something we're waiting on! LATE is also yellow/orange.
                            icon = <span className="w-2.5 h-2.5 rounded-full bg-[#F2C17D] shadow-[0_0_8px_#F2C17D]"></span>; // Yellow
                            textColor = "text-[#AF5B00] font-bold";
                          } else if (sc.status === 'MISSED') {
                            icon = <span className="w-2.5 h-2.5 rounded-full bg-[#E24B4A] shadow-[0_0_8px_#E24B4A]"></span>; // Red
                            textColor = "text-[#E24B4A] font-bold";
                          }

                          return (
                            <div key={sc.id} className="flex items-center justify-between hover:bg-black/5 transition-colors p-2 rounded-lg cursor-default">
                              <div className="flex items-center gap-3">
                                {icon}
                                <span className="text-[13px] font-mono text-[#444]">{sc.window_start.substring(0, 5)} - {sc.window_end.substring(0, 5)}</span>
                              </div>
                              <span className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-md ${textColor}`}>
                                {sc.status}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
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
                          {alert.station_name} • <span className="text-[#111]">{unsafeEntry?.value}°</span>
                        </div>
                        <span className="text-[12px] text-[#791F1F]/70 font-medium">
                          {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#111110] leading-relaxed mb-2">
                        <span className="font-semibold opacity-70">Corrective Action:</span> {unsafeEntry?.corrective_action || "None provided"}
                      </p>
                      <div className="text-[11.5px] text-[#6b6b67] font-medium">
                        Logged by {alert.staff_name}
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
                const mainReading = log.entry_data && log.entry_data.length > 0 ? log.entry_data[0].value : "✓";

                return (
                  <div key={log.id} className="relative pl-8 py-3 group">
                    <div className={`absolute left-[7px] top-[18px] w-[9px] h-[9px] rounded-full ring-4 ring-white ${isFail ? 'bg-[#E24B4A]' : 'bg-[#97C459]'}`}></div>
                    <div className="bg-[#fcfbf9] border border-black/5 group-hover:bg-[#f5f4f0] transition-colors rounded-xl p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[13px]">{log.station_name}</span>
                        <span className={`font-mono text-[13px] font-bold ${isFail ? 'text-[#E24B4A]' : 'text-[#3B6D11]'}`}>
                          {mainReading}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] text-[#888]">
                        <span>{log.staff_name}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
            {/* Presets Button Group */}
            <div className="flex bg-[#fcfbf9] border border-black/15 items-center rounded-lg overflow-hidden h-9 shadow-sm p-1">
              <button
                onClick={() => { setFilterPreset('TODAY'); setCurrentPage(1); }}
                className={`text-[12px] font-bold px-3 py-1 rounded transition-colors ${filterPreset === 'TODAY' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-[#111]'}`}
              >
                Today
              </button>
              <button
                onClick={() => { setFilterPreset('WEEK'); setCurrentPage(1); }}
                className={`text-[12px] font-bold px-3 py-1 rounded transition-colors ${filterPreset === 'WEEK' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-[#111]'}`}
              >
                This Week
              </button>
              <button
                onClick={() => { setFilterPreset('CUSTOM'); setCurrentPage(1); }}
                className={`text-[12px] font-bold px-3 py-1 rounded transition-colors ${filterPreset === 'CUSTOM' ? 'bg-[#111] text-white' : 'text-[#888] hover:text-[#111]'}`}
              >
                Custom
              </button>
            </div>

            {filterPreset === 'CUSTOM' && (
              <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden h-9 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="px-3 text-[#888] bg-[#f8f7f4] border-r border-black/10 h-full flex items-center"><Calendar size={14} /></div>
                <input
                  type="date"
                  max={todayStr}
                  value={filterDate}
                  onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                  className="text-[13px] px-3 h-full outline-none font-medium text-[#111]"
                />
              </div>
            )}

            <select
              value={filterStation}
              onChange={e => { setFilterStation(e.target.value); setCurrentPage(1); }}
              className="h-9 bg-white border border-black/15 rounded-lg px-3 text-[13px] font-medium text-[#111] outline-none shadow-sm cursor-pointer"
            >
              <option value="">All Stations</option>
              {stations.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>

            <select
              value={filterStaff}
              onChange={e => { setFilterStaff(e.target.value); setCurrentPage(1); }}
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
                const readingVal = readingObj ? readingObj.value : "—";

                return (
                  <tr key={log.id} className="border-b border-black/5 last:border-0 hover:bg-[#f8f7f4] transition-colors">
                    <td className="px-6 py-4 text-[#6b6b67] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#111]">{log.station_name}</td>
                    <td className="px-6 py-4 text-[#6b6b67]">{log.staff_name}</td>
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
        {/* Pagination Footer */}
        <div className="p-4 border-t border-black/10 flex items-center justify-between bg-[#fcfbf9]">
          <div className="text-[13px] text-[#6b6b67] font-medium">
            Showing {totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} logs
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1 || isFiltering}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="h-8 px-3 rounded-md border border-black/10 text-[13px] font-medium bg-white hover:bg-black/5 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage * pageSize >= totalLogs || isFiltering}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="h-8 px-3 rounded-md border border-black/10 text-[13px] font-medium bg-white hover:bg-black/5 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
