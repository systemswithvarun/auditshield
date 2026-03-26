import Link from "next/link";
import { ArrowRight, ShieldCheck, Bell, MapPin, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans selection:bg-[#EAF3DE] selection:text-[#3B6D11]">
      {/* Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-6 py-5 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-[#111] flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-4 h-4 border-[2.5px] border-white rounded-[3px] relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-1.5 after:h-1.5 after:bg-white after:rounded-[1px]"></div>
          </div>
          <span className="text-[17px] font-semibold text-[#111110] tracking-tight">AuditShield</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[14px] font-medium text-[#111110] hover:text-black/70 transition-colors">
            Log in
          </Link>
          <Link 
            href="/onboard" 
            className="h-10 px-5 bg-[#111] text-white rounded-full text-[14px] font-medium tracking-tight flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            Create Your Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-28 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3DE] border border-[#97C459]/30 text-[#3B6D11] text-[13px] font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <ShieldCheck size={16} /> 100% Digital AHS Compliance
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-[#111110] tracking-[-0.03em] leading-[1.05] max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          Food Safety on Autopilot.
        </h1>
        
        <p className="text-lg md:text-xl text-[#6b6b67] max-w-2xl mb-10 leading-[1.5] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          AuditShield secures your business by replacing messy paper logs with intelligent, multi-location digital workflows and real-time alerts. Stop stressing over health inspections.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link 
            href="/onboard" 
            className="h-[54px] px-8 bg-[#111] text-white rounded-full text-[16px] font-medium tracking-tight flex items-center justify-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
          >
            Create Your Account <ArrowRight size={18} />
          </Link>
          <a href="#features" className="h-[54px] px-8 bg-white border border-black/10 text-[#111110] rounded-full text-[16px] font-medium tracking-tight flex items-center justify-center hover:bg-[#f2f1ef] transition-colors shadow-sm">
            See how it works
          </a>
        </div>
      </main>

      {/* Value Prop Section */}
      <section id="features" className="w-full bg-white border-y border-black/5 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col bg-[#f8f7f4] p-8 rounded-3xl border border-black/5">
              <div className="w-12 h-12 bg-[#E6F1FB] text-[#245D91] rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="text-[19px] font-semibold text-[#111110] tracking-tight mb-2">Multi-Location Support</h3>
              <p className="text-[#6b6b67] text-[15px] leading-[1.5] flex-1">
                Manage all your franchise locations or stores in a single seamless dashboard. Filter staff and station views automatically by site.
              </p>
            </div>

            <div className="flex flex-col bg-[#f8f7f4] p-8 rounded-3xl border border-black/5">
              <div className="w-12 h-12 bg-[#FCEBEB] text-[#791F1F] rounded-2xl flex items-center justify-center mb-6">
                <Bell size={24} />
              </div>
              <h3 className="text-[19px] font-semibold text-[#111110] tracking-tight mb-2">Real-Time Breach Alerts</h3>
              <p className="text-[#6b6b67] text-[15px] leading-[1.5] flex-1">
                Receive instant notifications when a station goes out of safe temperature zones. Log immediate corrective actions securely.
              </p>
            </div>

            <div className="flex flex-col bg-[#f8f7f4] p-8 rounded-3xl border border-black/5">
              <div className="w-12 h-12 bg-[#EAF3DE] text-[#3B6D11] rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-[19px] font-semibold text-[#111110] tracking-tight mb-2">100% Digital AHS Compliance</h3>
              <p className="text-[#6b6b67] text-[15px] leading-[1.5] flex-1">
                Generate instant health inspector reports with timestamped security. Say goodbye to illegible handwritten clipboards.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between text-[#9b9b97] text-sm">
        <div>© {new Date().getFullYear()} AuditShield. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-[#111110] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#111110] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
