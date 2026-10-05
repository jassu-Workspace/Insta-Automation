export interface AIReplyOptions {
  incomingMessage: string;
  conversationHistory?: Array<{ direction: string; message_text: string }>;
  aiContext?: string;
  groqApiKey?: string;
  aiModel?: string;
  maxResponseLength?: number;
  fallbackResponse?: string;
  onLeadCaptured?: (lead: { email?: string; name?: string; phone?: string; interest?: string }) => Promise<void> | void;
}

export interface AIReplyResult {
  text: string;
  leadCaptured?: { email?: string; name?: string; phone?: string; interest?: string };
}

/**
 * AI Auto-Reply Engine using Groq API (llama-3.1-8b-instant) with Tool / Function Calling
 */
export async function generateAIReply({
  incomingMessage,
  conversationHistory = [],
  aiContext,
  groqApiKey,
  aiModel = "llama-3.1-8b-instant",
  maxResponseLength = 250,
  fallbackResponse,
  onLeadCaptured,
}: AIReplyOptions): Promise<string> {
  const apiKey = groqApiKey || process.env.GROQ_API_KEY;
  const defaultFallback = fallbackResponse || "Thanks for reaching out! We'll get back to you shortly.";

  if (!apiKey) {
    console.log("ℹ️ No Groq API Key provided. Returning fallback message.");
    return defaultFallback;
  }

  const brandInstructions = aiContext
    ? `Brand Context & Guidelines: "${aiContext}"`
    : "Be a helpful, friendly, and concise Instagram assistant.";

  const systemPrompt = `You are an Instagram Direct Message auto-responder assistant.
${brandInstructions}

Guardrails & Instructions:
1. Provide a direct, helpful, and natural response to the user's message.
2. Keep your answer under ${maxResponseLength} characters.
3. Do NOT use markdown formatting, bold text, bullet points, or codeblocks.
4. Keep the tone warm, engaging, and professional.
5. If the user provides their email, phone, or expresses strong buying interest, call the record_lead_info tool.`;

  // Format past 5 messages for context
  const pastMessages = conversationHistory.slice(-5).map((msg) => ({
    role: msg.direction === "outgoing" ? "assistant" : "user",
    content: msg.message_text,
  }));

  const messagesPayload: any[] = [
    { role: "system", content: systemPrompt },
    ...pastMessages,
    { role: "user", content: incomingMessage },
  ];

  // Tool definitions for Groq function calling
  const tools = [
    {
      type: "function",
      function: {
        name: "record_lead_info",
        description: "Records the user's contact information when provided in the chat",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string", description: "Email address provided by the user" },
            name: { type: "string", description: "Name of the user if mentioned" },
            phone: { type: "string", description: "Phone number if provided" },
            interest: { type: "string", description: "Topic or product user showed interest in" },
          },
        },
      },
    },
  ];

  // 5-second timeout guardrail
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: messagesPayload,
        tools: tools,
        tool_choice: "auto",
        max_tokens: Math.min(250, Math.ceil(maxResponseLength / 2)),
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[Groq API Warning] API call failed:", errText);
      return defaultFallback;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    // Check if the AI invoked a tool call
    if (message?.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.name === "record_lead_info") {
          try {
            const leadData = JSON.parse(toolCall.function.arguments || "{}");
            if (onLeadCaptured && (leadData.email || leadData.phone || leadData.name)) {
              await onLeadCaptured(leadData);
            }
          } catch {
            // Ignore parse error
          }
        }
      }
    }

    const aiText = message?.content?.trim();

    if (aiText) {
      console.log(`✨ [GROQ AI REPLY GENERATED] (${aiText.length} chars): "${aiText}"`);
      // Enforce hard character length limit guardrail
      return aiText.length > maxResponseLength ? aiText.substring(0, maxResponseLength - 3) + "..." : aiText;
    }

    return defaultFallback;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("⚠️ Groq API call timed out after 5000ms. Returning fallback response.");
    } else {
      console.warn("Groq API Exception:", err);
    }
    return defaultFallback;
  }
}
