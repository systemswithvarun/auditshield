"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type FieldConfig = {
  key: string;
  label: string;
  type: 'temperature' | 'passfail';
  min?: number;
  max?: number;
  unit?: string;
  warn_msg?: string;
};

export type StationConfig = {
  id: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  desc: string;
  fields: FieldConfig[];
  pending_count?: number;
  pending_instance_id?: string | null;
};

type FieldState = {
  value: string | boolean | null;
  status: 'SAFE' | 'UNSAFE' | null;
  correctiveAction: string;
};

type Props = {
  station: StationConfig;
  staffId: string;
  orgSlug: string;
  locSlug: string;
  instanceId?: string | null;
  sessionToken: string;
  onReset: () => void;
};

export function StationForm({ station, staffId, orgSlug, locSlug, instanceId, sessionToken, onReset }: Props) {
  const [formData, setFormData] = useState<Record<string, FieldState>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  const validateTemp = (val: string, f: FieldConfig): 'SAFE' | 'UNSAFE' | null => {
    if (val === "") return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;

    if (f.min !== undefined && num < f.min) return 'UNSAFE';
    if (f.max !== undefined && num > f.max) return 'UNSAFE';
    return 'SAFE';
  };

  const handleInputChange = (fieldKey: string, val: string) => {
    const f = station.fields.find((x) => x.key === fieldKey)!;
    const status = validateTemp(val, f);
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: {
        value: val,
        status,
        correctiveAction: prev[fieldKey]?.correctiveAction || "",
      },
    }));
  };

  const handlePassChange = (fieldKey: string, passed: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: {
        value: passed ? 'pass' : 'fail',
        status: passed ? 'SAFE' : 'UNSAFE',
        correctiveAction: prev[fieldKey]?.correctiveAction || "",
      },
    }));
  };

  const handleActionChange = (fieldKey: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        correctiveAction: val,
      },
    }));
  };

  const getIsDisabled = () => {
    let hasData = false;
    for (const f of station.fields) {
      const fd = formData[f.key];
      if (fd && fd.value !== "" && fd.value !== null) {
        hasData = true;
        if (fd.status === 'UNSAFE' && !fd.correctiveAction.trim()) {
          return true;
        }
      }
    }
    return !hasData;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setDbError("");

    const entries = station.fields
      .filter((f) => {
        const fd = formData[f.key];
        return fd && fd.value !== "" && fd.value !== null;
      })
      .map((f) => {
        const ds = formData[f.key];
        const entry: Record<string, unknown> = {
          key: f.key,
          label: f.label,
          value: String(ds.value),
          unit: f.unit || null,
          status: ds.status,
        };
        if (ds.status === 'UNSAFE' && ds.correctiveAction.trim()) {
          entry.corrective_action = ds.correctiveAction.trim();
        }
        return entry;
      });

    const { data: logData, error } = await supabase.rpc('submit_kiosk_log', {
      p_org_slug: orgSlug,
      p_loc_slug: locSlug,
      p_station_id: station.id,
      p_staff_id: staffId,
      p_entry_data: entries,
      p_instance_id: instanceId ?? null,
      p_session_token: sessionToken,
    });

    if (error || logData?.error) {
      const msg = logData?.error || error?.message || "Submission failed.";
      if (msg === 'invalid_session') {
        setDbError("Session expired. Please log out and sign in again.");
      } else if (msg === 'corrective_action_required') {
        setDbError("A corrective action is required before this log can be submitted.");
      } else {
        setDbError(msg);
      }
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="py-8 px-2 text-center animate-in zoom-in-95 fade-in duration-300">
        <div className="w-14 h-14 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#006e2f]">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-[19px] font-medium text-[#0d1c2d] mb-1">Log submitted</h2>
        <p className="text-[14px] text-[#45464d] leading-[1.6] mb-6 px-4">
          Station check recorded. In the full AuditShield system, this entry is:
        </p>
        <div className="text-left bg-[#f8f9ff] rounded-xl border border-black/10 p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#0d1c2d] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Timestamped and stored digitally
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#0d1c2d] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Included in weekly compliance reports
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#0d1c2d] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Ready for health inspectors instantly
          </div>
          <div className="flex items-start gap-3 py-2 text-[13px] text-[#0d1c2d] leading-[1.5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" /> Flagged automatically if a safety breach was logged
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full h-[46px] bg-transparent border border-black/20 rounded-lg font-medium text-[14px] text-[#0d1c2d] hover:bg-[#eef4ff] transition-colors"
        >
          Log another station
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="h-[1px] bg-black/10 my-6" />
      <div className="text-[13px] font-medium text-[#45464d] mb-5 tracking-wide">
        {station.label} checklist
      </div>

      <div className="flex flex-col gap-6">
        {station.fields.map((f) => {
          const ds = formData[f.key] || { value: "", status: null, correctiveAction: "" };
          const isWarn = ds.status === 'UNSAFE';

          return (
            <div key={f.key} className="flex flex-col">
              {f.type === "passfail" ? (
                <>
                  <span className="block text-[14px] font-medium text-[#0d1c2d] mb-2">
                    {f.label}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePassChange(f.key, true)}
                      className={`flex-1 h-[42px] border rounded-lg text-[14px] font-medium transition-colors shadow-sm ${ds.value === 'pass' ? 'bg-[#22C55E]/10 border-[#22C55E] text-[#006e2f]' : 'bg-white border-black/10 text-[#0d1c2d] hover:border-black/20 hover:bg-[#eef4ff]'}`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handlePassChange(f.key, false)}
                      className={`flex-1 h-[42px] border rounded-lg text-[14px] font-medium transition-colors shadow-sm ${ds.value === 'fail' ? 'bg-[#ffdad6] border-[#ba1a1a]/20 text-[#ba1a1a]' : 'bg-white border-black/10 text-[#0d1c2d] hover:border-black/20 hover:bg-[#eef4ff]'}`}
                    >
                      Fail
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="block text-[14px] font-medium text-[#0d1c2d] mb-2">
                    {f.label}
                    {f.unit && <span className="text-[12px] font-normal text-[#9b9b97] ml-1.5">{f.unit}</span>}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={(ds.value as string) || ""}
                      onChange={(e) => handleInputChange(f.key, e.target.value)}
                      className={`w-full h-[46px] border rounded-lg px-4 pr-12 text-[15px] text-[#0d1c2d] outline-none transition-colors shadow-sm placeholder:text-[#ccc] ${isWarn ? 'border-[#ba1a1a] bg-[#fff8f8] focus:border-[#ba1a1a]' : 'bg-white border-black/10 focus:border-black/30'}`}
                    />
                    {f.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9b9b97] pointer-events-none">
                        {f.unit}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Safety Alert Box */}
              {isWarn && (
                <div className="flex gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl p-3 mt-3 animate-in fade-in duration-200 shadow-sm">
                  <AlertCircle size={16} className="text-[#ba1a1a] mt-[2px] shrink-0" />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[#ba1a1a] mb-1">Safety alert</div>
                    <div className="text-[12px] text-[#ba1a1a] leading-[1.5] mb-3">{f.warn_msg}</div>

                    <div className="text-[11px] font-semibold text-[#ba1a1a] opacity-80 mb-1.5 tracking-[0.05em] uppercase">Action Required: Describe corrective steps (e.g., 'Moved stock').</div>
                    <textarea
                      placeholder="Describe what was done to fix this issue..."
                      value={ds.correctiveAction}
                      onChange={(e) => handleActionChange(f.key, e.target.value)}
                      className="w-full border border-[#ba1a1a]/20 rounded-lg bg-white/80 p-3 text-[13px] text-[#0d1c2d] resize-none outline-none min-h-[70px] leading-[1.5] transition-colors focus:bg-white focus:border-[#ba1a1a] placeholder:text-[#a18989] shadow-inner"
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
        <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] text-[13.5px] rounded-xl flex items-start gap-2.5 animate-in fade-in shadow-sm">
          <AlertCircle size={16} className="shrink-0 mt-[1px]" />
          <div className="leading-[1.4]"><span className="font-bold uppercase tracking-[0.03em] text-[12px] opacity-80 block mb-0.5">Database Error</span> {dbError}</div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={getIsDisabled() || loading}
        className="flex items-center justify-center w-full h-[52px] bg-[#0F172A] text-white rounded-xl text-[15px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none shadow-md"
      >
        {loading ? "Syncing securely to Database..." : "Submit station log"}
      </button>
    </div>
  );
}
