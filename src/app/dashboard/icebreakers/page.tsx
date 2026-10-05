"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  Zap,
} from "lucide-react";

interface IceBreaker {
  id: string;
  user_id: string;
  question: string;
  payload?: string;
  response_text: string;
  is_active: boolean;
  created_at: string;
}

export default function IceBreakersPage() {
  const [iceBreakers, setIceBreakers] = useState<IceBreaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [question, setQuestion] = useState("");
  const [payload, setPayload] = useState("");
  const [responseText, setResponseText] = useState("");

  const fetchIceBreakers = async () => {
    try {
      const res = await fetch("/api/icebreakers");
      const data = await res.json();
      if (data.ice_breakers) {
        setIceBreakers(data.ice_breakers);
      }
    } catch (err) {
      console.error("Error fetching ice breakers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIceBreakers();
  }, []);

  const handleCreateIceBreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !responseText) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/icebreakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          payload,
          response_text: responseText,
          is_active: true,
        }),
      });

      if (res.ok) {
        setQuestion("");
        setPayload("");
        setResponseText("");
        setIsCreating(false);
        fetchIceBreakers();
      }
    } catch (err) {
      console.error("Error creating ice breaker:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIceBreaker = async (id: string) => {
    try {
      const res = await fetch(`/api/icebreakers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setIceBreakers((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting ice breaker:", err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "40px 32px 80px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Sparkles size={24} color="var(--accent-coral)" />
              <h1 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Instagram Ice Breakers</h1>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Configure canned DM starter buttons displayed to new contacts when opening a conversation with your account.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="btn-ig-connect"
            style={{ borderRadius: "10px", padding: "10px 20px", fontSize: "0.9rem" }}
          >
            <Plus size={18} />
            {isCreating ? "Cancel" : "Add Ice Breaker"}
          </button>
        </div>

        {/* Create Ice Breaker Form */}
        {isCreating && (
          <section
            className="glass-card"
            style={{
              padding: "32px",
              marginBottom: "32px",
              borderColor: "rgba(255, 107, 74, 0.4)",
              background: "linear-gradient(135deg, rgba(255, 107, 74, 0.08) 0%, rgba(253, 29, 29, 0.04) 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <HelpCircle size={20} color="var(--accent-coral)" />
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Add Canned DM Starter Button</h2>
            </div>

            <form onSubmit={handleCreateIceBreaker} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-muted)" }}>
                    Button Prompt Question
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. What are your VIP pricing plans?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      color: "#fff",
                      fontSize: "0.95rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-muted)" }}>
                    Postback Payload (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pricing_info"
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.95rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", color: "var(--text-muted)" }}>
                  Canned Response Message
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Our VIP membership is $29/mo with unlimited DM automations..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-card)",
                    color: "#fff",
                    fontSize: "0.95rem",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "transparent",
                    border: "1px solid var(--border-card)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    background: "var(--coral-gradient)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Saving..." : "Save Ice Breaker"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Ice Breakers List */}
        <section>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading Ice Breakers...</div>
          ) : iceBreakers.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <Sparkles size={32} color="var(--accent-coral)" />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>No Ice Breakers Configured</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px" }}>
                Add starter button prompts to greet new followers when they initiate a conversation on Instagram.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
              {iceBreakers.map((item) => (
                <div key={item.id} className="glass-card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      <HelpCircle size={18} color="var(--accent-coral)" />
                      {item.question}
                    </h3>
                    <button
                      onClick={() => handleDeleteIceBreaker(item.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#fca5a5",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {item.payload && (
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", background: "rgba(255, 255, 255, 0.05)", padding: "2px 8px", borderRadius: "4px", color: "var(--text-muted)" }}>
                        Payload: {item.payload}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-card)",
                      fontSize: "0.9rem",
                      color: "#e5e7eb",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <MessageSquare size={16} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{item.response_text}</span>
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
