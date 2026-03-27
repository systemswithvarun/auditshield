import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find all PENDING schedule instances for today where window_end < NOW
    // Because edge functions run in UTC, we compare standard UTC time constraints or just fetch all and filter in memory based on timezone
    // To simplify: we fetch all PENDING instances target_date = CURRENT_DATE
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Convert current time to a time string 'HH:MM:SS'
    // Careful: Local vs UTC. Ideally we would just query all PENDING for today and map locally.
    const { data: pendingInstances, error: fetchErr } = await supabaseClient
      .from('schedule_instances')
      .select(`
        id, station_id, window_end, target_date, status,
        stations (
          name,
          locations (
            name,
            organizations (owner_id)
          )
        )
      `)
      .eq('status', 'PENDING')
      .eq('target_date', todayStr);

    if (fetchErr) throw fetchErr;

    if (!pendingInstances || pendingInstances.length === 0) {
      return new Response(JSON.stringify({ message: "No pending instances found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const missedInstances = pendingInstances.filter((instance) => {
       // If current 'HH:MM' is greater than window_end 'HH:MM', it's missed
       return nowStr > instance.window_end;
    });

    if (missedInstances.length === 0) {
      return new Response(JSON.stringify({ message: "No instances missed yet." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Mark them as MISSED in DB
    const instanceIds = missedInstances.map(i => i.id);
    const { error: updateErr } = await supabaseClient
      .from('schedule_instances')
      .update({ status: 'MISSED' })
      .in('id', instanceIds);

    if (updateErr) throw updateErr;

    // 3. Dispatch Emails via Resend
    if (!RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY found. Skipping emails.");
    } else {
      for (const instance of missedInstances) {
        const stationObj = instance.stations as any;
        const locObj = stationObj?.locations;
        const orgObj = locObj?.organizations;
        const ownerId = orgObj?.owner_id;

        if (!ownerId) continue;

        // Bypassing RLS with service_role to pull exact email from auth.users
        const { data: authData, error: authErr } = await supabaseClient.auth.admin.getUserById(ownerId);
        
        if (authErr || !authData?.user?.email) {
          console.warn("Could not find email for owner:", ownerId);
          continue;
        }

        const emailAddress = authData.user.email;
        const stationName = stationObj.name || "Unknown Station";
        const locationName = locObj.name || "Unknown Location";

        const emailPayload = {
          from: "AuditShield Alerts <alerts@auditshield.app>",
          to: [emailAddress],
          subject: `🚨 ALERT: Missed Food Safety Check - ${stationName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111;">
              <h2 style="color: #E24B4A; margin-top: 0;">Missed Check Alert</h2>
              <p>The scheduled compliance check for <strong>${stationName}</strong> at <strong>${locationName}</strong> was missed.</p>
              <p style="background: #f8f7f4; padding: 12px; border-radius: 8px;">
                 <strong>Target Date:</strong> ${instance.target_date}<br/>
                 <strong>Window Ended At:</strong> ${instance.window_end.substring(0, 5)}
              </p>
              <p>Please log in to the <a href="https://auditshield.app/admin/dashboard" style="color: #245D91; font-weight: bold;">Manager Dashboard</a> to review your compliance records.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 11px; color: #888;">This is an automated safety alert from AuditShield Compliance Systems.</p>
            </div>
          `
        };

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        if (!res.ok) {
          console.error("Resend API error:", await res.text());
        }
      }
    }

    return new Response(JSON.stringify({
      message: "Successfully processed missed instances",
      count: missedInstances.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
