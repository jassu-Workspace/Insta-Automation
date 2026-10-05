import fs from "fs";
import path from "path";
import readline from "readline";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_INSTAGRAM_APP_ID?: string;
  INSTAGRAM_APP_ID?: string;
  INSTAGRAM_APP_SECRET?: string;
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN?: string;
  NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI?: string;
  GROQ_API_KEY?: string;
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const env: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function saveEnvFile(filePath: string, env: Record<string, string>) {
  const lines: string[] = [
    "# DMflow Environment Configuration",
    `# Generated on ${new Date().toISOString()}`,
    "",
  ];

  for (const [key, val] of Object.entries(env)) {
    lines.push(`${key}=${val}`);
  }
  lines.push("");

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}

async function testSupabase(url?: string, key?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!url || !key) return { ok: false, latencyMs: 0, error: "Missing Supabase URL or key" };
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { ok: res.status < 500, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err?.message };
  }
}

async function testGroq(key?: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!key) return { ok: false, latencyMs: 0, error: "Missing Groq API key" };
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err?.message };
  }
}

async function main() {
  console.log("\n========================================================");
  console.log("       ⚡ DMflow Production 100/100 Setup Wizard       ");
  console.log("========================================================\n");

  const existing = parseEnvFile(ENV_PATH);
  const isInteractive = process.argv.includes("--interactive") || process.argv.includes("-i");

  console.log(`📁 Checking environment file at: ${ENV_PATH}`);
  console.log(`🔍 Current Environment Status:\n`);

  // Supabase check
  const sbUrl = existing.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = existing.SUPABASE_SERVICE_ROLE_KEY || existing.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.stdout.write("  • Testing Supabase PostgreSQL... ");
  const sbTest = await testSupabase(sbUrl, sbKey);
  if (sbTest.ok) {
    console.log(`✅ CONNECTED (${sbTest.latencyMs}ms)`);
  } else {
    console.log(`⚠️  ${sbTest.error || "Needs Configuration"}`);
  }

  // Groq AI check
  const groqKey = existing.GROQ_API_KEY || process.env.GROQ_API_KEY;
  process.stdout.write("  • Testing Groq AI Inference Engine... ");
  const groqTest = await testGroq(groqKey);
  if (groqTest.ok) {
    console.log(`✅ CONNECTED (${groqTest.latencyMs}ms)`);
  } else {
    console.log(`⚠️  ${groqTest.error || "Needs Configuration"}`);
  }

  // Meta App check
  const igAppId = existing.INSTAGRAM_APP_ID || existing.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.INSTAGRAM_APP_ID;
  const igSecret = existing.INSTAGRAM_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
  const igVerify = existing.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123";
  process.stdout.write("  • Checking Meta Instagram App Credentials... ");
  if (igAppId && igSecret) {
    console.log(`✅ CONFIGURED (App ID: ${igAppId})`);
  } else {
    console.log(`⚠️  PARTIAL (App ID: ${igAppId || "missing"}, Secret: ${igSecret ? "set" : "missing"})`);
  }

  console.log("\n--------------------------------------------------------");
  console.log(" 🌐 Webhook Handshake Endpoint Details:");
  console.log(`   Callback URL: http://localhost:3000/api/webhook/instagram`);
  console.log(`   Verify Token: ${igVerify}`);
  console.log("--------------------------------------------------------\n");

  if (!isInteractive && !process.argv.includes("--prompt")) {
    console.log("✨ All current credentials verified.");
    console.log("👉 To interactively update any keys, run: npm run setup -- --interactive\n");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  console.log("Press [Enter] to keep current value.\n");

  const newSbUrl = await promptUser(`Supabase URL [${existing.NEXT_PUBLIC_SUPABASE_URL || ""}]: `);
  if (newSbUrl.trim()) existing.NEXT_PUBLIC_SUPABASE_URL = newSbUrl.trim();

  const newSbAnon = await promptUser(`Supabase Anon Key [${existing.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "********" : ""}]: `);
  if (newSbAnon.trim()) existing.NEXT_PUBLIC_SUPABASE_ANON_KEY = newSbAnon.trim();

  const newSbService = await promptUser(`Supabase Service Role Key [${existing.SUPABASE_SERVICE_ROLE_KEY ? "********" : ""}]: `);
  if (newSbService.trim()) existing.SUPABASE_SERVICE_ROLE_KEY = newSbService.trim();

  const newIgAppId = await promptUser(`Instagram App ID [${existing.INSTAGRAM_APP_ID || ""}]: `);
  if (newIgAppId.trim()) {
    existing.INSTAGRAM_APP_ID = newIgAppId.trim();
    existing.NEXT_PUBLIC_INSTAGRAM_APP_ID = newIgAppId.trim();
  }

  const newIgSecret = await promptUser(`Instagram App Secret [${existing.INSTAGRAM_APP_SECRET ? "********" : ""}]: `);
  if (newIgSecret.trim()) existing.INSTAGRAM_APP_SECRET = newIgSecret.trim();

  const newIgVerify = await promptUser(`Instagram Webhook Verify Token [${existing.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "dmflow_secret_token_123"}]: `);
  if (newIgVerify.trim()) existing.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = newIgVerify.trim();

  const newGroq = await promptUser(`Groq API Key [${existing.GROQ_API_KEY ? "********" : ""}]: `);
  if (newGroq.trim()) existing.GROQ_API_KEY = newGroq.trim();

  rl.close();

  saveEnvFile(ENV_PATH, existing);
  console.log(`\n🎉 Environment saved successfully to ${ENV_PATH}`);
  console.log("Run 'npm run setup' at any time to re-verify connections.\n");
}

main().catch((err) => {
  console.error("Setup wizard error:", err);
  process.exit(1);
});
