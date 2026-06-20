export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.text();

    const upstream = await fetch(
      "https://agent-prod.studio.lyzr.ai/v3/inference/chat/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "sk-default-pZcInjl3DZStUYXX9fTMODoDFHeZ9Zpk",
        },
        body: body,
      }
    );

    const data = await upstream.text();

    return new Response(data, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
