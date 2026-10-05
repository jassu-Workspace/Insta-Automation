"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar, ChevronDown, BarChart3 } from "lucide-react";

export default function AnalyticsOverviewPage() {
  const [activeTab, setActiveTab] = useState("Performance");
  const [range, setRange] = useState("7d");
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedRange: string) => {
    try {
      const res = await fetch(`/api/analytics?range=${selectedRange}`);
      const data = await res.json();
      if (data) {
        setAnalyticsData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const metrics = analyticsData?.metrics || { dmsSent: 0, linkClicks: 0, ctr: "0%", leadsCaptured: 0 };
  const performanceRows = analyticsData?.performanceList || [];
  const highlights = analyticsData?.highlights;

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Analytics</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              DMs sent, link clicks, top automations, and audience engagement trends.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                background: "#ffffff",
                border: "1px solid var(--border-card)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar size={15} /> {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "All time"} <ChevronDown size={14} />
            </button>

            {rangeDropdownOpen && (
              <div
                className="glass-card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "44px",
                  width: "160px",
                  padding: "6px",
                  zIndex: 20,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {[
                  { label: "Last 7 days", val: "7d" },
                  { label: "Last 30 days", val: "30d" },
                  { label: "All time", val: "all" },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setRange(item.val);
                      setRangeDropdownOpen(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: range === item.val ? "var(--bg-soft)" : "transparent",
                      border: "none",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Row */}
        <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border-card)", marginBottom: "36px" }}>
          {["Performance", "Activity Log", "Account Performance"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 4px",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid #0c0a09" : "2px solid transparent",
                  color: isActive ? "var(--text-main)" : "var(--text-muted)",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Key Metrics */}
        <section style={{ marginBottom: "44px" }}>
          <h2 style={{ fontSize: "1.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "16px" }}>Key metrics</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>DMs sent</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.dmsSent.toLocaleString()}</div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total automated messages sent</span>
            </div>

            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Link clicks</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.linkClicks.toLocaleString()}</div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>CTA link clicks tracked</span>
            </div>

            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Click-through rate</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.ctr}</div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Overall CTR</span>
            </div>

            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px" }}>Leads captured</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>{metrics.leadsCaptured}</div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Email capture enabled</span>
            </div>
          </div>
        </section>

        {/* Automation Performance Table */}
        <section>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.4rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>Automation Performance</h2>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading performance analytics...</div>
            ) : performanceRows.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <BarChart3 size={32} color="var(--text-muted)" />
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>No Automation Performance Data Yet</div>
                <div style={{ fontSize: "0.85rem" }}>Create and activate automations to see live performance analytics here.</div>
              </div>
            ) : (
              performanceRows.map((row: any) => (
                <div
                  key={row.id}
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f0efed" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{row.name}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", fontSize: "0.72rem", fontWeight: "600" }}>
                          {row.links}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{row.dmsSent}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#16a34a" }}>{row.ctr}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>CTR</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
