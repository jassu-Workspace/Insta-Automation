import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { fetchUserInstagramMedia } from "@/lib/instagram";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUser(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    let accessToken = "";

    const { data } = await supabaseAdmin
      .from("users")
      .select("access_token")
      .eq("id", userId)
      .single();

    if (data?.access_token) {
      accessToken = data.access_token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Couldn't load your posts: No connected Instagram access token found" },
        { status: 400 }
      );
    }

    const mediaItems = await fetchUserInstagramMedia(accessToken);

    const enrichedMedia = mediaItems.map((item: any, idx: number) => ({
      id: item.id,
      caption: item.caption || `Instagram Post #${idx + 1}`,
      media_type: item.media_type || "VIDEO",
      thumbnail_url: item.thumbnail_url || item.permalink,
      permalink: item.permalink,
      like_count: item.like_count || 0,
      comments_count: item.comments_count || 0,
    }));

    return NextResponse.json({ media: enrichedMedia });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Couldn't load your posts, check your Instagram connection";
    return NextResponse.json({ error: `Couldn't load your posts, check your Instagram connection: ${message}` }, { status: 500 });
  }
}
