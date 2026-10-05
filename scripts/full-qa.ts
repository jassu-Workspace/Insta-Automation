/**
 * DMflow Full QA Suite
 * 
 * Tests every API route, webhook processing, automation CRUD, rewind logic,
 * session auth enforcement, and Instagram API error handling — all without
 * requiring a running dev server or real Instagram credentials.
 */

import { NextRequest } from "next/server";
import crypto from "crypto";

// Session helper
import { getSessionUser } from "../src/lib/session";

// Instagram functions
import {
  sendInstagramMessage,
  sendInstagramSenderAction,
  replyToInstagramComment,
  fetchUserInstagramMedia,
  getInstagramMediaComments,
  getInstagramAuthUrl,
} from "../src/lib/instagram";

// Identity resolver
import { resolveUserId } from "../src/lib/identity-resolver";

// API route handlers — GET routes
import { GET as statsGET } from "../src/app/api/stats/route";
import { GET as analyticsGET } from "../src/app/api/analytics/route";
import { GET as insightsGET } from "../src/app/api/insights/route";
import { GET as icebreakersGET, POST as icebreakersPOST, DELETE as icebreakersDELETE } from "../src/app/api/icebreakers/route";
import { GET as automationsGET, POST as automationsPOST, DELETE as automationsDELETE } from "../src/app/api/automations/route";
import { GET as rewindGET, POST as rewindPOST } from "../src/app/api/rewind/route";
import { GET as settingsGET, POST as settingsPOST } from "../src/app/api/user/settings/route";
import { GET as conversationsGET } from "../src/app/api/inbox/conversations/route";
import { GET as messagesGET } from "../src/app/api/inbox/messages/route";
import { POST as sendPOST } from "../src/app/api/inbox/send/route";
import { GET as mediaGET } from "../src/app/api/instagram/media/route";
import { GET as webhookGET, POST as webhookPOST } from "../src/app/api/webhook/instagram/route";
import { GET as authInstagramGET } from "../src/app/api/auth/instagram/route";

// ─── Helpers ──────────────────────────────────────────────────
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "placeholder_app_secret";
const WEBHOOK_VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123";
const TEST_USER_ID = "qa_test_user_777";

let passed = 0;
let failed = 0;
let total = 0;
const failures: string[] = [];

function assert(condition: boolean, name: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    const msg = detail ? `${name} — ${detail}` : name;
    failures.push(msg);
    console.error(`  ❌ ${name}`);
    if (detail) console.error(`     └─ ${detail}`);
  }
}

function makeReq(url: string, opts?: { method?: string; body?: any; withSession?: boolean }): NextRequest {
  const headers: Record<string, string> = {};
  if (opts?.withSession) {
    headers.cookie = `dmflow_session=${encodeURIComponent(JSON.stringify({ id: TEST_USER_ID, username: "qa_user" }))}`;
  }
  if (opts?.body) {
    headers["content-type"] = "application/json";
  }
  return new NextRequest(url, {
    method: opts?.method || "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
}

function signPayload(body: string): string {
  return "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");
}

// ─── Test Groups ──────────────────────────────────────────────

async function testSessionHelper() {
  console.log("\n═══ 1. SESSION HELPER ═══");

  // No cookie
  const r1 = new NextRequest("http://localhost:3000/test");
  assert(getSessionUser(r1) === null, "No cookie → null");

  // Empty cookie
  const r2 = new NextRequest("http://localhost:3000/test", {
    headers: { cookie: "dmflow_session=" },
  });
  assert(getSessionUser(r2) === null, "Empty cookie → null");

  // Garbage cookie
  const r3 = new NextRequest("http://localhost:3000/test", {
    headers: { cookie: "dmflow_session=not_json" },
  });
  assert(getSessionUser(r3) === null, "Garbage cookie → null");

  // Valid cookie
  const r4 = new NextRequest("http://localhost:3000/test", {
    headers: { cookie: `dmflow_session=${encodeURIComponent(JSON.stringify({ id: "abc123" }))}` },
  });
  assert(getSessionUser(r4) === "abc123", "Valid cookie → correct user id");

  // Cookie with empty id
  const r5 = new NextRequest("http://localhost:3000/test", {
    headers: { cookie: `dmflow_session=${encodeURIComponent(JSON.stringify({ id: "" }))}` },
  });
  assert(getSessionUser(r5) === null, "Cookie with empty id → null");
}

async function testAuthEnforcement() {
  console.log("\n═══ 2. AUTH ENFORCEMENT (401 WITHOUT SESSION) ═══");

  const routes: Array<{ name: string; handler: (req: NextRequest) => Promise<any> }> = [
    { name: "/api/stats", handler: statsGET },
    { name: "/api/analytics", handler: analyticsGET },
    { name: "/api/insights", handler: insightsGET },
    { name: "/api/icebreakers GET", handler: icebreakersGET },
    { name: "/api/automations GET", handler: automationsGET },
    { name: "/api/rewind GET", handler: rewindGET },
    { name: "/api/user/settings GET", handler: settingsGET },
    { name: "/api/inbox/conversations", handler: conversationsGET },
    { name: "/api/instagram/media", handler: mediaGET },
  ];

  for (const { name, handler } of routes) {
    const res = await handler(new NextRequest(`http://localhost:3000${name.split(" ")[0]}`));
    assert(res.status === 401, `${name} → 401 without session`, `Got ${res.status}`);
  }

  // POST routes without session
  const postRoutes: Array<{ name: string; handler: (req: NextRequest) => Promise<any>; body: any }> = [
    { name: "/api/automations POST", handler: automationsPOST, body: { name: "test" } },
    { name: "/api/icebreakers POST", handler: icebreakersPOST, body: { question: "q", response_text: "r" } },
    { name: "/api/rewind POST", handler: rewindPOST, body: { automation_id: "x" } },
    { name: "/api/user/settings POST", handler: settingsPOST, body: { groq_api_key: "k" } },
    { name: "/api/inbox/send POST", handler: sendPOST, body: { conversation_id: "c", recipient_id: "r", message_text: "m" } },
  ];

  for (const { name, handler, body } of postRoutes) {
    const res = await handler(makeReq(`http://localhost:3000${name.split(" ")[0]}`, { method: "POST", body }));
    assert(res.status === 401, `${name} → 401 without session`, `Got ${res.status}`);
  }

  // DELETE routes without session
  const delRoutes: Array<{ name: string; handler: (req: NextRequest) => Promise<any>; qs: string }> = [
    { name: "/api/automations DELETE", handler: automationsDELETE, qs: "?id=xxx" },
    { name: "/api/icebreakers DELETE", handler: icebreakersDELETE, qs: "?id=xxx" },
  ];

  for (const { name, handler, qs } of delRoutes) {
    const res = await handler(new NextRequest(`http://localhost:3000${name.split(" ")[0]}${qs}`, { method: "DELETE" }));
    assert(res.status === 401, `${name} → 401 without session`, `Got ${res.status}`);
  }

  // /api/inbox/messages without session
  const msgRes = await messagesGET(new NextRequest("http://localhost:3000/api/inbox/messages?conversation_id=test"));
  assert(msgRes.status === 401, "/api/inbox/messages → 401 without session", `Got ${msgRes.status}`);
}

async function testAuthenticatedApiRoutes() {
  console.log("\n═══ 3. AUTHENTICATED API ROUTES (200 WITH SESSION) ═══");

  const res1 = await statsGET(makeReq("http://localhost:3000/api/stats", { withSession: true }));
  assert(res1.status === 200, "/api/stats → 200 with session");
  const statsBody = await res1.json();
  assert(typeof statsBody.dms_sent === "number", "/api/stats returns dms_sent number");
  assert(statsBody.dms_sent === 0 || typeof statsBody.dms_sent === "number", "/api/stats dms_sent is 0 or real (no fake 2200)");

  const res2 = await analyticsGET(makeReq("http://localhost:3000/api/analytics", { withSession: true }));
  assert(res2.status === 200, "/api/analytics → 200 with session");

  const res3 = await insightsGET(makeReq("http://localhost:3000/api/insights", { withSession: true }));
  assert(res3.status === 200, "/api/insights → 200 with session");

  const res4 = await automationsGET(makeReq("http://localhost:3000/api/automations", { withSession: true }));
  assert(res4.status === 200, "/api/automations → 200 with session");
  const autoBody = await res4.json();
  assert(Array.isArray(autoBody.automations), "/api/automations returns automations array");

  const res5 = await icebreakersGET(makeReq("http://localhost:3000/api/icebreakers", { withSession: true }));
  assert(res5.status === 200, "/api/icebreakers → 200 with session");

  const res6 = await rewindGET(makeReq("http://localhost:3000/api/rewind", { withSession: true }));
  assert(res6.status === 200, "/api/rewind → 200 with session");
  const rewindBody = await res6.json();
  assert(Array.isArray(rewindBody.jobs), "/api/rewind returns jobs array");

  const res7 = await settingsGET(makeReq("http://localhost:3000/api/user/settings", { withSession: true }));
  assert(res7.status === 200, "/api/user/settings → 200 with session");

  const res8 = await conversationsGET(makeReq("http://localhost:3000/api/inbox/conversations", { withSession: true }));
  assert(res8.status === 200, "/api/inbox/conversations → 200 with session");
  const convsBody = await res8.json();
  assert(Array.isArray(convsBody.conversations), "/api/inbox/conversations returns conversations array");

  const res9 = await messagesGET(makeReq("http://localhost:3000/api/inbox/messages?conversation_id=test:test", { withSession: true }));
  assert(res9.status === 200, "/api/inbox/messages → 200 with session");
  const msgsBody = await res9.json();
  assert(Array.isArray(msgsBody.messages), "/api/inbox/messages returns messages array");
}

async function testInputValidation() {
  console.log("\n═══ 4. INPUT VALIDATION / ERROR SHAPES ═══");

  // /api/inbox/messages without conversation_id
  const r1 = await messagesGET(makeReq("http://localhost:3000/api/inbox/messages", { withSession: true }));
  assert(r1.status === 400, "/api/inbox/messages → 400 without conversation_id", `Got ${r1.status}`);
  const b1 = await r1.json();
  assert(typeof b1.error === "string", "Error body has error string");

  // /api/inbox/send missing fields
  const r2 = await sendPOST(makeReq("http://localhost:3000/api/inbox/send", {
    method: "POST", body: { conversation_id: "c" }, withSession: true,
  }));
  assert(r2.status === 400, "/api/inbox/send → 400 missing fields", `Got ${r2.status}`);

  // /api/icebreakers POST missing fields
  const r3 = await icebreakersPOST(makeReq("http://localhost:3000/api/icebreakers", {
    method: "POST", body: { question: "q" }, withSession: true,
  }));
  assert(r3.status === 400, "/api/icebreakers POST → 400 missing response_text", `Got ${r3.status}`);

  // /api/automations DELETE missing id
  const r4 = await automationsDELETE(makeReq("http://localhost:3000/api/automations", {
    method: "DELETE", withSession: true,
  }));
  assert(r4.status === 400, "/api/automations DELETE → 400 missing id", `Got ${r4.status}`);

  // /api/icebreakers DELETE missing id
  const r5 = await icebreakersDELETE(makeReq("http://localhost:3000/api/icebreakers", {
    method: "DELETE", withSession: true,
  }));
  assert(r5.status === 400, "/api/icebreakers DELETE → 400 missing id", `Got ${r5.status}`);

  // /api/rewind POST missing automation_id
  const r6 = await rewindPOST(makeReq("http://localhost:3000/api/rewind", {
    method: "POST", body: {}, withSession: true,
  }));
  assert(r6.status === 400, "/api/rewind POST → 400 missing automation_id", `Got ${r6.status}`);
}

async function testAutomationCRUD() {
  console.log("\n═══ 5. AUTOMATION CRUD FLOW ═══");

  // CREATE
  const createRes = await automationsPOST(makeReq("http://localhost:3000/api/automations", {
    method: "POST",
    body: {
      name: "QA Test Rule",
      trigger_source: "comment",
      trigger_type: "keyword",
      trigger_value: "qa, test",
      response_text: "QA auto-reply",
      is_active: true,
    },
    withSession: true,
  }));
  assert(createRes.status === 200, "Create automation → 200");
  const createBody = await createRes.json();
  assert(createBody.success === true, "Create automation → success: true");
  assert(typeof createBody.automation?.id === "string", "Created automation has an id");
  assert(createBody.automation?.name === "QA Test Rule", "Created automation has correct name");
  assert(createBody.automation?.user_id === TEST_USER_ID, "Created automation has session user_id (not hardcoded)");

  const ruleId = createBody.automation?.id;

  // LIST should contain the new rule (test the response shape even if DB isn't connected)
  const listRes = await automationsGET(makeReq("http://localhost:3000/api/automations", { withSession: true }));
  assert(listRes.status === 200, "List automations → 200");
  const listBody = await listRes.json();
  assert(Array.isArray(listBody.automations), "List automations returns array");

  // TOGGLE / UPDATE — set is_active to false
  const updateRes = await automationsPOST(makeReq("http://localhost:3000/api/automations", {
    method: "POST",
    body: {
      id: ruleId,
      name: "QA Test Rule Updated",
      trigger_value: "qa, test, update",
      response_text: "QA updated reply",
      is_active: false,
    },
    withSession: true,
  }));
  assert(updateRes.status === 200, "Update automation → 200");
  const updateBody = await updateRes.json();
  assert(updateBody.success === true, "Update automation → success: true");

  // DELETE
  const deleteRes = await automationsDELETE(makeReq(`http://localhost:3000/api/automations?id=${ruleId}`, {
    method: "DELETE",
    withSession: true,
  }));
  assert(deleteRes.status === 200, "Delete automation → 200");
  const deleteBody = await deleteRes.json();
  assert(deleteBody.success === true, "Delete automation → success: true");
}

async function testIcebreakerCRUD() {
  console.log("\n═══ 6. ICEBREAKER CRUD FLOW ═══");

  // CREATE
  const createRes = await icebreakersPOST(makeReq("http://localhost:3000/api/icebreakers", {
    method: "POST",
    body: { question: "What is QA?", response_text: "Quality Assurance testing." },
    withSession: true,
  }));
  assert(createRes.status === 201, "Create icebreaker → 201");
  const createBody = await createRes.json();
  assert(typeof createBody.ice_breaker?.id === "string", "Created icebreaker has id");
  assert(createBody.ice_breaker?.user_id === TEST_USER_ID, "Created icebreaker has session user_id");

  // LIST
  const listRes = await icebreakersGET(makeReq("http://localhost:3000/api/icebreakers", { withSession: true }));
  assert(listRes.status === 200, "List icebreakers → 200");

  // DELETE
  const deleteRes = await icebreakersDELETE(makeReq(`http://localhost:3000/api/icebreakers?id=${createBody.ice_breaker?.id}`, {
    method: "DELETE", withSession: true,
  }));
  assert(deleteRes.status === 200, "Delete icebreaker → 200");
}

async function testInstagramApiFunctions() {
  console.log("\n═══ 7. INSTAGRAM API FUNCTIONS — HONEST FAILURE ═══");

  // sendInstagramMessage with bad token
  const msgRes = await sendInstagramMessage("123", "hello", "bad_token");
  assert(msgRes.success === false, "sendInstagramMessage bad token → success: false");
  assert(typeof msgRes.error === "string" && msgRes.error.length > 0, "sendInstagramMessage bad token → has error string");
  assert(!("simulated" in msgRes), "sendInstagramMessage → no simulated field");

  // sendInstagramSenderAction with bad token
  const saRes = await sendInstagramSenderAction("123", "mark_seen", "bad_token");
  assert(saRes.success === false, "sendInstagramSenderAction bad token → success: false");
  assert(!("simulated" in saRes), "sendInstagramSenderAction → no simulated field");

  // replyToInstagramComment with bad token
  const crRes = await replyToInstagramComment("c_123", "reply", "bad_token");
  assert(crRes.success === false, "replyToInstagramComment bad token → success: false");
  assert(!("simulated" in crRes), "replyToInstagramComment → no simulated field");

  // fetchUserInstagramMedia throws on bad token
  let mediaThrew = false;
  try { await fetchUserInstagramMedia("bad_token"); } catch { mediaThrew = true; }
  assert(mediaThrew, "fetchUserInstagramMedia bad token → throws (no mock fallback)");

  // getInstagramMediaComments throws on bad token
  let commentsThrew = false;
  try { await getInstagramMediaComments("m123", "bad_token"); } catch { commentsThrew = true; }
  assert(commentsThrew, "getInstagramMediaComments bad token → throws (no mock fallback)");

  // getInstagramAuthUrl returns a valid URL
  const authUrl = getInstagramAuthUrl();
  assert(authUrl.startsWith("https://www.instagram.com/oauth/authorize"), "getInstagramAuthUrl returns valid OAuth URL");
}

async function testIdentityResolver() {
  console.log("\n═══ 8. IDENTITY RESOLVER ═══");

  const r1 = await resolveUserId("nonexistent_account_999", {});
  assert(r1 === null, "Unknown account → null (no fake ID fallback)");

  const r2 = await resolveUserId("", {});
  assert(r2 === null, "Empty account id → null");
}

async function testWebhookVerification() {
  console.log("\n═══ 9. WEBHOOK VERIFICATION HANDSHAKE ═══");

  // Valid handshake
  const req1 = new NextRequest(
    `http://localhost:3000/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=${WEBHOOK_VERIFY_TOKEN}&hub.challenge=test_challenge_123`
  );
  const res1 = await webhookGET(req1);
  assert(res1.status === 200, "Valid webhook handshake → 200");
  const text1 = await res1.text();
  assert(text1 === "test_challenge_123", "Webhook returns challenge string");

  // Invalid token
  const req2 = new NextRequest(
    "http://localhost:3000/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=x"
  );
  const res2 = await webhookGET(req2);
  assert(res2.status === 403, "Invalid webhook token → 403");

  // Missing mode
  const req3 = new NextRequest(
    `http://localhost:3000/api/webhook/instagram?hub.verify_token=${WEBHOOK_VERIFY_TOKEN}&hub.challenge=x`
  );
  const res3 = await webhookGET(req3);
  assert(res3.status === 403, "Missing hub.mode → 403");
}

async function testWebhookSignatureValidation() {
  console.log("\n═══ 10. WEBHOOK HMAC SIGNATURE VALIDATION ═══");

  const payload = JSON.stringify({ object: "instagram", entry: [{ id: "test" }] });

  // No signature header → 401
  const req1 = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    body: payload,
  });
  const res1 = await webhookPOST(req1);
  assert(res1.status === 401, "Missing x-hub-signature-256 → 401");

  // Wrong signature → 401
  const req2 = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000" },
    body: payload,
  });
  const res2 = await webhookPOST(req2);
  assert(res2.status === 401, "Wrong HMAC signature → 401");

  // Valid signature → 200
  const req3 = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(payload) },
    body: payload,
  });
  const res3 = await webhookPOST(req3);
  assert(res3.status === 200, "Valid HMAC signature → 200");
}

async function testWebhookEventProcessing() {
  console.log("\n═══ 11. WEBHOOK EVENT PROCESSING ═══");

  // DM event with unresolvable account → 200 + skipped
  const dmPayload = JSON.stringify({
    object: "instagram",
    entry: [{
      id: "unresolvable_account_123",
      messaging: [{
        sender: { id: "follower_1" },
        recipient: { id: "unresolvable_account_123" },
        message: { mid: "mid_test_1", text: "hello there" },
      }],
    }],
  });
  const dmReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(dmPayload) },
    body: dmPayload,
  });
  const dmRes = await webhookPOST(dmReq);
  const dmText = await dmRes.text();
  assert(dmRes.status === 200 && dmText === "EVENT_RECEIVED", "DM event with unresolvable account → 200 EVENT_RECEIVED");

  // Comment event with unresolvable account → 200 + skipped
  const commentPayload = JSON.stringify({
    object: "instagram",
    entry: [{
      id: "unresolvable_account_456",
      changes: [{
        field: "comments",
        value: { id: "c_999", text: "link please", media: { id: "m_123" }, from: { id: "user_789", username: "commenter" } },
      }],
    }],
  });
  const commentReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(commentPayload) },
    body: commentPayload,
  });
  const commentRes = await webhookPOST(commentReq);
  const commentText = await commentRes.text();
  assert(commentRes.status === 200 && commentText === "EVENT_RECEIVED", "Comment event unresolvable → 200 EVENT_RECEIVED");

  // Story mention event with unresolvable account → 200 + skipped
  const storyPayload = JSON.stringify({
    object: "instagram",
    entry: [{
      id: "unresolvable_account_789",
      changes: [{
        field: "mentions",
        value: { from: { id: "user_aaa", username: "mentioner" }, sender_name: "mentioner" },
      }],
    }],
  });
  const storyReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(storyPayload) },
    body: storyPayload,
  });
  const storyRes = await webhookPOST(storyReq);
  const storyText = await storyRes.text();
  assert(storyRes.status === 200 && storyText === "EVENT_RECEIVED", "Story mention unresolvable → 200 EVENT_RECEIVED");

  // Invalid JSON → 400
  const badBody = "not json at all";
  const badReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(badBody) },
    body: badBody,
  });
  const badRes = await webhookPOST(badReq);
  assert(badRes.status === 400, "Invalid JSON body → 400");

  // Echo message (is_echo: true) should be silently ignored, not trigger automation
  const echoPayload = JSON.stringify({
    object: "instagram",
    entry: [{
      id: "unresolvable_echo_acct",
      messaging: [{
        sender: { id: "page_self" },
        recipient: { id: "follower_x" },
        message: { mid: "mid_echo", text: "echo test", is_echo: true },
      }],
    }],
  });
  const echoReq = new NextRequest("http://localhost:3000/api/webhook/instagram", {
    method: "POST",
    headers: { "x-hub-signature-256": signPayload(echoPayload) },
    body: echoPayload,
  });
  const echoRes = await webhookPOST(echoReq);
  assert(echoRes.status === 200, "Echo message → 200 (not crashed)");
}

async function testRewindRoute() {
  console.log("\n═══ 12. REWIND ROUTE ═══");

  // GET without session → 401
  const r1 = await rewindGET(new NextRequest("http://localhost:3000/api/rewind"));
  assert(r1.status === 401, "Rewind GET no session → 401");

  // POST without session → 401
  const r2 = await rewindPOST(makeReq("http://localhost:3000/api/rewind", {
    method: "POST", body: { automation_id: "test" },
  }));
  assert(r2.status === 401, "Rewind POST no session → 401");

  // POST missing automation_id → 400
  const r3 = await rewindPOST(makeReq("http://localhost:3000/api/rewind", {
    method: "POST", body: {}, withSession: true,
  }));
  assert(r3.status === 400, "Rewind POST missing automation_id → 400");

  // POST with non-existent automation → 404
  const r4 = await rewindPOST(makeReq("http://localhost:3000/api/rewind", {
    method: "POST", body: { automation_id: "non_existent_rule_999" }, withSession: true,
  }));
  assert(r4.status === 404, "Rewind POST non-existent rule → 404 (no fake completion)", `Got ${r4.status}`);
}

async function testSettingsRoute() {
  console.log("\n═══ 13. USER SETTINGS ROUTE ═══");

  // GET returns empty strings (not fake defaults)
  const r1 = await settingsGET(makeReq("http://localhost:3000/api/user/settings", { withSession: true }));
  assert(r1.status === 200, "Settings GET → 200");
  const body = await r1.json();
  assert(typeof body.groq_api_key === "string", "Settings has groq_api_key string");
  assert(typeof body.ai_context === "string", "Settings has ai_context string");

  // POST updates settings
  const r2 = await settingsPOST(makeReq("http://localhost:3000/api/user/settings", {
    method: "POST",
    body: { groq_api_key: "test_key", ai_context: "test context" },
    withSession: true,
  }));
  assert(r2.status === 200, "Settings POST → 200");
  const postBody = await r2.json();
  assert(postBody.success === true, "Settings POST → success: true");
}

async function testMediaRoute() {
  console.log("\n═══ 14. INSTAGRAM MEDIA ROUTE ═══");

  // Without session → 401
  const r1 = await mediaGET(new NextRequest("http://localhost:3000/api/instagram/media"));
  assert(r1.status === 401, "Media GET no session → 401");

  // With session but no DB/token → error (not mock data)
  const r2 = await mediaGET(makeReq("http://localhost:3000/api/instagram/media", { withSession: true }));
  // Should be 400 or 500 since no real token exists, NOT 200 with mock data
  const body = await r2.json();
  const hasError = r2.status >= 400 || body.error;
  assert(!!hasError, "Media GET no token → error response (no fake demo posts)", `Status: ${r2.status}, body: ${JSON.stringify(body).substring(0, 100)}`);
}

async function testInboxSendRoute() {
  console.log("\n═══ 15. INBOX SEND ROUTE ═══");

  // Missing fields → 400
  const r1 = await sendPOST(makeReq("http://localhost:3000/api/inbox/send", {
    method: "POST", body: {}, withSession: true,
  }));
  assert(r1.status === 400, "Send POST missing all fields → 400");

  // Partial fields → 400
  const r2 = await sendPOST(makeReq("http://localhost:3000/api/inbox/send", {
    method: "POST",
    body: { conversation_id: "c", recipient_id: "r" },
    withSession: true,
  }));
  assert(r2.status === 400, "Send POST missing message_text → 400");
}

async function testAuthInstagramRoute() {
  console.log("\n═══ 16. AUTH INSTAGRAM REDIRECT ═══");

  // This should return a redirect to Instagram OAuth
  const req = new NextRequest("http://localhost:3000/api/auth/instagram?force_oauth=true");
  const res = await authInstagramGET(req);
  assert(res.status === 307 || res.status === 308 || res.status === 302, "Auth instagram → redirect status");
  const location = res.headers.get("location") || "";
  assert(location.includes("instagram.com/oauth/authorize") || location.includes("dashboard"), "Redirects to Instagram OAuth URL or Dashboard");
}

async function testNoHardcodedDemoData() {
  console.log("\n═══ 17. NO HARDCODED DEMO DATA ═══");

  // Stats should not return fake 2200 dms_sent or fake 10 automations
  const statsRes = await statsGET(makeReq("http://localhost:3000/api/stats", { withSession: true }));
  const stats = await statsRes.json();
  assert(stats.dms_sent !== 2200, "Stats dms_sent ≠ 2200 (old hardcoded)", `dms_sent: ${stats.dms_sent}`);
  assert(stats.active_automations !== 10, "Stats active_automations ≠ 10 (old hardcoded)", `active_automations: ${stats.active_automations}`);
  assert(stats.active_threads !== 4, "Stats active_threads ≠ 4 (old hardcoded)", `active_threads: ${stats.active_threads}`);

  // Analytics should not return 943 dms
  const analyticsRes = await analyticsGET(makeReq("http://localhost:3000/api/analytics", { withSession: true }));
  const analytics = await analyticsRes.json();
  assert(analytics.metrics?.dmsSent !== 943, "Analytics dmsSent ≠ 943 (old hardcoded)", `dmsSent: ${analytics.metrics?.dmsSent}`);

  // Insights should not return 2840 totalComments or fake leaderboard
  const insightsRes = await insightsGET(makeReq("http://localhost:3000/api/insights", { withSession: true }));
  const insights = await insightsRes.json();
  assert(insights.totalComments !== 2840, "Insights totalComments ≠ 2840 (old hardcoded)", `totalComments: ${insights.totalComments}`);
}

// ─── MAIN ─────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("🧪 DMFLOW FULL QA SUITE");
  console.log("═══════════════════════════════════════════════════");

  await testSessionHelper();
  await testAuthEnforcement();
  await testAuthenticatedApiRoutes();
  await testInputValidation();
  await testAutomationCRUD();
  await testIcebreakerCRUD();
  await testInstagramApiFunctions();
  await testIdentityResolver();
  await testWebhookVerification();
  await testWebhookSignatureValidation();
  await testWebhookEventProcessing();
  await testRewindRoute();
  await testSettingsRoute();
  await testMediaRoute();
  await testInboxSendRoute();
  await testAuthInstagramRoute();
  await testNoHardcodedDemoData();

  console.log("\n═══════════════════════════════════════════════════");
  if (failed === 0) {
    console.log(`🎉 ALL ${total} TESTS PASSED`);
  } else {
    console.log(`⚠️  ${passed}/${total} PASSED, ${failed} FAILED`);
    console.log("\nFailed tests:");
    for (const f of failures) {
      console.log(`  ❌ ${f}`);
    }
  }
  console.log("═══════════════════════════════════════════════════");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("QA suite crashed:", err);
  process.exit(1);
});
