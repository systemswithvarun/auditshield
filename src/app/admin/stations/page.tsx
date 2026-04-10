"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Thermometer, AlertCircle, MapPin, X } from "lucide-react";

type FieldType = 'temperature' | 'number' | 'boolean' | 'date' | 'text';

type Station = {
  id: string;
  name: string;
  icon: string;
  sop_config: any[];
  location: { id: string; name: string };
};

type Location = {
  id: string;
  name: string;
};

export default function StationsPage() {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    locationId: "",
    name: "",
    icon: "",
  });

  const ICON_PRESETS = [
    "🌡️", "❄️", "🧊", "🔥", "🍳", "🥩", "🥗", "🥛", "🧴", "🧽",
    "🚿", "🪣", "🧹", "📋", "✅", "⚠️", "🔬", "💧", "🏪", "🍽️",
  ];
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const [fields, setFields] = useState<{
    localId: string;
    label: string;
    type: FieldType;
    unit: string;
    min: string;
    max: string;
    warn_msg: string;
  }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();

      if (!orgData) throw new Error("Organization not found.");

      const { data: locData, error: locErr } = await supabase
        .from("locations")
        .select("id, name")
        .eq("organization_id", orgData.id);

      if (locErr) throw locErr;
      setLocations(locData || []);

      if (locData && locData.length > 0) {
        const { data: statData, error: statErr } = await supabase
          .from("stations")
          .select("*, location:locations(id, name)")
          .in("location_id", locData.map((l) => l.id))
          .order("created_at", { ascending: false });

        if (statErr) throw statErr;
        setStations(statData || []);

        if (locData.length === 1) {
          setFormData(prev => ({ ...prev, locationId: locData[0].id }));
        }
      } else {
        setStations([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.locationId) {
      alert("Name and Location are required.");
      return;
    }

    if (fields.length === 0) {
      alert("At least one field is required.");
      return;
    }

    for (const f of fields) {
      if (!f.label.trim()) {
        alert("Every field must have a label.");
        return;
      }
    }

    setSubmitting(true);

    const sopConfig = fields.map((f, index) => {
      const config: any = {
        key: `field_${index}`,
        label: f.label.trim(),
        type: f.type,
      };

      if (f.type === 'temperature' || f.type === 'number') {
        if (f.unit.trim()) config.unit = f.unit.trim();
        if (f.min !== "") config.min = Number(f.min);
        if (f.max !== "") config.max = Number(f.max);
        if (f.warn_msg.trim()) config.warn_msg = f.warn_msg.trim();
      } else if (f.type === 'boolean') {
        if (f.warn_msg.trim()) config.warn_msg = f.warn_msg.trim();
      }

      return config;
    });

    try {
      const { error: insertError } = await supabase
        .from("stations")
        .insert({
          location_id: formData.locationId,
          name: formData.name,
          icon: formData.icon || "📋",
          sop_config: sopConfig,
        });

      if (insertError) throw insertError;

      setIsAdding(false);
      setFormData({
        locationId: locations.length === 1 ? locations[0].id : "",
        name: "",
        icon: ""
      });
      setFields([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add station");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (index: number, updates: Partial<typeof fields[0]>) => {
    const newFields = [...fields];
    const prevType = newFields[index].type;
    newFields[index] = { ...newFields[index], ...updates };

    if (updates.type && updates.type !== prevType) {
      const t = updates.type;
      if (t === 'temperature') {
        newFields[index].unit = "°C";
        newFields[index].warn_msg = "Temperature is out of the safe range. Ensure immediate corrective action.";
      } else if (t === 'number') {
        newFields[index].unit = "";
        newFields[index].warn_msg = "Value out of acceptable bounds. Corrective action required.";
      } else if (t === 'boolean') {
        newFields[index].warn_msg = "Check indicates a problem requires attention.";
      }
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        localId: Math.random().toString(36).substring(7),
        label: "",
        type: "temperature",
        unit: "°C",
        min: "",
        max: "",
        warn_msg: "Temperature is out of the safe range. Ensure immediate corrective action.",
      }
    ]);
  };

  if (loading && stations.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight text-[#0d1c2d] mb-1">Stations</h1>
          <p className="text-[#45464d] text-[15px]">Configure operating thresholds for temperature logging.</p>
        </div>
        {!isAdding && locations.length > 0 && (
          <button
            onClick={() => {
              setIsAdding(true);
              setFields([
                {
                  localId: Math.random().toString(36).substring(7),
                  label: "",
                  type: "temperature",
                  unit: "°C",
                  min: "",
                  max: "",
                  warn_msg: "Temperature is out of the safe range. Ensure immediate corrective action.",
                }
              ]);
            }}
            className="h-[42px] bg-[#0F172A] text-white px-5 rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center shadow-sm w-fit"
          >
            <Plus size={16} className="mr-2" /> Add Station
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white border border-black/10 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold text-[#0d1c2d]">New Station Config</h2>
            <button onClick={() => setIsAdding(false)} className="text-[13px] text-[#45464d] hover:text-[#0d1c2d] font-medium">Cancel</button>
          </div>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end pb-6 border-b border-black/10">
              <div>
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Location</label>
                <select
                  required
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] bg-[#f8f9ff] outline-none focus:border-black/30 transition-colors"
                >
                  <option value="" disabled>Select Locale</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Station Name</label>
                <input
                  required
                  type="text"
                  placeholder="Walk-in Fridge"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc]"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1 relative">
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">
                  Icon <span className="normal-case font-normal text-[#94a3b8]">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pick or paste an emoji..."
                    value={formData.icon}
                    onFocus={() => setIconPickerOpen(true)}
                    onBlur={() => setIconPickerOpen(false)}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[20px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[14px] placeholder:text-[#ccc]"
                  />
                  {iconPickerOpen && (
                    <div className="absolute top-[46px] left-0 z-50 bg-white border border-black/10 rounded-xl shadow-lg p-3 w-full">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {ICON_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, icon: emoji });
                              setIconPickerOpen(false);
                            }}
                            className={`w-[34px] h-[34px] rounded-lg text-[18px] flex items-center justify-center transition-colors border ${formData.icon === emoji
                              ? "bg-[#0F172A] border-[#0F172A]"
                              : "bg-white border-black/10 hover:bg-[#f8f9ff] hover:border-black/20"
                              }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setIconPickerOpen(false); }}
                        className="text-[11px] text-[#94a3b8] hover:text-[#0d1c2d] w-full text-right"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-bold text-[#0d1c2d]">Fields</h3>
              {fields.map((f, i) => (
                <div key={f.localId} className="bg-[#f8f9ff] border border-black/5 rounded-xl p-4 flex flex-col gap-4 relative">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#ba1a1a] transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div>
                      <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Label</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Temperature reading"
                        value={f.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Type</label>
                      <select
                        value={f.type}
                        onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                        className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] bg-white outline-none focus:border-black/30 transition-colors"
                      >
                        <option value="temperature">Temperature (°C)</option>
                        <option value="number">Number / PPM</option>
                        <option value="boolean">Yes / No check</option>
                        <option value="date">Date (e.g. expiry)</option>
                        <option value="text">Free text / notes</option>
                      </select>
                    </div>
                  </div>

                  {(f.type === 'temperature' || f.type === 'number') && (
                    <div className="grid grid-cols-3 gap-4 mr-8">
                      <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Unit</label>
                        <input
                          type="text"
                          placeholder="e.g. PPM, °C"
                          value={f.unit}
                          onChange={(e) => updateField(i, { unit: e.target.value })}
                          className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Min</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="No min"
                          value={f.min}
                          onChange={(e) => updateField(i, { min: e.target.value })}
                          className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Max</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="No max"
                          value={f.max}
                          onChange={(e) => updateField(i, { max: e.target.value })}
                          className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc] bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {(f.type === 'temperature' || f.type === 'number' || f.type === 'boolean') && (
                    <div className="mr-8">
                      <label className="block text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">Warn message</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Value out of safe range — corrective action required."
                        value={f.warn_msg}
                        onChange={(e) => updateField(i, { warn_msg: e.target.value })}
                        className="w-full h-[38px] border border-black/10 rounded-lg px-3 text-[13px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc] bg-white"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addField}
                className="h-[38px] bg-white border border-black/10 text-[#0d1c2d] px-4 rounded-xl text-[13px] font-medium hover:bg-[#f8f9ff] transition-colors flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] justify-center w-full sm:w-fit mt-2"
              >
                <Plus size={14} className="mr-2" /> Add Field
              </button>
            </div>

            <div className="pt-4 mt-2 border-t border-black/10 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="h-[42px] px-8 bg-[#0F172A] text-white rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Station"}
              </button>
            </div>
          </form>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="bg-white border border-black/10 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <MapPin className="text-[#94a3b8] mb-3" size={32} />
          <h3 className="font-bold text-[16px] mb-1">No Locations</h3>
          <p className="text-[14px] text-[#45464d] max-w-sm">You must create a location before adding stations.</p>
        </div>
      ) : stations.length > 0 ? (
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-black/5">
                <th className="font-bold text-[11px] text-[#94a3b8] uppercase tracking-wider px-6 py-4">Station</th>
                <th className="font-bold text-[11px] text-[#94a3b8] uppercase tracking-wider px-6 py-4">Location</th>
                <th className="font-bold text-[11px] text-[#94a3b8] uppercase tracking-wider px-6 py-4 hidden md:table-cell">Targets</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {stations.map((stat) => (
                <tr key={stat.id} className="border-b border-black/5 last:border-0 hover:bg-[#eef4ff] transition-colors">
                  <td className="px-6 py-4 text-[#0d1c2d] font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] text-[#245D91] flex items-center justify-center text-[16px]">
                      {stat.icon || "📋"}
                    </div>
                    {stat.name}
                  </td>
                  <td className="px-6 py-4 text-[#45464d]">
                    {stat.location?.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {stat.sop_config && stat.sop_config.length > 0 ? (
                        stat.sop_config.map((f: any) => (
                          <span key={f.key} className="text-[12px] bg-[#f5f4f0] text-[#45464d] px-2.5 py-1 rounded-md font-medium border border-black/5">
                            {f.label}
                            {!f.label.toLowerCase().includes(f.type.toLowerCase()) && (
                              <> &middot; {f.type.charAt(0).toUpperCase() + f.type.slice(1)}</>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-[#94a3b8]">No fields configured</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-black/10 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <Thermometer className="text-[#94a3b8] mb-3" size={32} />
          <h3 className="font-bold text-[16px] mb-1">No Stations Built</h3>
          <p className="text-[14px] text-[#45464d] max-w-sm">Build your first station above to begin logging parameters.</p>
        </div>
      )}
    </div>
  );
}
