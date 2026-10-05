import crypto from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhook/instagram";
const AUTOMATIONS_URL = "http://localhost:3000/api/automations";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";

function calculateSignature(body: string): string {
  const hmac = crypto.createHmac("sha256", APP_SECRET);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

async function runCommentAndStoryTests() {
  console.log("🚀 Starting Comment & Story Automation Engine Tests...\n");

  const accountId = "1784140982345678";
  const mediaId = "17998877665544332";

  // Step 1: Register Comment Automation Rule targeting mediaId with reply_mode: 'both'
  console.log("--- Test 1: Registering Comment Automation Rule (Target Post: 17998877665544332) ---");
  try {
    const res = await fetch(AUTOMATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: accountId,
        name: "Reel Comment Link Auto-DM & Public Reply",
        trigger_source: "comment",
        trigger_type: "keyword",
        trigger_value: "link, send, info",
        response_text: "Hey! 🚀 Here is the instant access link: https://example.com/checkout",
        public_response_text: "Check your DMs! 📩 Just sent you the private link.",
        reply_mode: "both",
        specific_media_id: mediaId,
        is_active: true,
      }),
    });
    console.log("Comment Rule Creation Status:", res.status);
  } catch (err) {
    console.warn("Could not register comment rule via API:", err);
  }

  // Step 2: Dispatch Signed Comment Webhook Event
  console.log("\n--- Test 2: Dispatching Signed Comment Webhook Event ('link') ---");
  const commentPayload = {
    object: "instagram",
    entry: [
      {
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: "comments",
            value: {
              id: "comment_id_5544332211",
              text: "Can you SEND LINK please?",
              from: {
                id: "follower_user_112233",
                username: "alex_creator",
              },
              media: {
                id: mediaId,
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
    const responseText = await res.text();
    console.log(`Comment Webhook Status: ${res.status}`);
    console.log(`Comment Webhook Response: ${responseText}`);
    if (res.status === 200 && responseText === "EVENT_RECEIVED") {
      console.log("✅ Comment Automation Test PASSED!\n");
    } else {
      console.error("❌ Comment Automation Test FAILED!\n");
    }
  } catch (err) {
    console.error("Error in comment test:", err);
  }

  // Step 3: Dispatch Signed Story Mention Event
  console.log("--- Test 3: Dispatching Signed Story Mention Webhook Event ---");
  const storyMentionPayload = {
    object: "instagram",
    entry: [
      {
        id: accountId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: "mentions",
            value: {
              media_id: "story_media_998877",
              sender_name: "sarah_influencer",
              from: {
                id: "follower_user_445566",
                username: "sarah_influencer",
              },
            },
          },
        ],
      },
    ],
  };

  const storyBody = JSON.stringify(storyMentionPayload);
  const storySig = calculateSignature(storyBody);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": storySig,
      },
      body: storyBody,
    });
    const responseText = await res.text();
    console.log(`Story Mention Webhook Status: ${res.status}`);
    console.log(`Story Mention Webhook Response: ${responseText}`);
    if (res.status === 200 && responseText === "EVENT_RECEIVED") {
      console.log("✅ Story Mention Automation Test PASSED!\n");
    } else {
      console.error("❌ Story Mention Automation Test FAILED!\n");
    }
  } catch (err) {
    console.error("Error in story mention test:", err);
  }
}

runCommentAndStoryTests();
