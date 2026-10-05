import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ automations: [] });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ automations: [] });
    }

    return NextResponse.json({ automations: data });
  } catch {
    return NextResponse.json({ automations: [] });
  }
}

export async function POST(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      trigger_source = "comment",
      trigger_type = "keyword",
      trigger_value = "link",
      response_text,
      public_response_text,
      reply_mode = "both",
      specific_media_id,
      is_ai_enabled = false,
      enable_opening_dm = true,
      enable_follow_gate = false,
      enable_email_capture = false,
      button_text,
      button_url,
      fallback_response_text,
      outbound_webhook_url,
      flow_steps,
      is_active = true,
    } = body;

    const ruleData = {
      user_id: userId,
      name: name || "New Automation",
      trigger_source,
      trigger_type,
      trigger_value: Array.isArray(trigger_value) ? trigger_value.join(", ") : trigger_value,
      response_content: { text: response_text || "Thanks for your comment!" },
      public_response_content: public_response_text ? { text: public_response_text } : null,
      reply_mode,
      specific_media_id: specific_media_id || null,
      is_ai_enabled: !!is_ai_enabled,
      enable_opening_dm: !!enable_opening_dm,
      enable_follow_gate: !!enable_follow_gate,
      enable_email_capture: !!enable_email_capture,
      button_text: button_text || null,
      button_url: button_url || null,
      fallback_response_text: fallback_response_text || null,
      outbound_webhook_url: outbound_webhook_url || null,
      flow_steps: flow_steps || null,
      is_active: !!is_active,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        automation: { id: id || `rule_${Date.now()}`, ...ruleData, created_at: new Date().toISOString() },
      });
    }

    const supabaseAdmin = createAdminClient();
    let resultData = null;

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("automations")
        .update(ruleData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (!error) resultData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("automations")
        .insert(ruleData)
        .select()
        .single();
      if (!error) resultData = data;
    }

    return NextResponse.json({
      success: true,
      automation: resultData || { id: id || `rule_${Date.now()}`, ...ruleData },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save automation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from("automations").delete().eq("id", id).eq("user_id", userId);
    } catch { /* fallback */ }
  }

  return NextResponse.json({ success: true });
}
