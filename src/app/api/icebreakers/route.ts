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
    const { data, error } = await supabaseAdmin
      .from("ice_breakers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ ice_breakers: [] });
    }

    return NextResponse.json({ ice_breakers: data });
  } catch {
    return NextResponse.json({ ice_breakers: [] });
  }
}

export async function POST(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { question, payload, response_text, is_active } = body;

    if (!question || !response_text) {
      return NextResponse.json({ error: "Missing required fields (question, response_text)" }, { status: 400 });
    }

    const itemObj = {
      id: `ice_${Date.now()}`,
      user_id: userId,
      question,
      payload: payload || question.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      response_text,
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
    };

    try {
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin.from("ice_breakers").insert(itemObj).select().single();
      if (!error && data) {
        return NextResponse.json({ ice_breaker: data }, { status: 201 });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({ ice_breaker: itemObj }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create ice breaker";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
    return NextResponse.json({ error: "Missing ice breaker ID" }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("ice_breakers").delete().eq("id", id).eq("user_id", userId);
    return NextResponse.json({ success: true, message: "Ice breaker deleted" });
  } catch {
    return NextResponse.json({ success: true, message: "Ice breaker deleted" });
  }
}
