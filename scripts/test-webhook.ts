import crypto from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhook/instagram";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123";

/**
 * Calculates HMAC-SHA256 signature for body
 */
function calculateSignature(body: string): string {
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

async function runTests() {
  console.log("🚀 Starting Instagram Webhook Engine Local Tests...\n");

  // Test 1: GET Verification Handshake
  console.log("--- Test 1: Meta GET Verification Handshake ---");
  const challenge = "test_challenge_code_999";
  const handshakeUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}&hub.challenge=${challenge}`;
  
  try {
    const res = await fetch(handshakeUrl);
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response Body: ${text}`);
    if (res.status === 200 && text === challenge) {
      console.log("✅ GET Verification Handshake PASSED!\n");
    } else {
      console.error("❌ GET Verification Handshake FAILED!\n");
    }
  } catch (err) {
    console.error("Error connecting to dev server for GET handshake:", err);
  }

  // Test 2: POST Invalid HMAC Signature (Security Test)
  console.log("--- Test 2: POST Invalid HMAC Signature Rejection ---");
  try {
    const dummyBody = JSON.stringify({ object: "instagram", entry: [] });
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=invalid_fake_signature_hash",
      },
      body: dummyBody,
    });
    console.log(`Status: ${res.status} (Expected 401)`);
    if (res.status === 401) {
      console.log("✅ Invalid Signature Security Check PASSED!\n");
    } else {
      console.error("❌ Invalid Signature Security Check FAILED!\n");
    }
  } catch (err) {
    console.error("Error in Test 2:", err);
  }

  // Test 3: POST Valid Comment Event Payload
  console.log("--- Test 3: POST Valid Signed Comment Webhook Event ---");
  const commentPayload = {
    object: "instagram",
    entry: [
      {
        id: "1784140982345678",
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: "comments",
            value: {
              id: "18012345678901234",
              text: "SEND LINK please!",
              from: {
                id: "1784141112223334",
                username: "test_follower_user",
              },
              media: {
                id: "17998877665544332",
                media_product_type: "REELS",
              },
            },
          },
        ],
      },
    ],
  };

  const commentBody = JSON.stringify(commentPayload);
  const commentSig = calculateSignature(commentBody);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": commentSig,
      },
      body: commentBody,
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    if (res.status === 200 && text === "EVENT_RECEIVED") {
      console.log("✅ Comment Webhook Event PASSED!\n");
    } else {
      console.error("❌ Comment Webhook Event FAILED!\n");
    }
  } catch (err) {
    console.error("Error in Test 3:", err);
  }

  // Test 4: POST Valid DM Message Payload
  console.log("--- Test 4: POST Valid Signed Direct Message Webhook Event ---");
  const dmPayload = {
    object: "instagram",
    entry: [
      {
        id: "1784140982345678",
        time: Math.floor(Date.now() / 1000),
        messaging: [
          {
            sender: { id: "178414999888777" },
            recipient: { id: "1784140982345678" },
            timestamp: Date.now(),
            message: {
              mid: "m_mid_123456",
              text: "Hey! What is the price of your VIP course?",
            },
          },
        ],
      },
    ],
  };

  const dmBody = JSON.stringify(dmPayload);
  const dmSig = calculateSignature(dmBody);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": dmSig,
      },
      body: dmBody,
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    if (res.status === 200 && text === "EVENT_RECEIVED") {
      console.log("✅ Direct Message Webhook Event PASSED!\n");
    } else {
      console.error("❌ Direct Message Webhook Event FAILED!\n");
    }
  } catch (err) {
    console.error("Error in Test 4:", err);
  }
}

runTests();
