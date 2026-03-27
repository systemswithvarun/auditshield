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

    const todayStr = new Date().toISOString().split('T')[0];
    
    const { data: pendingInstances, error: fetchErr } = await supabaseClient
      .from('schedule_instances')
      .select(`
        id, station_id, window_end, target_date, status, grace_period_minutes,
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

    const missedInstances = pendingInstances.filter((instance) => {
       const now = new Date(); // Deno executes in UTC
       
       // Parse the exact target time boundary mapped in UTC isolating Date blocks
       const dEnd = new Date(`${instance.target_date}T${instance.window_end}Z`);
       
       // Execute grace calculations extracting integer minutes securely
       const dGrace = new Date(dEnd.getTime() + ((instance.grace_period_minutes || 15) * 60000));
       
       // Compare mathematical spans
       return now > dGrace;
    });

    if (missedInstances.length === 0) {
      return new Response(JSON.stringify({ message: "No instances missed yet passing grace thresholds." }), {
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
        const closedTime = instance.window_end.substring(0, 5);

        const emailPayload = {
          from: "AuditShield Alerts <alerts@auditshield.app>",
          to: [emailAddress],
          subject: `🚨 AUDIT SHIELD ALERT: Missed Check - ${stationName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111;">
              <h2 style="color: #E24B4A; margin-top: 0;">System 3 Metric Alert</h2>
              <p>A scheduled safety check for <strong>${stationName}</strong> at <strong>${locationName}</strong> was missed. The window closed at <strong>${closedTime}</strong>.</p>
              <p>Please review the dashboard immediately.</p>
              <p style="background: #f8f7f4; padding: 12px; border-radius: 8px;">
                 <strong>Target Date:</strong> ${instance.target_date}<br/>
                 <strong>Maximum Grace Extended:</strong> +${instance.grace_period_minutes}m
              </p>
              <p>Please log in to the <a href="https://auditshield.app/admin/dashboard" style="color: #245D91; font-weight: bold;">Manager Dashboard</a> to begin mitigation protocols.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 11px; color: #888;">This is an automated System 3 safety alert from AuditShield Compliance Architecture.</p>
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
      message: "Successfully processed missed instances bounded by Grace targets",
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
