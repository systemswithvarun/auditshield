"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Users, Loader2, LogOut, MapPin, Thermometer, FileSpreadsheet, CalendarClock, ShieldCheck, UsersRound } from "lucide-react";
type Location = { id: string; name: string; slug: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [orgSlug, setOrgSlug] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [showKioskPicker, setShowKioskPicker] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "manager">("manager");

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
      } else {
        const { data: orgData } = await supabase.rpc('get_my_organization');

        if (!orgData?.exists) {
          router.replace('/onboard');
          return;
        }

        setOrgSlug(orgData.slug || "");
        setUserRole(orgData.role || "manager");

        const { data: locData } = await supabase
          .from('locations')
          .select('id, name, slug')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: true });

        setLocations(locData || []);
        if (locData && locData.length > 0) {
          setLocSlug(locData[0].slug);
        }

        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/locations", label: "Locations", icon: MapPin },
    { href: "/admin/schedules", label: "Schedules", icon: CalendarClock },
    { href: "/admin/reports", label: "Audit Reports", icon: FileSpreadsheet },
    { href: "/admin/staff-accountability", label: "Accountability", icon: ShieldCheck },
    { href: "/admin/stations", label: "Stations", icon: Thermometer },
    { href: "/admin/staff", label: "Staff", icon: Users },
    { href: "/admin/team", label: "Team", icon: UsersRound },
  ];

  return (
    <div className="flex md:flex-row flex-col min-h-screen bg-[#f8f9ff]">
      {/* Sidebar */}
      <aside className="w-full md:w-[240px] bg-white border-b md:border-b-0 md:border-r border-[#c6c6cd]/20 flex flex-col shrink-0 print:hidden relative z-10">
        <div className="p-4 md:p-6 border-b border-[#c6c6cd]/20 flex items-center justify-between md:block">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tighter text-[#0F172A]">AuditShield</span>
          </div>
          <button onClick={handleLogout} className="md:hidden text-[#45464d] p-2">
            <LogOut size={20} />
          </button>
        </div>

        <nav className="p-2 md:p-4 flex md:flex-col flex-row gap-1 overflow-x-auto md:flex-1 md:overflow-visible">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-[12px] md:text-[14px] font-medium transition-colors min-w-[120px] justify-center md:justify-start ${isActive
                  ? "bg-[#0F172A] text-white font-semibold"
                  : "text-[#374151] hover:bg-[#e8edf5] hover:text-[#0F172A]"
                  }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-[#4B5563]"} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block p-4 border-t border-[#c6c6cd]/20 mt-auto space-y-2">
          {orgSlug && locations.length > 0 && (
            <div className="relative z-50">
              {locations.length === 1 ? (
                // Single location — open directly
                <Link
                  href={`/${orgSlug}/${locations[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium text-white bg-[#0F172A] hover:opacity-90 transition-all text-left"
                >
                  <div className="w-4 h-4 border-[2px] border-white rounded-[3px] shrink-0" />
                  Open Kiosk
                </Link>
              ) : (
                // Multiple locations — show picker
                <>
                  <button
                    onClick={() => setShowKioskPicker(!showKioskPicker)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium text-white bg-[#0F172A] hover:opacity-90 transition-all text-left"
                  >
                    <div className="w-4 h-4 border-[2px] border-white rounded-[3px] shrink-0" />
                    Open Kiosk
                    <span className="ml-auto text-white/60 text-xs">▾</span>
                  </button>
                  {showKioskPicker && (
                    <div className="absolute bottom-full mb-1 left-0 w-full bg-white border border-[#c6c6cd]/40 rounded-xl shadow-lg overflow-hidden z-20">
                      {locations.map((loc) => (
                        <a
                          key={loc.id}
                          href={`/${orgSlug}/${loc.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowKioskPicker(false)}
                          className="block px-3 py-2.5 text-[13px] text-[#0F172A] hover:bg-[#f1f5f9] transition-colors"
                        >
                          {loc.name}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium text-[#45464d] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors text-left group"
          >
            <LogOut size={18} className="text-[#94a3b8] group-hover:text-[#ba1a1a] transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative z-0">
        {children}
      </main>
    </div>
  );
}
