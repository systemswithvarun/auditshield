"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Thermometer, AlertCircle, MapPin } from "lucide-react";

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
    minTemp: "",
    maxTemp: "",
  });
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

    setSubmitting(true);
    
    const minVal = formData.minTemp ? parseFloat(formData.minTemp) : null;
    const maxVal = formData.maxTemp ? parseFloat(formData.maxTemp) : null;

    const sopConfig = [
      {
        id: "temp1",
        label: "Temperature reading",
        unit: "°C",
        type: "temp",
        min: minVal,
        max: maxVal,
        warnMsg: "Temperature is out of the safe range. Ensure immediate corrective action."
      }
    ];

    try {
      const { error: insertError } = await supabase
        .from("stations")
        .insert({
          location_id: formData.locationId,
          name: formData.name,
          icon: "❄", // A generic icon representing temperature
          sop_config: sopConfig,
        });

      if (insertError) throw insertError;

      setIsAdding(false);
      setFormData({ 
        locationId: locations.length === 1 ? locations[0].id : "", 
        name: "", 
        minTemp: "", 
        maxTemp: "" 
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add station");
    } finally {
      setSubmitting(false);
    }
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
            onClick={() => setIsAdding(true)}
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
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
              <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Min Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="No min"
                value={formData.minTemp}
                onChange={(e) => setFormData({ ...formData, minTemp: e.target.value })}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc]"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Max Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="4.0"
                value={formData.maxTemp}
                onChange={(e) => setFormData({ ...formData, maxTemp: e.target.value })}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc]"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[42px] bg-[#0F172A] text-white rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save"}
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
                <th className="font-bold text-[11px] text-[#94a3b8] uppercase tracking-wider px-6 py-4">Targets</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {stations.map((stat) => {
                const config = stat.sop_config && stat.sop_config.length > 0 ? stat.sop_config[0] : null;
                const min = config?.min !== null && config?.min !== undefined ? config.min : "—";
                const max = config?.max !== null && config?.max !== undefined ? config.max : "—";

                return (
                  <tr key={stat.id} className="border-b border-black/5 last:border-0 hover:bg-[#eef4ff] transition-colors">
                    <td className="px-6 py-4 text-[#0d1c2d] font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] text-[#245D91] flex items-center justify-center text-[16px]">
                        {stat.icon}
                      </div>
                      {stat.name}
                    </td>
                    <td className="px-6 py-4 text-[#45464d]">
                      {stat.location?.name}
                    </td>
                    <td className="px-6 py-4 text-[#45464d]">
                      {config ? (
                         <div className="flex items-center gap-2">
                            <span className="text-[12px] bg-[#f5f4f0] px-2 py-0.5 rounded font-mono">Min: {min}</span>
                            <span className="text-[12px] bg-[#f5f4f0] px-2 py-0.5 rounded font-mono">Max: {max}</span>
                         </div>
                      ) : (
                        "No threshold set"
                      )}
                    </td>
                  </tr>
                );
              })}
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
