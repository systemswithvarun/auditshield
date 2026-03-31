import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Users,
  AlertCircle,
  FileText,
  Lock,
  LayoutDashboard,
  Check,
  X,
  User,
  Clock,
  Database,
  History,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AuditShield — Digital Food Safety Compliance for Commercial Kitchens",
  description:
    "Replace paper food safety logs with a tamper-proof digital system. Real-time compliance tracking, forced corrective actions, and audit-ready reports. Built for Alberta restaurants and commercial kitchens.",
  openGraph: {
    title: "AuditShield — Digital Food Safety Compliance",
    description:
      "Stop trusting paper logs. AuditShield gives you a defensible audit trail your health inspector can't argue with.",
    url: "https://auditshield-three.vercel.app",
  },
};

const features = [
  {
    icon: <Calendar size={22} />,
    title: "Digital Log Schedules",
    desc: "Daily check windows auto-generated. Every pending, completed, and missed check tracked in real time.",
  },
  {
    icon: <Users size={22} />,
    title: "PIN-Based Staff Identity",
    desc: "4-digit PIN on a tablet kiosk. Every log tied to a specific staff member. No shared logins.",
  },
  {
    icon: <AlertCircle size={22} />,
    title: "Forced Corrective Actions",
    desc: "Out-of-range reading? Hard lock. Staff cannot proceed until a corrective action is documented.",
  },
  {
    icon: <FileText size={22} />,
    title: "Instant Audit Reports",
    desc: "PDF export for any date range in seconds. Breach rows highlighted. Ready for Health Authority.",
  },
  {
    icon: <Lock size={22} />,
    title: "Immutable Audit Trail",
    desc: "Logs cannot be edited after submission. Server-generated timestamps. Backdating is impossible.",
  },
  {
    icon: <LayoutDashboard size={22} />,
    title: "Real-Time Dashboard",
    desc: "Live compliance status for managers. Breach alerts surface immediately — not at end of day.",
  },
];

const howItWorks = [
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
];

const whyItems = [
  {
    icon: <Clock size={20} />,
    title: "Can't be backdated",
    desc: "Timestamps are set by the server, not the person entering data. There is no way to log a reading for yesterday.",
  },
  {
    icon: <User size={20} />,
    title: "Every log has a name on it",
    desc: "Staff authenticate with a unique PIN before every entry. There is no anonymous path to submit a log.",
  },
  {
    icon: <Database size={20} />,
    title: "Records can't be changed",
    desc: "Once a log is saved, it's locked. No edits, no deletions. What was entered is what the inspector sees.",
  },
  {
    icon: <History size={20} />,
    title: "History survives staff turnover",
    desc: "Each log captures the staff name, station, and config at time of entry. Deleting a staff member doesn't erase their records.",
  },
];

const whoFor = [
  {
    emoji: "🍽️",
    title: "Restaurants & Bars",
    desc: "Single-location owners in Alberta. Replace the paper binder. Pass inspections with confidence.",
  },
  {
    emoji: "🏠",
    title: "Seniors Homes & LTC",
    desc: "Regulated facilities where food safety incidents carry real licensing consequences.",
  },
  {
    emoji: "🏨",
    title: "Hotel & Institutional",
    desc: "Multi-station kitchens with shift changeovers — exactly where compliance gaps form.",
  },
  {
    emoji: "🔗",
    title: "Small Chains",
    desc: "2-5 locations. One dashboard, standardized SOPs, no separate spreadsheets per site.",
  },
];

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-white font-sans">
      {/* ── STICKY NAV ── */}
      <nav className="sticky top-0 z-50 w-full bg-[#0f172a] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-16">
          <span className="text-white text-lg font-bold tracking-tight">
            AuditShield
          </span>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-[#94a3b8] hover:text-white text-sm font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/onboard"
              className="h-9 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full bg-[#0f172a] py-20 md:py-32 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-[#60a5fa] text-xs font-semibold tracking-widest uppercase mb-5 border border-[#60a5fa]/30 rounded-full px-4 py-1.5">
            Food Safety Compliance OS
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-2">
            Stop trusting paper logs.
          </h1>
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#60a5fa] tracking-tight leading-[1.1] mb-7">
            Start proving compliance.
          </p>
          <p className="text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AuditShield digitizes your food safety logs with an immutable audit
            trail, forced corrective actions, and reports ready for Health
            Authority in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboard"
              className="h-12 px-8 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-base font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="h-12 px-8 bg-transparent border border-white/20 hover:border-white/40 text-white rounded-lg text-base font-semibold flex items-center justify-center transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="w-full bg-[#f8f9fa] py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="border-l-4 border-[#f97316] pl-6 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-2">
              Paper logs don&apos;t protect you.
            </h2>
            <p className="text-[#64748b] text-lg">
              They just create the appearance of compliance.
            </p>
          </div>
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
                className="flex items-start gap-3 bg-white rounded-lg p-4 border border-[#e2e8f0]"
              >
                <X
                  className="text-[#dc2626] shrink-0 mt-0.5"
                  size={18}
                />
                <span className="text-[#1a1a2e] text-sm leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-6 sm:p-8">
            <p className="text-[#94a3b8] text-base md:text-lg italic leading-relaxed text-center">
              &ldquo;When Health Authority shows up, a binder of hand-written
              logs isn&apos;t a defence — it&apos;s a liability.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── SCENARIO ── */}
      <section className="w-full bg-white py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] text-center mb-3">
            What happens when something goes wrong?
          </h2>
          <p className="text-center text-[#64748b] italic mb-10 text-base">
            An inspector finds your walk-in fridge at 8°C.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border border-[#fecaca] overflow-hidden">
              <div className="bg-[#dc2626] px-5 py-3">
                <span className="text-white font-bold text-xs tracking-widest uppercase">
                  Without Logs
                </span>
              </div>
              <div className="p-5 bg-[#fff5f5] flex flex-col gap-3">
                {[
                  "No record of when the temperature rose",
                  "Inspector assumes worst case — all day",
                  "Critical violation issued",
                  "Food ordered destroyed",
                  "Thousands in lost inventory",
                  "Possible facility closure or fine",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <X
                      className="text-[#dc2626] shrink-0 mt-0.5"
                      size={16}
                    />
                    <span className="text-[#1a1a2e] text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#bbf7d0] overflow-hidden">
              <div className="bg-[#16a34a] px-5 py-3">
                <span className="text-white font-bold text-xs tracking-widest uppercase">
                  With AuditShield
                </span>
              </div>
              <div className="p-5 bg-[#f0fdf4] flex flex-col gap-3">
                {[
                  "Logs show 3°C four hours ago",
                  "Compressor failure identified quickly",
                  "Proof the issue was caught and acted on",
                  "Food can be rapid-cooled, not destroyed",
                  "Corrective action already documented",
                  "Due diligence defence in any dispute",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check
                      className="text-[#16a34a] shrink-0 mt-0.5"
                      size={16}
                    />
                    <span className="text-[#1a1a2e] text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-[#64748b] text-xs italic">
            Alberta Food Code §3.7.1 requires routine monitoring of food
            temperatures — not just a passing inspection.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="w-full bg-[#f8f9fa] py-16 md:py-24 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] text-center mb-3">
            Everything you need to prove compliance
          </h2>
          <p className="text-[#64748b] text-center mb-12 text-base">
            Six capabilities that work together to protect your operation.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col gap-4"
              >
                <div className="w-11 h-11 bg-[#eff6ff] text-[#2563eb] rounded-lg flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1a2e] mb-1 text-base">
                    {feat.title}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        className="w-full bg-white py-16 md:py-24 px-4 sm:px-6"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] text-center mb-12">
            How It Works
          </h2>
          <div className="flex flex-col">
            {howItWorks.map((s, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">
                    {s.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[#e2e8f0] my-1" />
                  )}
                </div>
                <div className="pb-8">
                  <p className="font-semibold text-[#1a1a2e] text-base">
                    {s.time}
                  </p>
                  <p className="text-[#64748b] text-sm mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-5 text-center">
            <p className="text-[#1d4ed8] font-medium text-sm">
              Health inspector arrives? Export a PDF audit report for any date
              range in under 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY AUDITSHIELD ── */}
      <section className="w-full bg-[#0f172a] py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
            Built for defensibility, not just convenience.
          </h2>
          <p className="text-[#94a3b8] text-center mb-12 text-base">
            Four guarantees your paper binder can never make.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {whyItems.map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-6 flex gap-4"
              >
                <div className="w-10 h-10 bg-[#2563eb]/20 text-[#60a5fa] rounded-lg flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-base">
                    {item.title}
                  </h3>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="w-full bg-[#f8f9fa] py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] text-center mb-12">
            Who It&apos;s For
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoFor.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#e2e8f0] p-6"
              >
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="font-semibold text-[#1a1a2e] mb-2 text-base">
                  {item.title}
                </h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        className="w-full bg-white py-16 md:py-24 px-4 sm:px-6"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-3">
            Simple, flat monthly pricing
          </h2>
          <p className="text-[#64748b] mb-12 text-base">
            No per-user fees. No setup costs. 30-day free trial. Cancel any
            time.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {/* Starter */}
            <div className="rounded-xl border border-[#e2e8f0] p-6 text-left flex flex-col">
              <div className="mb-5">
                <h3 className="font-bold text-[#1a1a2e] text-lg">Starter</h3>
                <div className="text-3xl font-bold text-[#1a1a2e] mt-1">
                  $79
                  <span className="text-base font-normal text-[#64748b]">
                    /mo
                  </span>
                </div>
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
                    className="flex items-start gap-2 text-sm text-[#64748b]"
                  >
                    <Check
                      size={15}
                      className="text-[#16a34a] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-10 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1a1a2e] rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="rounded-xl border-2 border-[#2563eb] bg-[#0f172a] p-6 text-left flex flex-col relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-[#2563eb] text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                  Recommended
                </span>
              </div>
              <div className="mb-5">
                <h3 className="font-bold text-white text-lg">Professional</h3>
                <div className="text-3xl font-bold text-white mt-1">
                  $199
                  <span className="text-base font-normal text-[#94a3b8]">
                    /mo
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {[
                  "1 location",
                  "Unlimited staff & stations",
                  "Advanced reporting",
                  "Custom SOP fields",
                  "Priority support",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#94a3b8]"
                  >
                    <Check
                      size={15}
                      className="text-[#60a5fa] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-10 flex items-center justify-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Multi-Site */}
            <div className="rounded-xl border border-[#e2e8f0] p-6 text-left flex flex-col">
              <div className="mb-5">
                <h3 className="font-bold text-[#1a1a2e] text-lg">
                  Multi-Site
                </h3>
                <div className="text-3xl font-bold text-[#1a1a2e] mt-1">
                  $399
                  <span className="text-base font-normal text-[#64748b]">
                    /mo
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {[
                  "Multiple locations",
                  "Unlimited staff",
                  "Cross-location dashboard",
                  "Per-location reports",
                  "Dedicated onboarding",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[#64748b]"
                  >
                    <Check
                      size={15}
                      className="text-[#16a34a] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-10 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1a1a2e] rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── EARLY ADOPTERS ── */}
      <section className="w-full bg-[#0f172a] py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">
            Why being first matters.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                n: "1",
                title: "Locked-in pricing",
                desc: "Your rate is frozen as the product scales.",
              },
              {
                n: "2",
                title: "Direct founder access",
                desc: "You get a line to the team, not a support queue.",
              },
              {
                n: "3",
                title: "Onboarding included",
                desc: "We set it up with you. No figuring it out alone.",
              },
              {
                n: "4",
                title: "Shape the product",
                desc: "Your workflow informs what gets built next.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-5 text-left flex gap-4"
              >
                <span className="text-[#60a5fa] font-bold text-2xl leading-none shrink-0">
                  {item.n}
                </span>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[#94a3b8] text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[#64748b] text-sm italic">
            AuditShield is actively onboarding its first clients. This is the
            lowest-risk, highest-influence moment to get in.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full bg-[#0f172a] border-t border-white/10 py-16 md:py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to replace your paper logs?
          </h2>
          <p className="text-[#94a3b8] mb-8 text-base leading-relaxed">
            The demo takes 20 minutes. No setup. No credit card. Just the
            product running.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/onboard"
              className="h-12 px-8 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a
              href="mailto:varun1200@gmail.com?subject=AuditShield Demo Request"
              className="h-12 px-8 bg-transparent border border-white/20 hover:border-white/40 text-white rounded-lg font-semibold flex items-center justify-center transition-colors"
            >
              Book a Demo
            </a>
          </div>
          <Link
            href="/info"
            className="text-[#60a5fa] hover:text-[#93c5fd] text-sm font-medium transition-colors"
          >
            Read the full info packet →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-[#0f172a] border-t border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-[#94a3b8] text-center md:text-left">
            AuditShield is a product of MSDV Inc. | Alberta, Canada
            <br />
            <span className="text-[#64748b]">
              © 2026 MSDV Inc. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-[#94a3b8] hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[#94a3b8] hover:text-white transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
