import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AuditShield — Info Packet | Digital Food Safety Compliance",
  description:
    "Everything you need to know about AuditShield. Features, pricing, how it works, and who it's built for.",
};

export default function InfoPage() {
  return (
    <div className="w-full min-h-screen">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-16">
          <span className="text-xl font-extrabold tracking-tighter text-slate-900">
            AuditShield
          </span>
          <div className="hidden md:flex items-center">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                arrow_back
              </span>
              Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 px-4 py-2 rounded-xl"
            >
              Login
            </Link>
            <a
              href="mailto:systemswithvarun@gmail.com?subject=AuditShield Access Request"
              className="bg-[#0F172A] text-white px-5 py-2.5 rounded-xl font-extrabold text-sm hover:opacity-90 transition-all active:scale-95"
            >
              Request Access
            </a>
          </div>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <section
        className="w-full pt-48 pb-24 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #020617 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-[#4AE176]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#4AE176]/10 border border-[#4AE176]/20 text-[#4AE176] text-[11px] font-black uppercase tracking-[0.25em] mb-8">
            INFO PACKET
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white mb-4">
            Everything you need to know about AuditShield.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
            Features, pricing, how it works, and who it&apos;s for.
          </p>
        </div>
      </section>

      {/* ── 1. WHAT IS AUDITSHIELD ── */}
      <section className="w-full bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0F172A] mb-4">
            WHAT IS AUDITSHIELD?
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-6">
            A tamper-proof compliance system built for commercial kitchens.
          </h2>
          <div className="max-w-3xl space-y-4">
            <p className="text-[#45464d] text-base md:text-lg font-medium leading-relaxed">
              AuditShield is a digital food safety compliance system built for
              commercial kitchens in Alberta. It replaces paper-based
              temperature logs with a tamper-proof, staff-authenticated digital
              record that holds up to Health Authority scrutiny.
            </p>
            <p className="text-[#45464d] text-base md:text-lg font-medium leading-relaxed">
              Every log entry is tied to a specific staff member, timestamped
              by the server, and locked from editing. When an out-of-range
              reading occurs, the system forces a corrective action before
              staff can continue. Reports are available as PDF in seconds —
              not minutes spent digging through binders.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. THE PROBLEM ── */}
      <section className="w-full bg-[#eef4ff] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#ba1a1a] mb-4">
            THE PROBLEM
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-3">
            The problem with paper logs
          </h2>
          <p className="text-[#45464d] font-medium mb-10">
            Paper-based compliance creates risk, not safety.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              "Logs get filled out late — or not at all",
              "Out-of-range readings ignored or erased",
              "No way to verify who actually signed a log",
              "Scrambling for binders during an inspection",
              "No alert when a temperature check is missed",
              "Paper can be backdated, altered, or lost",
            ].map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-[#c6c6cd]/20 shadow-sm"
              >
                <span
                  className="material-symbols-outlined text-[#ba1a1a] shrink-0 mt-0.5"
                  style={{ fontSize: "20px" }}
                >
                  cancel
                </span>
                <span className="text-[#0d1c2d] font-medium leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-[#0d1c2d] rounded-2xl p-8 border-l-4 border-[#f97316]">
            <p className="text-[#94a3b8] text-base font-medium leading-relaxed">
              When Health Authority shows up, a binder of hand-written logs
              isn&apos;t a defence — it&apos;s a liability. AuditShield creates
              a record that&apos;s legally defensible from the moment a log is
              submitted.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. CORE FEATURES ── */}
      <section className="w-full bg-[#f8f9ff] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0F172A] mb-4">
            CORE CAPABILITIES
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-3">
            Core features
          </h2>
          <p className="text-[#45464d] font-medium mb-10">
            Six integrated capabilities that work together to protect your
            operation.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "schedule",
                title: "Digital Log Schedules",
                desc: "Daily check windows auto-generated. Every pending, completed, and missed check tracked in real time.",
              },
              {
                icon: "pin",
                title: "PIN-Based Staff Identity",
                desc: "4-digit PIN on a tablet kiosk. Every log tied to a specific staff member. No shared logins.",
              },
              {
                icon: "assignment_late",
                title: "Forced Corrective Actions",
                desc: "Out-of-range reading? Hard lock. Staff cannot proceed until a corrective action is documented.",
              },
              {
                icon: "shield",
                title: "Immutable Audit Trail",
                desc: "Once a log is submitted, it cannot be edited or backdated. Server-generated timestamps ensure total integrity.",
              },
              {
                icon: "description",
                title: "Instant Audit Reports",
                desc: "PDF export for any date range in seconds. Breach rows highlighted. Ready for Health Authority.",
              },
              {
                icon: "bar_chart",
                title: "Real-Time Dashboard",
                desc: "Live compliance status for managers. Breach alerts surface immediately — not at end of day.",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="group bg-white p-6 rounded-2xl border border-[#c6c6cd]/10 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#eef4ff] text-[#0F172A] group-hover:bg-[#0F172A] group-hover:text-white group-hover:-translate-y-1 transition-all mb-4">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "24px" }}
                  >
                    {feat.icon}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-[#0d1c2d] mb-2">
                  {feat.title}
                </h3>
                <p className="text-[#45464d] font-medium leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section className="w-full bg-[#eef4ff] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0F172A] mb-4">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-10">
            How it works — a typical day
          </h2>
          <div className="flex flex-col max-w-3xl">
            {[
              {
                step: "1",
                time: "Midnight",
                desc: "System auto-generates the day's check schedule based on your stations and time windows.",
              },
              {
                step: "2",
                time: "Staff logs in",
                desc: "Kitchen staff enter their 4-digit PIN on the tablet kiosk. Authenticated in seconds.",
              },
              {
                step: "3",
                time: "Reading entered",
                desc: "Staff selects station, enters reading. System validates against thresholds in real time.",
              },
              {
                step: "4",
                time: "Breach? Hard lock.",
                desc: "Out-of-range reading triggers a mandatory corrective action — staff can't skip it.",
              },
              {
                step: "5",
                time: "Manager reviews",
                desc: "Dashboard shows completed, pending, and missed checks. Breach alerts are instant.",
              },
            ].map((s, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-[#22C55E] rounded-full text-[#002109] font-black text-xl flex items-center justify-center shrink-0 z-10">
                    {s.step}
                  </div>
                  {i < 4 && (
                    <div className="w-0.5 flex-1 bg-[#22C55E]/30 my-1" />
                  )}
                </div>
                <div className="pb-7 pt-3">
                  <p className="font-black text-[#0d1c2d] text-lg tracking-tight">
                    {s.time}
                  </p>
                  <p className="text-[#45464d] font-medium leading-relaxed mt-1">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 w-full bg-[#22C55E] rounded-2xl px-8 py-5 text-center max-w-3xl">
            <p className="text-[#002109] font-black text-base">
              Health inspector arrives? Export a PDF audit report for any date
              range in under 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. WHY AUDITSHIELD ── */}
      <section
        className="w-full py-20 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #020617 100%)" }}
      >
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#4AE176]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#4AE176] mb-4">
            WHY AUDITSHIELD
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white mb-3">
            Built for defensibility
          </h2>
          <p className="text-slate-400 font-medium mb-10">
            Four guarantees your paper binder can never make.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: "history",
                title: "Can't be backdated",
                desc: "Timestamps are set by the server, not the person entering data. There is no way to log a reading for yesterday.",
              },
              {
                icon: "verified",
                title: "Every log has a name on it",
                desc: "Staff authenticate with a unique PIN before every entry. There is no anonymous path to submit a log.",
              },
              {
                icon: "lock",
                title: "Records can't be changed",
                desc: "Once a log is saved, it's locked. No edits, no deletions. What was entered is what the inspector sees.",
              },
              {
                icon: "update",
                title: "History survives staff turnover",
                desc: "Each log captures the staff name, station, and config at time of entry. Deleting a staff member doesn't erase their records.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors flex gap-5"
              >
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-[#4AE176]"
                    style={{ fontSize: "24px" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PRICING ── */}
      <section className="w-full bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0F172A] mb-4">
            PRICING
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-3">
            Pricing
          </h2>
          <p className="text-[#45464d] font-medium mb-10">
            No per-user fees. No setup costs. Early adopter pricing available
            — contact us for details.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 items-center">
            {/* Starter */}
            <div className="bg-white p-7 rounded-2xl border border-slate-300 shadow-md flex flex-col">
              <h3 className="font-black text-[#0d1c2d] text-xl mb-1">
                Starter
              </h3>
              <p className="text-[#45464d] text-sm font-medium mb-4">
                Single location, smaller team.
              </p>
              <div className="text-4xl font-black tracking-tighter text-[#0d1c2d] mb-5">
                $79
                <span className="text-base font-medium text-[#64748b]">
                  /mo
                </span>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {[
                  "1 location",
                  "Up to 10 staff",
                  "Unlimited log entries",
                  "PDF & CSV export",
                  "Compliance dashboard",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm font-medium text-[#45464d]"
                  >
                    <span
                      className="material-symbols-outlined text-[#22C55E]"
                      style={{ fontSize: "16px" }}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:systemswithvarun@gmail.com?subject=AuditShield Access Request — Starter"
                className="w-full flex items-center justify-center bg-[#0F172A] text-white px-6 py-3 rounded-xl font-extrabold hover:opacity-90 transition-all active:scale-95 text-sm"
              >
                Request Access
              </a>
            </div>

            {/* Professional */}
            <div className="bg-[#0F172A] p-7 rounded-2xl shadow-2xl flex flex-col relative transform scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-[#4AE176] text-[#002109] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wide">
                  RECOMMENDED
                </span>
              </div>
              <h3 className="font-black text-white text-xl mb-1">
                Professional
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-4">
                Growing operation, more stations.
              </p>
              <div className="text-4xl font-black tracking-tighter text-white mb-5">
                $199
                <span className="text-base font-medium text-slate-400">
                  /mo
                </span>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {[
                  "Up to 5 locations",
                  "Unlimited staff & stations",
                  "Advanced reporting",
                  "Custom SOP fields",
                  "Priority support",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm font-medium text-slate-400"
                  >
                    <span
                      className="material-symbols-outlined text-[#22C55E]"
                      style={{ fontSize: "16px" }}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:systemswithvarun@gmail.com?subject=AuditShield Access Request — Professional"
                className="w-full flex items-center justify-center bg-white text-[#0F172A] px-6 py-3 rounded-xl font-extrabold hover:bg-slate-100 transition-all active:scale-95 text-sm"
              >
                Request Access
              </a>
            </div>

            {/* Multi-Site */}
            <div className="bg-white p-7 rounded-2xl border border-slate-300 shadow-md flex flex-col">
              <h3 className="font-black text-[#0d1c2d] text-xl mb-1">
                Multi-Site
              </h3>
              <p className="text-[#45464d] text-sm font-medium mb-4">
                Chains, franchises, institutional — per location pricing.
              </p>
              <div className="text-4xl font-black tracking-tighter text-[#0d1c2d] mb-5">
                $399
                <span className="text-base font-medium text-[#64748b]">
                  /location/mo
                </span>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {[
                  "Unlimited locations",
                  "Unlimited staff",
                  "Cross-location dashboard",
                  "Per-location reports",
                  "Dedicated onboarding",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm font-medium text-[#45464d]"
                  >
                    <span
                      className="material-symbols-outlined text-[#22C55E]"
                      style={{ fontSize: "16px" }}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:systemswithvarun@gmail.com?subject=AuditShield Access Request — Multi-Site"
                className="w-full flex items-center justify-center bg-[#0F172A] text-white px-6 py-3 rounded-xl font-extrabold hover:opacity-90 transition-all active:scale-95 text-sm"
              >
                Request Access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. WHO IT'S FOR ── */}
      <section className="w-full bg-[#f8f9ff] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0F172A] mb-4">
            WHO IT&apos;S FOR
          </p>
          <h2 className="text-3xl font-black tracking-tight text-[#0d1c2d] mb-10">
            Who it&apos;s for
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "restaurant",
                title: "Restaurants & Bars",
                desc: "Single-location owners in Alberta. Replace the paper binder. Pass inspections with confidence.",
              },
              {
                icon: "local_hospital",
                title: "Seniors Homes & LTC",
                desc: "Regulated facilities where food safety incidents carry real licensing consequences.",
              },
              {
                icon: "hotel",
                title: "Hotel & Institutional",
                desc: "Multi-station kitchens with shift changeovers — exactly where compliance gaps form.",
              },
              {
                icon: "storefront",
                title: "Small Chains",
                desc: "2-5 locations. One dashboard, standardized SOPs, no separate spreadsheets per site.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-[#c6c6cd]/10 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#eef4ff] rounded-full flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-[#0F172A]"
                    style={{ fontSize: "22px" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-[#0d1c2d] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#45464d] font-medium leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA ── */}
      <section
        className="w-full py-20 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #020617 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-[#4AE176]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            See it working.
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl mx-auto">
            The demo takes 20 minutes. No setup, no credit card. Just the
            product running on your screen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="mailto:systemswithvarun@gmail.com?subject=AuditShield Access Request"
              className="inline-flex items-center justify-center gap-2 bg-[#0F172A] text-white px-10 py-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95"
            >
              Request Access
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_forward</span>
            </a>
            <a
              href="mailto:systemswithvarun@gmail.com?subject=AuditShield Demo Request"
              className="inline-flex items-center justify-center bg-white/5 text-white border border-white/10 backdrop-blur-md px-10 py-5 rounded-2xl font-extrabold text-lg hover:bg-white/10 transition-all"
            >
              Book a Demo Call
            </a>
          </div>
          <p className="text-[#64748b] text-sm font-medium">
            Or email{" "}
            <a
              href="mailto:systemswithvarun@gmail.com"
              className="text-[#4AE176] hover:underline"
            >
              systemswithvarun@gmail.com
            </a>{" "}
            directly
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                arrow_back
              </span>
              Back to homepage
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-slate-50 border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <p className="text-2xl font-black tracking-tighter text-[#0d1c2d] mb-2">
              AuditShield
            </p>
            <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
              © 2026 MSDV Inc. All rights reserved.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#0d1c2d] mb-3">
                Legal
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-sm font-medium text-[#64748b] hover:text-[#0d1c2d] transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-[#64748b] hover:text-[#0d1c2d] transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#0d1c2d] mb-3">
                Contact
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:systemswithvarun@gmail.com"
                  className="text-sm font-medium text-[#64748b] hover:text-[#0d1c2d] transition-colors"
                >
                  systemswithvarun@gmail.com
                </a>
                <p className="text-sm font-medium text-[#64748b]">
                  Alberta, Canada
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
