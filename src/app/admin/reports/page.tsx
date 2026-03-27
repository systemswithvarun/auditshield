"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, FileSpreadsheet, Download, Printer, AlertCircle, FileText, CheckCircle } from "lucide-react";

type Org = { id: string; name: string };
type Location = { id: string; name: string };

type ScheduleInstance = {
  id: string;
  target_date: string;
  window_start: string;
  window_end: string;
  status: string;
  stations: { id: string; name: string; location_id: string };
};

export default function AuditReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [org, setOrg] = useState<Org | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Date logic - default to last 7 days inclusive
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().split('T')[0]);
  
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleInstance[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

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

        if (orgError) throw orgError;
        setOrg(orgData);

        if (orgData) {
          const { data: locData } = await supabase
            .from("locations")
            .select("id, name")
            .eq("organization_id", orgData.id);
          setLocations(locData || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, [router]);

  useEffect(() => {
    if (!org || locations.length === 0) return;

    const fetchLogs = async () => {
      setIsFetchingLogs(true);
      setError("");
      try {
        // Build timestamp bounds
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = supabase
          .from("schedule_instances")
          .select(`
            id, target_date, window_start, window_end, status,
            stations!inner(id, name, location_id)
          `)
          .in("stations.location_id", locations.map(l => l.id))
          .gte("target_date", start.toISOString().split('T')[0])
          .lte("target_date", end.toISOString().split('T')[0])
          .order("target_date", { ascending: false })
          .order("window_start", { ascending: true });

        if (showExceptionsOnly) {
           query = query.in("status", ["MISSED", "LATE"]);
        }

        const { data, error: logErr } = await query;
        if (logErr) throw logErr;

        // Filter valid joins
        const validSchedules = (data as unknown as ScheduleInstance[]).filter(l => l.stations !== null);
        setSchedules(validSchedules);

      } catch (err: any) {
        setError("Failed to fetch logs: " + err.message);
      } finally {
        setIsFetchingLogs(false);
      }
    };

    fetchLogs();
  }, [startDate, endDate, showExceptionsOnly, locations, org]);

  const getLocationName = (locId: string) => {
    return locations.find(l => l.id === locId)?.name || "Unknown Location";
  };

  const exportCSV = () => {
    if (schedules.length === 0) return;

    // Headers
    const headers = ["Target Date", "Location", "Check Name (Station)", "Time Window", "Status", "UUID"];
    
    const rows = schedules.map(sc => {
      const windowStr = `${sc.window_start.substring(0,5)} - ${sc.window_end.substring(0,5)}`;
      return [
        `"${sc.target_date}"`,
        `"${getLocationName(sc.stations.location_id).replace(/"/g, '""')}"`,
        `"${sc.stations.name.replace(/"/g, '""')}"`,
        `"${windowStr}"`,
        `"${sc.status}"`,
        `"${sc.id}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_report_${org?.name.replace(/\\s+/g, '_')}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111]" />
      </div>
    );
  }

  // Pre-compute Compliance Mathematics
  const totalChecks = schedules.length;
  const completedChecks = schedules.filter(sc => sc.status === 'COMPLETED' || sc.status === 'LATE').length;
  const missedChecks = schedules.filter(sc => sc.status === 'MISSED').length;
  const compliancePercent = totalChecks === 0 ? 100 : Math.round((completedChecks / totalChecks) * 100);

  let gaugeColor = "#E24B4A"; // red
  if (compliancePercent >= 50 && compliancePercent < 90) gaugeColor = "#E28800"; // yellow
  if (compliancePercent >= 90) gaugeColor = "#97C459"; // green

  // Top Offender Dictionary Map
  const topOffenderObj = (() => {
    if (schedules.length === 0) return null;
    const missedByStation: Record<string, number> = {};
    const missedByWindow: Record<string, number> = {};

    schedules.forEach(sc => {
      if (sc.status === 'MISSED') {
         missedByStation[sc.stations.name] = (missedByStation[sc.stations.name] || 0) + 1;
         const winKey = `${sc.window_start.substring(0,5)} - ${sc.window_end.substring(0,5)}`;
         missedByWindow[winKey] = (missedByWindow[winKey] || 0) + 1;
      }
    });

    let maxMissedStation = "";
    let maxMissedStationCount = 0;
    Object.entries(missedByStation).forEach(([st, count]) => {
       if (count > maxMissedStationCount) {
          maxMissedStationCount = count;
          maxMissedStation = st;
       }
    });

    let maxMissedWindow = "";
    let maxMissedWindowCount = 0;
    Object.entries(missedByWindow).forEach(([win, count]) => {
       if (count > maxMissedWindowCount) {
          maxMissedWindowCount = count;
          maxMissedWindow = win;
       }
    });

    return {
      station: maxMissedStation,
      stationCount: maxMissedStationCount,
      window: maxMissedWindow,
      windowCount: maxMissedWindowCount
    };
  })();

  // SVG Gauge Math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliancePercent / 100) * circumference;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 text-[#111110] animate-in fade-in duration-500 min-h-screen pb-16">
      
      {/* Official Print Header - Hidden normally, visible on print */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-black">
        <h1 className="text-[24px] font-bold tracking-tight uppercase">Official Food Safety Record</h1>
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="font-bold text-[18px]">{org?.name}</p>
            <p className="text-[14px]">Period: {startDate} to {endDate}</p>
          </div>
          <div className="text-right text-[12px] opacity-70">
            <p>Generated: {new Date().toLocaleString()}</p>
            <p>System: AuditShield Compliance</p>
          </div>
        </div>
      </div>

      {/* Screen Controls - Hidden on print */}
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight mb-1 flex items-center gap-2">
              <FileSpreadsheet className="text-[#245D91]" /> Compliance Ledger & Reporting
            </h1>
            <p className="text-[#6b6b67] text-[15px]">Generate operational compliance analytics.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Filters Box */}
        <div className="bg-white rounded-2xl border border-black/10 p-5 mb-6 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">Start Date</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#111110] bg-[#f8f7f4] outline-none focus:border-black/30 w-full sm:w-auto"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">End Date</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#111110] bg-[#f8f7f4] outline-none focus:border-black/30 w-full sm:w-auto"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer h-[42px] px-4 border border-black/10 rounded-xl bg-white hover:bg-[#f8f7f4] transition-colors">
                <input 
                  type="checkbox" 
                  checked={showExceptionsOnly}
                  onChange={(e) => setShowExceptionsOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#E24B4A] rounded-md cursor-pointer"
                />
                <span className={`text-[14px] font-bold tracking-tight ${showExceptionsOnly ? 'text-[#E24B4A]' : 'text-[#6b6b67]'}`}>
                  Show Exceptions Only
                </span>
                {showExceptionsOnly && <AlertTriangle size={15} className="text-[#E24B4A]" />}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={exportCSV}
              disabled={schedules.length === 0}
              className="flex-1 md:flex-none h-[42px] bg-white border border-black/10 text-[#111] px-5 rounded-xl text-[14px] font-medium hover:bg-[#f8f7f4] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Download size={16} className="mr-2" /> Export CSV
            </button>
            <button 
              onClick={triggerPrint}
              disabled={schedules.length === 0}
              className="flex-1 md:flex-none h-[42px] bg-[#111] text-white px-5 rounded-xl text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Printer size={16} className="mr-2" /> Print PDF
            </button>
          </div>
        </div>

        {/* Compliance Overview Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:block">
           {/* Gauge Card */}
           <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex items-center gap-8 print:border-black/50 print:mb-4">
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                 <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f5f4f0" strokeWidth="12" />
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke={gaugeColor} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[28px] font-black tracking-tighter leading-none" style={{ color: gaugeColor }}>
                       {compliancePercent}%
                    </span>
                 </div>
              </div>
              <div>
                 <h2 className="text-[18px] font-bold tracking-tight mb-1">Compliance Target</h2>
                 <p className="text-[13px] text-[#888] mb-3">
                    {completedChecks} of {totalChecks} mandatory checks completed safely.
                 </p>
                 {compliancePercent < 90 && topOffenderObj && topOffenderObj.windowCount > 0 && (
                    <div className="bg-[#FFF8EB] border border-[#F2C17D] text-[#AF5B00] px-3 py-2 rounded-lg text-[12px] font-bold inline-flex animate-in fade-in duration-500">
                       Recommendation: Review staffing levels during the {topOffenderObj.window} window.
                    </div>
                 )}
              </div>
           </div>

           {/* Risk Analysis Card */}
           <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex flex-col justify-center print:border-black/50 print:mb-6">
              <h2 className="text-[18px] font-bold tracking-tight mb-4 flex items-center gap-2">
                 <AlertTriangle size={18} className="text-[#E24B4A]" />
                 Risk Analysis
              </h2>
              {topOffenderObj && topOffenderObj.stationCount > 0 ? (
                 <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-black/5 pb-2">
                       <span className="text-[13px] text-[#6b6b67] font-bold uppercase tracking-wider">Top Offender</span>
                       <span className="font-bold text-[#E24B4A] text-[15px]">{topOffenderObj.station}</span>
                    </div>
                    <div className="text-[13px] text-[#888]">
                       <strong>{topOffenderObj.stationCount}</strong> missed required checks observed inside constraints during this reporting cycle.
                    </div>
                 </div>
              ) : (
                 <div className="text-[14px] text-[#3B6D11] font-bold flex items-center gap-2">
                    <CheckCircle size={18} />
                    Zero missed logs detected in range!
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Actual Ledger Data */}
      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm print:shadow-none print:border-none print:rounded-none">
        <div className="overflow-x-auto relative">
          {isFetchingLogs && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center print:hidden">
              <Loader2 className="w-6 h-6 animate-spin text-black/50" />
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-black/10 print:bg-white print:border-b-2 print:border-black">
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4 print:px-2 print:text-black">Date</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4 print:px-2 print:text-black">Check Name (Station)</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4 print:px-2 print:text-black">Status</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4 print:px-2 print:text-black text-right">Time Completed (Window)</th>
              </tr>
            </thead>
            <tbody className="text-[14px] print:text-[12px]">
              {schedules.map(sc => {
                const isFail = sc.status === 'MISSED';
                const isSafe = sc.status === 'COMPLETED';
                const isLate = sc.status === 'LATE';

                return (
                  <tr key={sc.id} className="border-b border-black/5 last:border-0 hover:bg-[#fcfbf9] transition-colors print:border-black/20">
                    <td className="px-6 py-4 text-[#111] whitespace-nowrap print:px-2 font-medium">
                      {new Date(`${sc.target_date}T00:00:00`).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#111] truncate max-w-[200px] print:px-2">
                       <span className="opacity-50 mr-2 text-[12px] font-normal hidden md:inline">{getLocationName(sc.stations.location_id)}</span>
                       {sc.stations.name}
                    </td>
                    <td className="px-6 py-4 print:px-2">
                      {isFail && (
                        <span className="inline-flex w-fit items-center text-[11px] font-bold uppercase tracking-wide text-[#E24B4A] bg-[#FFF4F4] px-2 py-1 rounded border border-[#F09595] print:border-black print:text-black print:bg-transparent">
                          MISSED
                        </span>
                      )}
                      {isSafe && (
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] px-2 py-1 rounded border border-[#97C459] print:text-black print:bg-transparent print:p-0">
                          COMPLETED
                        </span>
                      )}
                      {isLate && (
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide text-[#AF5B00] bg-[#FFF8EB] px-2 py-1 rounded border border-[#F2C17D] print:text-black print:bg-transparent print:p-0">
                          COMPLETED LATE
                        </span>
                      )}
                      {sc.status === 'PENDING' && (
                        <span className="inline-flex w-fit items-center text-[11px] font-bold uppercase tracking-wide text-[#888] bg-black/5 px-2 py-1 rounded border border-black/10 print:border-black print:text-black print:bg-transparent">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-right text-[#6b6b67] print:px-2 print:text-black">
                       <span className="bg-[#f5f4f0] px-2 py-1 rounded-lg print:bg-transparent print:border print:border-black/20 text-[13px]">
                          {sc.window_start.substring(0,5)} - {sc.window_end.substring(0,5)}
                       </span>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && !isFetchingLogs && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#888] text-[14px]">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <FileText size={32} className="opacity-30" />
                       No records found matching the requested timeframe.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
