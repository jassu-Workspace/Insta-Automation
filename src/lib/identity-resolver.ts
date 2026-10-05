import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

// In-memory cache for mapping target account IDs to Supabase user IDs
const accountMappingCache = new Map<string, string>();

/**
 * Recursively extracts all string numeric ID fields from a JSON payload
 */
function extractAllIdsFromPayload(obj: unknown, set: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== "object") return set;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractAllIdsFromPayload(item, set);
    }
    return set;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if ((key === "id" || key === "user_id" || key === "recipient_id" || key === "sender_id" || key === "account_id") && typeof value === "string") {
      set.add(value);
    } else if (typeof value === "object" && value !== null) {
      extractAllIdsFromPayload(value, set);
    }
  }

  return set;
}

/**
 * Identity Resolver: Maps incoming webhook target account ID to Supabase user account.
 * Returns the resolved user ID string, or null if no matching user account exists.
 */
export async function resolveUserId(targetAccountId: string, payload: unknown): Promise<string | null> {
  if (!targetAccountId) return null;

  // Step (a): Check in-memory cache
  if (accountMappingCache.has(targetAccountId)) {
    return accountMappingCache.get(targetAccountId)!;
  }

  if (!isSupabaseConfigured()) return null;

  const supabaseAdmin = createAdminClient();

  // Step (a) Direct match in Supabase DB
  try {
    const { data: directUsers, error: directErr } = await supabaseAdmin
      .from("users")
      .select("id, ig_account_id")
      .or(`ig_account_id.eq.${targetAccountId},id.eq.${targetAccountId}`)
      .limit(1);

    if (!directErr && directUsers && directUsers.length > 0) {
      const resolvedId = directUsers[0].id;
      accountMappingCache.set(targetAccountId, resolvedId);
      return resolvedId;
    }
  } catch (err) {
    console.warn("Direct identity resolution DB lookup exception:", err);
  }

  // Step (b) Payload IDs inspection & DB matching
  try {
    const extractedIds = Array.from(extractAllIdsFromPayload(payload));
    if (extractedIds.length > 0) {
      const { data: payloadMatchUsers, error: payloadErr } = await supabaseAdmin
        .from("users")
        .select("id, ig_account_id")
        .in("ig_account_id", extractedIds)
        .limit(1);

      if (!payloadErr && payloadMatchUsers && payloadMatchUsers.length > 0) {
        const resolvedId = payloadMatchUsers[0].id;
        accountMappingCache.set(targetAccountId, resolvedId);
        return resolvedId;
      }
    }
  } catch (err) {
    console.warn("Payload identity resolution DB lookup exception:", err);
  }

  // Step (c) Graph API Fallback: Verify token ownership against targetAccountId
  try {
    const { data: allUsers } = await supabaseAdmin.from("users").select("id, access_token, ig_account_id");
    
    if (allUsers && allUsers.length > 0) {
      for (const user of allUsers) {
        if (!user.access_token) continue;

        try {
          // Check Graph API /me endpoint with user token
          const res = await fetch(`https://graph.instagram.com/v24.0/me?fields=user_id,id&access_token=${user.access_token}`);
          if (res.ok) {
            const data = await res.json();
            const meId = data.user_id || data.id;
            if (meId === targetAccountId) {
              accountMappingCache.set(targetAccountId, user.id);
              return user.id;
            }
          }
        } catch {
          // Ignore individual Graph API errors in loop
        }
      }
    }
  } catch (err) {
    console.warn("Graph API fallback resolution exception:", err);
  }

  // If no user found in DB or Graph API, return null (do not fake resolution)
  return null;
}
