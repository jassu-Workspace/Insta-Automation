"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Plus,
  Instagram,
  Heart,
  MessageCircle,
  TrendingUp,
  Users,
  MousePointerClick,
  Mail,
  Zap,
} from "lucide-react";

interface ActionCardItem {
  id: string;
  media_type: string;
  likes: string;
  comments: string;
  caption: string;
  hasAutomation: boolean;
  automationName?: string;
  orbClass: string;
  thumbnail_url?: string;
}

interface AutomationSummary {
  id: string;
  name: string;
  trigger_value: string;
  dms_sent: number;
  clicks: number;
  ctr: string;
  is_active: boolean;
  is_ai_enabled?: boolean;
}

export default function DashboardHomePage() {
  const [username, setUsername] = useState("your_account");
  const [automations, setAutomations] = useState<AutomationSummary[]>([]);
  const [actionCards, setActionCards] = useState<ActionCardItem[]>([]);
  const [stats, setStats] = useState({ dms_sent: 0, link_clicks: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  const fetchHomeData = async () => {
    try {
      // Fetch user settings / profile
      const userRes = await fetch("/api/user/settings");
      const userData = await userRes.json();
      if (userData.username) {
        setUsername(userData.username);
      }

      // Fetch stats
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json();
      if (statsData) {
        setStats({
          dms_sent: statsData.dms_sent || 0,
          link_clicks: statsData.bonus_dms || 0,
          leads: 0,
        });
      }

      // Fetch automations
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.automations) {
        const mapped = data.automations.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          trigger_value: rule.trigger_value || "*",
          dms_sent: rule.dms_sent || 0,
          clicks: rule.clicks || 0,
          ctr: rule.ctr || "0%",
          is_active: rule.is_active,
          is_ai_enabled: rule.is_ai_enabled,
        }));
        setAutomations(mapped);
      }

      // Fetch Instagram media
      const mediaRes = await fetch("/api/instagram/media");
      const mediaData = await mediaRes.json();
      if (mediaData.media && Array.isArray(mediaData.media)) {
        const orbClasses = ["gradient-orb-mint", "gradient-orb-peach", "gradient-orb-lavender", "gradient-orb-sky"];
        const cards: ActionCardItem[] = mediaData.slice(0, 6).map((item: any, idx: number) => ({
          id: item.id,
          media_type: item.media_type || "POST",
          likes: (item.like_count || 0).toLocaleString(),
          comments: (item.comments_count || 0).toLocaleString(),
          caption: item.caption || `Instagram Post #${idx + 1}`,
          hasAutomation: false,
          orbClass: orbClasses[idx % orbClasses.length],
          thumbnail_url: item.thumbnail_url || item.permalink,
        }));
        setActionCards(cards);
      }
    } catch {
      // Clean fallback (empty arrays)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  return (
    <DashboardLayout username={username}>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
          <div>
            <div style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px" }}>
              INSTAGRAM AUTOMATION DASHBOARD
            </div>
            <h1 style={{ fontSize: "2.8rem", fontFamily: "var(--font-serif)", fontWeight: "300", letterSpacing: "-0.5px" }}>
              Welcome back, <span className="gradient-text">@{username}</span>
            </h1>
          </div>

          <Link href="/dashboard/automations/builder" className="btn-ig-connect">
            <Plus size={18} /> New Automation
          </Link>
        </div>

        {/* Section 1: Today's Actions (Real Instagram Media Carousel or Clean Empty State) */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>Posts & Reels</h2>
            <Link href="/dashboard/automations" style={{ fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: "500" }}>
              View all automations →
            </Link>
          </div>

          {actionCards.length === 0 ? (
            <div
              className="glass-card gradient-orb-mint"
              style={{
                padding: "48px 24px",
                borderRadius: "20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <Instagram size={36} color="var(--text-muted)" />
              <h3 style={{ fontSize: "1.25rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>No Connected Instagram Posts Found</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-body)", maxWidth: "450px" }}>
                Connect your Instagram Professional account via Meta Business Login to view your posts, Reels, and attach comment automations.
              </p>
              <Link href="/dashboard/automations/builder" className="btn-ig-connect">
                <Plus size={18} /> Create Custom Automation
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "20px",
                overflowX: "auto",
                paddingBottom: "12px",
                scrollbarWidth: "none",
              }}
            >
              {actionCards.map((card) => (
                <div
                  key={card.id}
                  className={`glass-card ${card.orbClass}`}
                  style={{
                    minWidth: "290px",
                    maxWidth: "290px",
                    borderRadius: "20px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "340px",
                    flexShrink: 0,
                  }}
                >
                  {/* Top Media Tag */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "700", padding: "3px 10px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", color: "var(--text-main)" }}>
                      {card.media_type}
                    </span>
                    <div style={{ display: "flex", gap: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Heart size={13} /> {card.likes}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MessageCircle size={13} /> {card.comments}</span>
                    </div>
                  </div>

                  {/* Media Preview Box */}
                  <div
                    style={{
                      width: "100%",
                      height: "140px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "14px 0",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {card.thumbnail_url ? (
                      <img src={card.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Instagram size={36} color="#777169" />
                    )}
                  </div>

                  {/* Caption & Automation Status */}
                  <div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.4, margin: "0 0 14px", fontWeight: "500", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {card.caption}
                    </p>

                    {card.hasAutomation ? (
                      <Link
                        href="/dashboard/automations"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "9999px",
                          background: "#0c0a09",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Zap size={13} /> {card.automationName}
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/automations/builder"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "9999px",
                          background: "rgba(12, 10, 9, 0.05)",
                          border: "1px solid var(--border-card)",
                          color: "var(--text-main)",
                          fontSize: "0.78rem",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Plus size={13} /> Add Automation
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Performance Snapshot */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>Performance Snapshot</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            
            <div className="glass-card gradient-orb-mint" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>DMs SENT</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={18} color="var(--text-main)" />
                </div>
              </div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "var(--text-main)" }}>
                {stats.dms_sent.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>Total automated messages sent</div>
            </div>

            <div className="glass-card gradient-orb-peach" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>LINK CLICKS</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MousePointerClick size={18} color="var(--text-main)" />
                </div>
              </div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "var(--text-main)" }}>
                {stats.link_clicks.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>CTA link clicks tracked</div>
            </div>

            <div className="glass-card gradient-orb-lavender" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>LEADS COLLECTED</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={18} color="var(--text-main)" />
                </div>
              </div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "var(--text-main)" }}>
                {stats.leads.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>Via DM email capture</div>
            </div>

            <div className="glass-card gradient-orb-sky" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>CONNECTED ACCOUNT</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-strong)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color="var(--text-main)" />
                </div>
              </div>
              <div style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", color: "var(--text-main)" }}>@{username}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>Instagram Account Status</div>
            </div>

          </div>
        </section>

        {/* Section 3: Active Automations Table */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>Active Automations ({automations.length})</h2>
            <Link href="/dashboard/automations" style={{ fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: "500" }}>
              Manage all →
            </Link>
          </div>

          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
                  <th style={{ padding: "16px 24px" }}>AUTOMATION NAME</th>
                  <th style={{ padding: "16px 24px" }}>KEYWORD</th>
                  <th style={{ padding: "16px 24px" }}>DMS SENT</th>
                  <th style={{ padding: "16px 24px" }}>CLICKS</th>
                  <th style={{ padding: "16px 24px" }}>CTR</th>
                  <th style={{ padding: "16px 24px" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Loading automations...</td></tr>
                ) : automations.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No active automations yet — create your first automation to get started!</td></tr>
                ) : (
                  automations.slice(0, 5).map((rule) => (
                    <tr key={rule.id} style={{ borderBottom: "1px solid var(--border-card)" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: "600", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                          {rule.name}
                          {rule.is_ai_enabled && (
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", background: "rgba(12, 10, 9, 0.06)", color: "var(--text-main)", fontWeight: "600" }}>
                              AI
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", background: "rgba(12, 10, 9, 0.04)", padding: "2px 8px", borderRadius: "6px" }}>
                          {rule.trigger_value}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: "600" }}>{rule.dms_sent}</td>
                      <td style={{ padding: "16px 24px", fontWeight: "600" }}>{rule.clicks}</td>
                      <td style={{ padding: "16px 24px", fontWeight: "600", color: "#16a34a" }}>{rule.ctr}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600", background: rule.is_active ? "rgba(22, 163, 74, 0.1)" : "rgba(245, 158, 11, 0.1)", color: rule.is_active ? "#16a34a" : "#d97706" }}>
                          {rule.is_active ? "Live" : "Paused"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
