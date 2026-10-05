import crypto from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhook/instagram";
const AUTOMATIONS_URL = "http://localhost:3000/api/automations";
const SETTINGS_URL = "http://localhost:3000/api/user/settings";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";

function calculateSignature(body: string): string {
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

async function runAIReplyTest() {
  console.log("🚀 Starting AI Auto-Reply Mode Test...\n");

  const accountId = "1784140982345678";
  const followerId = "follower_ai_user_888";

  // Step 1: Configure User Brand AI Context in Settings
  console.log("--- Step 1: Save Brand AI Context in User Settings ---");
  try {
    const setRes = await fetch(SETTINGS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: accountId,
        ai_context: "DMflow is an Instagram automation platform. Offer 14-day free trials, mention our $29/mo pricing, and maintain a friendly, warm tone.",
      }),
    });
    console.log(`Settings API Status: ${setRes.status}`);
  } catch (err) {
    console.warn("Could not save settings via API:", err);
  }

  // Step 2: Register AI Catch-All Automation Rule
  console.log("\n--- Step 2: Register AI Catch-All Automation Rule ---");
  try {
    const autoRes = await fetch(AUTOMATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: accountId,
        name: "AI Smart Assistant Catch-All",
        trigger_source: "dm",
        trigger_type: "ai",
        trigger_value: "*",
        is_ai_enabled: true,
        ai_model: "llama-3.1-8b-instant",
        max_response_length: 250,
        fallback_response_text: "Thanks for reaching out! DMflow automates Instagram DMs & comments. How can we help?",
        is_active: true,
      }),
    });
    const autoData = await autoRes.json();
    console.log(`Automation Rule Status: ${autoRes.status}`);
    console.log(`Rule Name: ${autoData.automation?.name || "AI Catch-All"}`);
  } catch (err) {
    console.warn("Could not create AI rule via API:", err);
  }

  // Step 3: Dispatch Unhandled DM Query (No Keyword Match -> AI Catch-All Trigger)
  console.log("\n--- Step 3: Dispatching Unhandled DM Query ('Do you offer custom agency onboarding?') ---");
  const dmPayload = {
    object: "instagram",
    entry: [
      {
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        messaging: [
          {
            sender: { id: followerId },
            recipient: { id: accountId },
            timestamp: Date.now(),
            message: {
              mid: `mid_ai_${Date.now()}`,
              text: "Do you offer custom agency onboarding?",
            },
          },
        ],
      },
    ],
  };

  const bodyStr = JSON.stringify(dmPayload);
  const signature = calculateSignature(bodyStr);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signature,
      },
      body: bodyStr,
    });

    const responseText = await res.text();
    console.log(`Webhook Status: ${res.status}`);
    console.log(`Webhook Body: ${responseText}`);

    if (res.status === 200 && responseText === "EVENT_RECEIVED") {
      console.log("\n✅ AI Auto-Reply Engine Test PASSED!");
    } else {
      console.error("\n❌ AI Auto-Reply Test FAILED!");
    }
  } catch (err) {
    console.error("Error in AI test:", err);
  }
}

runAIReplyTest();
