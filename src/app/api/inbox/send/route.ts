import { NextRequest, NextResponse } from "next/server";
import { sendInstagramMessage, sendInstagramSenderAction } from "@/lib/instagram";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversation_id, recipient_id, message_text, tag } = body;

    if (!conversation_id || !recipient_id || !message_text) {
      return NextResponse.json({ error: "Missing required fields (conversation_id, recipient_id, message_text)" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    let accessToken = "";
    try {
      const { data } = await supabaseAdmin.from("users").select("access_token").eq("id", userId).single();
      if (data?.access_token) {
        accessToken = data.access_token;
      }
    } catch {
      // Fallback
    }

    // 1. Send sender action + Instagram Graph API message (with optional HUMAN_AGENT tag)
    await sendInstagramSenderAction(recipient_id, "mark_seen", accessToken);
    const apiResult = await sendInstagramMessage(recipient_id, message_text, accessToken, tag);
    const sendStatus = apiResult.success ? "sent" : "failed";

    const messageId = `manual_out_${Date.now()}`;
    const newMsgObj = {
      id: messageId,
      conversation_id: conversation_id,
      user_id: userId,
      sender_id: userId,
      recipient_id: recipient_id,
      message_text: message_text,
      direction: "outgoing",
      send_status: sendStatus,
      created_at: new Date().toISOString(),
    };

    // 2. Insert into `messages` and update `conversations`
    try {
      await supabaseAdmin.from("messages").insert(newMsgObj);
      await supabaseAdmin.from("conversations").upsert({
        id: conversation_id,
        user_id: userId,
        follower_id: recipient_id,
        last_message: message_text,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("DB logging manual send exception:", dbErr);
    }

    if (!apiResult.success) {
      return NextResponse.json(
        { success: false, error: apiResult.error || "Failed to send message via Instagram API", message: newMsgObj },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: newMsgObj, apiResult });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send manual DM";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
