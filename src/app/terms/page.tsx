"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function TermsPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "40px 36px 80px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "16px" }}>Terms of Service</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          By using DMflow, you agree to comply with Meta Developer Policies and Instagram API Terms.
        </p>
      </div>
    </DashboardLayout>
  );
}
