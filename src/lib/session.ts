import { NextRequest } from "next/server";

export interface SessionUser {
  id: string;
  username?: string;
  profilePic?: string;
}

/**
 * Reads and parses the `dmflow_session` httpOnly cookie set during auth callback.
 * Returns the real logged-in user's ID, or null if no valid session cookie exists.
 */
export function getSessionUser(request: NextRequest): string | null {
  try {
    const cookieValue = request.cookies.get("dmflow_session")?.value;
    if (!cookieValue) return null;

    const parsed: SessionUser = JSON.parse(cookieValue);
    if (parsed && typeof parsed.id === "string" && parsed.id.trim().length > 0) {
      return parsed.id;
    }
    return null;
  } catch (err) {
    console.warn("Failed to parse dmflow_session cookie:", err);
    return null;
  }
}
