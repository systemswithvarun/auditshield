"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Copy, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({}); // loc.id -> isUpToDate
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("Not authenticated");
        
        const ownerId = userData.user.id;

        // Fetch Org
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", ownerId)
          .single();
          
        if (orgError || !orgData) {
          throw new Error("Failed to load organization. Please ensure your account has an assigned organization.");
        }
        setOrg(orgData);

        // Fetch Locations
        const { data: locData, error: locError } = await supabase
          .from("locations")
          .select("*")
          .eq("organization_id", orgData.id);
          
        if (locError) throw new Error("Failed to load locations.");
        setLocations(locData || []);

        // Fetch System Status
        // Simplified check: Are there any recent logs with breaches? 
        const statuses: Record<string, boolean> = {};
        for (const loc of (locData || [])) {
          // If the nested routing doesn't exist, we fallback
          const { data: recentLogs } = await supabase
            .from("logs")
            .select("is_breach, created_at, stations!inner(location_id)")
            .eq("stations.location_id", loc.id)
            .order("created_at", { ascending: false })
            .limit(10);
            
          // If no logs, green (new setup). If logs exist and recent one has breach, red.
          const hasRecentBreach = recentLogs?.some((l: any) => l.is_breach);
          statuses[loc.id] = !hasRecentBreach; 
        }
        setStatusMap(statuses);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-black/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[#FCEBEB] border border-[#F09595] text-[#791F1F] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-10 text-[#111110] animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-[28px] font-medium tracking-tight mb-2">Welcome back, {org?.name}</h1>
        <p className="text-[#6b6b67] text-[15px]">Manage your locations, staff, and system compliance from this dashboard.</p>
      </div>

      <div className="mb-6">
        <h2 className="text-[18px] font-bold tracking-tight mb-4 text-[#111110]">Locations & System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const isUpToDate = statusMap[loc.id];
            const kioskUrl = typeof window !== 'undefined' ? `${window.location.origin}/${org?.slug}/${loc.slug}` : `/${org?.slug}/${loc.slug}`;

            return (
              <div key={loc.id} className="bg-white rounded-2xl p-6 border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col hover:border-black/20 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-[17px] tracking-tight">{loc.name}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      {isUpToDate ? (
                        <div className="flex items-center gap-1.5 text-[#3B6D11] bg-[#EAF3DE] border border-[#97C459] px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wide uppercase">
                          <CheckCircle size={13} strokeWidth={2.5} />
                          <span>Logs up to date</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#791F1F] bg-[#FCEBEB] border border-[#F09595] px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wide uppercase">
                          <AlertCircle size={13} strokeWidth={2.5} />
                          <span>Tasks overdue</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t border-black/5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#888] mb-2">Kiosk Access</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={kioskUrl} 
                      className="flex-1 bg-[#f8f7f4] border border-black/10 rounded-lg px-3 py-2 text-[13px] text-[#6b6b67] outline-none font-mono"
                    />
                    <button 
                      onClick={() => copyToClipboard(kioskUrl)}
                      className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-black/10 hover:bg-[#f5f4f0] rounded-lg text-[#6b6b67] transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                    </button>
                    <Link 
                      href={`/${org?.slug}/${loc.slug}`} 
                      target="_blank"
                      className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#111] hover:bg-black text-white rounded-lg transition-colors shadow-sm"
                      title="Open Kiosk"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {locations.length === 0 && (
            <div className="col-span-full bg-white border border-black/10 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-[#f8f7f4] rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-[#888]" size={24} />
              </div>
              <h3 className="font-bold text-[16px] mb-1">No Locations Found</h3>
              <p className="text-[14px] text-[#6b6b67] max-w-sm">You haven't added any locations to your organization yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
