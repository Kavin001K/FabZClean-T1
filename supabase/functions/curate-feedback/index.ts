import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CurateRequest = {
  orderId?: string;
  orderNumber?: string;
  source?: string;
};

type GeminiAssessment = {
  is_positive: boolean;
  score: number;
  reason: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

async function assessWithGemini(input: {
  comment: string;
  rating: number;
  orderNumber: string;
}) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
You are curating public customer reviews for a premium laundry and dry-cleaning website.

Return only valid JSON with this exact shape:
{"is_positive":boolean,"score":number,"reason":string}

Rules:
- score must be a number from 0 to 100
- mark is_positive true only when the feedback is clearly positive and safe to publish publicly
- favor comments that mention quality, turnaround, staff behavior, reliability, convenience, or delivery experience
- avoid over-rewarding very short generic comments
- keep reason under 160 characters

Order number: ${input.orderNumber}
Rating: ${input.rating}/5
Comment:
${input.comment}
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const rawText =
    payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") ||
    "";

  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: GeminiAssessment;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned non-JSON content");
  }

  return {
    is_positive: Boolean(parsed.is_positive),
    score: clampScore(Number(parsed.score)),
    reason: String(parsed.reason || "").slice(0, 160),
    model,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { success: false, error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required" },
      500,
    );
  }

  const authHeader = req.headers.get("Authorization");
  const functionSecret = Deno.env.get("CURATE_FEEDBACK_FUNCTION_SECRET");
  if (functionSecret && authHeader !== `Bearer ${functionSecret}`) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let body: CurateRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const orderId = body.orderId?.trim();
  const orderNumber = body.orderNumber?.trim();

  if (!orderId && !orderNumber) {
    return jsonResponse(
      { success: false, error: "orderId or orderNumber is required" },
      400,
    );
  }

  let orderQuery = supabase
    .from("orders")
    .select(
      "id, order_number, customer_id, customer_name, customer_rating, feedback_comment, feedback_submitted_at",
    )
    .limit(1);

  if (orderId) {
    orderQuery = orderQuery.eq("id", orderId);
  } else if (orderNumber) {
    orderQuery = orderQuery.eq("order_number", orderNumber);
  }

  const { data: order, error: orderError } = await orderQuery.maybeSingle();

  if (orderError) {
    return jsonResponse({ success: false, error: orderError.message }, 500);
  }

  if (!order) {
    return jsonResponse({ success: false, error: "Order not found" }, 404);
  }

  const rating = Number(order.customer_rating || 0);
  const comment = String(order.feedback_comment || "").trim();

  if (rating < 4 || !comment) {
    await supabase.from("public_website_reviews").delete().eq("order_id", order.id);
    await supabase.rpc("recompute_top_website_reviews");

    return jsonResponse({
      success: true,
      data: {
        action: "skipped",
        reason: "Feedback is not eligible for public curation",
        orderId: order.id,
        orderNumber: order.order_number,
      },
    });
  }

  const assessment = await assessWithGemini({
    comment,
    rating,
    orderNumber: order.order_number,
  });

  if (!assessment.is_positive) {
    await supabase.from("public_website_reviews").delete().eq("order_id", order.id);
    await supabase.rpc("recompute_top_website_reviews");

    return jsonResponse({
      success: true,
      data: {
        action: "not_published",
        orderId: order.id,
        orderNumber: order.order_number,
        score: assessment.score,
        reason: assessment.reason,
      },
    });
  }

  const { error: upsertError } = await supabase.from("public_website_reviews").upsert(
    {
      order_id: order.id,
      customer_id: order.customer_id,
      rating,
      comment,
      is_best_rating: true,
      is_top_rating: false,
      curation_score: assessment.score,
      curation_reason: assessment.reason,
      ai_provider: "gemini",
      ai_model: assessment.model,
      created_at: order.feedback_submitted_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "order_id",
    },
  );

  if (upsertError) {
    return jsonResponse({ success: false, error: upsertError.message }, 500);
  }

  const { error: recomputeError } = await supabase.rpc("recompute_top_website_reviews");
  if (recomputeError) {
    return jsonResponse({ success: false, error: recomputeError.message }, 500);
  }

  return jsonResponse({
    success: true,
    data: {
      action: "published",
      orderId: order.id,
      orderNumber: order.order_number,
      score: assessment.score,
      reason: assessment.reason,
      source: body.source || "manual",
    },
  });
});
