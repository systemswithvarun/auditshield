import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
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
  title: "AuditShield — Info Packet | Digital Food Safety Compliance",
  description:
    "Everything you need to know about AuditShield. Features, pricing, how it works, and who it's built for.",
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

export default function InfoPage() {
  return (
    <div className="w-full min-h-screen bg-white font-sans">
      {/* ── HEADER ── */}
      <header className="w-full bg-[#0f172a] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#94a3b8] hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <span className="text-white text-base font-bold tracking-tight">
            AuditShield
          </span>
          <Link
            href="/onboard"
            className="h-9 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── INTRO ── */}
      <section className="w-full bg-[#0f172a] py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-[#60a5fa] text-xs font-semibold tracking-widest uppercase mb-4 border border-[#60a5fa]/30 rounded-full px-4 py-1.5">
            Info Packet
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            What is AuditShield?
          </h1>
          <p className="text-[#94a3b8] text-base md:text-lg leading-relaxed">
            AuditShield is a digital food safety compliance system built for
            commercial kitchens in Alberta. It replaces paper-based temperature
            logs with a tamper-proof, staff-authenticated digital record that
            holds up to Health Authority scrutiny.
          </p>
          <p className="text-[#94a3b8] text-base md:text-lg leading-relaxed mt-4">
            Every log entry is tied to a specific staff member, timestamped by
            the server, and locked from editing. When an out-of-range reading
            occurs, the system forces a corrective action before staff can
            continue. Reports are available as PDF in seconds — not minutes
            spent digging through binders.
          </p>
        </div>
      </section>

      {/* ── PROBLEM STRIP ── */}
      <section className="w-full bg-[#f8f9fa] py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="border-l-4 border-[#f97316] pl-6 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-2">
              The problem with paper logs
            </h2>
            <p className="text-[#64748b]">
              Paper-based compliance creates risk, not safety.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
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
                <X className="text-[#dc2626] shrink-0 mt-0.5" size={18} />
                <span className="text-[#1a1a2e] text-sm leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="w-full bg-white py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-2">
            Core features
          </h2>
          <p className="text-[#64748b] mb-10 text-sm">
            Six integrated capabilities that work together to protect your
            operation.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="bg-[#f8f9fa] rounded-xl border border-[#e2e8f0] p-5 flex flex-col gap-3"
              >
                <div className="w-10 h-10 bg-[#eff6ff] text-[#2563eb] rounded-lg flex items-center justify-center shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1a2e] mb-1 text-sm">
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
      <section className="w-full bg-[#f8f9fa] py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-10">
            How it works — a typical day
          </h2>
          <div className="flex flex-col">
            {howItWorks.map((s, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0 z-10">
                    {s.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[#e2e8f0] my-1" />
                  )}
                </div>
                <div className="pb-7">
                  <p className="font-semibold text-[#1a1a2e] text-sm">
                    {s.time}
                  </p>
                  <p className="text-[#64748b] text-sm mt-0.5 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
            <p className="text-[#1d4ed8] font-medium text-sm">
              Health inspector arrives? Export a PDF audit report for any date
              range in under 2 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY AUDITSHIELD ── */}
      <section className="w-full bg-[#0f172a] py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Why AuditShield — built for defensibility
          </h2>
          <p className="text-[#94a3b8] mb-8 text-sm">
            Four guarantees your paper binder can never make.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {whyItems.map((item, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-5 flex gap-4"
              >
                <div className="w-9 h-9 bg-[#2563eb]/20 text-[#60a5fa] rounded-lg flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-sm">
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

      {/* ── PRICING ── */}
      <section className="w-full bg-white py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-2">
            Pricing
          </h2>
          <p className="text-[#64748b] mb-10 text-sm">
            No per-user fees. No setup costs. 30-day free trial. Cancel any
            time.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 items-start">
            {/* Starter */}
            <div className="rounded-xl border border-[#e2e8f0] p-5 flex flex-col">
              <h3 className="font-bold text-[#1a1a2e] mb-1">Starter</h3>
              <p className="text-2xl font-bold text-[#1a1a2e] mb-4">
                $79
                <span className="text-sm font-normal text-[#64748b]">/mo</span>
              </p>
              <ul className="flex flex-col gap-2 flex-1 mb-5">
                {[
                  "1 location",
                  "Up to 10 staff",
                  "Unlimited log entries",
                  "PDF & CSV export",
                  "Compliance dashboard",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#64748b]"
                  >
                    <Check
                      size={13}
                      className="text-[#16a34a] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-9 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1a1a2e] rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="rounded-xl border-2 border-[#2563eb] bg-[#0f172a] p-5 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-[#2563eb] text-white text-xs font-bold px-3 py-0.5 rounded-full uppercase">
                  Recommended
                </span>
              </div>
              <h3 className="font-bold text-white mb-1">Professional</h3>
              <p className="text-2xl font-bold text-white mb-4">
                $199
                <span className="text-sm font-normal text-[#94a3b8]">/mo</span>
              </p>
              <ul className="flex flex-col gap-2 flex-1 mb-5">
                {[
                  "1 location",
                  "Unlimited staff & stations",
                  "Advanced reporting",
                  "Custom SOP fields",
                  "Priority support",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#94a3b8]"
                  >
                    <Check
                      size={13}
                      className="text-[#60a5fa] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-9 flex items-center justify-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Multi-Site */}
            <div className="rounded-xl border border-[#e2e8f0] p-5 flex flex-col">
              <h3 className="font-bold text-[#1a1a2e] mb-1">Multi-Site</h3>
              <p className="text-2xl font-bold text-[#1a1a2e] mb-4">
                $399
                <span className="text-sm font-normal text-[#64748b]">/mo</span>
              </p>
              <ul className="flex flex-col gap-2 flex-1 mb-5">
                {[
                  "Multiple locations",
                  "Unlimited staff",
                  "Cross-location dashboard",
                  "Per-location reports",
                  "Dedicated onboarding",
                ].map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#64748b]"
                  >
                    <Check
                      size={13}
                      className="text-[#16a34a] shrink-0 mt-0.5"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="h-9 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1a1a2e] rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="w-full bg-[#f8f9fa] py-14 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-8">
            Who it&apos;s for
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {whoFor.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#e2e8f0] p-5 flex gap-4"
              >
                <div className="text-2xl shrink-0">{item.emoji}</div>
                <div>
                  <h3 className="font-semibold text-[#1a1a2e] mb-1 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full bg-[#0f172a] py-14 md:py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            See it working
          </h2>
          <p className="text-[#94a3b8] mb-8 text-base leading-relaxed">
            The demo takes 20 minutes. No setup, no credit card. Just the
            product running on your screen.
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
              Email Us
            </a>
          </div>
          <Link
            href="/"
            className="text-[#60a5fa] hover:text-[#93c5fd] text-sm font-medium transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-[#0f172a] border-t border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
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
