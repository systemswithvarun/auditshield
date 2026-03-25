"use client";

import { MOCK_LOGS, NotificationHandler } from "@/services/alertService";

export default function InspectorPage() {
  const alerts = NotificationHandler.checkAlerts();

  return (
    <div className="w-full max-w-6xl mx-auto bg-white min-h-screen p-8 sm:p-12 sm:my-8 sm:rounded-2xl border-black/10 sm:border shadow-[0_4px_24px_rgba(0,0,0,0.04)] print:m-0 print:p-0 print:border-none print:shadow-none print:bg-white text-[#111110]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-black/10 print:hidden gap-4">
        <div>
          <h1 className="text-[26px] font-medium tracking-tight">Inspector Mode</h1>
          <p className="text-[#6b6b67] text-[14px] mt-1">Audit logs and compliance overview</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="px-5 py-2.5 bg-[#111] hover:opacity-85 active:scale-95 transition-all text-white rounded-lg text-[14px] font-medium"
        >
          Print to PDF
        </button>
      </div>

      <div className="hidden print:block pb-6 mb-6 border-b border-black/10">
        <h1 className="text-[28px] font-bold tracking-tight text-black">Inspector Audit Report</h1>
        <p className="text-black/60 text-[14px] mt-1">Generated: {new Date().toLocaleString()}</p>
      </div>

      {(alerts.level2.length > 0 || alerts.level3.length > 0) && (
        <div className="my-8 print:hidden flex flex-col gap-3">
          {alerts.level3.map((a, i) => (
             <div key={'l3'+i} className="p-3.5 bg-[#FCEBEB] text-[#791F1F] text-[14px] rounded-lg border border-[#F09595] font-medium flex gap-2 items-start">
               <span className="mt-[1px]">🚨</span> <span>{a}</span>
             </div>
          ))}
          {alerts.level2.map((a, i) => (
             <div key={'l2'+i} className="p-3.5 bg-[#FAEEDA] text-[#8C5D19] text-[14px] rounded-lg border border-[#e6c183] font-medium flex gap-2 items-start">
               <span className="mt-[1px]">✉️</span> <span>{a}</span>
             </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-[17px] font-medium mb-5 print:mb-4 text-[#111110]">Station Logs Directory</h2>
        <div className="overflow-x-auto border border-black/10 rounded-xl print:border-none print:rounded-none">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f5f4f0] border-b border-black/10 text-[#6b6b67] text-[13px] print:bg-white print:border-black/30">
              <tr>
                <th className="p-4 font-medium min-w-[150px]">Date & Time</th>
                <th className="p-4 font-medium min-w-[170px]">Station</th>
                <th className="p-4 font-medium min-w-[130px]">Staff</th>
                <th className="p-4 font-medium min-w-[120px]">Status</th>
                <th className="p-4 font-medium min-w-[300px]">Readings & Corrective Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-[#111110] print:divide-black/20">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="align-top hover:bg-[#f8f7f4] print:hover:bg-white transition-colors">
                  <td className="p-4 whitespace-nowrap text-[13px]">{new Date(log.performed_at).toLocaleString([], { dateStyle:'short', timeStyle:'short' })}</td>
                  <td className="p-4 font-medium">{log.station_name}</td>
                  <td className="p-4 text-[#6b6b67]">{log.staff_name}</td>
                  <td className="p-4">
                    {log.is_breach ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[12px] font-medium bg-[#FCEBEB] text-[#791F1F] border border-[#F09595] print:border-black print:text-black print:bg-transparent">
                        Breach
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[12px] font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#97C459] print:border-black print:text-black print:bg-transparent">
                        Compliant
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-4">
                      {log.fields.map((f, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-[#6b6b67] w-48 text-[13px]">{f.label}</span>
                            {f.hasBreach ? (
                               <span className="font-semibold text-[#791F1F] bg-[#FCEBEB] px-1.5 py-0.5 rounded-[4px] border border-[#F09595] print:border-black print:bg-transparent print:text-black">{f.value} {f.unit}</span>
                            ) : (
                               <span className="font-medium text-[#111110]">{f.value} {f.unit}</span>
                            )}
                          </div>
                          {f.hasBreach && (
                            <div className="mt-2 ml-14 bg-[#FCEBEB] border border-[#F09595] px-3 py-2.5 rounded-lg flex flex-col print:border-black print:bg-white print:ml-4">
                              <span className="text-[10px] font-bold text-[#791F1F] uppercase tracking-[0.05em] mb-1 print:text-black">Corrective Action</span>
                              <span className="text-[#111] text-[13px] leading-[1.5]">
                                {f.correctiveAction ? f.correctiveAction : <span className="text-[#791F1F] italic font-medium print:text-black">None recorded. Immediate attention required.</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
