"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  RotateCcw,
  Search,
  Cog,
  CheckCircle,
  Play,
  RefreshCw,
} from "lucide-react";

interface RewindItem {
  id: string;
  name: string;
  details: string;
  status: string;
}

interface RewindJob {
  id: string;
  automation_name: string;
  comments_scanned: number;
  dms_sent: number;
  status: string;
  created_at: string;
}

export default function RewindPage() {
  const [automations, setAutomations] = useState<RewindItem[]>([]);
  const [historyJobs, setHistoryJobs] = useState<RewindJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [runningRewind, setRunningRewind] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fetchAutomationsAndJobs = async () => {
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      if (data.automations) {
        const commentRules = data.automations
          .filter((a: any) => (a.trigger_source || "dm") === "comment")
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            details: `Keywords: '${a.trigger_value}' · DM: '${a.response_content?.text?.substring(0, 40) || ""}...'`,
            status: a.is_active ? "Active" : "Paused",
          }));

        setAutomations(commentRules);

        if (commentRules.length > 0 && !selectedId) {
          setSelectedId(commentRules[0].id);
        }
      }
    } catch {
      // Fallback
    }

    try {
      const jobsRes = await fetch("/api/rewind");
      const jobsData = await jobsRes.json();
      if (jobsData.jobs) {
        setHistoryJobs(jobsData.jobs);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchAutomationsAndJobs();
  }, []);

  const handleRunRewind = async () => {
    if (!selectedId) return;
    setRunningRewind(true);
    setResultMessage(null);
    setActiveStep(2);

    setTimeout(async () => {
      setActiveStep(3);
      try {
        const res = await fetch("/api/rewind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ automation_id: selectedId }),
        });
        const data = await res.json();
        setActiveStep(4);
        setResultMessage(data.message || "Rewind completed successfully!");
        fetchAutomationsAndJobs();
      } catch (err) {
        console.error("Rewind execution error:", err);
      } finally {
        setRunningRewind(false);
      }
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Rewind</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Retroactively send DMs to missed comments on your Instagram posts.
          </p>
        </div>

        {/* 4-Step Tracker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "48px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: activeStep >= 1 ? "#0c0a09" : "#ffffff",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={18} color={activeStep >= 1 ? "#fff" : "var(--text-muted)"} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: activeStep >= 1 ? "600" : "400", color: "var(--text-main)" }}>
              Select Automation
            </span>
          </div>

          <div style={{ width: "60px", height: "1px", background: activeStep >= 2 ? "#0c0a09" : "var(--border-card)" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: activeStep >= 2 ? "#0c0a09" : "#ffffff",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={18} color={activeStep >= 2 ? "#fff" : "var(--text-muted)"} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: activeStep >= 2 ? "600" : "400", color: "var(--text-main)" }}>
              Scan Comments
            </span>
          </div>

          <div style={{ width: "60px", height: "1px", background: activeStep >= 3 ? "#0c0a09" : "var(--border-card)" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: activeStep >= 3 ? "#0c0a09" : "#ffffff",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cog size={18} color={activeStep >= 3 ? "#fff" : "var(--text-muted)"} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: activeStep >= 3 ? "600" : "400", color: "var(--text-main)" }}>
              Processing
            </span>
          </div>

          <div style={{ width: "60px", height: "1px", background: activeStep >= 4 ? "#0c0a09" : "var(--border-card)" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: activeStep >= 4 ? "#0c0a09" : "#ffffff",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={18} color={activeStep >= 4 ? "#fff" : "var(--text-muted)"} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: activeStep >= 4 ? "600" : "400", color: "var(--text-main)" }}>
              Complete
            </span>
          </div>

        </div>

        {resultMessage && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "rgba(22, 163, 74, 0.1)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              color: "#16a34a",
              fontWeight: "600",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            {resultMessage}
          </div>
        )}

        {/* Automation Selection */}
        <section style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "4px" }}>Choose an automation to rewind</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Only comment-to-DM automations can be rewound.
              </p>
            </div>

            <button
              onClick={handleRunRewind}
              disabled={!selectedId || runningRewind}
              className="btn-ig-connect"
            >
              <Play size={15} fill="#ffffff" />
              {runningRewind ? "Running Rewind..." : "Start Rewind Job"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {automations.length === 0 ? (
              <div className="glass-card" style={{ padding: "30px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No comment-to-DM automations configured yet. Create a comment automation rule first to use Rewind.
              </div>
            ) : (
              automations.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="glass-card"
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: isSelected ? "2px solid #0c0a09" : "1px solid var(--border-card)",
                    background: isSelected ? "var(--bg-soft)" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "4px" }}>{item.name}</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-body)" }}>{item.details}</p>
                  </div>

                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: item.status === "Active" ? "rgba(22, 163, 74, 0.1)" : "rgba(245, 158, 11, 0.1)",
                      color: item.status === "Active" ? "#16a34a" : "#d97706",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              );
            }))}
          </div>
        </section>

        {/* Rewind History */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400" }}>Rewind History</h2>
            <button onClick={fetchAutomationsAndJobs} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {historyJobs.length === 0 ? (
            <div
              className="glass-card gradient-orb-sky"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <RotateCcw size={32} color="var(--text-muted)" />
              <h3 style={{ fontSize: "1.2rem", fontFamily: "var(--font-serif)", fontWeight: "300" }}>No rewind jobs yet</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-body)", maxWidth: "400px" }}>
                Your completed rewind jobs will appear here once executed.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {historyJobs.map((job) => (
                <div key={job.id} className="glass-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{job.automation_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Scanned {job.comments_scanned} comments · Dispatched {job.dms_sent} DMs
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#16a34a", background: "rgba(22, 163, 74, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
