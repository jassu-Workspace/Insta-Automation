"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookOpen, Shield, Key, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <BookOpen size={26} color="var(--text-main)" />
            <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>DMflow Integration Documentation</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Complete step-by-step setup guide for Meta Developer App, Instagram Business Login, Webhooks, and Groq AI.
          </p>
        </div>

        {/* Section 1: Meta Developer App Setup */}
        <section className="glass-card gradient-orb-mint" style={{ padding: "28px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={20} color="var(--text-main)" /> 1. Meta Developer App & Instagram Business Login
          </h2>
          <p style={{ color: "var(--text-body)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "16px" }}>
            DMflow uses official <strong>Instagram API with Instagram Login (Business Login)</strong> flow — NOT Facebook Login, NOT Instagram Basic Display.
          </p>
          <ol style={{ paddingLeft: "20px", color: "var(--text-body)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-main)", textDecoration: "underline" }}>developers.facebook.com</a> and click <strong>Create App</strong>.</li>
            <li>Select app type: <strong>Business / Other</strong>.</li>
            <li>Add product: <strong>Instagram API with Instagram Login</strong>.</li>
            <li>Configure OAuth Redirect URI: <code>http://localhost:3000/api/auth/callback</code>.</li>
          </ol>
        </section>

        {/* Section 2: Required Scopes */}
        <section className="glass-card gradient-orb-peach" style={{ padding: "28px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Key size={20} color="var(--text-main)" /> 2. Required OAuth Scopes
          </h2>
          <p style={{ color: "var(--text-body)", fontSize: "0.92rem", marginBottom: "16px" }}>
            Request the following permissions during Instagram OAuth authorization:
          </p>
          <ul style={{ paddingLeft: "20px", color: "var(--text-body)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <li><code>instagram_business_basic</code>: Access account profile and media posts.</li>
            <li><code>instagram_business_manage_messages</code>: Receive incoming DMs and send automated replies.</li>
            <li><code>instagram_business_manage_comments</code>: Read comments and publish public replies.</li>
          </ul>
        </section>

        {/* Section 3: Webhook Verification */}
        <section className="glass-card gradient-orb-sky" style={{ padding: "28px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={20} color="var(--text-main)" /> 3. Webhook Setup & Handshake
          </h2>
          <p style={{ color: "var(--text-body)", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: "12px" }}>
            In Meta App Dashboard under Webhooks → Instagram:
          </p>
          <ul style={{ paddingLeft: "20px", color: "var(--text-body)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <li>Callback URL: <code>http://localhost:3000/api/webhook/instagram</code></li>
            <li>Verify Token: <code>dmflow_secret_token_123</code> (configured in <code>INSTAGRAM_WEBHOOK_VERIFY_TOKEN</code>)</li>
            <li>Subscribe to fields: <code>messages</code>, <code>comments</code>, <code>mentions</code>.</li>
          </ul>
        </section>

        {/* Section 4: Environment Variables */}
        <section className="glass-card" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "12px" }}>
            4. Environment Variables Checklist
          </h2>
          <pre
            style={{
              background: "#0c0a09",
              padding: "16px",
              borderRadius: "12px",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "#34d399",
              overflowX: "auto",
              lineHeight: 1.6,
            }}
          >
{`NEXT_PUBLIC_SUPABASE_URL=https://your-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_INSTAGRAM_APP_ID=12345678
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=dmflow_secret_token_123
GROQ_API_KEY=gsk_your_groq_api_key`}
          </pre>
        </section>

      </div>
    </DashboardLayout>
  );
}
