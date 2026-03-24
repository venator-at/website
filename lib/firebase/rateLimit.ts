import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./admin";

const WINDOW_MS = 60_000; // 1 minute
const MAX_CALLS = 10;

/**
 * Check and increment rate limit for a given identifier (userId or IP).
 * Returns { allowed: true } or { allowed: false, retryAfterMs: number }.
 */
export async function checkRateLimit(
  identifier: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number }> {
  const db = getAdminDb();
  const windowKey = Math.floor(Date.now() / WINDOW_MS);
  const docId = `${identifier}:${windowKey}`;
  const ref = db.collection("rate_limits").doc(docId);

  const newCount = await db.runTransaction(async (t) => {
    const snap = await t.get(ref);

    if (!snap.exists) {
      t.set(ref, {
        count: 1,
        // TTL field — Cloud Firestore TTL policy can clean these up automatically
        expiresAt: new Date(Date.now() + WINDOW_MS * 2),
      });
      return 1;
    }

    const current = (snap.data()?.count as number) ?? 0;
    t.update(ref, { count: FieldValue.increment(1) });
    return current + 1;
  });

  if (newCount > MAX_CALLS) {
    const windowEndMs = (windowKey + 1) * WINDOW_MS;
    const retryAfterMs = windowEndMs - Date.now();
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true };
}

/**
 * Extract a best-effort client identifier from request headers.
 * Prefers userId, falls back to IP.
 */
export function getRateLimitIdentifier(request: Request, userId: string | null): string {
  if (userId) return `user:${userId}`;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : "unknown";
  return `ip:${ip ?? "unknown"}`;
}
