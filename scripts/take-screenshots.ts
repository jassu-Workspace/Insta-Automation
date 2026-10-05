import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function takeScreenshots() {
  console.log("📸 Starting screenshot capture...");
  const browser = await chromium.launch({ headless: true });

  const outputDir = path.join(process.cwd(), "public", "screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Context without session for landing page
  const publicContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const landingPage = await publicContext.newPage();
  await landingPage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await landingPage.screenshot({ path: path.join(outputDir, "landing.png") });
  console.log("  ✅ Saved public/screenshots/landing.png");
  await publicContext.close();

  // Context WITH session cookie for dashboard pages
  const authContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await authContext.addCookies([
    {
      name: "dmflow_session",
      value: JSON.stringify({ id: "demo_user_123", username: "your_username" }),
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await authContext.newPage();
  await page.goto("http://localhost:3000/api/automations", { waitUntil: "networkidle" });
  
  // Seed sample automation for clean display
  await page.evaluate(async () => {
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Reel Comment Checkout Link",
        trigger_source: "comment",
        trigger_type: "keyword",
        trigger_value: "link, shop",
        response_text: "Hey! 🚀 Here is the instant access checkout link with 15% OFF applied: https://dmflow.app/checkout",
        public_response_text: "Sent you the direct link in DMs! 📩",
        reply_mode: "both",
        is_active: true,
      }),
    });
  });

  // 1. Dashboard Home Screenshot
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "dashboard.png") });
  console.log("  ✅ Saved public/screenshots/dashboard.png");

  // 2. Automations List Screenshot
  await page.goto("http://localhost:3000/dashboard/automations", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "automations.png") });
  console.log("  ✅ Saved public/screenshots/automations.png");

  // 3. Builder Page Screenshot
  await page.goto("http://localhost:3000/dashboard/automations/builder?template=tpl_1", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "builder.png") });
  console.log("  ✅ Saved public/screenshots/builder.png");

  // 4. Templates Page Screenshot
  await page.goto("http://localhost:3000/dashboard/templates", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "templates.png") });
  console.log("  ✅ Saved public/screenshots/templates.png");

  // 5. Rewind Page Screenshot
  await page.goto("http://localhost:3000/dashboard/rewind", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "rewind.png") });
  console.log("  ✅ Saved public/screenshots/rewind.png");

  // 6. Analytics Page Screenshot
  await page.goto("http://localhost:3000/dashboard/analytics", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "analytics.png") });
  console.log("  ✅ Saved public/screenshots/analytics.png");

  // 7. Audience Insights Page Screenshot
  await page.goto("http://localhost:3000/dashboard/insights", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "insights.png") });
  console.log("  ✅ Saved public/screenshots/insights.png");

  // 8. Contacts Page Screenshot
  await page.goto("http://localhost:3000/dashboard/contacts", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "contacts.png") });
  console.log("  ✅ Saved public/screenshots/contacts.png");

  await authContext.close();
  await browser.close();
  console.log("🎉 All 8 screenshots captured successfully!");
}

takeScreenshots().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
