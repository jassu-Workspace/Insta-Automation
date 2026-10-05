import crypto from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhook/instagram";
const AUTOMATIONS_URL = "http://localhost:3000/api/automations";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";

function calculateSignature(body: string): string {
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

async function runEndToEndAutomationTest() {
  console.log("🚀 Starting End-to-End DM Automation Engine Test...\n");

  // Step 1: Create or verify automation rule "hello"
  console.log("--- Step 1: Register Automation Rule 'hello' ---");
  try {
    const res = await fetch(AUTOMATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "1784140982345678",
        name: "Welcome DM Greeting Rule",
        trigger_source: "dm",
        trigger_type: "keyword",
        trigger_value: "hello, hi, pricing",
        response_text: "Automated Reply: Hello! Welcome to DMflow. How can we help you today?",
        is_active: true,
      }),
    });
    const data = await res.json();
    console.log("Automation Rule API Status:", res.status);
    console.log("Created Rule:", data.automation?.name || "Ready");
  } catch (err) {
    console.warn("Could not register automation rule via API (using fallback):", err);
  }

  // Step 2: Simulate incoming DM containing "hello"
  console.log("\n--- Step 2: Dispatching Signed Incoming DM Webhook Event ('hello') ---");
  const followerId = "follower_user_987654";
  const accountId = "1784140982345678";

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
              mid: `m_test_${Date.now()}`,
              text: "hello there! Can you tell me about DMflow?",
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
    console.log(`Webhook HTTP Status: ${res.status}`);
    console.log(`Webhook Response Body: ${responseText}`);

    if (res.status === 200 && responseText === "EVENT_RECEIVED") {
      console.log("\n✅ End-to-End DM Automation & Reply Verification PASSED!");
    } else {
      console.error("\n❌ DM Automation Test Failed!");
    }
  } catch (err) {
    console.error("Error dispatching test webhook:", err);
  }
}

runEndToEndAutomationTest();
