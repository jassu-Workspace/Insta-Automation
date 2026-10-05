"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PieChart, MessageCircle, Plus, Trophy, Layers } from "lucide-react";

interface CommenterLeader {
  rank: number;
  username: string;
  commentsCount: number;
  automationsTriggered: number;
  lastActive: string;
}

export default function AudienceInsightsPage() {
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [leaderboard, setLeaderboard] = useState<CommenterLeader[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [uniqueCommenters, setUniqueCommenters] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      if (data) {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.totalComments) setTotalComments(data.totalComments);
        if (data.uniqueCommenters) setUniqueCommenters(data.uniqueCommenters);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Audience Insights & Top Commenters</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Identify your most engaged Instagram followers and top comment automation triggers.
          </p>
        </div>

        {/* Two Panel Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "28px" }}>
          
          {/* Left Panel */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
            <h2 style={{ fontSize: "1.1rem", fontFamily: "var(--font-serif)", fontWeight: "400" }}>View Stats For</h2>

            <button
              onClick={() => alert("Custom Rule Group created!")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "9999px",
                background: "#ffffff",
                border: "1px solid var(--border-card)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} /> Create Custom Group
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
              <div
                onClick={() => setSelectedGroup("all")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: selectedGroup === "all" ? "var(--bg-soft)" : "transparent",
                  border: selectedGroup === "all" ? "1px solid var(--border-card)" : "1px solid transparent",
                  color: "var(--text-main)",
                  fontWeight: selectedGroup === "all" ? "600" : "400",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Layers size={16} /> All Automations
              </div>
              
              <div
                onClick={() => setSelectedGroup("reels")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: selectedGroup === "reels" ? "var(--bg-soft)" : "transparent",
                  border: selectedGroup === "reels" ? "1px solid var(--border-card)" : "1px solid transparent",
                  color: "var(--text-main)",
                  fontWeight: selectedGroup === "reels" ? "600" : "400",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <MessageCircle size={16} /> Reel Comments
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Stat Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="glass-card gradient-orb-mint" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TOTAL COMMENTS PROCESSED</div>
                <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginTop: "4px" }}>{totalComments.toLocaleString()}</div>
              </div>

              <div className="glass-card gradient-orb-peach" style={{ padding: "24px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>UNIQUE COMMENTERS</div>
                <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginTop: "4px" }}>{uniqueCommenters.toLocaleString()}</div>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Trophy size={18} color="var(--text-main)" />
                <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>Top Commenters Ranked Leaderboard</h2>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
                    <th style={{ padding: "12px 16px" }}>RANK</th>
                    <th style={{ padding: "12px 16px" }}>FOLLOWER</th>
                    <th style={{ padding: "12px 16px" }}>COMMENTS</th>
                    <th style={{ padding: "12px 16px" }}>RULES TRIGGERED</th>
                    <th style={{ padding: "12px 16px" }}>LAST ACTIVE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading insights...</td></tr>
                  ) : leaderboard.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No audience comment data yet — top commenters will appear here as automations trigger.</td></tr>
                  ) : (
                    leaderboard.map((item) => (
                      <tr key={item.rank} style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "var(--text-main)" }}>#{item.rank}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "0.75rem" }}>
                              {item.username.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: "600" }}>@{item.username}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: "600" }}>{item.commentsCount}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", color: "var(--text-main)", fontWeight: "600", fontSize: "0.75rem" }}>
                            {item.automationsTriggered} rules
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#16a34a", fontWeight: "600" }}>{item.lastActive}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
