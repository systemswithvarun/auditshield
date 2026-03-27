"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type FieldConfig = {
  id: string;
  label: string;
  unit: string;
  type: "temp" | "ppm" | "pass";
  min: number | null;
  max: number | null;
  warnMsg: string;
};

export type StationConfig = {
  id: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  desc: string;
  fields: FieldConfig[];
};



type FieldState = {
  value: string | boolean | null;
  hasBreach: boolean;
  correctiveAction: string;
};

type Props = {
  station: StationConfig;
  staffId: string;
  organizationId: string;
  locationId: string;
  onReset: () => void;
};

export function StationForm({ station, staffId, organizationId, locationId, onReset }: Props) {
  const [formData, setFormData] = useState<Record<string, FieldState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const handleInputChange = (fieldId: string, val: string) => {
    const f = station.fields.find((x) => x.id === fieldId)!;
    let breach = false;
    
    if (val !== "") {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (f.min !== null && num < f.min) breach = true;
        if (f.max !== null && num > f.max) breach = true;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [fieldId]: {
        value: val,
        hasBreach: breach,
        correctiveAction: prev[fieldId]?.correctiveAction || "",
      },
    }));
  };

  const handlePassChange = (fieldId: string, passed: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: {
        value: passed,
        hasBreach: !passed,
        correctiveAction: prev[fieldId]?.correctiveAction || "",
      },
    }));
  };

  const handleActionChange = (fieldId: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        correctiveAction: val,
      },
    }));
  };

  const getIsDisabled = () => {
    let hasData = false;
    for (const f of station.fields) {
      const fd = formData[f.id];
      if (fd && fd.value !== "" && fd.value !== null) {
        hasData = true;
        // If breach and NO corrective action text, disabled!
        if (fd.hasBreach && !fd.correctiveAction.trim()) {
          return true;
        }
      }
    }
    return !hasData; // Also disabled if entirely empty
  };

  const handleSubmit = async () => {
    setLoading(true);
    setDbError("");

    const isBreachOverall = station.fields.some(
      (f) => formData[f.id]?.hasBreach
    );

    const payload = {
      // Using the real staff UUID from our staff fetch
      staff_id: staffId,
      organization_id: organizationId,
      location_id: locationId,
      action: `${station.label} Audit Log`,
      details: {
        is_breach: isBreachOverall,
        entry_data: formData,
        station_id: station.id
      }
    };
    
    // Execute Supabase Insert
    const { error } = await supabase.from("logs").insert([payload]);

    setLoading(false);

    if (error) {
      console.error("Supabase Error:", error);
      setDbError(error.message || "Failed to sync with Supabase. Ensure Keys are configured and foreign keys exist.");
    } else {
      // ONLY manifest the success UI once DB confirms
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="py-8 px-2 text-center animate-in zoom-in-95 fade-in duration-300">
        <div className="w-14 h-14 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-4 text-[#3B6D11]">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-[19px] font-medium text-[#111110] mb-1">Log submitted</h2>
        <p className="text-[14px] text-[#6b6b67] leading-[1.6] mb-6 px-4">
          Station check recorded. In the full AuditShield system, this entry is:
        </p>
        <div className="text-left bg-[#f8f7f4] rounded-xl border border-black/10 p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#111110] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Timestamped and stored digitally
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#111110] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Included in weekly compliance reports
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#111110] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Ready for health inspectors instantly
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#111110] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Flagged automatically if a safety breach was logged
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full h-[46px] bg-transparent border border-black/20 rounded-lg font-medium text-[14px] text-[#111110] hover:bg-[#f8f7f4] transition-colors"
        >
          Log another station
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="h-[1px] bg-black/10 my-6" />
      <div className="text-[13px] font-medium text-[#6b6b67] mb-5 tracking-wide">
        {station.label} checklist
      </div>
      
      <div className="flex flex-col gap-6">
        {station.fields.map((f) => {
          const ds = formData[f.id] || { value: "", hasBreach: false, correctiveAction: "" };
          const isWarn = ds.hasBreach;

          return (
            <div key={f.id} className="flex flex-col">
              {f.type === "pass" ? (
                <>
                  <span className="block text-[14px] font-medium text-[#111110] mb-2">
                    {f.label}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePassChange(f.id, true)}
                      className={`flex-1 h-[42px] border rounded-lg text-[14px] font-medium transition-colors shadow-sm ${ds.value === true ? 'bg-[#EAF3DE] border-[#97C459] text-[#3B6D11]' : 'bg-white border-black/10 text-[#111110] hover:border-black/20 hover:bg-[#f8f7f4]'}`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handlePassChange(f.id, false)}
                      className={`flex-1 h-[42px] border rounded-lg text-[14px] font-medium transition-colors shadow-sm ${ds.value === false ? 'bg-[#FCEBEB] border-[#F09595] text-[#791F1F]' : 'bg-white border-black/10 text-[#111110] hover:border-black/20 hover:bg-[#f8f7f4]'}`}
                    >
                      Fail
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="block text-[14px] font-medium text-[#111110] mb-2">
                    {f.label}
                    <span className="text-[12px] font-normal text-[#9b9b97] ml-1.5">{f.unit}</span>
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={(ds.value as string) || ""}
                      onChange={(e) => handleInputChange(f.id, e.target.value)}
                      className={`w-full h-[46px] border rounded-lg px-4 pr-12 text-[15px] text-[#111110] outline-none transition-colors shadow-sm placeholder:text-[#ccc] ${isWarn ? 'border-[#E24B4A] bg-[#fff8f8] focus:border-[#E24B4A]' : 'bg-white border-black/10 focus:border-black/30'}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9b9b97] pointer-events-none">
                      {f.unit}
                    </span>
                  </div>
                </>
              )}

              {/* Safety Alert Box */}
              {isWarn && (
                <div className="flex gap-3 bg-[#FCEBEB] border border-[#F09595] rounded-xl p-3 mt-3 animate-in fade-in duration-200 shadow-sm">
                  <AlertCircle size={16} className="text-[#791F1F] mt-[2px] shrink-0" />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[#791F1F] mb-1">Safety alert</div>
                    <div className="text-[12px] text-[#791F1F] leading-[1.5] mb-3">{f.warnMsg}</div>
                    
                    <div className="text-[11px] font-semibold text-[#791F1F] opacity-80 mb-1.5 tracking-[0.05em] uppercase">Corrective action required</div>
                    <textarea
                      placeholder="Describe what was done to fix this issue..."
                      value={ds.correctiveAction}
                      onChange={(e) => handleActionChange(f.id, e.target.value)}
                      className="w-full border border-[#F09595] rounded-lg bg-white/80 p-3 text-[13px] text-[#111110] resize-none outline-none min-h-[70px] leading-[1.5] transition-colors focus:bg-white focus:border-[#E24B4A] placeholder:text-[#a18989] shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-[1px] bg-black/10 my-7" />
      
      {dbError && (
        <div className="mb-4 p-3 bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] text-[13.5px] rounded-xl flex items-start gap-2.5 animate-in fade-in shadow-sm">
           <AlertCircle size={16} className="shrink-0 mt-[1px]" /> 
           <div className="leading-[1.4]"><span className="font-bold uppercase tracking-[0.03em] text-[12px] opacity-80 block mb-0.5">Database Error</span> {dbError}</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={getIsDisabled() || loading}
        className="flex items-center justify-center w-full h-[52px] bg-[#111] text-white rounded-xl text-[15px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none shadow-md"
      >
        {loading ? "Syncing securely to Database..." : "Submit station log"}
      </button>
    </div>
  );
}
