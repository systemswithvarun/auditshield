"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrintAutoTrigger() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push("/admin")}
        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-black rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <ArrowLeft size={18} className="stroke-[2px]" /> Back to Admin
      </button>
      <button 
        onClick={() => window.print()}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-gray-800 text-white rounded-[10px] text-[14px] font-medium shadow-md transition-colors"
      >
        <Printer size={18} className="stroke-[2px]" /> Print Official Report
      </button>
    </div>
  );
}
