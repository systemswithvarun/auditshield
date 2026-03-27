"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, FileSpreadsheet, Download, Printer, AlertCircle, FileText } from "lucide-react";

type Org = { id: string; name: string };
type Location = { id: string; name: string };

type LogRecord = {
  id: string;
  created_at: string;
  is_breach: boolean;
  entry_data: any[];
  staff: { id: string; full_name: string };
  stations: { id: string; name: string; icon: string; location_id: string };
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
  const [logs, setLogs] = useState<LogRecord[]>([]);
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
          .from("logs")
          .select(`
            id, created_at, is_breach, entry_data,
            staff!inner(id, full_name),
            stations!inner(id, name, icon, location_id)
          `)
          .in("stations.location_id", locations.map(l => l.id))
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: false });

        if (showExceptionsOnly) {
           query = query.eq("is_breach", true);
        }

        const { data, error: logErr } = await query;
        if (logErr) throw logErr;

        // Filter valid joins
        const validLogs = (data || []).filter((l: any) => l.stations !== null && l.staff !== null) as LogRecord[];
        setLogs(validLogs);

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
    if (logs.length === 0) return;

    // Headers
    const headers = ["Timestamp", "Location", "Station", "Staff", "Reading", "Status", "Min Temp", "Max Temp", "Corrective Action", "UUID"];
    
    const rows = logs.map(l => {
      const entry = l.entry_data && l.entry_data.length > 0 ? l.entry_data[0] : null;
      return [
        `"${new Date(l.created_at).toLocaleString().replace(/"/g, '""')}"`,
        `"${getLocationName(l.stations.location_id).replace(/"/g, '""')}"`,
        `"${l.stations.name.replace(/"/g, '""')}"`,
        `"${l.staff.full_name.replace(/"/g, '""')}"`,
        `"${entry?.entry_value ?? ''}"`,
        `"${entry?.status ?? (l.is_breach ? 'UNSAFE' : 'SAFE')}"`,
        `"${entry?.min_at_time ?? ''}"`,
        `"${entry?.max_at_time ?? ''}"`,
        `"${String(entry?.corrective_action || '').replace(/"/g, '""')}"`,
        `"${l.id}"`
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
              <FileSpreadsheet className="text-[#245D91]" /> Audit Reports
            </h1>
            <p className="text-[#6b6b67] text-[15px]">Generate immutable raw compliance exports.</p>
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
              disabled={logs.length === 0}
              className="flex-1 md:flex-none h-[42px] bg-white border border-black/10 text-[#111] px-5 rounded-xl text-[14px] font-medium hover:bg-[#f8f7f4] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Download size={16} className="mr-2" /> Export CSV
            </button>
            <button 
              onClick={triggerPrint}
              disabled={logs.length === 0}
              className="flex-1 md:flex-none h-[42px] bg-[#111] text-white px-5 rounded-xl text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Printer size={16} className="mr-2" /> Print PDF
            </button>
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
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black">Date & Time</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black">Location</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black">Station</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black">Staff</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black text-right">Value</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black text-right">Target Range</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-4 py-3 print:px-2 print:text-black">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] print:text-[12px]">
              {logs.map(log => {
                const entry = log.entry_data && log.entry_data.length > 0 ? log.entry_data[0] : null;
                const min = entry?.min_at_time !== null && entry?.min_at_time !== undefined ? entry.min_at_time : "—";
                const max = entry?.max_at_time !== null && entry?.max_at_time !== undefined ? entry.max_at_time : "—";

                return (
                  <tr key={log.id} className="border-b border-black/5 last:border-0 hover:bg-[#fcfbf9] transition-colors print:border-black/20">
                    <td className="px-4 py-3 text-[#111] whitespace-nowrap print:px-2">
                      <span className="font-medium mr-2">{new Date(log.created_at).toLocaleDateString()}</span>
                      <span className="text-[#888] print:text-[#666]">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b67] truncate max-w-[150px] print:px-2 print:text-black">
                      {getLocationName(log.stations.location_id)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111] truncate max-w-[150px] print:px-2">
                      {log.stations.name}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b67] print:px-2 print:text-black">
                      {log.staff.full_name}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-right print:px-2">
                      {entry?.entry_value ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-center text-[#888] print:px-2 print:text-black">
                       <span className="bg-[#f5f4f0] px-1.5 py-0.5 rounded print:bg-transparent print:border print:border-black/20 print:p-0.5">{min}</span>
                       <span className="mx-1.5 text-[#ccc] print:text-black">-</span>
                       <span className="bg-[#f5f4f0] px-1.5 py-0.5 rounded print:bg-transparent print:border print:border-black/20 print:p-0.5">{max}</span>
                    </td>
                    <td className="px-4 py-3 print:px-2 max-w-[300px]">
                      {log.is_breach ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center text-[10px] font-bold uppercase tracking-wide text-[#E24B4A] bg-[#FFF4F4] px-1.5 py-0.5 rounded border border-[#F09595] print:border-black print:text-black print:bg-transparent">
                            UNSAFE EXCEPTION
                          </span>
                          <span className="text-[12px] font-bold text-[#111] leading-tight">
                            {entry?.corrective_action || "Manual override without action statement."}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] px-1.5 py-0.5 rounded align-middle print:text-black print:bg-transparent print:p-0">
                          SAFE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && !isFetchingLogs && (
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
