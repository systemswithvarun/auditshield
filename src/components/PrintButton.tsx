"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export default function PrintButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/admin/report")}
      className="flex items-center gap-2.5 px-5 py-2.5 bg-[#0F172A] hover:opacity-85 active:scale-95 transition-all text-white rounded-[10px] text-[14px] font-medium shadow-md"
    >
      <FileText size={18} className="stroke-[2px]" /> Generate AHS Report
    </button>
  );
}
