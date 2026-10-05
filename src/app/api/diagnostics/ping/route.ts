import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export interface DiagnosticItem {
  service: "supabase" | "meta" | "webhook" | "groq";
  name: string;
  status: "connected" | "degraded" | "disconnected" | "unconfigured";
  latencyMs?: number;
  message: string;
  details?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  const userId = getSessionUser(request);
  const results: Record<string, DiagnosticItem> = {};

  const supabaseAdmin = createAdminClient();
  let userRec: any = null;
  if (userId) {
    try {
      const { data } = await supabaseAdmin.from("users").select("*").eq("id", userId).maybeSingle();
      userRec = data;
    } catch {
      // Fallback
    }
  }

  // 1. Test Supabase Database Connection
  const sbStart = Date.now();
  try {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);
    const sbLatency = Date.now() - sbStart;
    if (error) {
      results.supabase = {
        service: "supabase",
        name: "Supabase PostgreSQL Database",
        status: "degraded",
        latencyMs: sbLatency,
        message: `Database query warning: ${error.message}`,
      };
    } else {
      results.supabase = {
        service: "supabase",
        name: "Supabase PostgreSQL Database",
        status: "connected",
        latencyMs: sbLatency,
        message: `Healthy connection (${sbLatency}ms)`,
      };
    }
  } catch (err: any) {
    results.supabase = {
      service: "supabase",
      name: "Supabase PostgreSQL Database",
      status: "disconnected",
      latencyMs: Date.now() - sbStart,
      message: `Failed to connect: ${err?.message || "Unknown error"}`,
    };
  }

  // 2. Test Groq AI API Connection
  const groqKey = userRec?.groq_api_key || process.env.GROQ_API_KEY || "";
  if (!groqKey) {
    results.groq = {
      service: "groq",
      name: "Groq AI Inference Engine (Llama 3.1)",
      status: "unconfigured",
      message: "No API key configured. Provide key in settings or .env.local",
    };
  } else {
    const groqStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const groqRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${groqKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const groqLatency = Date.now() - groqStart;

      if (groqRes.ok) {
        results.groq = {
          service: "groq",
          name: "Groq AI Inference Engine (Llama 3.1)",
          status: "connected",
          latencyMs: groqLatency,
          message: `Ultra-fast inference ready (${groqLatency}ms)`,
        };
      } else {
        results.groq = {
          service: "groq",
          name: "Groq AI Inference Engine (Llama 3.1)",
          status: "disconnected",
          latencyMs: groqLatency,
          message: `Invalid API key or rate limited (HTTP ${groqRes.status})`,
        };
      }
    } catch (err: any) {
      results.groq = {
        service: "groq",
        name: "Groq AI Inference Engine (Llama 3.1)",
        status: "disconnected",
        latencyMs: Date.now() - groqStart,
        message: `Connection timeout or network failure: ${err?.message}`,
      };
    }
  }

  // 3. Test Meta Instagram Graph API
  const accessToken = userRec?.access_token || "";
  const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET || "";

  if (!accessToken) {
    results.meta = {
      service: "meta",
      name: "Meta Instagram Graph API",
      status: appId && appSecret ? "degraded" : "unconfigured",
      message: "OAuth App configured, but no Instagram account connected yet.",
      details: {
        app_id_configured: !!appId,
        app_secret_configured: !!appSecret,
      },
    };
  } else {
    const metaStart = Date.now();
    try {
      const metaRes = await fetch(`https://graph.instagram.com/v24.0/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`);
      const metaLatency = Date.now() - metaStart;
      const metaData = await metaRes.json();

      if (metaRes.ok && metaData.id) {
        results.meta = {
          service: "meta",
          name: "Meta Instagram Graph API",
          status: "connected",
          latencyMs: metaLatency,
          message: `Connected as @${metaData.username || metaData.id} (${metaLatency}ms)`,
          details: {
            username: metaData.username,
            instagram_id: metaData.id,
          },
        };
      } else {
        results.meta = {
          service: "meta",
          name: "Meta Instagram Graph API",
          status: "degraded",
          latencyMs: metaLatency,
          message: `Access token expired or permission missing: ${metaData.error?.message || "Invalid token"}`,
        };
      }
    } catch (err: any) {
      results.meta = {
        service: "meta",
        name: "Meta Instagram Graph API",
        status: "disconnected",
        latencyMs: Date.now() - metaStart,
        message: `Graph API unreachable: ${err?.message}`,
      };
    }
  }

  // 4. Test Webhook Handshake Readiness
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123";
  const origin = request.nextUrl.origin || "http://localhost:3000";
  const webhookUrl = `${origin}/api/webhook/instagram`;

  results.webhook = {
    service: "webhook",
    name: "Meta Webhook Ingress Handshake",
    status: "connected",
    message: `Ready for Meta subscription handshake`,
    details: {
      callback_url: webhookUrl,
      verify_token: verifyToken,
    },
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: Object.values(results).every((r) => r.status === "connected") ? "healthy" : "attention_required",
    diagnostics: results,
  });
}
