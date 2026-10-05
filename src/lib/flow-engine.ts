import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export interface FlowStep {
  id: string;
  type: "send_dm" | "wait_for_input" | "email_capture" | "follow_gate" | "outbound_webhook";
  text?: string;
  button_text?: string;
  button_url?: string;
  validation?: "email" | "phone" | "any";
  reprompt_text?: string;
  variable?: string;
  next_step_id?: string;
}

export interface FlowContext {
  [key: string]: any;
}

export interface FlowExecutionResult {
  handled: boolean;
  replyText?: string;
  buttonText?: string;
  buttonUrl?: string;
  nextStepId?: string | null;
  completed?: boolean;
  capturedData?: Record<string, any>;
  publicCommentReply?: string;
}

/**
 * Validates input text against expected type
 */
export function validateInput(value: string, validationType: "email" | "phone" | "any"): boolean {
  if (!value || typeof value !== "string") return false;
  const clean = value.trim();

  if (validationType === "email") {
    // Check if the message contains an email or is an email
    const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return !!emailMatch;
  }

  if (validationType === "phone") {
    const digitsOnly = clean.replace(/[^0-9]/g, "");
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }

  return clean.length > 0;
}

/**
 * Extracts email address from natural language text (e.g. "it is alex@example.com thanks")
 */
export function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Dispatches an outbound webhook payload to an external endpoint (Zapier, Make, Slack, custom CRM)
 */
export async function dispatchOutboundWebhook(url: string, payload: Record<string, any>): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DMflow-Automation-Engine/1.0",
      },
      body: JSON.stringify({
        source: "dmflow",
        timestamp: new Date().toISOString(),
        ...payload,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Outbound webhook dispatch exception:", err);
    return false;
  }
}

/**
 * Handles conversational state machine transitions for incoming messages.
 * Returns null if the incoming message is not part of an ongoing multi-turn state.
 */
export async function processConversationStateTransition(
  userId: string,
  followerId: string,
  incomingText: string,
  conversation: any,
  providedAutomation?: any
): Promise<FlowExecutionResult | null> {
  const currentStep = conversation?.current_step_id;
  const activeAutoId = conversation?.active_automation_id;

  if (!currentStep) {
    return null; // Not currently in a multi-turn step
  }

  // Load the active automation rule if available
  let automation: any = providedAutomation || null;
  if (!automation && activeAutoId && isSupabaseConfigured()) {
    try {
      const supabaseAdmin = createAdminClient();
      const { data } = await supabaseAdmin.from("automations").select("*").eq("id", activeAutoId).single();
      automation = data;
    } catch {
      // Fallback
    }
  }

  // Handle 'awaiting_email' state
  if (currentStep === "awaiting_email") {
    const email = extractEmail(incomingText);

    if (!email) {
      // Input invalid: send friendly reprompt without ending the state
      return {
        handled: true,
        replyText:
          automation?.email_reprompt_text ||
          "That doesn't look like a valid email address. Could you please reply with your email? (e.g. name@example.com) 🙌",
        nextStepId: "awaiting_email",
        completed: false,
      };
    }

    // Input valid: Save email to database if Supabase configured
    if (isSupabaseConfigured()) {
      const conversationId = `${userId}:${followerId}`;
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.from("conversations").update({
          follower_email: email,
          current_step_id: null, // Flow completed
          active_automation_id: null,
          flow_context: { ...(conversation.flow_context || {}), email_captured: email, captured_at: new Date().toISOString() },
          state_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", conversationId);
      } catch (err) {
        console.warn("Error updating conversation with captured email:", err);
      }
    }

    // Trigger Outbound Webhook if configured on rule
    if (automation?.outbound_webhook_url) {
      dispatchOutboundWebhook(automation.outbound_webhook_url, {
        event: "lead_captured",
        user_id: userId,
        follower_id: followerId,
        follower_username: conversation?.follower_username,
        email: email,
        automation_name: automation.name,
      });
    }

    // Deliver final DM reply with button/link
    const finalReply = automation?.response_content?.text || "Thanks! Here is your link:";
    return {
      handled: true,
      replyText: finalReply,
      buttonText: automation?.button_text || "Get Access Now",
      buttonUrl: automation?.button_url || "https://dmflow.app",
      nextStepId: null,
      completed: true,
      capturedData: { email },
    };
  }

  return null;
}

/**
 * Initiates a new multi-turn or single-turn flow for an automation rule
 */
export async function initializeFlowForAutomation(
  userId: string,
  followerId: string,
  followerUsername: string | undefined,
  automation: any
): Promise<FlowExecutionResult> {
  const conversationId = `${userId}:${followerId}`;

  // Check if automation requires email capture
  if (automation.enable_email_capture) {
    // Initiate email capture state in database if Supabase configured
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.from("conversations").upsert({
          id: conversationId,
          user_id: userId,
          follower_id: followerId,
          follower_username: followerUsername || followerId,
          current_step_id: "awaiting_email",
          active_automation_id: automation.id,
          flow_context: { started_at: new Date().toISOString(), automation_id: automation.id },
          state_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Error initializing email capture state in conversation:", err);
      }
    }

    const openingPrompt = automation.opening_dm_text || "To send you the instant link, what's the best email address to reach you at? 📩";
    return {
      handled: true,
      replyText: openingPrompt,
      nextStepId: "awaiting_email",
      completed: false,
    };
  }

  // Check if automation has opening DM
  if (automation.enable_opening_dm && automation.opening_dm_text) {
    const text = `${automation.opening_dm_text}\n\n${automation.response_content?.text || ""}`.trim();
    return {
      handled: true,
      replyText: text,
      buttonText: automation.button_text,
      buttonUrl: automation.button_url,
      nextStepId: null,
      completed: true,
    };
  }

  // Standard single-turn execution
  return {
    handled: true,
    replyText: automation.response_content?.text || "Thanks for reaching out!",
    buttonText: automation.button_text,
    buttonUrl: automation.button_url,
    nextStepId: null,
    completed: true,
  };
}
