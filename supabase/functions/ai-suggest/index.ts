// AI suggestions edge function — uses Lovable AI Gateway
// Generates contextual suggestions: risk analysis, mentor matching, summaries.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestRequest {
  mode: "risk_analysis" | "mentor_match" | "summary" | "next_actions";
  context: Record<string, any>;
}

const PROMPTS = {
  risk_analysis: (ctx: any) => `Tu es un expert en gestion de risques pour startups en accélération.
Analyse ce projet et identifie les 3 risques les plus probables et leurs mitigations.
Contexte projet:
${JSON.stringify(ctx, null, 2)}

Réponds en JSON: {"risks":[{"title":"...","level":"low|medium|high|critical","description":"...","mitigation":"..."}]}`,

  mentor_match: (ctx: any) => `Tu es un expert en accompagnement entrepreneurial.
À partir du profil de la startup et de la liste de mentors fournis, recommande les 3 meilleurs mentors (avec score 0-100 et justification).
Contexte:
${JSON.stringify(ctx, null, 2)}

Réponds en JSON: {"matches":[{"mentor_name":"...","score":85,"reasons":["...","..."]}]}`,

  summary: (ctx: any) => `Tu es un assistant analytique pour incubateur.
Résume cette entité en 3-4 phrases percutantes (français), en mettant en avant points forts et risques.
Contexte:
${JSON.stringify(ctx, null, 2)}

Réponds en JSON: {"summary":"...","highlights":["..."],"concerns":["..."]}`,

  next_actions: (ctx: any) => `Tu es un coordinateur de programme expérimenté.
Propose 5 actions concrètes prioritaires pour faire avancer ce projet/cette startup dans les 2 prochaines semaines.
Contexte:
${JSON.stringify(ctx, null, 2)}

Réponds en JSON: {"actions":[{"title":"...","priority":"high|medium|low","why":"..."}]}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mode, context } = await req.json() as SuggestRequest;
    if (!mode || !PROMPTS[mode]) {
      return new Response(JSON.stringify({ error: "Mode invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY manquante" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = PROMPTS[mode](context);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu réponds toujours en JSON valide, sans markdown autour." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de taux dépassée. Réessayez dans un instant." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA insuffisants. Recharge ton workspace Lovable." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI Gateway: ${txt}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content ?? "{}";

    let parsed: any = null;
    try {
      const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ success: true, mode, result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
