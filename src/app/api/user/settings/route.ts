import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from("users")
      .select("groq_api_key, ai_context")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      groq_api_key: data?.groq_api_key || "",
      ai_context: data?.ai_context || "",
    });
  } catch {
    return NextResponse.json({
      groq_api_key: "",
      ai_context: "",
    });
  }
}

export async function POST(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { groq_api_key, ai_context } = body;

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("users").upsert(
      {
        id: userId,
        groq_api_key,
        ai_context,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Supabase settings update warning:", error.message);
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
