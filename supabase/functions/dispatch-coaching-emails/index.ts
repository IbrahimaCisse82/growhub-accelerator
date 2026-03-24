import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailJob {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  attempts: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("EMAIL_FROM") ?? "GrowHub <no-reply@example.com>";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "coordinator"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: reminderResult, error: reminderError } = await adminClient.rpc("enqueue_coaching_reminders");
    if (reminderError) {
      return new Response(JSON.stringify({ error: reminderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: jobs, error: queueError } = await adminClient
      .from("coaching_email_jobs")
      .select("id, recipient_email, subject, body, attempts")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(50);

    if (queueError) {
      return new Response(JSON.stringify({ error: queueError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({
        error: "RESEND_API_KEY manquante",
        queued: jobs?.length ?? 0,
        reminders_enqueued: reminderResult ?? 0,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const job of (jobs ?? []) as EmailJob[]) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [job.recipient_email],
            subject: job.subject,
            text: job.body,
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          await adminClient
            .from("coaching_email_jobs")
            .update({
              status: "failed",
              attempts: (job.attempts ?? 0) + 1,
              last_attempt_at: new Date().toISOString(),
              error: txt.slice(0, 1000),
            })
            .eq("id", job.id);
          failed += 1;
          continue;
        }

        await adminClient
          .from("coaching_email_jobs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            attempts: (job.attempts ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", job.id);
        sent += 1;
      } catch (err) {
        await adminClient
          .from("coaching_email_jobs")
          .update({
            status: "failed",
            attempts: (job.attempts ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
            error: String((err as Error).message).slice(0, 1000),
          })
          .eq("id", job.id);
        failed += 1;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reminders_enqueued: reminderResult ?? 0,
      processed: jobs?.length ?? 0,
      sent,
      failed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
