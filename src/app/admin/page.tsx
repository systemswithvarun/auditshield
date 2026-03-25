import { supabase } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";
import StaffManager from "@/components/StaffManager";

export const revalidate = 0; // Disable cache so the dashboard always fetches the latest logs

export default async function AdminDashboard() {
  const { data: logs, error } = await supabase
    .from("logs")
    .select(`
      id,
      action,
      details,
      performed_at,
      stations ( name ),
      staff ( first_name, last_name )
    `)
    .order("performed_at", { ascending: false });

  // Use the fetched data, or fallback to mock data if the realtime DB is unreachable (e.g. no .env keys)
  let displayLogs: any[] = [];
  
  if (!error && logs) {
    displayLogs = logs.map((l: any) => ({
      ...l,
      stationName: l.stations?.name || "Unknown Station",
      staffName: l.staff ? `${l.staff.first_name} ${l.staff.last_name}` : "Unknown Staff",
      isBreach: l.details?.is_breach === true,
      entryData: l.details?.entry_data || {}
    }));
  } else {
    // Fallback Mock Logic ensures UI is testable immediately
    displayLogs = [
      {
        id: "mock-1",
        action: "Station Log",
        performed_at: new Date(Date.now() - 40 * 60000).toISOString(),
        stationName: "Cold Storage",
        staffName: "Sarah Jenkins",
        isBreach: true,
        entryData: {
          wic: { hasBreach: true, correctiveAction: "None recorded.", label: "Walk-in cooler temperature", value: "5.2", unit: "°C" },
          pct: { hasBreach: false, correctiveAction: "", label: "Prep cooler temperature", value: "3.1", unit: "°C" }
        }
      },
      {
        id: "mock-2",
        action: "Station Log",
        performed_at: new Date(Date.now() - 120 * 60000).toISOString(),
        stationName: "Hot Holding",
        staffName: "Mike Chen",
        isBreach: true,
        entryData: {
          stt: { hasBreach: true, correctiveAction: "Adjusted thermostat limits and waited 15 mins. Recovered successful.", label: "Steam table temperature", value: "52.0", unit: "°C" }
        }
      },
      {
        id: "mock-3",
        action: "Station Log",
        performed_at: new Date(Date.now() - 180 * 60000).toISOString(),
        stationName: "Sanitation & Chemicals",
        staffName: "Alex Rivera",
        isBreach: false,
        entryData: {
          snc: { hasBreach: false, correctiveAction: "", label: "Sanitizer concentration", value: "200", unit: "ppm" },
          stp: { hasBreach: false, correctiveAction: "", label: "Surface test passed", value: "Pass", unit: "" }
        }
      }
    ];
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white min-h-screen p-8 sm:p-12 sm:my-8 sm:rounded-2xl border-black/10 sm:border shadow-[0_4px_24px_rgba(0,0,0,0.04)] print:m-0 print:p-0 print:border-none print:shadow-none print:min-w-full text-[#111110]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-black/10 print:hidden gap-4">
        <div>
          <h1 className="text-[26px] font-medium tracking-tight">Manager Dashboard</h1>
          <p className="text-[#6b6b67] text-[14px] mt-1">AuditShield Health Services (AHS) Reporting</p>
        </div>
        <PrintButton />
      </div>

      {/* Print PDF Header */}
      <div className="hidden print:block pb-6 mb-8 border-b-2 border-black/80">
        <h1 className="text-[32px] font-bold tracking-tight text-black">AHS Compliance Report</h1>
        <p className="text-black/70 text-[14px] mt-1 font-medium">Generated: {new Date().toLocaleString()}</p>
        <p className="text-black/70 text-[14px] mt-1 font-medium">Facility: Main Campus HQ</p>
      </div>

      <div className="mt-8">
        <div className="overflow-x-auto border border-black/10 rounded-xl print:border-none print:rounded-none">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f5f4f0] border-b border-black/10 text-[#6b6b67] text-[13px] print:bg-black print:text-white">
              <tr>
                <th className="p-4 font-medium min-w-[150px]">Date & Time</th>
                <th className="p-4 font-medium min-w-[150px]">Station</th>
                <th className="p-4 font-medium min-w-[130px]">Staff</th>
                <th className="p-4 font-medium min-w-[120px]">Status</th>
                <th className="p-4 font-medium min-w-[300px]">Readings & Corrective Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-[#111110] print:divide-black/40">
              {displayLogs.map((log) => {
                // Determine row highlight condition
                const rowClasses = log.isBreach
                  ? "bg-[#fff8f8] hover:bg-[#FFEBEB] print:bg-white print:border-l-4 print:border-[#E24B4A]"
                  : "bg-white hover:bg-[#f8f7f4] print:bg-white";

                return (
                  <tr key={log.id} className={`align-top transition-colors ${rowClasses}`}>
                    <td className="p-4 whitespace-nowrap text-[13px]">{new Date(log.performed_at).toLocaleString([], { dateStyle:'short', timeStyle:'short' })}</td>
                    <td className="p-4 font-medium">{log.stationName}</td>
                    <td className="p-4 text-[#6b6b67] print:text-black/80">{log.staffName}</td>
                    <td className="p-4">
                      {log.isBreach ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[12px] font-bold bg-[#FCEBEB] text-[#791F1F] border border-[#F09595] print:border-none print:p-0 print:uppercase print:tracking-wider print:text-[#E24B4A] print:bg-transparent">
                          Breach
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[12px] font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#97C459] print:border-none print:p-0 print:text-[#3B6D11] print:bg-transparent">
                          Compliant
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-4">
                        {Object.values(log.entryData).map((f: any, i: number) => (
                          <div key={i} className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <span className="text-[#6b6b67] print:text-black/80 w-48 text-[13px]">{f.label}</span>
                              {f.hasBreach ? (
                                 <span className="font-bold text-[#E24B4A]">{f.value} {f.unit}</span>
                              ) : (
                                 <span className="font-medium text-[#111110]">{f.value} {f.unit}</span>
                              )}
                            </div>
                            {f.hasBreach && (
                              <div className="mt-2 ml-14 bg-white/60 border border-[#F09595] px-3 py-2 rounded flex flex-col print:border-l-2 print:border-black print:rounded-none print:bg-transparent print:ml-4">
                                <span className="text-[10px] font-bold text-[#791F1F] uppercase tracking-[0.05em] mb-[2px] print:text-black">Corrective Action</span>
                                <span className="text-[#111110] text-[13px] leading-[1.5] font-medium print:text-black">
                                  {f.correctiveAction ? f.correctiveAction : <span className="text-[#E24B4A] italic">Not Provided</span>}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Supabase Mock Hint */}
        {error && (
          <div className="mt-6 text-xs text-center text-[#9b9b97] print:hidden">
            <p>Running mock database engine. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are wired to fetch real logs.</p>
          </div>
        )}
      </div>

      <StaffManager />
    </div>
  );
}
