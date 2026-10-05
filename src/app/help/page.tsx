"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HelpCircle, ExternalLink } from "lucide-react";

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "40px 36px 80px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <HelpCircle size={28} color="var(--accent-coral)" />
          <h1 style={{ fontSize: "1.8rem", fontWeight: "900" }}>Help Center & Support</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
          Need assistance setting up DMflow Instagram automations? Contact our 24/7 priority support team or read our detailed setup guide.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link href="/docs" className="btn-ig-connect" style={{ borderRadius: "10px", padding: "10px 20px", fontSize: "0.9rem" }}>
            Read Integration Docs
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
