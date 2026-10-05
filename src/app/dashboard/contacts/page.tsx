"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Users,
  Mail,
  Zap,
  Search,
  Download,
  MessageSquare,
} from "lucide-react";

interface ContactItem {
  id: string;
  username: string;
  email?: string;
  dmsCount: number;
  firstContact: string;
  lastActive: string;
}

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/inbox/conversations");
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        const mapped = data.conversations.map((c: any, idx: number) => ({
          id: c.id,
          username: c.follower_username || c.follower_id || `user_${idx + 1}`,
          email: c.follower_email || "",
          dmsCount: 1,
          firstContact: new Date(c.updated_at || Date.now()).toISOString().split("T")[0],
          lastActive: "Recently",
        }));
        setContacts(mapped);
      } else {
        setContacts([]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleExportCSV = () => {
    const headers = ["Username", "Email", "DMs Exchanged", "First Contact", "Last Active"];
    const rows = filteredContacts.map((c) => [
      c.username,
      c.email || "",
      c.dmsCount.toString(),
      c.firstContact,
      c.lastActive,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dmflow_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContacts = contacts.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase()) || (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Contacts</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              All Instagram leads and followers who interacted with your DM automations.
            </p>
          </div>

          <button onClick={handleExportCSV} className="btn-ig-connect">
            <Download size={16} /> Export to CSV
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "36px" }}>
          <div className="glass-card gradient-orb-mint" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TOTAL CONTACTS</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginTop: "4px" }}>{contacts.length.toLocaleString()}</div>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color="var(--text-main)" />
            </div>
          </div>

          <div className="glass-card gradient-orb-peach" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>WITH EMAIL CAPTURED</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginTop: "4px" }}>{contacts.filter((c) => !!c.email).length}</div>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={20} color="var(--text-main)" />
            </div>
          </div>

          <div className="glass-card gradient-orb-sky" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.5px" }}>ACTIVE TODAY</div>
              <div style={{ fontSize: "2.4rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginTop: "4px" }}>{contacts.length}</div>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color="var(--text-main)" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px", position: "relative", maxWidth: "400px" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search contacts by @username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              borderRadius: "9999px",
              background: "#ffffff",
              border: "1px solid var(--border-card)",
              color: "var(--text-main)",
              fontSize: "0.88rem",
              outline: "none",
            }}
          />
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
                <th style={{ padding: "16px 24px" }}>FOLLOWER</th>
                <th style={{ padding: "16px 24px" }}>EMAIL</th>
                <th style={{ padding: "16px 24px" }}>DMS EXCHANGED</th>
                <th style={{ padding: "16px 24px" }}>FIRST CONTACT</th>
                <th style={{ padding: "16px 24px" }}>LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Loading contacts...</td></tr>
              ) : filteredContacts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No contacts found.</td></tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border-card)" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "0.8rem" }}>
                          {c.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: "600", color: "var(--text-main)" }}>@{c.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: c.email ? "var(--text-main)" : "var(--text-muted)" }}>{c.email || "—"}</td>
                    <td style={{ padding: "16px 24px", fontWeight: "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MessageSquare size={14} color="var(--text-muted)" /> {c.dmsCount}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "var(--text-muted)" }}>{c.firstContact}</td>
                    <td style={{ padding: "16px 24px", color: "#16a34a", fontWeight: "600" }}>{c.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}
