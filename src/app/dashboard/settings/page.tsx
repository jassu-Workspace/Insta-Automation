"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Settings,
  Key,
  Bot,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Activity,
  Database,
  Cpu,
  Webhook,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

interface DiagnosticItem {
  service: "supabase" | "meta" | "webhook" | "groq";
  name: string;
  status: "connected" | "degraded" | "disconnected" | "unconfigured";
  latencyMs?: number;
  message: string;
  details?: Record<string, any>;
}

export default function SettingsPage() {
  const [groqApiKey, setGroqApiKey] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticItem> | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (data) {
        setGroqApiKey(data.groq_api_key || "");
        setAiContext(data.ai_context || "");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setTestingHealth(true);
    try {
      const res = await fetch("/api/diagnostics/ping");
      const data = await res.json();
      if (data?.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.error("Failed to run diagnostics:", err);
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    runDiagnostics();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groq_api_key: groqApiKey,
          ai_context: aiContext,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        runDiagnostics();
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const renderStatusBadge = (status?: string, latency?: number) => {
    switch (status) {
      case "connected":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.82rem", fontWeight: "600" }}>
            <CheckCircle2 size={15} /> Connected {latency !== undefined ? `(${latency}ms)` : ""}
          </span>
        );
      case "degraded":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "0.82rem", fontWeight: "600" }}>
            <AlertTriangle size={15} /> Attention Needed
          </span>
        );
      case "unconfigured":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: "600" }}>
            Unconfigured
          </span>
        );
      case "disconnected":
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "0.82rem", fontWeight: "600" }}>
            <XCircle size={15} /> Disconnected
          </span>
        );
    }
  };

  const webhookUrl = diagnostics?.webhook?.details?.callback_url || `${typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/api/webhook/instagram`;
  const verifyToken = diagnostics?.webhook?.details?.verify_token || "dmflow_secret_token_123";

  return (
    <DashboardLayout>
      <div style={{ padding: "40px 32px 80px", maxWidth: "1050px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Settings size={26} color="var(--accent-coral)" />
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800" }}>System Settings & Connectivity</h1>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Monitor live platform health, test Meta & Groq latency, and configure your webhook endpoints.
            </p>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={testingHealth}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-card)",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} className={testingHealth ? "animate-spin" : ""} />
            {testingHealth ? "Testing Latency..." : "Test All Connections"}
          </button>
        </div>

        {savedSuccess && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
              fontWeight: "600",
            }}
          >
            <CheckCircle2 size={18} />
            Settings saved and live connections re-verified!
          </div>
        )}

        {/* 1. Live Infrastructure Health & Connectivity Grid */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Activity size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Live Infrastructure Diagnostics</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {/* Supabase */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database size={18} color="var(--accent-coral)" />
                  <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>PostgreSQL & DB</span>
                </div>
                {renderStatusBadge(diagnostics?.supabase?.status, diagnostics?.supabase?.latencyMs)}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                {diagnostics?.supabase?.message || "Checking database connection..."}
              </p>
            </div>

            {/* Groq AI */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={18} color="var(--accent-amber)" />
                  <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Groq AI Inference</span>
                </div>
                {renderStatusBadge(diagnostics?.groq?.status, diagnostics?.groq?.latencyMs)}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                {diagnostics?.groq?.message || "Checking Groq API..."}
              </p>
            </div>

            {/* Meta Graph API */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Instagram Graph API</span>
                </div>
                {renderStatusBadge(diagnostics?.meta?.status, diagnostics?.meta?.latencyMs)}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                {diagnostics?.meta?.message || "Checking Meta connection..."}
              </p>
            </div>

            {/* Webhook Handshake */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Webhook size={18} color="#a855f7" />
                  <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Webhook Ingress</span>
                </div>
                {renderStatusBadge(diagnostics?.webhook?.status)}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                {diagnostics?.webhook?.message || "Ingress handshake ready"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Meta Webhook Configuration Details */}
        <div className="glass-card" style={{ padding: "28px", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <Webhook size={20} color="#a855f7" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Meta Webhook Handshake Endpoints</h2>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px", lineHeight: 1.5 }}>
            Paste these into your <strong>Meta App Dashboard → Webhooks → Instagram Graph API</strong> to establish real-time event streaming.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>
                Callback URL
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-card)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(webhookUrl, "url")}
                  style={{
                    padding: "0 14px",
                    borderRadius: "8px",
                    background: copiedField === "url" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    border: "1px solid var(--border-card)",
                    color: copiedField === "url" ? "#10b981" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  {copiedField === "url" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedField === "url" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>
                Verify Token
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-card)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(verifyToken, "token")}
                  style={{
                    padding: "0 14px",
                    borderRadius: "8px",
                    background: copiedField === "token" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    border: "1px solid var(--border-card)",
                    color: copiedField === "token" ? "#10b981" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                  }}
                >
                  {copiedField === "token" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedField === "token" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Settings Form (Groq Key + AI Context) */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading settings...</div>
        ) : (
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Groq API Key Section */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Key size={20} color="var(--accent-coral)" />
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Groq API Key (Free Tier Supported)</h2>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-cyan)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Get free Groq Key <ExternalLink size={14} />
                </a>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", lineHeight: 1.5 }}>
                DMflow uses Groq&apos;s lightning-fast <code>llama-3.1-8b-instant</code> model for automated lead qualification and conversational DM replies.
              </p>

              <div style={{ position: "relative" }}>
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="gsk_..."
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 48px 12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-card)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* AI Brand Context & Tone Section */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Bot size={20} color="var(--accent-amber)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>AI Brand Context & Tone Guidelines</h2>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "16px", lineHeight: 1.5 }}>
                Write a concise description of your business, product details, promo codes, and tone instructions. The AI will consult this context before responding to incoming DMs.
              </p>

              <textarea
                rows={5}
                placeholder="e.g. We are DMflow — a premium Instagram automation platform. Be friendly, energetic, and helpful. Mention our free 14-day trial link (https://dmflow.app/trial) and answer pricing questions ($29/mo)."
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-card)",
                  color: "#fff",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-ig-connect"
                style={{ borderRadius: "10px", padding: "12px 28px", fontSize: "0.95rem" }}
              >
                <Save size={18} />
                {saving ? "Saving Settings..." : "Save Settings & Test"}
              </button>
            </div>

          </form>
        )}

      </div>
    </DashboardLayout>
  );
}
