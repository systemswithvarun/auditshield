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
    "🐀", "🪲",
  ];

  const STATION_TEMPLATES: { label: string; name: string; icon: string; fields: typeof fields }[] = [
    {
      label: "❄️ Cold Storage Log",
      name: "Cold Storage Log",
      icon: "❄️",
      fields: [
        { localId: "cs_0", label: "Storage temperature (°C)", type: "temperature", unit: "°C", min: "0", max: "4", warn_msg: "Temperature exceeds 4°C. Move product to compliant storage immediately and notify manager." },
        { localId: "cs_1", label: "Door seals and gaskets intact?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Seal damage found. Tag unit, notify manager, and arrange repair before next service." },
        { localId: "cs_2", label: "No evidence of ice buildup or condensation?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Ice buildup detected. Schedule defrost and inspect for door seal failure." },
        { localId: "cs_3", label: "All products covered, labelled, and off floor?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Storage standards not met. Cover, label, and properly store all product before end of shift." },
        { localId: "cs_4", label: "Raw proteins stored below ready-to-eat foods?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Cross-contamination risk. Reorganize storage: raw below cooked/ready-to-eat. Document corrective action." },
        { localId: "cs_5", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🔥 Hot Holding Log",
      name: "Hot Holding Log",
      icon: "🔥",
      fields: [
        { localId: "hh_0", label: "Hot holding temperature (°C)", type: "temperature", unit: "°C", min: "60", max: "100", warn_msg: "Temperature below 60°C. Reheat product to 74°C internal temp or discard. Do not serve." },
        { localId: "hh_1", label: "Product covered when not in active service?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Products must be covered when not in active service. Cover immediately to prevent contamination." },
        { localId: "hh_2", label: "Time product placed in hot holding", type: "text", unit: "", min: "", max: "", warn_msg: "" },
        { localId: "hh_3", label: "Product discarded after 2 hours if below 60°C?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Ensure product held below 60°C for more than 2 hours is discarded and logged." },
        { localId: "hh_4", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "📦 Dry Storage Log",
      name: "Dry Storage Log",
      icon: "📦",
      fields: [
        { localId: "ds_0", label: "Storage area temperature (°C)", type: "temperature", unit: "°C", min: "10", max: "21", warn_msg: "Dry storage temperature out of range. Check ventilation and remove heat sources." },
        { localId: "ds_1", label: "All products at least 15cm off the floor?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Products must be stored off the floor. Raise all items to shelving immediately." },
        { localId: "ds_2", label: "All open products in sealed food-grade containers?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Open products must be sealed. Transfer to food-grade containers and label with date." },
        { localId: "ds_3", label: "No expired or damaged product on shelves?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Expired or damaged product found. Remove, discard, and document what was discarded." },
        { localId: "ds_4", label: "No evidence of moisture, pests, or contamination?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Contamination risk detected. Remove affected product, identify source, and notify manager." },
        { localId: "ds_5", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🧴 Sanitizer Station Log",
      name: "Sanitizer Station Log",
      icon: "🧴",
      fields: [
        { localId: "ss_0", label: "Sanitizer concentration (PPM)", type: "number", unit: "PPM", min: "200", max: "400", warn_msg: "PPM out of range (200–400 PPM required). Change solution immediately and retest before use." },
        { localId: "ss_1", label: "Test strip expiry date", type: "date", unit: "", min: "", max: "", warn_msg: "" },
        { localId: "ss_2", label: "Solution changed this shift?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Sanitizer solution must be changed each shift. Replace immediately and log new concentration." },
        { localId: "ss_3", label: "Bucket clean with no food debris?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Bucket contaminated. Empty, wash, rinse, and refill with fresh sanitizer solution." },
        { localId: "ss_4", label: "Cloths fully submerged in solution?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Cloths must remain submerged to maintain sanitizer contact. Submerge and retest solution strength." },
        { localId: "ss_5", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🍽️ Dishwasher Log",
      name: "Dishwasher Log",
      icon: "🍽️",
      fields: [
        { localId: "dw_0", label: "Wash cycle temperature (°C)", type: "temperature", unit: "°C", min: "60", max: "100", warn_msg: "Wash temp below 60°C. Do not use dishwasher. Wash manually until repaired and retest." },
        { localId: "dw_1", label: "Final rinse temperature (°C)", type: "temperature", unit: "°C", min: "82", max: "100", warn_msg: "Rinse temp below 82°C. Sanitization is not achieved. Remove dishwasher from service immediately." },
        { localId: "dw_2", label: "Wash arms and filters clean and unobstructed?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Blocked wash arms reduce cleaning effectiveness. Clean filters and arms before running next cycle." },
        { localId: "dw_3", label: "Detergent and rinse aid levels adequate?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Refill detergent or rinse aid before next cycle. Do not operate without correct chemical levels." },
        { localId: "dw_4", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🐀 Pest Control Log",
      name: "Pest Control Log",
      icon: "🐀",
      fields: [
        { localId: "pc_0", label: "Pest control log book up to date?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Log book must be current. Update records and notify manager immediately." },
        { localId: "pc_1", label: "Evidence of pests observed?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Pest activity detected. Isolate affected area, contact pest control contractor, and notify manager." },
        { localId: "pc_2", label: "Traps and bait stations checked?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Traps not checked. Complete inspection of all bait stations before end of shift." },
        { localId: "pc_3", label: "Physical barriers intact? (screens, kick plates, seals)", type: "boolean", unit: "", min: "", max: "", warn_msg: "Barrier damage found. Document location, apply temporary seal if possible, and schedule repair." },
        { localId: "pc_4", label: "Pest control contractor visit this period?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Contractor visit overdue. Contact pest control company to schedule service." },
        { localId: "pc_5", label: "Additional observations / notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🍺 Draft Beer System Log",
      name: "Draft Beer System Log",
      icon: "🍺",
      fields: [
        { localId: "db_0", label: "Beer line temperature (°C)", type: "temperature", unit: "°C", min: "2", max: "4", warn_msg: "Line temperature out of range (2–4°C required). Adjust cooler and recheck before service. Notify manager." },
        { localId: "db_1", label: "Lines cleaned within last 14 days?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Line cleaning overdue. Schedule cleaning before next service. Document date completed." },
        { localId: "db_2", label: "Last line clean date", type: "date", unit: "", min: "", max: "", warn_msg: "" },
        { localId: "db_3", label: "Tap heads and couplers clean and free of buildup?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Buildup on tap heads or couplers detected. Clean and sanitize immediately before service." },
        { localId: "db_4", label: "Drip trays cleaned and sanitized?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Drip trays must be cleaned and sanitized each shift. Complete before service begins." },
        { localId: "db_5", label: "Keg connections secure with no leaks?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Leak detected. Shut off affected keg line, notify manager, and do not serve until repaired." },
        { localId: "db_6", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🧊 Ice Bin Log",
      name: "Ice Bin Log",
      icon: "🧊",
      fields: [
        { localId: "ib_0", label: "Ice bin cleaned and sanitized today?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Ice bin must be cleaned and sanitized daily. Empty, clean, sanitize, and refill before service." },
        { localId: "ib_1", label: "Scoop stored outside ice bin (not submerged)?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Scoop must never be stored in ice. Remove immediately and store in a clean designated holder." },
        { localId: "ib_2", label: "No drink glasses used to scoop ice?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Glass scooping is prohibited — risk of glass contamination. Discard affected ice, replace bin, retrain staff." },
        { localId: "ib_3", label: "No evidence of contamination in ice bin?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Contamination detected. Discard all ice, clean and sanitize bin, refill with fresh ice." },
        { localId: "ib_4", label: "Ice scoop clean and in good condition?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Damaged or soiled scoop must be replaced immediately. Do not use until replaced." },
        { localId: "ib_5", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
    {
      label: "🥃 Bar Station Log",
      name: "Bar Station Log",
      icon: "🥃",
      fields: [
        { localId: "bs_0", label: "Garnish tray temperature (°C)", type: "temperature", unit: "°C", min: "0", max: "4", warn_msg: "Garnish temperature exceeds 4°C. Discard affected garnishes, replace with fresh product from cold storage immediately." },
        { localId: "bs_1", label: "Bar surface sanitizer concentration (PPM)", type: "number", unit: "PPM", min: "200", max: "400", warn_msg: "PPM out of range (200–400 PPM required). Replace solution and retest before continuing service." },
        { localId: "bs_2", label: "Test strip expiry date", type: "date", unit: "", min: "", max: "", warn_msg: "" },
        { localId: "bs_3", label: "Glass washer wash temperature (°C)", type: "temperature", unit: "°C", min: "60", max: "100", warn_msg: "Wash temp below 60°C. Take glass washer out of service. Hand wash and sanitize until repaired." },
        { localId: "bs_4", label: "Glass washer rinse temperature (°C)", type: "temperature", unit: "°C", min: "82", max: "100", warn_msg: "Rinse temp below 82°C. Sanitization not achieved. Remove from service immediately and notify manager." },
        { localId: "bs_5", label: "Clean glasses stored inverted on clean surface?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Glasses must be stored inverted to prevent contamination. Correct storage immediately." },
        { localId: "bs_6", label: "Garnishes covered when not in active service?", type: "boolean", unit: "", min: "", max: "", warn_msg: "Garnishes must be covered when not in use. Cover or return to cold storage immediately." },
        { localId: "bs_7", label: "Notes", type: "text", unit: "", min: "", max: "", warn_msg: "" },
      ],
    },
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
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setIsAdding(true);
                setFields([{
                  localId: Math.random().toString(36).substring(7),
                  label: "", type: "temperature", unit: "°C", min: "", max: "",
                  warn_msg: "Temperature is out of the safe range. Ensure immediate corrective action.",
                }]);
              }}
              className="h-[42px] bg-[#0F172A] text-white px-5 rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center shadow-sm w-fit"
            >
              <Plus size={16} className="mr-2" /> Add Station
            </button>
            <select
              defaultValue=""
              onChange={(e) => {
                const tpl = STATION_TEMPLATES.find(t => t.name === e.target.value);
                if (!tpl) return;
                setIsAdding(true);
                setFormData(prev => ({ ...prev, name: tpl.name, icon: tpl.icon }));
                setFields(tpl.fields.map(f => ({ ...f, localId: Math.random().toString(36).substring(7) })));
                e.target.value = "";
              }}
              className="h-[42px] bg-white border border-black/10 text-[#0d1c2d] px-4 rounded-xl text-[14px] font-medium hover:bg-[#f8f9ff] transition-colors shadow-sm cursor-pointer outline-none"
            >
              <option value="" disabled>Use Template…</option>
              {STATION_TEMPLATES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
          </div>
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
                  <td className="px-6 py-4 hidden md:table-cell">
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
