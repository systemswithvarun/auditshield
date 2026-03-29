"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
};

type PinPadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  onSuccess: (staff: Staff, sessionToken: string) => void;
};

export default function PinPadModal({ isOpen, onClose, staff, onSuccess }: PinPadModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setShake(false);
      setErrorMsg("");
      setAttemptsRemaining(null);
    }
  }, [isOpen]);

  const handleInput = (char: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + char);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async () => {
    if (pin.length !== 4 || !staff) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase.rpc('validate_kiosk_pin', {
        p_staff_id: staff.id,
        p_pin_attempt: pin
      });

      if (error) throw error;

      if (data?.valid === true) {
        setAttemptsRemaining(null);
        onSuccess(staff, data.session_token);
      } else if (data?.reason === 'locked') {
        setErrorMsg("Account locked for 15 minutes due to too many failed attempts.");
        setPin("");
      } else if (data?.reason === 'inactive') {
        setErrorMsg("This staff account is inactive. Contact your manager.");
        setPin("");
      } else {
        const remaining = data?.attempts_remaining ?? null;
        setAttemptsRemaining(remaining);
        if (remaining === 0) {
          setErrorMsg("Account locked for 15 minutes.");
        } else {
          setErrorMsg(remaining !== null ? `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : "Incorrect PIN.");
        }
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
      }
    } catch (err) {
      setErrorMsg("Verification failed. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-end sm:justify-center animate-in fade-in duration-200">
      <div className={`w-full max-w-[380px] bg-[#111110] sm:rounded-[36px] rounded-t-[36px] pt-8 pb-10 px-6 shadow-2xl relative transition-transform border border-white/10 ${shake ? 'animate-shake' : 'animate-in slide-in-from-bottom-8 sm:zoom-in-95'}`}>
        
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-6 right-6 w-[34px] h-[34px] flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <X size={18} className="stroke-[2.5]" />
        </button>

        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center mb-5 text-[20px] font-medium shadow-xl ${staff?.color || 'bg-white text-black'}`}>
            {staff?.initials}
          </div>
          <h2 className="text-[22px] font-medium text-white tracking-tight mb-1">Enter PIN</h2>
          <p className="text-[14px] text-white/50 mb-8">Confirm identity for {staff?.name}</p>

          <div className="flex gap-4 mb-10">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx} 
                className={`w-[15px] h-[15px] rounded-full border-[2px] transition-all duration-300 ease-out ${
                  idx < pin.length 
                    ? 'bg-white border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                    : 'bg-transparent border-white/20'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="text-[13px] text-[#E24B4A] text-center mb-4 px-4 leading-snug">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleInput(num.toString())}
                disabled={loading}
                className="w-[74px] h-[74px] mx-auto rounded-full text-[28px] font-medium text-white bg-white/5 hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors touch-manipulation select-none"
              >
                {num}
              </button>
            ))}
            
            <div className="flex justify-center items-center">
              <button
                onClick={handleClear}
                disabled={loading}
                className="w-[74px] h-[74px] mx-auto rounded-full text-[14px] font-bold text-white/60 hover:text-white bg-transparent hover:bg-white/5 active:bg-white/10 flex items-center justify-center transition-colors touch-manipulation select-none uppercase tracking-widest"
              >
                Clear
              </button>
            </div>
            
            <button
              onClick={() => handleInput("0")}
              disabled={loading}
              className="w-[74px] h-[74px] mx-auto rounded-full text-[28px] font-medium text-white bg-white/5 hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors touch-manipulation select-none"
            >
              0
            </button>

            <div className="flex justify-center items-center">
              <button
                onClick={handleSubmit}
                disabled={loading || pin.length !== 4}
                className="w-[74px] h-[74px] mx-auto rounded-full text-[#111] bg-white hover:bg-[#f0f0f0] active:scale-95 disabled:bg-white/5 disabled:text-white/30 flex items-center justify-center transition-all touch-manipulation shadow-xl disabled:shadow-none select-none"
              >
                {loading ? <Loader2 size={26} className="animate-spin" /> : <Check size={32} className="stroke-[2.5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
