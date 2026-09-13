/**
 * Runtime backend mode. The whole app pivots on this single decision so the UI
 * and the proxy stay in sync about whether the HTTP API is live.
 *
 * - "remote": a real backend is configured (Supabase, or an explicitly enabled
 *   server file store). The browser talks to `/api/prompts`.
 * - "local": no backend configured. The browser persists to its own localStorage
 *   and the API stays dormant, so a fresh clone runs with zero setup.
 *
 * Reads only `process.env`, so it is safe in the proxy, server components and
 * route handlers alike (no `server-only` import).
 */
export type BackendMode = "remote" | "local";

export function backendMode(): BackendMode {
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  // Opt-in escape hatch to exercise the server file store without Supabase.
  const forceApi = process.env.ENABLE_SERVER_API === "true";
  return hasSupabase || forceApi ? "remote" : "local";
}

export function isRemoteBackend(): boolean {
  return backendMode() === "remote";
}
