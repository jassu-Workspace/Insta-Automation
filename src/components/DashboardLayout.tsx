"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Zap,
  LayoutTemplate,
  FolderKanban,
  FileText,
  Video,
  Users,
  RotateCcw,
  BarChart3,
  PieChart,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  Bot,
  CheckCircle2,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  username?: string;
  userId?: string;
}

export function DashboardLayout({
  children,
  username = "your_account",
  userId,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [contentOpen, setContentOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const [stats, setStats] = useState({
    dms_sent: 0,
    active_automations: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      if (data && typeof data.dms_sent === "number") {
        setStats({
          dms_sent: data.dms_sent || 0,
          active_automations: data.active_automations || 0,
        });
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--bg-dark)",
      }}
    >
      {/* Main Container */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100vh", overflow: "hidden" }}>
        
        {/* Editorial Left Sidebar (~260px fixed width) */}
        <aside
          style={{
            width: "260px",
            minWidth: "260px",
            borderRight: "1px solid var(--border-card)",
            background: "var(--bg-soft)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          {/* Logo & Branding */}
          <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#0c0a09",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", letterSpacing: "-0.5px" }}>
                DMflow
              </span>
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div style={{ padding: "0 16px 14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid var(--border-card)",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#0c0a09",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)" }}>My Workspace</div>
                <div style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: "600" }}>● All Features Unlocked</div>
              </div>
            </div>
          </div>

          {/* New Automation Pill Button */}
          <div style={{ padding: "0 16px 14px" }}>
            <Link
              href="/dashboard/automations/builder"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px",
                borderRadius: "9999px",
                background: "#0c0a09",
                color: "#ffffff",
                fontWeight: "500",
                fontSize: "0.88rem",
                boxShadow: "0 2px 10px rgba(12, 10, 9, 0.12)",
                transition: "all 0.2s ease",
              }}
            >
              <Plus size={16} strokeWidth={2} />
              New Automation
            </Link>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
            
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard" ? "600" : "400",
                color: pathname === "/dashboard" ? "var(--text-main)" : "var(--text-body)",
                background: pathname === "/dashboard" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard" ? "1px solid var(--border-card)" : "1px solid transparent",
              }}
            >
              <Home size={17} color="currentColor" />
              Home
            </Link>

            <Link
              href="/dashboard/automations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname.startsWith("/dashboard/automations") ? "600" : "400",
                color: pathname.startsWith("/dashboard/automations") ? "var(--text-main)" : "var(--text-body)",
                background: pathname.startsWith("/dashboard/automations") ? "#ffffff" : "transparent",
                border: pathname.startsWith("/dashboard/automations") ? "1px solid var(--border-card)" : "1px solid transparent",
              }}
            >
              <Zap size={17} color="currentColor" />
              Automations
            </Link>

            <Link
              href="/dashboard/templates"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/templates" ? "600" : "400",
                color: pathname === "/dashboard/templates" ? "var(--text-main)" : "var(--text-body)",
                background: pathname === "/dashboard/templates" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/templates" ? "1px solid var(--border-card)" : "1px solid transparent",
              }}
            >
              <LayoutTemplate size={17} color="currentColor" />
              Templates
            </Link>

            <div>
              <button
                onClick={() => setContentOpen(!contentOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "400",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FolderKanban size={17} color="currentColor" />
                  My Content
                </div>
                {contentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {contentOpen && (
                <div style={{ paddingLeft: "28px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                  <Link href="/dashboard/automations" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: "var(--text-body)" }}>
                    <FileText size={14} /> Posts & Reels
                  </Link>
                  <Link href="/dashboard/automations" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: "var(--text-body)" }}>
                    <Video size={14} /> Stories
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/contacts"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/contacts" ? "600" : "400",
                color: pathname === "/dashboard/contacts" ? "var(--text-main)" : "var(--text-body)",
                background: pathname === "/dashboard/contacts" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/contacts" ? "1px solid var(--border-card)" : "1px solid transparent",
              }}
            >
              <Users size={17} color="currentColor" />
              Contacts
            </Link>

            <Link
              href="/dashboard/rewind"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: pathname === "/dashboard/rewind" ? "600" : "400",
                color: pathname === "/dashboard/rewind" ? "var(--text-main)" : "var(--text-body)",
                background: pathname === "/dashboard/rewind" ? "#ffffff" : "transparent",
                border: pathname === "/dashboard/rewind" ? "1px solid var(--border-card)" : "1px solid transparent",
              }}
            >
              <RotateCcw size={17} color="currentColor" />
              Rewind
            </Link>

            <div>
              <button
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: pathname.includes("analytics") || pathname.includes("insights") ? "600" : "400",
                  color: "var(--text-body)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart3 size={17} color="currentColor" />
                  Analytics
                </div>
                {analyticsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {analyticsOpen && (
                <div style={{ paddingLeft: "28px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                  <Link href="/dashboard/analytics" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: pathname === "/dashboard/analytics" ? "var(--text-main)" : "var(--text-body)", fontWeight: pathname === "/dashboard/analytics" ? "600" : "400" }}>
                    <BarChart3 size={14} /> Overview
                  </Link>
                  <Link href="/dashboard/insights" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", fontSize: "0.82rem", color: pathname === "/dashboard/insights" ? "var(--text-main)" : "var(--text-body)", fontWeight: pathname === "/dashboard/insights" ? "600" : "400" }}>
                    <PieChart size={14} /> Audience Insights
                  </Link>
                </div>
              )}
            </div>

            <Link href="/docs" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", fontSize: "0.85rem", color: "var(--text-body)" }}>
              <HelpCircle size={17} />
              Support & Docs
            </Link>
          </nav>

          {/* Bottom Free Unlimited Status Indicator (NO PAYWALL / NO PRO LIMITS) */}
          <div
            style={{
              padding: "14px",
              margin: "10px 10px 14px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid var(--border-card)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "600", color: "#16a34a" }}>
              <CheckCircle2 size={15} /> 100% Free Unlimited Plan
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>DMs Sent:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{stats.dms_sent.toLocaleString()} (Unlimited)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>Active Rules:</span>
              <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{stats.active_automations} Active</span>
            </div>
          </div>

        </aside>

        {/* Independent Main Content Viewport */}
        <main
          style={{
            flex: 1,
            height: "100%",
            maxHeight: "100%",
            overflowY: "auto",
            minWidth: 0,
            backgroundColor: "var(--bg-dark)",
          }}
        >
          {children}
        </main>
      </div>

    </div>
  );
}
