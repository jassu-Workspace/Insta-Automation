import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { resolveUserId } from "@/lib/identity-resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendInstagramMessage,
  sendInstagramSenderAction,
  replyToInstagramComment,
} from "@/lib/instagram";
import { generateAIReply } from "@/lib/ai-reply";
import {
  processConversationStateTransition,
  initializeFlowForAutomation,
  dispatchOutboundWebhook,
} from "@/lib/flow-engine";

// In-memory LRU deduplication cache (15-minute TTL)
const processedEventsCache = new Map<string, number>();

async function isEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const now = Date.now();
  // Clear events older than 15 minutes
  for (const [key, timestamp] of processedEventsCache.entries()) {
    if (now - timestamp > 15 * 60 * 1000) {
      processedEventsCache.delete(key);
    }
  }

  if (processedEventsCache.has(eventId)) {
    return true;
  }

  processedEventsCache.set(eventId, now);

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("processed_events").insert({ event_id: eventId });
    if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
      return true;
    }
  } catch {
    // Fallback to in-memory check
  }

  return false;
}


/**
 * GET Handler: Meta Developer Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Meta Webhook Verification Handshake successful!");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("❌ Meta Webhook Verification failed. Token mismatch or invalid mode.");
  return NextResponse.json({ error: "Forbidden - Verification token mismatch" }, { status: 403 });
}

/**
 * Helper to safely verify HMAC-SHA256 signature using timingSafeEqual
 */
function verifyXHubSignature256(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";
  if (!signatureHeader) {
    console.warn("⚠️ Missing x-hub-signature-256 header");
    return false;
  }

  const parts = signatureHeader.split("sha256=");
  const signatureHex = parts.length === 2 ? parts[1] : signatureHeader;

  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(rawBody);
  const expectedHex = hmac.digest("hex");

  try {
    const signatureBuffer = Buffer.from(signatureHex, "hex");
    const expectedBuffer = Buffer.from(expectedHex, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    console.error("Error comparing HMAC buffers:", err);
    return false;
  }
}

/**
 * Helper to determine high-level event type for logging
 */
function determineEventType(payload: any): { eventType: string; summary: string } {
  try {
    const entry = payload?.entry?.[0];
    if (entry?.messaging?.[0]) {
      const messaging = entry.messaging[0];
      if (messaging.message?.is_echo) {
        return { eventType: "dm_echo", summary: `Sent DM: "${messaging.message.text || "media"}" to recipient ${messaging.recipient?.id}` };
      }
      if (messaging.message?.reply_to?.story) {
        return { eventType: "story_reply", summary: `Story Reply from ${messaging.sender?.id}: "${messaging.message.text}"` };
      }
      return { eventType: "direct_message", summary: `Incoming DM from ${messaging.sender?.id}: "${messaging.message?.text || "attachment"}"` };
    }

    if (entry?.changes?.[0]) {
      const change = entry.changes[0];
      const field = change.field;
      const val = change.value;
      if (field === "comments") {
        return { eventType: "comment", summary: `Comment by @${val?.from?.username || val?.from?.id}: "${val?.text}" on media ${val?.media?.id}` };
      }
      if (field === "mentions") {
        return { eventType: "story_mention", summary: `Mentioned in story/media by @${val?.sender_name || val?.from?.id || "user"}` };
      }
      return { eventType: field || "change_event", summary: `Field '${field}' updated` };
    }
  } catch {
    // Fallback
  }
  return { eventType: "unknown_event", summary: "Raw webhook payload received" };
}

/**
 * Process Direct Message Automation & Conversation Logging (with Multi-Turn FSM & AI Tool Calling)
 */
async function processDirectMessageAutomation(userId: string, messaging: any) {
  const message = messaging.message;
  if (!message || message.is_echo) {
    return; // Ignore echoes
  }

  const senderId = messaging.sender?.id;
  const recipientId = messaging.recipient?.id;
  const messageText = message.text || "";
  const messageId = message.mid || `mid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!senderId || !messageText) return;

  const isStoryReply = !!message.reply_to?.story;
  const targetTriggerSource = isStoryReply ? "story" : "dm";

  const supabaseAdmin = createAdminClient();
  const conversationId = `${userId}:${senderId}`;

  // 1. Log incoming message
  try {
    await supabaseAdmin.from("conversations").upsert({
      id: conversationId,
      user_id: userId,
      follower_id: senderId,
      last_message: messageText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("messages").upsert({
      id: messageId,
      conversation_id: conversationId,
      user_id: userId,
      sender_id: senderId,
      recipient_id: recipientId || userId,
      message_text: messageText,
      direction: "incoming",
      send_status: "sent",
      created_at: new Date().toISOString(),
    });
  } catch (dbErr) {
    console.warn("DB logging warning (conversations/messages):", dbErr);
  }

  // Retrieve user access token & AI context settings
  let accessToken = "";
  let groqApiKey = process.env.GROQ_API_KEY || "";
  let aiContext = "We are a premium brand selling products and services. Be helpful and friendly.";

  try {
    const { data: userRec } = await supabaseAdmin
      .from("users")
      .select("access_token, groq_api_key, ai_context")
      .eq("id", userId)
      .single();

    if (userRec) {
      if (userRec.access_token) accessToken = userRec.access_token;
      if (userRec.groq_api_key) groqApiKey = userRec.groq_api_key;
      if (userRec.ai_context) aiContext = userRec.ai_context;
    }
  } catch {
    // Fallback
  }

  // 2. Check for Ongoing Multi-Turn Flow State Transition
  let existingConv: any = null;
  try {
    const { data } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();
    existingConv = data;
  } catch {
    // Fallback
  }

  if (existingConv?.current_step_id) {
    const stateResult = await processConversationStateTransition(
      userId,
      senderId,
      messageText,
      existingConv
    );

    if (stateResult && stateResult.handled) {
      let replyText = stateResult.replyText || "";
      if (stateResult.buttonUrl) {
        replyText += `\n\n👉 ${stateResult.buttonText || "Open Link"}: ${stateResult.buttonUrl}`;
      }

      await sendInstagramSenderAction(senderId, "mark_seen", accessToken);
      const sendRes = await sendInstagramMessage(senderId, replyText, accessToken);
      const sendStatus = sendRes.success ? "sent" : "failed";

      const replyMid = `flow_out_${Date.now()}`;
      try {
        await supabaseAdmin.from("messages").insert({
          id: replyMid,
          conversation_id: conversationId,
          user_id: userId,
          sender_id: userId,
          recipient_id: senderId,
          message_text: replyText,
          direction: "outgoing",
          send_status: sendStatus,
          created_at: new Date().toISOString(),
        });

        await supabaseAdmin.from("conversations").update({
          last_message: replyText,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", conversationId);
      } catch (dbErr) {
        console.warn("DB logging flow state transition outgoing message warning:", dbErr);
      }

      return;
    }
  }

  // 3. Fetch active automations
  let automations: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);
    automations = data || [];
  } catch (err) {
    console.warn("Failed to query automations table:", err);
  }

  if (automations.length === 0) {
    console.log(`no matching automation configured for user ${userId}`);
    return;
  }

  const normalizedMsg = messageText.toLowerCase();

  // Step A: Attempt Exact Keyword Match
  let matchedRule: any = null;
  let aiRule: any = null;

  for (const rule of automations) {
    const ruleSource = rule.trigger_source || "dm";
    if (ruleSource !== targetTriggerSource && ruleSource !== "dm") continue;

    if (rule.is_ai_enabled || rule.trigger_type === "ai") {
      aiRule = rule; // Save for AI fallback if no keyword matches
      continue;
    }

    const keywords = (rule.trigger_value || "").split(",").map((k: string) => k.trim().toLowerCase());
    const isMatch = keywords.some((kw: string) => kw && kw !== "*" && normalizedMsg.includes(kw));

    if (isMatch) {
      matchedRule = rule;
      break;
    }
  }

  let finalResponseText = "";
  let isAiReply = false;

  if (matchedRule) {
    console.log(`🤖 [KEYWORD MATCHED] Rule: "${matchedRule.name}" for text: "${messageText}"`);

    // Check if rule requires multi-turn email capture
    if (matchedRule.enable_email_capture) {
      const flowInit = await initializeFlowForAutomation(
        userId,
        senderId,
        existingConv?.follower_username,
        matchedRule
      );

      let replyText = flowInit.replyText || "";
      if (flowInit.buttonUrl) {
        replyText += `\n\n👉 ${flowInit.buttonText || "Open Link"}: ${flowInit.buttonUrl}`;
      }

      await sendInstagramSenderAction(senderId, "mark_seen", accessToken);
      const sendRes = await sendInstagramMessage(senderId, replyText, accessToken);
      const sendStatus = sendRes.success ? "sent" : "failed";

      try {
        const replyMid = `flow_init_${Date.now()}`;
        await supabaseAdmin.from("messages").insert({
          id: replyMid,
          conversation_id: conversationId,
          user_id: userId,
          sender_id: userId,
          recipient_id: senderId,
          message_text: replyText,
          direction: "outgoing",
          send_status: sendStatus,
          created_at: new Date().toISOString(),
        });

        await supabaseAdmin.from("conversations").update({
          last_message: replyText,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", conversationId);
      } catch (dbErr) {
        console.warn("DB logging flow init outgoing message warning:", dbErr);
      }

      return;
    }

    finalResponseText = matchedRule.response_content?.text || "Hello from DMflow!";
  } else if (aiRule) {
    console.log(`🤖 [AI CATCH-ALL TRIGGERED] Rule: "${aiRule.name}" for unhandled text: "${messageText}"`);
    isAiReply = true;

    // Query last 5 messages for thread context
    let history: Array<{ direction: string; message_text: string }> = [];
    try {
      const { data: pastMsgs } = await supabaseAdmin
        .from("messages")
        .select("direction, message_text")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (pastMsgs) {
        history = pastMsgs.reverse();
      }
    } catch {
      // Fallback
    }

    finalResponseText = await generateAIReply({
      incomingMessage: messageText,
      conversationHistory: history,
      aiContext: aiContext,
      groqApiKey: groqApiKey,
      aiModel: aiRule.ai_model || "llama-3.1-8b-instant",
      maxResponseLength: aiRule.max_response_length || 250,
      fallbackResponse: aiRule.fallback_response_text || "Thanks for your message! Our team will get back to you shortly.",
      onLeadCaptured: async (lead) => {
        console.log(`🎯 [AI Lead Extracted] User: ${userId}, Follower: ${senderId}, Lead:`, lead);
        try {
          await supabaseAdmin.from("leads").upsert({
            user_id: userId,
            instagram_username: existingConv?.follower_username || senderId,
            instagram_id: senderId,
            email: lead.email || null,
            phone: lead.phone || null,
            full_name: lead.name || null,
            source: "ai_dm",
            status: "captured",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (aiRule.outbound_webhook_url) {
            dispatchOutboundWebhook(aiRule.outbound_webhook_url, {
              event: "lead_captured_ai",
              user_id: userId,
              follower_id: senderId,
              follower_username: existingConv?.follower_username,
              ...lead,
            });
          }
        } catch (lErr) {
          console.warn("Failed to record lead from AI tool call:", lErr);
        }
      },
    });
  } else {
    console.log(`no matching automation configured for user ${userId}`);
    return;
  }

  // 5. Send 'mark_seen' sender action
  await sendInstagramSenderAction(senderId, "mark_seen", accessToken);

  // 6. Send DM via Instagram Graph API
  const sendRes = await sendInstagramMessage(senderId, finalResponseText, accessToken);
  const sendStatus = sendRes.success ? "sent" : "failed";

  if (!sendRes.success) {
    console.error(`❌ [Webhook DM Send Failed] User: ${userId}, Recipient: ${senderId}, Error: ${sendRes.error}`);
  }

  // 7. Log outgoing response to `conversations` + `messages`
  try {
    const replyMid = `out_${isAiReply ? "ai_" : ""}${Date.now()}`;
    await supabaseAdmin.from("messages").insert({
      id: replyMid,
      conversation_id: conversationId,
      user_id: userId,
      sender_id: userId,
      recipient_id: senderId,
      message_text: finalResponseText,
      direction: "outgoing",
      send_status: sendStatus,
      created_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("conversations").update({
      last_message: finalResponseText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", conversationId);
  } catch (dbErr) {
    console.warn("DB logging outgoing message warning:", dbErr);
  }
}

/**
 * Process Comment Automation (Public Reply + Private DM + Post ID Filtering + Flow Init)
 */
async function processCommentAutomation(userId: string, changeValue: any) {
  const commentId = changeValue?.id;
  const commentText = changeValue?.text || "";
  const mediaId = changeValue?.media?.id || "";
  const commenterId = changeValue?.from?.id;
  const commenterUsername = changeValue?.from?.username || commenterId;

  if (!commentId || !commentText) return;

  const supabaseAdmin = createAdminClient();

  let automations: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("user_id", userId)
      .eq("trigger_source", "comment")
      .eq("is_active", true);

    automations = data || [];
  } catch (err) {
    console.warn("Failed to query comment automations:", err);
  }

  if (automations.length === 0) {
    console.log(`no matching automation configured for user ${userId}`);
    return;
  }

  const normalizedComment = commentText.toLowerCase();
  let matchedRule: any = null;

  for (const rule of automations) {
    if (rule.specific_media_id && mediaId && rule.specific_media_id !== mediaId) {
      continue;
    }

    const keywords = (rule.trigger_value || "").split(",").map((k: string) => k.trim().toLowerCase());
    const isMatch = keywords.some((kw: string) => kw && (normalizedComment.includes(kw) || kw === "*"));

    if (isMatch) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    console.log(`no matching automation configured for user ${userId}`);
    return;
  }

  console.log(`🤖 [COMMENT AUTOMATION MATCHED] Rule: "${matchedRule.name}" on Media: ${mediaId} | Comment: "${commentText}"`);

  let accessToken = "";
  try {
    const { data: userRec } = await supabaseAdmin.from("users").select("access_token").eq("id", userId).single();
    if (userRec?.access_token) {
      accessToken = userRec.access_token;
    }
  } catch {
    // Fallback
  }

  const replyMode = matchedRule.reply_mode || "both";

  if (replyMode === "public_only" || replyMode === "both") {
    const publicText = matchedRule.public_response_content?.text || `Check your DMs! 📩`;
    const replyRes = await replyToInstagramComment(commentId, publicText, accessToken);
    if (!replyRes.success) {
      console.error(`❌ [Webhook Comment Reply Failed] Comment: ${commentId}, Error: ${replyRes.error}`);
    }
  }

  if ((replyMode === "dm_only" || replyMode === "both") && commenterId) {
    let dmText = matchedRule.response_content?.text || "Thanks for commenting!";

    // If multi-turn flow is enabled, initialize flow state
    if (matchedRule.enable_email_capture) {
      const flowInit = await initializeFlowForAutomation(
        userId,
        commenterId,
        commenterUsername,
        matchedRule
      );
      dmText = flowInit.replyText || dmText;
      if (flowInit.buttonUrl) {
        dmText += `\n\n👉 ${flowInit.buttonText || "Open Link"}: ${flowInit.buttonUrl}`;
      }
    }

    await sendInstagramSenderAction(commenterId, "mark_seen", accessToken);
    const sendRes = await sendInstagramMessage(commenterId, dmText, accessToken);
    const sendStatus = sendRes.success ? "sent" : "failed";

    if (!sendRes.success) {
      console.error(`❌ [Webhook Comment DM Send Failed] Recipient: ${commenterId}, Error: ${sendRes.error}`);
    }

    try {
      const conversationId = `${userId}:${commenterId}`;
      await supabaseAdmin.from("conversations").upsert({
        id: conversationId,
        user_id: userId,
        follower_id: commenterId,
        follower_username: commenterUsername,
        last_message: dmText,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await supabaseAdmin.from("messages").insert({
        id: `comment_dm_${Date.now()}`,
        conversation_id: conversationId,
        user_id: userId,
        sender_id: userId,
        recipient_id: commenterId,
        message_text: dmText,
        direction: "outgoing",
        send_status: sendStatus,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("DB logging comment DM error:", dbErr);
    }
  }
}

/**
 * Process Story Mention Automation
 */
async function processStoryMentionAutomation(userId: string, changeValue: any) {
  const commenterId = changeValue?.from?.id || changeValue?.sender_id;
  const username = changeValue?.from?.username || changeValue?.sender_name || commenterId;

  if (!commenterId) return;

  const supabaseAdmin = createAdminClient();
  let automations: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("user_id", userId)
      .eq("trigger_source", "story")
      .eq("is_active", true);

    automations = data || [];
  } catch (err) {
    console.warn("Failed to query story automations:", err);
  }

  if (automations.length === 0) {
    console.log(`no matching automation configured for user ${userId}`);
    return;
  }

  const matchedRule = automations[0];
  console.log(`🤖 [STORY MENTION AUTOMATION MATCHED] Rule: "${matchedRule.name}" for User: @${username}`);

  let accessToken = "";
  try {
    const { data: userRec } = await supabaseAdmin.from("users").select("access_token").eq("id", userId).single();
    if (userRec?.access_token) {
      accessToken = userRec.access_token;
    }
  } catch {
    // Fallback
  }

  const responseText = matchedRule.response_content?.text || "Thanks for mentioning us in your Story!";
  await sendInstagramSenderAction(commenterId, "mark_seen", accessToken);
  const sendRes = await sendInstagramMessage(commenterId, responseText, accessToken);
  const sendStatus = sendRes.success ? "sent" : "failed";

  if (!sendRes.success) {
    console.error(`❌ [Webhook Story DM Send Failed] Recipient: ${commenterId}, Error: ${sendRes.error}`);
  }

  try {
    const conversationId = `${userId}:${commenterId}`;
    await supabaseAdmin.from("conversations").upsert({
      id: conversationId,
      user_id: userId,
      follower_id: commenterId,
      follower_username: username,
      last_message: responseText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin.from("messages").insert({
      id: `story_dm_${Date.now()}`,
      conversation_id: conversationId,
      user_id: userId,
      sender_id: userId,
      recipient_id: commenterId,
      message_text: responseText,
      direction: "outgoing",
      send_status: sendStatus,
      created_at: new Date().toISOString(),
    });
  } catch (dbErr) {
    console.warn("DB logging story mention DM error:", dbErr);
  }
}

/**
 * POST Handler: Handles incoming Meta Webhook events
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  // Step 1: Verify HMAC-SHA256 signature
  const isValidSignature = verifyXHubSignature256(rawBody, signatureHeader);
  if (!isValidSignature) {
    console.error("❌ HMAC-SHA256 signature verification failed for incoming webhook.");
    return NextResponse.json({ error: "Invalid x-hub-signature-256 signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Extract target Instagram account ID from entry
  const entry = payload?.entry?.[0];
  const targetAccountId = entry?.id || "";

  // Step 2: Idempotency deduplication check (prevents duplicate execution on Meta retry loops)
  let eventId = "";
  if (entry?.messaging?.[0]) {
    const m = entry.messaging[0];
    eventId = m.message?.mid || (m.timestamp ? `msg_${m.sender?.id}_${m.timestamp}` : "");
  } else if (entry?.changes?.[0]) {
    const c = entry.changes[0];
    eventId = c.value?.id || (c.value?.comment_id ? `comment_${c.value.comment_id}` : "");
  }

  if (eventId && (await isEventProcessed(eventId))) {
    console.log(`⚡ [DUPLICATE EVENT DROPPED] Webhook event ${eventId} already processed.`);
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  // Step 3: Resolve user identity
  const resolvedUserId = await resolveUserId(targetAccountId, payload);
  if (!resolvedUserId) {
    console.log("unresolved account — check Instagram App connection");
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  // Step 3: Classify event & log to console
  const { eventType, summary } = determineEventType(payload);

  console.log("=================================================");
  console.log(`📩 [INSTAGRAM WEBHOOK RECEIVED] Event: ${eventType.toUpperCase()}`);
  console.log(`👤 Target Account ID: ${targetAccountId} -> Resolved User ID: ${resolvedUserId}`);
  console.log(`💬 Summary: ${summary}`);
  console.log("=================================================");

  // Step 4: Record in `webhook_events` Supabase table
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("webhook_events").insert({
      event_type: eventType,
      user_id: resolvedUserId,
      payload: payload,
      received_at: new Date().toISOString(),
    });
  } catch (dbEx) {
    console.warn("Database insert bypassed (check Supabase keys):", dbEx);
  }

  // Step 5: Route to appropriate Automation Processor
  if (entry?.messaging?.[0]) {
    await processDirectMessageAutomation(resolvedUserId, entry.messaging[0]);
  } else if (entry?.changes?.[0]) {
    const change = entry.changes[0];
    if (change.field === "comments") {
      await processCommentAutomation(resolvedUserId, change.value);
    } else if (change.field === "mentions") {
      await processStoryMentionAutomation(resolvedUserId, change.value);
    }
  }

  // Meta expects 200 OK EVENT_RECEIVED response within 20 seconds
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
