"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function AuthCallbackHandler() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Fetch the user session to see if we're authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          // If no user, auth failed or did not occur
          throw new Error("Authentication failed: No user found.");
        }

        const { data: orgData } = await supabase.rpc('get_my_organization')

        if (!orgData?.exists) {
          router.replace('/onboard')
          return
        }

        router.replace('/admin/dashboard')
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "An unexpected error occurred during authentication.");
      }
    };

    // The auth fragment or token might not be immediately available
    // waiting for onAuthStateChange might also be a viable option, but getSession usually parses the url
    
    // We bind to onAuthStateChange in case the session is still resolving
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        processAuth();
      }
    });

    // Also run processAuth manually just in case the event already fired
    processAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-[#FCEBEB] rounded-full flex items-center justify-center mb-4 border border-[#F09595] shadow-sm">
          <svg className="w-8 h-8 text-[#791F1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-[18px] font-medium text-[#111110] mb-2">Authentication Error</h2>
        <p className="text-[14px] text-[#6b6b67] mb-6 max-w-[300px] leading-[1.5]">{error}</p>
        <button
          onClick={() => router.replace("/login")}
          className="h-[46px] px-6 bg-[#111] text-white rounded-xl text-[14px] font-medium tracking-[-0.2px] transition-all hover:opacity-85 active:scale-[0.99] shadow-md"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 size={32} className="animate-spin text-[#111] mb-4" />
      <h2 className="text-[16px] font-medium text-[#111110]">Completing authentication...</h2>
      <p className="text-[13px] text-[#6b6b67] mt-1.5">Please wait while we verify your account.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col items-center justify-center p-4 selection:bg-[#EAF3DE] selection:text-[#3B6D11]">
      <div className="w-full max-w-[400px] bg-white rounded-3xl border border-black/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative animate-in fade-in zoom-in-[0.98] duration-500 min-h-[300px] flex items-center justify-center">
        <Suspense fallback={<Loader2 size={32} className="animate-spin text-[#111]" />}>
          <AuthCallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
