import { NextRequest, NextResponse } from "next/server";
import { getInstagramAuthUrl } from "@/lib/instagram";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isDemo = searchParams.get("demo") === "true";
  const forceOAuth = searchParams.get("force_oauth") === "true";

  const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || "";
  const isPlaceholderApp = !appId || appId === "1234567890" || appId.includes("placeholder");

  // If demo requested or if Instagram App ID is a dummy placeholder (and force_oauth is not set)
  if (!forceOAuth && (isDemo || isPlaceholderApp)) {
    const baseUrl = request.nextUrl.origin;
    const response = NextResponse.redirect(`${baseUrl}/dashboard?demo_notice=true`);

    response.cookies.set("dmflow_session", JSON.stringify({
      id: "17841400000000000",
      username: "dmflow_official",
      profilePic: "",
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    return response;
  }

  const authUrl = getInstagramAuthUrl();
  return NextResponse.redirect(authUrl);
}

