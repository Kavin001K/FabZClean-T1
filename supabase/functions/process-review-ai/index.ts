import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ReviewJob = {
  id: string;
  review_id: string;
  attempt_count: number;
  payload: Record<string, unknown> | null;
};

type ReviewRow = {
  id: string;
  order_id: string;
  rating: number;
  feedback: string | null;
};

type GeminiAnalysis = {
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

async function analyzeReview(feedback: string, rating: number): Promise<GeminiAnalysis> {
  const apiKey = getEnv("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-flash";
  const prompt = [
    "You are classifying a laundry-service customer review.",
    "Return strict JSON with keys: category, sentiment, score.",
    "sentiment must be one of positive, neutral, negative.",
    "score must be a number from 0 to 1 where 1 is the strongest positive review.",
    "Choose category from: quality, delivery, timeliness, staff, pricing, convenience, communication, overall.",
    `Star rating: ${rating}`,
    `Review text: ${feedback || "No written feedback supplied."}`,
  ].join("\n");

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
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const rawText =
    payload?.candidates?.[0]?.content?.parts?.[0]?.text ??
    payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ??
    "";

  const parsed = JSON.parse(rawText) as Partial<GeminiAnalysis>;
  const sentiment = parsed.sentiment === "negative" || parsed.sentiment === "neutral"
    ? parsed.sentiment
    : "positive";

  return {
    category: parsed.category?.trim() || "overall",
    sentiment,
    score: clampScore(Number(parsed.score)),
  };
}

async function processJob(job: ReviewJob, supabase: ReturnType<typeof createClient>) {
  const { data: review, error: reviewError } = await supabase
    .from("reviews_table")
    .select("id, order_id, rating, feedback")
    .eq("id", job.review_id)
    .single<ReviewRow>();

  if (reviewError || !review) {
    throw new Error(reviewError?.message || "Review not found");
  }

  const analysis = await analyzeReview(review.feedback ?? "", review.rating);
  const nextStatus = analysis.sentiment === "positive" && analysis.score >= 0.65 ? "published" : "reviewed";

  const { error: reviewUpdateError } = await supabase
    .from("reviews_table")
    .update({
      ai_category: analysis.category,
      ai_sentiment: analysis.sentiment,
      ai_score: analysis.score,
      feedback_status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", review.id);

  if (reviewUpdateError) {
    throw new Error(reviewUpdateError.message);
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      ai_category: analysis.category,
      ai_sentiment: analysis.sentiment,
      ai_score: analysis.score,
      feedback_status: nextStatus,
    })
    .eq("id", review.order_id);

  if (orderUpdateError) {
    throw new Error(orderUpdateError.message);
  }

  const { error: rankingError } = await supabase.rpc("refresh_review_rankings");
  if (rankingError) {
    throw new Error(rankingError.message);
  }

  const { error: jobUpdateError } = await supabase
    .from("review_ai_jobs")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", job.id);

  if (jobUpdateError) {
    throw new Error(jobUpdateError.message);
  }

  return {
    jobId: job.id,
    reviewId: review.id,
    sentiment: analysis.sentiment,
    score: analysis.score,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    const explicitReviewId = typeof body?.reviewId === "string" ? body.reviewId : null;

    let query = supabase
      .from("review_ai_jobs")
      .select("id, review_id, attempt_count, payload")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (explicitReviewId) {
      query = query.eq("review_id", explicitReviewId);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      throw new Error(jobsError.message);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const job of jobs as ReviewJob[]) {
      const { error: markProcessingError } = await supabase
        .from("review_ai_jobs")
        .update({
          status: "processing",
          attempt_count: job.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "pending");

      if (markProcessingError) {
        throw new Error(markProcessingError.message);
      }

      try {
        results.push(await processJob(job, supabase));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown processing error";
        await supabase
          .from("review_ai_jobs")
          .update({
            status: job.attempt_count + 1 >= 3 ? "error" : "pending",
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        results.push({ jobId: job.id, reviewId: job.review_id, error: message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
