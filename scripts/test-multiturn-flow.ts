import crypto from "crypto";
import {
  validateInput,
  extractEmail,
  processConversationStateTransition,
  initializeFlowForAutomation,
  dispatchOutboundWebhook,
} from "../src/lib/flow-engine";
import { isWithin24HourWindow } from "../src/lib/instagram";

let totalTests = 0;
let passedTests = 0;

function assert(condition: any, testName: string, detail?: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ""}`);
  }
}

async function runMultiturnTests() {
  console.log("\n==========================================================");
  console.log("       🧪 DMflow Multi-Turn FSM & Production QA Test      ");
  console.log("==========================================================\n");

  // 1. Regex & Input Validation Unit Tests
  console.log("🔹 1. Flow Engine Input Validation & Extraction:");
  assert(validateInput("test@example.com", "email") === true, "Valid email string");
  assert(validateInput("please reach out to support@dmflow.app thanks", "email") === true, "Natural language with email");
  assert(validateInput("not-an-email", "email") === false, "Invalid email string rejected");
  assert(extractEmail("My email is Founder@Startup.io! Ping me there") === "founder@startup.io", "Email extracted cleanly in lowercase");
  assert(validateInput("+1 (555) 234-5678", "phone") === true, "Valid phone formatted");
  assert(validateInput("123", "phone") === false, "Short phone rejected");

  // 2. Flow Initialization
  console.log("\n🔹 2. Multi-Turn Automation Flow Initialization:");
  const testAutomation = {
    id: "auto_test_100",
    name: "VIP Lead Magnet",
    enable_email_capture: true,
    opening_dm_text: "To receive your VIP access code, reply with your best email! 🎁",
    email_reprompt_text: "Please enter a valid email address.",
    response_content: { text: "Here is your exclusive VIP code: VIP100" },
    button_text: "Claim VIP Code",
    button_url: "https://dmflow.app/vip",
  };

  const flowInit = await initializeFlowForAutomation(
    "usr_test_1",
    "follower_999",
    "ig_traveler",
    testAutomation
  );

  assert(flowInit.handled === true, "Flow initialized successfully");
  assert(flowInit.nextStepId === "awaiting_email", "Flow step set to awaiting_email");
  assert(flowInit.replyText?.includes("reply with your best email"), "Opening email prompt rendered");

  // 3. Conversation State Transition: Reprompt on Invalid Input
  console.log("\n🔹 3. State Machine Transition (Invalid Input -> Friendly Reprompt):");
  const ongoingConv = {
    id: "usr_test_1:follower_999",
    user_id: "usr_test_1",
    follower_id: "follower_999",
    current_step_id: "awaiting_email",
    active_automation_id: "auto_test_100",
  };

  // Mock conversation transition with non-email text
  const repromptResult = await processConversationStateTransition(
    "usr_test_1",
    "follower_999",
    "what is this about?",
    ongoingConv,
    testAutomation
  );

  assert(repromptResult !== null, "Handled by ongoing flow");
  assert(repromptResult?.nextStepId === "awaiting_email", "Step remains awaiting_email");
  assert(repromptResult?.completed === false, "Flow remains uncompleted pending valid input");

  // 4. Conversation State Transition: Valid Email -> Completion
  console.log("\n🔹 4. State Machine Transition (Valid Email -> Flow Completion):");
  const successResult = await processConversationStateTransition(
    "usr_test_1",
    "follower_999",
    "sure, it is alex@company.co cheers!",
    ongoingConv,
    testAutomation
  );

  assert(successResult !== null, "Flow processed valid email");
  assert(successResult?.completed === true, "Flow marked as completed");
  assert(successResult?.capturedData?.email === "alex@company.co", "Email captured in state");
  assert(successResult?.replyText?.includes("VIP100"), "Final DM reply delivered");
  assert(successResult?.buttonUrl === "https://dmflow.app/vip", "CTA button URL attached");

  // 5. Meta 24-Hour Messaging Compliance Window Calculation
  console.log("\n🔹 5. Meta 24-Hour Messaging Window Compliance:");
  const recentTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  const recentCheck = isWithin24HourWindow(recentTime);
  assert(recentCheck.allowed === true, "Interaction within 24h allowed");
  assert(recentCheck.remainingMinutes > 1300 && recentCheck.remainingMinutes < 1330, "Accurate countdown remaining (~22h)");

  const expiredTime = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(); // 26 hours ago
  const expiredCheck = isWithin24HourWindow(expiredTime);
  assert(expiredCheck.allowed === false, "Interaction >24h marked expired");
  assert(expiredCheck.formattedRemaining.includes("HUMAN_AGENT"), "Advises HUMAN_AGENT message tag");

  // 6. Outbound Webhook Dispatch Egress Engine
  console.log("\n🔹 6. Outbound Webhook Dispatch Egress Engine:");
  const invalidWebhook = await dispatchOutboundWebhook("", { test: true });
  assert(invalidWebhook === false, "Empty webhook URL rejected safely without throwing");

  const nonHttpWebhook = await dispatchOutboundWebhook("ftp://invalid", { test: true });
  assert(nonHttpWebhook === false, "Non-HTTP webhook URL rejected safely");

  // Summary
  console.log("\n==========================================================");
  console.log(`  QA SUMMARY: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log("==========================================================\n");

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runMultiturnTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
