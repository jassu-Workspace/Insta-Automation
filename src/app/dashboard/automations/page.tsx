"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Bot,
  Play,
  Pause,
  Edit2,
  Copy,
  MoreVertical,
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  trigger_source: string;
  trigger_type: string;
  trigger_value: string;
  response_content: { text: string };
  public_response_content?: { text: string };
  reply_mode?: string;
  specific_media_id?: string;
  is_ai_enabled?: boolean;
  ai_model?: string;
  max_response_length?: number;
  fallback_response_text?: string;
  is_active: boolean;
  created_at: string;
}

export default function AutomationsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.automations) {
        setAutomations(data.automations);
      }
    } catch (err) {
      console.error("Failed to fetch automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setAutomations((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, is_active: !currentStatus } : rule))
    );

    const targetRule = automations.find((r) => r.id === id);
    if (targetRule) {
      try {
        await fetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...targetRule,
            is_active: !currentStatus,
          }),
        });
      } catch (err) {
        console.error("Error toggling automation status:", err);
      }
    }
  };

  const handleDuplicate = async (rule: AutomationRule) => {
    setActiveMenuId(null);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${rule.name} (Copy)`,
          trigger_source: rule.trigger_source,
          trigger_type: rule.trigger_type,
          trigger_value: rule.trigger_value,
          response_text: rule.response_content?.text,
          public_response_text: rule.public_response_content?.text,
          reply_mode: rule.reply_mode,
          specific_media_id: rule.specific_media_id,
          is_ai_enabled: rule.is_ai_enabled,
          fallback_response_text: rule.fallback_response_text,
          is_active: true,
        }),
      });

      if (res.ok) {
        fetchAutomations();
      }
    } catch (err) {
      console.error("Error duplicating rule:", err);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    setActiveMenuId(null);
    if (!confirm("Are you sure you want to delete this automation rule?")) return;

    try {
      const res = await fetch(`/api/automations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAutomations((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting automation:", err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Automation Rules Engine</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Manage active comment-to-DM, story mention, and Groq AI auto-reply rules.
            </p>
          </div>

          <Link href="/dashboard/automations/builder" className="btn-ig-connect">
            <Plus size={18} /> New Automation
          </Link>
        </div>

        {/* Rules List */}
        <section>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading automations...</div>
          ) : automations.length === 0 ? (
            <div
              className="glass-card gradient-orb-peach"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <Zap size={32} color="var(--text-main)" />
              <h3 style={{ fontSize: "1.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>No Automation Rules Created Yet</h3>
              <p style={{ color: "var(--text-body)", maxWidth: "450px", fontSize: "0.9rem" }}>
                Create your first rule to start automatically responding to Instagram DMs, comments, and story mentions.
              </p>
              <Link href="/dashboard/automations/builder" className="btn-ig-connect">
                <Plus size={18} /> Create First Automation
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {automations.map((rule) => (
                <div
                  key={rule.id}
                  className="glass-card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    position: "relative",
                  }}
                >
                  <div style={{ flex: "1 1 400px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.25rem", fontFamily: "var(--font-serif)", fontWeight: "400" }}>{rule.name}</h3>

                      {rule.is_ai_enabled && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            background: "rgba(12, 10, 9, 0.06)",
                            color: "var(--text-main)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Bot size={13} /> AI Powered ({rule.ai_model || "Groq Llama 3.1"})
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          background: rule.is_active ? "rgba(22, 163, 74, 0.1)" : "rgba(245, 158, 11, 0.1)",
                          color: rule.is_active ? "#16a34a" : "#d97706",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {rule.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {rule.is_active ? "Live" : "Paused"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Tag size={15} color="var(--text-muted)" />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>Keywords:</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(rule.trigger_value || "*").split(",").map((kw, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "rgba(12, 10, 9, 0.04)",
                              color: "var(--text-main)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.82rem",
                              fontWeight: "600",
                            }}
                          >
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "var(--bg-soft)",
                        border: "1px solid var(--border-card)",
                        fontSize: "0.88rem",
                        color: "var(--text-body)",
                      }}
                    >
                      <strong>Response:</strong> {rule.response_content?.text}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => handleToggleActive(rule.id, rule.is_active)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "9999px",
                        border: "1px solid var(--border-card)",
                        background: "#ffffff",
                        color: "var(--text-main)",
                        fontSize: "0.82rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {rule.is_active ? <Pause size={14} /> : <Play size={14} />}
                      {rule.is_active ? "Pause" : "Resume"}
                    </button>

                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === rule.id ? null : rule.id)}
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: "8px", cursor: "pointer" }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === rule.id && (
                        <div
                          className="glass-card"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "40px",
                            width: "160px",
                            padding: "6px",
                            zIndex: 20,
                            background: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              router.push(`/dashboard/automations/builder?id=${rule.id}`);
                            }}
                            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <Edit2 size={14} /> Edit Rule
                          </button>
                          <button
                            onClick={() => handleDuplicate(rule)}
                            style={{ padding: "8px 12px", borderRadius: "6px", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <Copy size={14} /> Duplicate
                          </button>
                          <button
                            onClick={() => handleDeleteAutomation(rule.id)}
                            style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(220, 38, 38, 0.1)", border: "none", color: "#dc2626", fontSize: "0.85rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
