"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, AlertCircle, MapPin, Copy, Check, Pencil } from "lucide-react";

type Location = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  slug: string;
  timezone: string;
};

type Org = {
  id: string;
  name: string;
  slug: string;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special characters
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');          // trim leading/trailing hyphens
}

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", timezone: "America/Edmonton" });
  const [userRole, setUserRole] = useState<"owner" | "manager">("manager");

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");

      const { data: orgData } = await supabase.rpc("get_my_organization");
      if (!orgData?.exists) throw new Error("Organization not found.");

      setOrg({ id: orgData.id, name: orgData.name, slug: orgData.slug });
      setUserRole(orgData.role || "manager");

      const { data: locData, error: locErr } = await supabase
        .from("locations")
        .select("id, name, address, created_at, slug, timezone")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: true });

      if (locErr) throw locErr;
      setLocations((locData as Location[]) || []);
    } catch (err: any) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !org) return;

    setSubmitting(true);
    setError("");

    try {
      const slug = generateSlug(formData.name);

      const { error: insertError } = await supabase
        .from("locations")
        .insert({
          organization_id: org.id,
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          slug: slug,
          timezone: formData.timezone,
        });

      if (insertError) throw insertError;

      setIsAdding(false);
      setFormData({ name: "", address: "", timezone: "America/Edmonton" });
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to add location");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (loc: Location) => {
    if (!org) return;
    const url = `${window.location.origin}/${org.slug}/${loc.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = async (locationId: string) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setSaveError("Name cannot be empty");
      return;
    }

    const newSlug = generateSlug(trimmedName);
    if (!newSlug) {
      setSaveError("Name must contain at least one letter or number");
      return;
    }
    
    setSaveError(null);
    try {
      const { error: editError } = await supabase
        .from('locations')
        .update({ name: trimmedName, slug: newSlug })
        .eq('id', locationId); // Ensure it's scoped to location
        
      if (editError) throw editError;
      
      setLocations((prev) => 
        prev.map((loc) => 
          loc.id === locationId ? { ...loc, name: trimmedName, slug: newSlug } : loc
        )
      );
      setEditingLocationId(null);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update location name");
    }
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 sm:p-8 animate-in fade-in duration-500 text-[#0d1c2d]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight mb-1 text-[#0d1c2d]">Locations</h1>
          <p className="text-[#45464d] text-[15px]">Manage physical sites for your organization.</p>
        </div>
        {!isAdding && userRole === "owner" && (
          <button
            onClick={() => setIsAdding(true)}
            className="h-[42px] bg-[#0F172A] text-white px-5 rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center shadow-sm w-fit shrink-0"
          >
            <Plus size={16} className="mr-2" /> Add Location
          </button>
        )}
      </div>

      {error && (
        <div className="mb-8 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white border border-black/10 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold text-[#0d1c2d]">New Location</h2>
            <button onClick={() => setIsAdding(false)} className="text-[13px] text-[#45464d] hover:text-[#0d1c2d] font-medium">Cancel</button>
          </div>
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Location Name <span className="text-[#ba1a1a]">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Downtown Kitchen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Calgary"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors placeholder:text-[#ccc]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full h-[42px] border border-black/10 rounded-xl px-3 text-[14px] text-[#0d1c2d] outline-none focus:border-black/30 transition-colors bg-white"
                >
                  <optgroup label="Canada">
                    <option value="America/Vancouver">Pacific Time — Vancouver, BC</option>
                    <option value="America/Edmonton">Mountain Time — Calgary, Edmonton, AB</option>
                    <option value="America/Regina">Central Time (SK) — Regina, Saskatoon</option>
                    <option value="America/Winnipeg">Central Time — Winnipeg, MB</option>
                    <option value="America/Toronto">Eastern Time — Toronto, Ottawa, ON</option>
                    <option value="America/Halifax">Atlantic Time — Halifax, NS</option>
                    <option value="America/St_Johns">Newfoundland Time — St. John's, NL</option>
                  </optgroup>
                  <optgroup label="United States">
                    <option value="America/Los_Angeles">Pacific Time — LA, Seattle, Portland</option>
                    <option value="America/Denver">Mountain Time — Denver, Phoenix</option>
                    <option value="America/Chicago">Central Time — Chicago, Dallas, Houston</option>
                    <option value="America/New_York">Eastern Time — New York, Miami, Atlanta</option>
                    <option value="America/Anchorage">Alaska Time — Anchorage</option>
                    <option value="Pacific/Honolulu">Hawaii Time — Honolulu</option>
                  </optgroup>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="h-[42px] bg-[#0F172A] text-white rounded-xl text-[14px] font-medium tracking-[-0.2px] hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50 w-full md:w-auto md:px-8 mt-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Location"}
            </button>
          </form>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="bg-white border border-black/10 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center mt-6">
          <MapPin className="text-[#94a3b8] mb-3" size={32} />
          <h3 className="font-bold text-[16px] mb-1 text-[#0d1c2d]">No locations yet</h3>
          <p className="text-[14px] text-[#45464d]">Add your first location to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-[#cbd5e1]/50">
                  <th className="font-black text-[10px] text-[#45464d] uppercase tracking-widest px-6 py-4">LOCATION</th>
                  <th className="font-black text-[10px] text-[#45464d] uppercase tracking-widest px-6 py-4">ADDRESS</th>
                  <th className="font-black text-[10px] text-[#45464d] uppercase tracking-widest px-6 py-4">KIOSK URL</th>
                  <th className="font-black text-[10px] text-[#45464d] uppercase tracking-widest px-6 py-4 whitespace-nowrap">ADDED</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {locations.map((loc) => (
                  <tr key={loc.id} className="border-b border-[#cbd5e1]/50 last:border-0 hover:bg-[#eef4ff] transition-colors">
                    <td className="px-6 py-4 text-[#0d1c2d] font-bold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] text-[#94a3b8] flex items-center justify-center shrink-0">
                          <MapPin size={16} />
                        </div>
                        {editingLocationId === loc.id ? (                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-[32px] border border-black/20 rounded-md px-2 text-[14px] text-[#0d1c2d] outline-none focus:border-black/50"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(loc.id)}
                              className="h-[32px] bg-[#0F172A] text-white px-3 rounded-md text-[13px] font-medium hover:bg-black transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingLocationId(null);
                                setSaveError(null);
                              }}
                              className="h-[32px] text-[#45464d] hover:text-[#0d1c2d] px-2 rounded-md text-[13px] font-medium"
                            >
                              Cancel
                            </button>
                            {saveError && <span className="text-[12px] text-[#ba1a1a]">{saveError}</span>}
                          </div>
                        ) : (
                          <>
                            {loc.name}
                            {userRole === "owner" && (
                              <button
                                onClick={() => {
                                  setEditingLocationId(loc.id);
                                  setEditingName(loc.name);
                                  setSaveError(null);
                                }}
                                className="text-[#94a3b8] hover:text-[#0d1c2d] transition-colors p-1"
                                title="Edit location name"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#45464d]">
                      {loc.address || "—"}
                    </td>
                    <td className="px-6 py-4 text-[#45464d]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/${org?.slug}/${loc.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-lg px-3 py-1.5 font-mono text-[12px] text-[#45464d] truncate max-w-[200px] xl:max-w-[250px] hover:bg-[#eef4ff] hover:border-[#0F172A]/20 hover:text-[#0F172A] transition-colors"
                        >
                          /{org?.slug}/{loc.slug}
                        </a>
                        <button
                          onClick={() => handleCopy(loc)}
                          className="flex items-center gap-1.5 text-[#45464d] hover:text-[#0d1c2d] transition-colors bg-[#f1f5f9] px-2 py-1.5 rounded-md border border-[#cbd5e1]"
                          title="Copy full URL"
                        >
                          {copiedId === loc.id ? (
                            <>
                              <Check size={14} className="text-[#22C55E]" />
                              <span className="text-[11px] font-medium text-[#22C55E]">Copied!</span>
                            </>
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#45464d] whitespace-nowrap">
                      {new Date(loc.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
