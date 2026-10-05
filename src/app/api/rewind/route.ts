import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInstagramMediaComments, sendInstagramMessage } from "@/lib/instagram";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("rewind_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ jobs: [] });
    }

    return NextResponse.json({ jobs: data || [] });
  } catch {
    return NextResponse.json({ jobs: [] });
  }
}

export async function POST(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { automation_id } = body;
    if (!automation_id) {
      return NextResponse.json({ error: "Missing automation_id parameter" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch automation rule
    const { data: rule, error: ruleErr } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("id", automation_id)
      .eq("user_id", userId)
      .single();

    if (ruleErr || !rule) {
      return NextResponse.json({ error: "Automation rule not found" }, { status: 404 });
    }

    const ruleName = rule.name || "Comments → DM Rewind";
    const mediaId = rule.specific_media_id;
    if (!mediaId) {
      return NextResponse.json({ error: "Automation rule does not specify a target media ID for rewind" }, { status: 400 });
    }

    const keywords = (rule.trigger_value || "").split(",").map((k: string) => k.trim().toLowerCase());
    const dmText = rule.response_content?.text || "Thanks for your comment!";

    // 2. Fetch User Access Token
    const { data: userRec } = await supabaseAdmin
      .from("users")
      .select("access_token")
      .eq("id", userId)
      .single();

    const accessToken = userRec?.access_token;
    if (!accessToken) {
      const jobObj = {
        id: `rw_job_${Date.now()}`,
        user_id: userId,
        automation_id,
        automation_name: ruleName,
        status: "failed",
        comments_scanned: 0,
        dms_sent: 0,
        created_at: new Date().toISOString(),
      };
      try {
        await supabaseAdmin.from("rewind_jobs").insert(jobObj);
      } catch {
        // DB insert fallback
      }
      return NextResponse.json({
        success: false,
        job: jobObj,
        error: "No valid Instagram access token found for user",
      }, { status: 400 });
    }

    // 3. Scan comments via Graph API (initialized to 0)
    let commentsScanned = 0;
    let dmsSent = 0;
    let dmsFailed = 0;

    let commentsData: any;
    try {
      commentsData = await getInstagramMediaComments(mediaId, accessToken);
    } catch (graphErr: unknown) {
      const errMsg = graphErr instanceof Error ? graphErr.message : "Failed to fetch comments from Instagram";
      const failedJobObj = {
        id: `rw_job_${Date.now()}`,
        user_id: userId,
        automation_id,
        automation_name: ruleName,
        status: "failed",
        comments_scanned: 0,
        dms_sent: 0,
        created_at: new Date().toISOString(),
      };
      try {
        await supabaseAdmin.from("rewind_jobs").insert(failedJobObj);
      } catch {
        // DB insert fallback
      }
      return NextResponse.json({
        success: false,
        job: failedJobObj,
        error: `Rewind job failed: ${errMsg}`,
      }, { status: 500 });
    }

    if (commentsData?.data && Array.isArray(commentsData.data)) {
      commentsScanned = commentsData.data.length;

      for (const commentObj of commentsData.data) {
        const text = (commentObj.text || "").toLowerCase();
        const isMatch = keywords.some((kw: string) => kw && text.includes(kw));
        const commenterId = commentObj.from?.id;

        if (isMatch && commenterId) {
          const sendRes = await sendInstagramMessage(commenterId, dmText, accessToken);
          if (sendRes.success) {
            dmsSent++;
          } else {
            dmsFailed++;
          }
        }
      }
    }

    const jobStatus = dmsFailed > 0 ? "failed" : "completed";
    const jobMessage = dmsFailed > 0
      ? `Rewind completed with errors: ${commentsScanned} scanned, ${dmsSent} sent, ${dmsFailed} failed.`
      : `Rewind completed! Scanned ${commentsScanned} comments and sent ${dmsSent} DMs.`;

    const jobObj = {
      id: `rw_job_${Date.now()}`,
      user_id: userId,
      automation_id,
      automation_name: ruleName,
      status: jobStatus,
      comments_scanned: commentsScanned,
      dms_sent: dmsSent,
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from("rewind_jobs").insert(jobObj);
    } catch {
      // DB insert fallback
    }

    return NextResponse.json({
      success: jobStatus === "completed",
      job: jobObj,
      message: jobMessage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute rewind job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
