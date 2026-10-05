"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ArrowLeft,
  HelpCircle,
  Play,
  Save,
  Check,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Plus,
  X,
  ExternalLink,
  Link2,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
  Smile,
  Image as ImageIcon,
} from "lucide-react";

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
}

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const templateId = searchParams.get("template");

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string>("");
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(6);
  const [postOption, setPostOption] = useState<"specific" | "next" | "any">("specific");
  const [keywordOption, setKeywordOption] = useState<"specific" | "any">("specific");
  const [keywordInput, setKeywordInput] = useState<string>("link");
  const [enablePublicReply, setEnablePublicReply] = useState<boolean>(true);
  const suggestedChips = ["link", "shop", "order", "buy", "price", "discount", "info", "details"];
  const [enableOpeningDM, setEnableOpeningDM] = useState<boolean>(false);
  const [openingDMText, setOpeningDMText] = useState<string>("Hey! Thanks for your comment! 🙌");
  const [openingDMButtonText, setOpeningDMButtonText] = useState<string>("Send me the link");
  const [enableFollowGate, setEnableFollowGate] = useState<boolean>(false);
  const [enableEmailCapture, setEnableEmailCapture] = useState<boolean>(false);
  const [outboundWebhookUrl, setOutboundWebhookUrl] = useState<string>("");
  const [ruleName, setRuleName] = useState<string>("Comment → Instant Link DM");
  const [messageText, setMessageText] = useState<string>("Hey there! 🚀 Here is the instant access link you requested: https://dmflow.app/access");
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkTitle, setLinkTitle] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<"post" | "dm">("post");
  const [saving, setSaving] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);

  const [username, setUsername] = useState<string>("your_account");

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/instagram/media");
      const data = await res.json();
      if (data.media && data.media.length > 0) {
        setMediaList(data.media);
        if (!selectedMediaId) setSelectedMediaId(data.media[0].id);
      } else {
        setMediaList([]);
      }
    } catch {
      setMediaList([]);
    }
  };

  useEffect(() => {
    fetchMedia();
    if (templateId) {
      if (templateId === "tpl_1") {
        setRuleName("Reel Comment Checkout Link");
        setKeywordInput("link, shop");
        setMessageText("Hey! 🚀 Here is the instant access checkout link with 15% OFF applied:");
        setLinks([{ title: "Get Access Now", url: "https://dmflow.app/checkout" }]);
      } else if (templateId === "tpl_2") {
        setRuleName("Lead Magnet PDF Delivery");
        setKeywordInput("guide, pdf");
        setMessageText("Thanks for checking out our guide! 🎁 Tap below to download your free PDF:");
        setLinks([{ title: "Download Free Guide", url: "https://dmflow.app/pdf" }]);
      }
    }
    if (editId) {
      fetch("/api/automations")
        .then((res) => res.json())
        .then((data) => {
          if (data.automations) {
            const existing = data.automations.find((a: any) => a.id === editId);
            if (existing) {
              setRuleName(existing.name);
              setKeywordInput(existing.trigger_value);
              setMessageText(existing.response_content?.text || "");
              if (existing.specific_media_id) { setPostOption("specific"); setSelectedMediaId(existing.specific_media_id); }
              if (existing.enable_opening_dm) { setEnableOpeningDM(true); if (existing.opening_dm_text) setOpeningDMText(existing.opening_dm_text); if (existing.opening_dm_button_text) setOpeningDMButtonText(existing.opening_dm_button_text); }
              if (existing.enable_follow_gate) setEnableFollowGate(true);
              if (existing.enable_email_capture) setEnableEmailCapture(true);
              if (existing.outbound_webhook_url) setOutboundWebhookUrl(existing.outbound_webhook_url);
              if (existing.button_text && existing.button_url) setLinks([{ title: existing.button_text, url: existing.button_url }]);
            }
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, editId]);

  const handleAddChip = (chip: string) => {
    const list = keywordInput.split(",").map((k) => k.trim()).filter(Boolean);
    if (!list.includes(chip) && list.length < 20) { list.push(chip); setKeywordInput(list.join(", ")); }
  };

  const parsedKeywordsCount = keywordInput.split(",").map((k) => k.trim()).filter(Boolean).length;

  const handleOpenLinkModal = () => { setLinkTitle(""); setLinkUrl(""); setLinkModalOpen(true); };
  const handleAddLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) { setLinks((prev) => [...prev, { title: linkTitle.trim(), url: linkUrl.trim() }]); setLinkModalOpen(false); setLinkTitle(""); setLinkUrl(""); }
  };
  const handleRemoveLink = (idx: number) => setLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleSaveAutomation = async (isActive: boolean) => {
    setSaving(true);
    try {
      const firstLink = links[0];
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId || undefined, name: ruleName, trigger_source: "comment", trigger_type: "keyword",
          trigger_value: keywordOption === "any" ? "*" : keywordInput, response_text: messageText, reply_mode: "both",
          specific_media_id: postOption === "specific" ? selectedMediaId : null,
          enable_opening_dm: enableOpeningDM, opening_dm_text: enableOpeningDM ? openingDMText : null,
          opening_dm_button_text: enableOpeningDM ? openingDMButtonText : null,
          enable_follow_gate: enableFollowGate, enable_email_capture: enableEmailCapture,
          outbound_webhook_url: outboundWebhookUrl.trim() || null,
          button_text: firstLink?.title || null, button_url: firstLink?.url || null, is_active: isActive,
        }),
      });
      if (res.ok) { setDeploySuccess(true); setTimeout(() => router.push("/dashboard/automations"), 1200); }
    } catch (err) { console.error("Save error:", err); } finally { setSaving(false); }
  };

  const selectedMediaObj = mediaList.find((m) => m.id === selectedMediaId) || mediaList[0];

  return (
    <div className="builder-root">

      {/* ── HEADER ── */}
      <header className="builder-header">
        <div className="builder-header-left">
          <Link href="/dashboard/automations" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={18} />
          </Link>
          <input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="builder-name-input" />
        </div>
        <div className="builder-header-right">
          <Link href="/docs" className="builder-help-link" style={{ color: "var(--text-muted)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <HelpCircle size={15} /> Need help?
          </Link>
          <button onClick={() => handleSaveAutomation(false)} disabled={saving} className="builder-btn-outline">
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => handleSaveAutomation(true)} disabled={saving} className="builder-btn-primary">
            <Play size={13} fill="#ffffff" /> {saving ? "Deploying..." : "Start Automation"}
          </button>
        </div>
      </header>

      {deploySuccess && (
        <div style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", textAlign: "center", fontWeight: "600", fontSize: "0.85rem", flexShrink: 0 }}>
          ✅ Automation deployed successfully! Redirecting...
        </div>
      )}

      {/* ── Mobile: Preview Toggle ── */}
      <button className="builder-mobile-preview-toggle" onClick={() => setShowPreview(!showPreview)}>
        {showPreview ? "Hide Preview" : "Show Preview"} <ChevronDown size={14} />
      </button>

      {/* ── WORKSPACE ── */}
      <div className="builder-workspace">

        {/* ── Left: Phone Preview ── */}
        {showPreview && (
          <div className="builder-preview gradient-orb-peach">
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Preview
              </span>
              <div className="builder-tab-group">
                <button className={`builder-tab ${previewTab === "post" ? "active" : ""}`} onClick={() => setPreviewTab("post")}>Post</button>
                <button className={`builder-tab ${previewTab === "dm" ? "active" : ""}`} onClick={() => setPreviewTab("dm")}>DM Reply</button>
              </div>
            </div>

            {/* Phone Frame */}
            <div className="builder-phone">
              <div className="builder-phone-notch" />

              {previewTab === "post" ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", color: "var(--text-main)", overflowY: "auto" }}>
                  <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-card)", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.7rem" }}>
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: "600", fontSize: "0.8rem" }}>{username}</span>
                    </div>
                    <span style={{ color: "var(--text-muted)" }}>•••</span>
                  </div>
                  <div style={{ width: "100%", height: "200px", background: "#f0efed", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0, overflow: "hidden" }}>
                    {(selectedMediaObj?.thumbnail_url || selectedMediaObj?.media_url) ? (
                      <img src={selectedMediaObj.thumbnail_url || selectedMediaObj.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <ImageIcon size={30} color="#777169" />
                        <span style={{ fontSize: "0.65rem", color: "#777169" }}>{selectedMediaObj?.media_type === "VIDEO" ? "Reel" : "Post"}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: "12px" }}><Heart size={18} color="#dc2626" fill="#dc2626" /><MessageCircle size={18} /><Send size={18} /></div>
                    <Bookmark size={18} />
                  </div>
                  <div style={{ padding: "0 14px", fontSize: "0.78rem", lineHeight: 1.4, flexShrink: 0 }}>
                    {selectedMediaObj && <p style={{ fontWeight: "600", fontSize: "0.72rem", marginBottom: "3px" }}>{(selectedMediaObj.like_count || 0).toLocaleString()} likes</p>}
                    <p style={{ marginBottom: "6px" }}><strong>{username}</strong> {selectedMediaObj?.caption || "Comment below for instant access!"}</p>
                  </div>
                  <div style={{ padding: "0 14px 14px", flexShrink: 0 }}>
                    <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", display: "flex", gap: "8px" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#777169", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.72rem" }}>user_follower</div>
                        <div style={{ fontWeight: "600", fontSize: "0.78rem" }}>&quot;{keywordInput.split(",")[0]?.trim() || "link"}&quot;</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", color: "var(--text-main)", padding: "14px", overflowY: "auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-card)", paddingBottom: "10px", flexShrink: 0 }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontWeight: "700", fontSize: "0.72rem" }}>
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: "600", fontSize: "0.82rem" }}>{username}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Active now</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "flex-end" }}>
                    <div style={{ alignSelf: "flex-start", background: "#f0efed", padding: "8px 12px", borderRadius: "16px", maxWidth: "80%", fontSize: "0.8rem" }}>
                      {keywordInput.split(",")[0]?.trim() || "link"}
                    </div>
                    {enableOpeningDM && (
                      <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", gap: "4px", maxWidth: "85%" }}>
                        <div style={{ background: "#0c0a09", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: "0.8rem", lineHeight: 1.3 }}>{openingDMText}</div>
                        {openingDMButtonText && <div style={{ alignSelf: "flex-end", padding: "6px 14px", borderRadius: "9999px", background: "#fff", border: "1px solid var(--border-card)", fontSize: "0.72rem", fontWeight: "500", textAlign: "center" }}>{openingDMButtonText}</div>}
                      </div>
                    )}
                    <div style={{ alignSelf: "flex-end", background: "#0c0a09", color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", maxWidth: "85%", fontSize: "0.8rem" }}>
                      <p style={{ marginBottom: links.length > 0 ? "6px" : "0", lineHeight: 1.3 }}>{messageText}</p>
                      {links.map((lnk, i) => (
                        <div key={i} style={{ padding: "6px 10px", borderRadius: "9999px", background: "#292524", textAlign: "center", fontWeight: "500", fontSize: "0.72rem", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          {lnk.title} <ExternalLink size={10} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Right: Step Panel ── */}
        <div className="builder-panel">

          {/* STEP 1: When a user comments on */}
          <div className="builder-step-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: selectedMediaId ? "#16a34a" : "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.7rem" }}>
                {selectedMediaId ? <Check size={12} /> : "1"}
              </div>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font-serif)", fontWeight: "600", margin: 0 }}>When a user comments on</h3>
            </div>

            <div className={`builder-option-card ${postOption === "specific" ? "active" : ""}`} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: postOption === "specific" ? "10px" : "0" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>A specific post or reel</span>
                <input type="checkbox" checked={postOption === "specific"} onChange={() => setPostOption(postOption === "specific" ? "any" : "specific")} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              {postOption === "specific" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
                    {mediaList.slice(0, visiblePostsCount).map((media) => (
                      <div
                        key={media.id}
                        role="button"
                        tabIndex={0}
                        className={`builder-post-thumb ${media.id === selectedMediaId ? "selected" : ""}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMediaId(media.id); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMediaId(media.id); } }}
                      >
                        {(media.thumbnail_url || media.media_url) && <img src={media.thumbnail_url || media.media_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />}
                        {media.id === selectedMediaId && (
                          <div style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", borderRadius: "50%", background: "#16a34a", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                            <Check size={10} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                        <span style={{ fontSize: "0.58rem", color: "#fff", lineHeight: 1.2, opacity: 0.95, position: "relative", zIndex: 2, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                          {media.caption ? (media.caption.length > 22 ? media.caption.substring(0, 22) + "…" : media.caption) : "Post"}
                        </span>
                        <div style={{ display: "flex", gap: "5px", fontSize: "0.58rem", color: "#fff", background: "rgba(0,0,0,0.65)", padding: "1px 4px", borderRadius: "3px", position: "relative", zIndex: 2 }}>
                          <span>❤️ {(media.like_count || 0).toLocaleString()}</span>
                          <span>💬 {(media.comments_count || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visiblePostsCount < mediaList.length && (
                    <button type="button" onClick={() => setVisiblePostsCount((prev) => Math.min(prev + 3, mediaList.length))} className="builder-btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "0.78rem" }}>
                      Show More
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0" }}>OR</div>

            <div className={`builder-option-card ${postOption === "next" ? "active" : ""}`} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>Next post or reel</span>
                <input type="checkbox" checked={postOption === "next"} onChange={() => setPostOption(postOption === "next" ? "specific" : "next")} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0" }}>OR</div>

            <div className={`builder-option-card ${postOption === "any" ? "active" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>Any post or reel</span>
                <input type="checkbox" checked={postOption === "any"} onChange={() => setPostOption(postOption === "any" ? "specific" : "any")} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
            </div>
          </div>

          {/* STEP 2: And his/her comment has */}
          <div className="builder-step-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.7rem" }}>2</div>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font-serif)", fontWeight: "600", margin: 0 }}>And his/her comment has</h3>
            </div>

            <div className={`builder-option-card ${keywordOption === "specific" ? "active" : ""}`} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: keywordOption === "specific" ? "8px" : "0" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>A specific keyword</span>
                <input type="checkbox" checked={keywordOption === "specific"} onChange={() => setKeywordOption(keywordOption === "specific" ? "any" : "specific")} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              {keywordOption === "specific" && (
                <div>
                  <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} placeholder="Enter keywords" style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", background: "#fff", border: "1px solid var(--border-card)", color: "var(--text-main)", fontSize: "0.82rem", outline: "none", marginBottom: "6px" }} />
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "5px" }}>Suggested:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
                    {suggestedChips.map((chip) => (
                      <button key={chip} type="button" onClick={() => handleAddChip(chip)} style={{ padding: "2px 8px", borderRadius: "9999px", background: keywordInput.split(",").map(k => k.trim()).includes(chip) ? "#0c0a09" : "#fff", color: keywordInput.split(",").map(k => k.trim()).includes(chip) ? "#fff" : "var(--text-main)", border: "1px solid var(--border-card)", fontSize: "0.7rem", fontWeight: "500", cursor: "pointer", transition: "all 0.15s ease" }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.65rem", color: "var(--text-muted)" }}>{parsedKeywordsCount}/20</div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0" }}>OR</div>

            <div className={`builder-option-card ${keywordOption === "any" ? "active" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>Any word</span>
                <input type="checkbox" checked={keywordOption === "any"} onChange={() => setKeywordOption(keywordOption === "any" ? "specific" : "any")} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Auto-reply publicly:</span>
                <input type="checkbox" checked={enablePublicReply} onChange={(e) => setEnablePublicReply(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
            </div>
          </div>

          {/* STEP 3: They will optionally get */}
          <div className="builder-step-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.7rem" }}>3</div>
              <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font-serif)", fontWeight: "600", margin: 0 }}>They will optionally get</h3>
            </div>

            <div className={`builder-option-card ${enableOpeningDM ? "active" : ""}`} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: enableOpeningDM ? "10px" : "2px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>an opening DM</span>
                <input type="checkbox" checked={enableOpeningDM} onChange={(e) => setEnableOpeningDM(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Send an initial message before the main content</p>
              {enableOpeningDM && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Opening Message</label>
                    <textarea rows={2} value={openingDMText} onChange={(e) => setOpeningDMText(e.target.value)} placeholder="Hey! Thanks for your comment!" style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", background: "#fff", border: "1px solid var(--border-card)", color: "var(--text-main)", fontSize: "0.78rem", lineHeight: 1.3, outline: "none", resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>Button text</label>
                    <input type="text" value={openingDMButtonText} onChange={(e) => setOpeningDMButtonText(e.target.value)} placeholder="Send me the link" style={{ width: "100%", padding: "7px 9px", borderRadius: "8px", background: "#fff", border: "1px solid var(--border-card)", color: "var(--text-main)", fontSize: "0.78rem", outline: "none" }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0" }}>OR</div>

            <div className={`builder-option-card ${enableFollowGate ? "active" : ""}`} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>Follow-gate</span>
                <input type="checkbox" checked={enableFollowGate} onChange={(e) => setEnableFollowGate(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Require follow before receiving the DM</p>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0" }}>OR</div>

            <div className={`builder-option-card ${enableEmailCapture ? "active" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "500" }}>Email Capture</span>
                <input type="checkbox" checked={enableEmailCapture} onChange={(e) => setEnableEmailCapture(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0c0a09" }} />
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Collect email before sending the DM</p>
            </div>
          </div>

          {/* STEP 4: And they will get a DM with */}
          <div className="builder-step-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0c0a09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.7rem" }}>4</div>
                <h3 style={{ fontSize: "0.95rem", fontFamily: "var(--font-serif)", fontWeight: "600", margin: 0 }}>And they will get a DM with</h3>
              </div>
              <button type="button" onClick={() => setTemplateModalOpen(true)} style={{ padding: "3px 10px", borderRadius: "9999px", background: "#fff", border: "1px solid var(--border-card)", color: "var(--text-main)", fontSize: "0.7rem", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                <LayoutTemplate size={12} /> Template
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: "8px" }}>
              <textarea rows={3} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Enter your message..." style={{ width: "100%", padding: "9px 10px", borderRadius: "10px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", color: "var(--text-main)", fontSize: "0.82rem", lineHeight: 1.3, outline: "none", resize: "vertical" }} />
              <Smile size={16} color="var(--text-muted)" style={{ position: "absolute", right: "10px", bottom: "10px", cursor: "pointer" }} />
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "10px" }}>{messageText.length}/1000 characters</div>

            {links.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                {links.map((lnk, i) => (
                  <div key={i} style={{ padding: "7px 10px", borderRadius: "8px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                      <Link2 size={12} color="var(--text-muted)" />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: "600", fontSize: "0.75rem" }}>{lnk.title}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lnk.url}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveLink(i)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px" }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={handleOpenLinkModal} className="builder-btn-outline" style={{ width: "100%", justifyContent: "center", marginBottom: "12px" }}>
              <Plus size={14} /> Add Link
            </button>

            <div style={{ borderTop: "1px solid var(--border-card)", paddingTop: "10px" }}>
              <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "var(--text-main)", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}>
                <span>Advanced Settings</span>
                {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {advancedOpen && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "3px", fontWeight: "600" }}>Fallback response:</label>
                    <input type="text" defaultValue="Thanks for reaching out! We'll reply shortly." style={{ width: "100%", padding: "7px", borderRadius: "8px", border: "1px solid var(--border-card)", background: "var(--bg-soft)", color: "var(--text-main)", fontSize: "0.78rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "3px", fontWeight: "600" }}>Outbound Webhook URL (Zapier / Make / CRM):</label>
                    <input
                      type="url"
                      value={outboundWebhookUrl}
                      onChange={(e) => setOutboundWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      style={{ width: "100%", padding: "7px", borderRadius: "8px", border: "1px solid var(--border-card)", background: "var(--bg-soft)", color: "var(--text-main)", fontSize: "0.78rem" }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                      Sends lead data & captured emails via HTTP POST to external webhooks.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {templateModalOpen && (
        <div className="builder-modal-overlay" onClick={() => setTemplateModalOpen(false)}>
          <div className="builder-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.2rem", fontFamily: "var(--font-serif)", fontWeight: "300", margin: 0 }}>Select Template</h3>
              <button onClick={() => setTemplateModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <button onClick={() => { setRuleName("Reel Comment Checkout Link"); setKeywordInput("link, shop"); setMessageText("Hey! 🚀 Here is the instant access checkout link with 15% OFF applied:"); setLinks([{ title: "Get Access Now", url: "https://dmflow.app/checkout" }]); setTemplateModalOpen(false); }} style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", color: "var(--text-main)", textAlign: "left", cursor: "pointer" }}>
                <strong>Reel Comment → Checkout Link</strong>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>Pre-fills keyword &quot;link&quot; + discount link button</div>
              </button>
              <button onClick={() => { setRuleName("Lead Magnet PDF Delivery"); setKeywordInput("guide, pdf, ebook"); setMessageText("Thanks for your interest! 🎁 Tap the link below to grab your free guide:"); setLinks([{ title: "Download Free Guide", url: "https://dmflow.app/pdf" }]); setTemplateModalOpen(false); }} style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", color: "var(--text-main)", textAlign: "left", cursor: "pointer" }}>
                <strong>Lead Magnet PDF Delivery</strong>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>Keywords &quot;guide&quot;, &quot;pdf&quot; + download button</div>
              </button>
            </div>
            <button onClick={() => setTemplateModalOpen(false)} style={{ width: "100%", padding: "8px", borderRadius: "9999px", background: "transparent", border: "1px solid var(--border-card)", color: "var(--text-main)", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
          </div>
        </div>
      )}

      {linkModalOpen && (
        <div className="builder-modal-overlay" onClick={() => { setLinkModalOpen(false); setLinkTitle(""); setLinkUrl(""); }}>
          <div className="builder-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", fontFamily: "var(--font-serif)", fontWeight: "300", margin: 0 }}>Add Link Button</h3>
              <button onClick={() => { setLinkModalOpen(false); setLinkTitle(""); setLinkUrl(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600" }}>Link Title</label>
                  <span style={{ fontSize: "0.65rem", color: linkTitle.length > 20 ? "#dc2626" : "var(--text-muted)" }}>{linkTitle.length}/20</span>
                </div>
                <input type="text" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value.slice(0, 20))} placeholder="e.g. Get Access Now" style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", fontSize: "0.85rem", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: "600", display: "block", marginBottom: "3px" }}>URL</label>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com/link" style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", background: "var(--bg-soft)", border: "1px solid var(--border-card)", fontSize: "0.85rem", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setLinkModalOpen(false); setLinkTitle(""); setLinkUrl(""); }} className="builder-btn-outline" style={{ flex: 1, justifyContent: "center", padding: "9px" }}>Cancel</button>
              <button onClick={handleAddLink} disabled={!linkTitle.trim() || !linkUrl.trim()} className="builder-btn-primary" style={{ flex: 1, justifyContent: "center", padding: "9px" }}>
                <Link2 size={14} /> Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationBuilderPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div style={{ padding: "40px", color: "var(--text-muted)" }}>Loading builder...</div>}>
        <BuilderContent />
      </Suspense>
    </DashboardLayout>
  );
}
