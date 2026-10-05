"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Sparkles, ArrowRight } from "lucide-react";

interface TemplateItem {
  id: string;
  category: string;
  title: string;
  description: string;
  triggerKeyword: string;
  incomingText: string;
  replyText: string;
  buttonText: string;
  orbClass: string;
}

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Featured",
    "Engage audience",
    "Sell & earn",
    "Capture leads",
    "Book clients",
  ];

  const templates: TemplateItem[] = [
    {
      id: "tpl_1",
      category: "Sell & earn",
      title: "Reel Comment to Instant Checkout Link",
      description: "Auto-send a private DM with direct discount link whenever followers comment 'link' or 'app'.",
      triggerKeyword: "link",
      incomingText: "Can you send me the link please?",
      replyText: "Hey! 🚀 Here is the instant access link with 15% OFF applied:",
      buttonText: "Get Access Now",
      orbClass: "gradient-orb-mint",
    },
    {
      id: "tpl_2",
      category: "Capture leads",
      title: "Lead Magnet / eBook PDF Delivery",
      description: "Deliver digital freebies, guides, or PDF cheat sheets directly inside Instagram DMs.",
      triggerKeyword: "guide",
      incomingText: "Commented 'guide' on your recent Reel",
      replyText: "Thanks for checking out our guide! 🎁 Tap below to download your free PDF:",
      buttonText: "Download Free Guide",
      orbClass: "gradient-orb-peach",
    },
    {
      id: "tpl_3",
      category: "Engage audience",
      title: "Story Mention Instant VIP Voucher",
      description: "Reward creators and fans who mention your brand in their Instagram Story with an instant voucher.",
      triggerKeyword: "* (Story Mention)",
      incomingText: "Mentioned you in their Story",
      replyText: "Thanks for featuring us in your Story! 💖 Here is a 20% VIP code for your next order:",
      buttonText: "Claim VIP Code",
      orbClass: "gradient-orb-lavender",
    },
    {
      id: "tpl_4",
      category: "Book clients",
      title: "Calendar Booking & Strategy Session",
      description: "Automate discovery call scheduling when followers express interest in your services.",
      triggerKeyword: "book",
      incomingText: "I want to book a strategy call",
      replyText: "Awesome! 📅 Pick a time that works best for you on our live calendar:",
      buttonText: "Select Booking Time",
      orbClass: "gradient-orb-sky",
    },
    {
      id: "tpl_5",
      category: "Featured",
      title: "Groq AI Assistant Auto-DM",
      description: "Uses Groq Llama 3.1 AI to answer product questions and handle FAQs contextually.",
      triggerKeyword: "AI Catch-All (*)",
      incomingText: "Do you ship internationally to Canada?",
      replyText: "Yes! We ship worldwide with standard 3-5 day delivery. Here are full shipping rates:",
      buttonText: "View Shipping Rates",
      orbClass: "gradient-orb-rose",
    },
  ];

  const filteredTemplates =
    activeCategory === "All"
      ? templates
      : templates.filter((t) => t.category === activeCategory || (activeCategory === "Featured" && t.category === "Featured"));

  return (
    <DashboardLayout>
      <div style={{ padding: "48px 40px 96px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", fontWeight: "300", marginBottom: "6px" }}>Automation Templates</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Launch high-converting Instagram comment-to-DM workflows in one click.
          </p>
        </div>

        {/* Filter Pills Row */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "36px" }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  border: isActive ? "none" : "1px solid var(--border-card)",
                  background: isActive ? "#0c0a09" : "#ffffff",
                  color: isActive ? "#ffffff" : "var(--text-body)",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Templates Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className={`glass-card ${tpl.orbClass}`}
              style={{
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: "20px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      background: "rgba(12, 10, 9, 0.06)",
                      color: "var(--text-main)",
                    }}
                  >
                    {tpl.category}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Trigger: {tpl.triggerKeyword}</span>
                </div>

                <h3 style={{ fontSize: "1.3rem", fontFamily: "var(--font-serif)", fontWeight: "400", marginBottom: "8px" }}>{tpl.title}</h3>
                <p style={{ color: "var(--text-body)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "20px" }}>
                  {tpl.description}
                </p>

                {/* Mini DM Conversation Preview */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: "1px solid var(--border-card)",
                    marginBottom: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ alignSelf: "flex-start", background: "#f0efed", padding: "8px 12px", borderRadius: "14px", fontSize: "0.78rem", color: "var(--text-main)" }}>
                    &quot;{tpl.incomingText}&quot;
                  </div>
                  <div
                    style={{
                      alignSelf: "flex-end",
                      background: "#0c0a09",
                      padding: "10px 14px",
                      borderRadius: "14px 14px 2px 14px",
                      fontSize: "0.78rem",
                      color: "#fff",
                      maxWidth: "90%",
                    }}
                  >
                    <div style={{ marginBottom: "6px" }}>{tpl.replyText}</div>
                    <div style={{ padding: "6px", borderRadius: "9999px", background: "#292524", textAlign: "center", fontWeight: "500", fontSize: "0.75rem" }}>
                      {tpl.buttonText}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`/dashboard/automations/builder?template=${tpl.id}`}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "9999px",
                  background: "#0c0a09",
                  color: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: "500",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                Use Template <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
