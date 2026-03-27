"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, AlertCircle, Clock, Trash2, CalendarClock, MapPin } from "lucide-react";

type Location = { id: string; name: string };
type Station = { id: string; name: string };
type Schedule = {
  id: string;
  window_start: string;
  window_end: string;
  grace_period_minutes: number;
  station: Station;
};

export default function ScheduleManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<string>("");
  
  const [stations, setStations] = useState<Station[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newStationId, setNewStationId] = useState("");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [newGrace, setNewGrace] = useState("15");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("Not authenticated");

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", userData.user.id)
          .maybeSingle();

        if (orgError) throw orgError;
        if (!orgData) {
          router.push("/onboard/finish-setup");
          return;
        }

        const { data: locData } = await supabase
          .from("locations")
          .select("id, name")
          .eq("organization_id", orgData.id);
        
        setLocations(locData || []);
        if (locData && locData.length > 0) {
          setActiveLocation(locData[0].id);
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
    if (!activeLocation) return;
    fetchData();
  }, [activeLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: stData } = await supabase
        .from("stations")
        .select("id, name")
        .eq("location_id", activeLocation);
      setStations(stData || []);

      if (stData && stData.length > 0) {
        setNewStationId(stData[0].id);
      }

      const { data: scData } = await supabase
        .from("schedules")
        .select(`
          id, window_start, window_end, grace_period_minutes,
          station:stations!inner(id, name, location_id)
        `)
        .eq("stations.location_id", activeLocation)
        .order("window_start");

      // Validating constraints natively handled by Postgres JOINS
      setSchedules((scData as any[]) || []);
    } catch (err: any) {
      setError("Failed to fetch schedules: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newStationId || !newStart || !newEnd) return;
    
    // Simple validation
    if (newStart >= newEnd) {
       setError("Start time must be strictly before End time.");
       return;
    }

    setIsSaving(true);
    setError("");

    try {
      const graceInt = parseInt(newGrace) || 15;
      const { error: insertErr } = await supabase
        .from("schedules")
        .insert([{
          station_id: newStationId,
          window_start: newStart,
          window_end: newEnd,
          grace_period_minutes: graceInt
        }]);

      if (insertErr) throw insertErr;
      
      setIsAdding(false);
      fetchData(); // Refresh list to get new IDs
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSchedules(prev => prev.filter(s => s.id !== id));
      await supabase.from("schedules").delete().eq("id", id);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Utility to parse PG TIME back to human readable string removing seconds
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    return `${hours}:${m} ${ampm}`;
  };

  if (loading && stations.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto p-4 sm:p-8 text-[#111110] animate-in fade-in duration-500 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight mb-1 flex items-center gap-2">
            <CalendarClock className="text-[#245D91]" /> Compliance Schedules
          </h1>
          <p className="text-[#6b6b67] text-[15px]">Configure operational time windows for automated log checks.</p>
        </div>
        
        {locations.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-xl p-1.5 shadow-sm w-fit">
            <MapPin size={16} className="text-[#888] ml-2" />
            <select
              value={activeLocation}
              onChange={(e) => setActiveLocation(e.target.value)}
              className="bg-transparent text-[14px] font-medium outline-none pr-3 cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Adding Module */}
      {isAdding ? (
        <div className="bg-white rounded-2xl border border-black/10 p-6 mb-8 shadow-sm">
          <h2 className="text-[16px] font-bold mb-5 flex items-center gap-2">
            <Plus size={18} /> New Schedule Binding
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">Target Station</label>
              <select 
                value={newStationId}
                onChange={e => setNewStationId(e.target.value)}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] bg-[#f8f7f4] outline-none"
              >
                {stations.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">Window Start</label>
              <input 
                type="time" 
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] bg-[#f8f7f4] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">Window End</label>
              <input 
                type="time" 
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] bg-[#f8f7f4] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#888] uppercase tracking-wider mb-2">Grace Period (Mins)</label>
              <input 
                type="number" 
                min="0"
                value={newGrace}
                onChange={e => setNewGrace(e.target.value)}
                className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] bg-[#f8f7f4] outline-none font-mono"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={handleAddSchedule}
               disabled={isSaving}
               className="h-[42px] bg-[#111] text-white px-6 rounded-xl font-medium hover:bg-black transition-colors flex items-center gap-2"
             >
               {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save Schedule Framework"}
             </button>
             <button 
               onClick={() => { setIsAdding(false); setError(""); }}
               className="h-[42px] bg-white border border-black/10 text-[#111] px-6 rounded-xl font-medium hover:bg-[#f8f7f4] transition-colors"
             >
               Cancel
             </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
           <button 
             onClick={() => setIsAdding(true)}
             disabled={stations.length === 0}
             className="h-[42px] bg-[#111] text-white px-5 rounded-xl text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
           >
             <Plus size={16} className="mr-2" /> Add New Schedule Matrix
           </button>
           {stations.length === 0 && (
             <p className="text-[12px] text-[#E24B4A] mt-2 font-medium">You need to create Stations before binding schedules.</p>
           )}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
         <div className="p-5 border-b border-black/10 bg-[#fcfbf9]">
            <h2 className="text-[16px] font-bold tracking-tight flex items-center gap-2">
              <Clock size={18} className="text-[#888]" /> Active Execution Thresholds
            </h2>
         </div>
         
         {schedules.length > 0 ? (
           <div className="divide-y divide-black/5">
             {schedules.map(sc => (
               <div key={sc.id} className="p-5 flex items-center justify-between hover:bg-[#f8f7f4] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-[#EAF3DE] text-[#3B6D11] border border-[#97C459] flex items-center justify-center shrink-0">
                       <Clock size={18} />
                     </div>
                     <div>
                       <div className="font-bold text-[15px]">{sc.station.name}</div>
                       <div className="text-[13px] text-[#6b6b67] font-mono mt-0.5 font-medium">
                         {formatTime(sc.window_start)} - {formatTime(sc.window_end)} 
                         <span className="text-[#a8a8a4] ml-2 px-1.5 py-0.5 bg-[#f8f7f4] rounded text-[11px] uppercase tracking-wide">+{sc.grace_period_minutes}m grace</span>
                       </div>
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(sc.id)}
                    className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-[#E24B4A] hover:bg-[#FFF4F4] rounded-lg transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
             ))}
           </div>
         ) : (
           <div className="p-12 text-center text-[#888]">
             <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
             <p className="text-[14px] font-medium">No master schedules natively mapped to this location.</p>
             <p className="text-[13px] mt-1">Configure intervals to strictly ensure staff enforce Kiosk activity.</p>
           </div>
         )}
      </div>

    </div>
  );
}
