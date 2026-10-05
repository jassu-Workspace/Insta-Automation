import { getSessionUser } from "../src/lib/session";
import {
  sendInstagramMessage,
  sendInstagramSenderAction,
  replyToInstagramComment,
  fetchUserInstagramMedia,
  getInstagramMediaComments,
} from "../src/lib/instagram";
import { resolveUserId } from "../src/lib/identity-resolver";
import { NextRequest } from "next/server";

// Import API route GET/POST handlers
import { GET as statsGET } from "../src/app/api/stats/route";
import { GET as automationsGET, POST as automationsPOST } from "../src/app/api/automations/route";
import { GET as analyticsGET } from "../src/app/api/analytics/route";
import { GET as insightsGET } from "../src/app/api/insights/route";
import { GET as icebreakersGET, POST as icebreakersPOST } from "../src/app/api/icebreakers/route";
import { GET as rewindGET, POST as rewindPOST } from "../src/app/api/rewind/route";
import { GET as settingsGET, POST as settingsPOST } from "../src/app/api/user/settings/route";
import { POST as sendPOST } from "../src/app/api/inbox/send/route";
import { GET as conversationsGET } from "../src/app/api/inbox/conversations/route";
import { GET as messagesGET } from "../src/app/api/inbox/messages/route";
import { GET as mediaGET } from "../src/app/api/instagram/media/route";
import { POST as webhookPOST } from "../src/app/api/webhook/instagram/route";

async function runVerification() {
  console.log("=================================================");
  console.log("🧪 STARTING BACKEND BUG VERIFICATION SUITE");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST BUG 1: Session Auth on API routes
  // -------------------------------------------------------------
  console.log("--- Testing BUG 1: Session Auth on API Routes ---");
  const dummyUrl = "http://localhost:3000/api/stats";
  const reqNoCookie = new NextRequest(dummyUrl);
  
  const resStatsNoAuth = await statsGET(reqNoCookie);
  assert(resStatsNoAuth.status === 401, "BUG 1: /api/stats returns 401 without session cookie", `Status: ${resStatsNoAuth.status}`);

  const resAutoNoAuth = await automationsGET(new NextRequest("http://localhost:3000/api/automations"));
  assert(resAutoNoAuth.status === 401, "BUG 1: /api/automations returns 401 without session cookie", `Status: ${resAutoNoAuth.status}`);

  const resMediaNoAuth = await mediaGET(new NextRequest("http://localhost:3000/api/instagram/media"));
  assert(resMediaNoAuth.status === 401, "BUG 1: /api/instagram/media returns 401 without session cookie", `Status: ${resMediaNoAuth.status}`);

  // Test WITH session cookie
  const reqWithAuth = new NextRequest(dummyUrl, {
    headers: {
      cookie: `dmflow_session=${encodeURIComponent(JSON.stringify({ id: "real_user_test_999" }))}`,
    },
  });
  const sessionUserId = getSessionUser(reqWithAuth);
  assert(sessionUserId === "real_user_test_999", "BUG 1: getSessionUser successfully reads logged in user ID", `User ID: ${sessionUserId}`);

  const resStatsWithAuth = await statsGET(reqWithAuth);
  assert(resStatsWithAuth.status === 200, "BUG 1: /api/stats returns 200 with valid session cookie", `Status: ${resStatsWithAuth.status}`);
  console.log("");

  // -------------------------------------------------------------
  // TEST BUG 2: Instagram API send functions error reporting
  // -------------------------------------------------------------
  console.log("--- Testing BUG 2: Instagram API send functions error reporting ---");
  const msgRes = await sendInstagramMessage("123", "hello", "bad_token_test");
  assert(msgRes.success === false && typeof msgRes.error === "string", "BUG 2: sendInstagramMessage returns { success: false, error } on failure", `Returned: ${JSON.stringify(msgRes)}`);

  const senderActionRes = await sendInstagramSenderAction("123", "mark_seen", "bad_token_test");
  assert(senderActionRes.success === false && typeof senderActionRes.error === "string", "BUG 2: sendInstagramSenderAction returns { success: false, error } on failure", `Returned: ${JSON.stringify(senderActionRes)}`);

  const commentReplyRes = await replyToInstagramComment("c_123", "reply text", "bad_token_test");
  assert(commentReplyRes.success === false && typeof commentReplyRes.error === "string", "BUG 2: replyToInstagramComment returns { success: false, error } on failure", `Returned: ${JSON.stringify(commentReplyRes)}`);
  console.log("");

  // -------------------------------------------------------------
  // TEST BUG 3 & BUG 5: Webhook unresolved account & no matching automations
  // -------------------------------------------------------------
  console.log("--- Testing BUG 3 & BUG 5: Webhook & Identity Resolver ---");
  const resolvedNull = await resolveUserId("unknown_account_999", {});
  assert(resolvedNull === null, "BUG 5: resolveUserId returns null for unknown account (does not fake ID)", `Resolved ID: ${resolvedNull}`);

  // Test Webhook POST with unknown account
  const crypto = require("crypto");
  const appSecret = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";
  const webhookBody = JSON.stringify({
    object: "instagram",
    entry: [{ id: "unknown_account_999", messaging: [{ sender: { id: "follower_1" }, message: { text: "hello" } }] }],
  });
  const hmac = crypto.createHmac("sha256", appSecret).update(webhookBody).digest("hex");

  const webhookReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: {
      "x-hub-signature-256": `sha256=${hmac}`,
    },
    body: webhookBody,
  });

  const webhookRes = await webhookPOST(webhookReq);
  const webhookText = await webhookRes.text();
  assert(webhookRes.status === 200 && webhookText === "EVENT_RECEIVED", "BUG 5: Webhook returns 200 EVENT_RECEIVED for unresolved account", `Response: ${webhookText}`);
  console.log("");

  // -------------------------------------------------------------
  // TEST BUG 4: Rewind reports real failure status
  // -------------------------------------------------------------
  console.log("--- Testing BUG 4: Rewind route failure reporting ---");
  const rewindReq = new NextRequest("http://localhost:3000/api/rewind", {
    method: "POST",
    headers: {
      cookie: `dmflow_session=${encodeURIComponent(JSON.stringify({ id: "real_user_test_999" }))}`,
    },
    body: JSON.stringify({ automation_id: "non_existent_rule_999" }),
  });
  const rewindRes = await rewindPOST(rewindReq);
  assert(rewindRes.status === 404, "BUG 4: Rewind returns 404 for missing automation rule (no fake completion)", `Status: ${rewindRes.status}`);
  console.log("");

  // -------------------------------------------------------------
  // TEST BUG 7: Media & Comments fetch throw on API failure
  // -------------------------------------------------------------
  console.log("--- Testing BUG 7: Media & Comments fetch throw on failure ---");
  let mediaThrew = false;
  try {
    await fetchUserInstagramMedia("invalid_access_token_777");
  } catch (err: any) {
    mediaThrew = true;
    assert(true, "BUG 7: fetchUserInstagramMedia throws error on API failure", `Error caught: ${err.message}`);
  }
  assert(mediaThrew, "BUG 7: fetchUserInstagramMedia did not silently return mock media");

  let commentsThrew = false;
  try {
    await getInstagramMediaComments("media_123", "invalid_access_token_777");
  } catch (err: any) {
    commentsThrew = true;
    assert(true, "BUG 7: getInstagramMediaComments throws error on API failure", `Error caught: ${err.message}`);
  }
  assert(commentsThrew, "BUG 7: getInstagramMediaComments did not silently return mock comments");
  console.log("");

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("=================================================");
  console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} PASSED`);
  console.log("=================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification script failed with exception:", err);
  process.exit(1);
});
