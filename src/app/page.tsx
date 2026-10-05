import React from "react";
import Link from "next/link";
import {
  MessageSquareText,
  Zap,
  Sparkles,
  ShieldCheck,
  Bot,
  ArrowRight,
  TrendingUp,
  Instagram,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getInstagramAuthUrl } from "@/lib/instagram";

interface LandingPageProps {
  searchParams: Promise<{ auth_error?: string }>;
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const { auth_error } = await searchParams;
  const instagramAuthUrl = getInstagramAuthUrl();

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden", overflowY: "auto" }}>
      {/* Background Glow Accents */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          background: "radial-gradient(circle, rgba(225, 48, 108, 0.2) 0%, rgba(131, 58, 180, 0.1) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "400px",
          right: "-100px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(252, 176, 69, 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--ig-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(225, 48, 108, 0.4)",
            }}
          >
            <Bot size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: "1.4rem", fontWeight: "800", letterSpacing: "-0.5px" }}>
            DM<span className="gradient-text">flow</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/api/auth/instagram"
            style={{
              fontSize: "0.9rem",
              fontWeight: "600",
              padding: "8px 18px",
              borderRadius: "9999px",
              border: "1px solid var(--border-card)",
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <Instagram size={16} />
            Login with Instagram
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px", position: "relative", zIndex: 10 }}>
        
        {/* Auth Error Banner if redirected back with an error */}
        {auth_error && (
          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto 32px",
              padding: "14px 20px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#fca5a5",
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ fontSize: "0.95rem" }}>
              <strong>OAuth Error:</strong> {decodeURIComponent(auth_error)}
            </span>
          </div>
        )}

        {/* Hero Section */}
        <section style={{ textAlign: "center", maxWidth: "850px", margin: "0 auto 80px" }}>
          <div
            className="glow-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "var(--ig-gradient-subtle)",
              border: "1px solid rgba(225, 48, 108, 0.3)",
              marginBottom: "28px",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#f472b6",
            }}
          >
            <Sparkles size={14} />
            <span>Official Instagram Business Login Integration</span>
          </div>

          <h1
            style={{
              fontSize: "3.6rem",
              fontWeight: "800",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "24px",
            }}
          >
            Turn Instagram DMs & Comments into <span className="gradient-text">Automated Revenue</span>
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: "40px",
              maxWidth: "680px",
              marginInline: "auto",
            }}
          >
            DMflow connects directly to your Instagram Professional account using Meta&apos;s Business API.
            Instantly reply to comments, send automated DMs, and convert story replies effortlessly.
          </p>

          {/* Connect & Demo Buttons */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px" }}>
              <Link id="connect-instagram-btn" href="/api/auth/instagram" className="btn-ig-connect">
                <Instagram size={22} />
                Connect Instagram Account
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/api/auth/instagram?demo=true"
                className="builder-btn-outline"
                style={{ padding: "12px 24px", fontSize: "0.95rem", borderRadius: "9999px" }}
              >
                <Sparkles size={18} color="var(--accent-cyan)" />
                Launch Demo Dashboard
              </Link>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "var(--text-subtle)", fontSize: "0.85rem", marginTop: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="var(--accent-emerald)" /> Business Login Approved
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" /> 60-Day Refreshable Token
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "80px" }}>
          
          <div className="glass-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(131, 58, 180, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(131, 58, 180, 0.3)",
              }}
            >
              <MessageSquareText size={24} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "10px" }}>
              Comment-to-DM Trigger
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Automatically dispatch private links or lead magnets whenever users comment specific keywords on your posts or Reels.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(253, 29, 29, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(253, 29, 29, 0.3)",
              }}
            >
              <Zap size={24} color="#f87171" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "10px" }}>
              Story Reply Auto-Responder
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Engage users who react to or reply to your Instagram Stories in real-time with instant personalized responses.
            </p>
          </div>

          <div className="glass-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(252, 176, 69, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                border: "1px solid rgba(252, 176, 69, 0.3)",
              }}
            >
              <TrendingUp size={24} color="#fbbf24" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "10px" }}>
              Analytics & Conversion Tracking
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Monitor DM open rates, link clicks, and campaign performance directly inside your DMflow dashboard.
            </p>
          </div>

        </section>

        {/* API Scope & Security Notice Card */}
        <section className="glass-card" style={{ padding: "40px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", marginBottom: "12px", fontWeight: "600" }}>
            <ShieldCheck size={20} />
            <span>Secure Business OAuth Flow</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "16px" }}>
            Powered by Instagram API with Instagram Login
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "650px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            DMflow uses Meta&apos;s native Business Login standard. Your credentials remain safe with Meta, and you can revoke permissions anytime in your Instagram account settings.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
            <span style={{ background: "rgba(255, 255, 255, 0.05)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "var(--font-mono)", border: "1px solid var(--border-card)" }}>
              instagram_business_basic
            </span>
            <span style={{ background: "rgba(255, 255, 255, 0.05)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "var(--font-mono)", border: "1px solid var(--border-card)" }}>
              instagram_business_manage_messages
            </span>
            <span style={{ background: "rgba(255, 255, 255, 0.05)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "var(--font-mono)", border: "1px solid var(--border-card)" }}>
              instagram_business_manage_comments
            </span>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-card)", padding: "32px 24px", textAlign: "center", color: "var(--text-subtle)", fontSize: "0.9rem" }}>
        <p>© 2026 DMflow — Instagram Automation Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
