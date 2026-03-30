"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, FileSpreadsheet, Download, Printer, AlertCircle, FileText, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Org = { id: string; name: string };
type Location = { id: string; name: string };

type LogRecord = {
  id: string;
  created_at: string;
  logged_at: string;
  is_breach: boolean;
  entry_data: Array<{ key: string; label?: string; value: string; unit?: string; status: string; corrective_action?: string }>;
  staff_name: string;
  station_name: string;
  location_id: string;
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
  const [isExporting, setIsExporting] = useState(false);

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
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = supabase
          .from("logs")
          .select(`id, created_at, logged_at, is_breach, entry_data, staff_name, station_name, location_id`)
          .in("location_id", locations.map(l => l.id))
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: false });

        if (showExceptionsOnly) {
          query = query.eq("is_breach", true);
        }

        const { data, error: logErr } = await query;
        if (logErr) throw logErr;

        setLogs((data as LogRecord[]) || []);
      } catch (err: any) {
        setError("Failed to fetch logs: " + err.message);
      } finally {
        setIsFetchingLogs(false);
      }
    };

    fetchLogs();
  }, [startDate, endDate, showExceptionsOnly, locations, org]);

  const exportCSV = () => {
    if (!org || logs.length === 0) return;
    setIsExporting(true);
    try {
      const headers = ["Date", "Time", "Station", "Staff", "Reading Key", "Reading Value", "Status", "Corrective Action"];
      const rows: string[] = [];

      logs.forEach(log => {
        const dateStr = new Date(log.created_at).toLocaleDateString();
        const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entries = Array.isArray(log.entry_data) ? log.entry_data : [];

        if (entries.length === 0) {
          rows.push([
            `"${dateStr}"`,
            `"${timeStr}"`,
            `"${(log.station_name || "").replace(/"/g, '""')}"`,
            `"${(log.staff_name || "").replace(/"/g, '""')}"`,
            `""`,
            `""`,
            `"${log.is_breach ? "BREACH" : "SAFE"}"`,
            `""`
          ].join(","));
        } else {
          entries.forEach(entry => {
            const corrective = entry.status === 'UNSAFE' && entry.corrective_action
              ? entry.corrective_action
              : "";
            rows.push([
              `"${dateStr}"`,
              `"${timeStr}"`,
              `"${(log.station_name || "").replace(/"/g, '""')}"`,
              `"${(log.staff_name || "").replace(/"/g, '""')}"`,
              `"${(entry.key || "").replace(/"/g, '""')}"`,
              `"${(entry.value || "").replace(/"/g, '""')}"`,
              `"${log.is_breach ? "BREACH" : "SAFE"}"`,
              `"${corrective.replace(/"/g, '""')}"`
            ].join(","));
          });
        }
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_report_${(org.name || "").replace(/\s+/g, '_')}_${startDate}_to_${endDate}_COMPLETE.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    if (!org || logs.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AuditShield — Food Safety Compliance Report", 14, 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Organization: ${org.name || "N/A"}`, 14, 28);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 34);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

      const tableColumn = ["Date/Time", "Station", "Staff", "Reading", "Status", "Corrective Action"];
      const tableRows: any[] = [];

      logs.forEach(log => {
        const dateTimeStr = new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const entries = Array.isArray(log.entry_data) ? log.entry_data : [];
        const statusText = log.is_breach ? "BREACH" : "SAFE";

        if (entries.length === 0) {
          tableRows.push([
            dateTimeStr,
            log.station_name || "Unknown",
            log.staff_name || "Unknown",
            "—",
            statusText,
            "—"
          ]);
        } else {
          entries.forEach(entry => {
            const corrective = entry.status === 'UNSAFE' && entry.corrective_action
              ? entry.corrective_action
              : "—";
            tableRows.push([
              dateTimeStr,
              log.station_name || "Unknown",
              log.staff_name || "Unknown",
              `${entry.label || entry.key || 'Reading'}: ${entry.value}${entry.unit ? ' ' + entry.unit : ''}`,
              statusText,
              corrective
            ]);
          });
        }
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: 'grid',
        headStyles: { fillColor: [17, 17, 16], textColor: [255, 255, 255] },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const statusVal = data.row.raw ? (data.row.raw as unknown as any[])[4] : null;
            if (statusVal === "BREACH") {
              data.cell.styles.fillColor = [252, 235, 235];
              data.cell.styles.textColor = [121, 31, 31];
            }
          }
        }
      });

      const safeName = (org.name || "report").replace(/\s+/g, '_');
      doc.save(`AuditShield_Report_${safeName}_${startDate}_${endDate}.pdf`);
    } catch (err: any) {
      setError("PDF export failed: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111]" />
      </div>
    );
  }

  // Pre-compute Compliance Mathematics
  const totalChecks = logs.length;
  const completedChecks = logs.filter(l => !l.is_breach).length;
  const missedChecks = logs.filter(l => l.is_breach).length;
  const compliancePercent = totalChecks === 0 ? 100 : Math.round((completedChecks / totalChecks) * 100);

  let gaugeColor = "#E24B4A";
  if (compliancePercent >= 50 && compliancePercent < 90) gaugeColor = "#E28800";
  if (compliancePercent >= 90) gaugeColor = "#97C459";

  // Top Offender Dictionary Map
  const topOffenderObj = (() => {
    if (logs.length === 0) return null;
    const breachesByStation: Record<string, number> = {};

    logs.forEach(log => {
      if (log.is_breach) {
        const name = log.station_name || "Unknown";
        breachesByStation[name] = (breachesByStation[name] || 0) + 1;
      }
    });

    let maxStation = "";
    let maxCount = 0;
    Object.entries(breachesByStation).forEach(([st, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxStation = st;
      }
    });

    return { station: maxStation, stationCount: maxCount };
  })();

  // SVG Gauge Math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliancePercent / 100) * circumference;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 text-[#111110] animate-in fade-in duration-500 min-h-screen pb-16">

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
              disabled={logs.length === 0 || isExporting}
              className="flex-1 md:flex-none h-[42px] bg-white border border-black/10 text-[#111] px-5 rounded-xl text-[14px] font-medium hover:bg-[#f8f7f4] transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={exportPDF}
              disabled={logs.length === 0 || isExporting}
              className="flex-1 md:flex-none h-[42px] bg-[#111] text-white px-5 rounded-xl text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Printer size={16} className="mr-2" />}
              {isExporting ? "Loading..." : "Print PDF"}
            </button>
          </div>
        </div>

        {/* Compliance Overview Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Gauge Card */}
          <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex items-center gap-8">
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
                {completedChecks} of {totalChecks} logs recorded safely.
              </p>
              {compliancePercent < 90 && topOffenderObj && topOffenderObj.stationCount > 0 && (
                <div className="bg-[#FFF8EB] border border-[#F2C17D] text-[#AF5B00] px-3 py-2 rounded-lg text-[12px] font-bold inline-flex animate-in fade-in duration-500">
                  Recommendation: Review {topOffenderObj.station} station immediately.
                </div>
              )}
            </div>
          </div>

          {/* Risk Analysis Card */}
          <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm flex flex-col justify-center">
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
                  <strong>{topOffenderObj.stationCount}</strong> breach{topOffenderObj.stationCount !== 1 ? 'es' : ''} logged at this station during this reporting cycle.
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-[#3B6D11] font-bold flex items-center gap-2">
                <CheckCircle size={18} />
                Zero breaches detected in range!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto relative">
          {isFetchingLogs && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-black/50" />
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#fcfbf9] border-b border-black/10">
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Date / Time</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Station</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Staff</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Readings</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Status</th>
                <th className="font-bold text-[11px] text-[#888] uppercase tracking-wider px-6 py-4">Corrective Action</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {logs.map(log => {
                const entries = Array.isArray(log.entry_data) ? log.entry_data : [];
                const correctiveEntries = entries.filter(e => e.status === 'UNSAFE' && e.corrective_action);

                return (
                  <tr
                    key={log.id}
                    className={`border-b border-black/5 last:border-0 transition-colors align-top ${log.is_breach ? 'bg-[#fff8f8] hover:bg-[#FFEBEB]' : 'bg-white hover:bg-[#f8f7f4]'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-[#111]">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-[#6b6b67] font-normal">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#111]">
                      {log.station_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-[#6b6b67]">
                      {log.staff_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {entries.length === 0 ? (
                        <span className="text-[#888] text-[13px]">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {entries.map((entry, i) => (
                            <div key={i} className="text-[13px]">
                              <span className="text-[#6b6b67]">{entry.label || entry.key || 'Reading'}:</span>{" "}
                              <span className={`font-medium ${entry.status === 'UNSAFE' ? 'text-[#E24B4A]' : 'text-[#111]'}`}>
                                {entry.value}{entry.unit ? ` ${entry.unit}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.is_breach ? (
                        <span className="inline-flex w-fit items-center text-[11px] font-bold uppercase tracking-wide text-[#E24B4A] bg-[#FFF4F4] px-2 py-1 rounded border border-[#F09595]">
                          BREACH
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide text-[#3B6D11] bg-[#EAF3DE] px-2 py-1 rounded border border-[#97C459]">
                          SAFE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#111] max-w-[200px]">
                      {correctiveEntries.length === 0 ? (
                        <span className="text-[#888]">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {correctiveEntries.map((entry, i) => (
                            <div key={i} className="leading-[1.4]">{entry.corrective_action}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && !isFetchingLogs && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#888] text-[14px]">
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
