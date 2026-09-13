import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { backendMode } from "@/lib/runtime";

const SESSION_COOKIE = "prompt_stash_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function equalSecret(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signSession(password: string, issuedAt: number): string {
  return createHmac("sha256", password).update(String(issuedAt)).digest("hex");
}

function validSessionCookie(cookie: string | undefined, password: string): boolean {
  if (!cookie) return false;
  const dot = cookie.indexOf(".");
  if (dot < 0) return false;
  const issuedAt = Number(cookie.slice(0, dot));
  const signature = cookie.slice(dot + 1);
  if (!Number.isFinite(issuedAt) || !signature) return false;
  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_TTL_SECONDS) return false;
  try {
    return equalSecret(signature, signSession(password, issuedAt));
  } catch {
    return false;
  }
}

function issueSessionCookie(password: string): { name: string; value: string; maxAge: number } {
  const issuedAt = Date.now();
  return {
    name: SESSION_COOKIE,
    value: `${issuedAt}.${signSession(password, issuedAt)}`,
    maxAge: SESSION_TTL_SECONDS,
  };
}

function deny(message: string, status: number, challenge = false) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(challenge ? { "WWW-Authenticate": 'Basic realm="Prompt Stash", charset="UTF-8"' } : {}),
      },
    },
  );
}

export function proxy(request: NextRequest) {
  // In local mode the whole app runs in the browser; keep the API dormant.
  if (backendMode() === "local") {
    return request.nextUrl.pathname.startsWith("/api/")
      ? deny("API access is disabled in local (browser-storage) mode.", 503)
      : NextResponse.next();
  }
  const password = process.env.WORKSPACE_PASSWORD;
  const apiKey = process.env.PROMPT_STASH_API_KEY;
  const authorization = request.headers.get("authorization") ?? "";
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  // NextURL normalizes loopback IPs to localhost; the browser Origin does not.
  const requestHost = request.headers.get("host") ?? request.nextUrl.host;
  const hostname = new URL(`http://${requestHost}`).hostname;
  const expectedOrigin = process.env.APP_ORIGIN || `${request.nextUrl.protocol}//${requestHost}`;
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

  // A public deployment fails closed instead of exposing the personal library.
  if ((process.env.VERCEL || !isLocal) && (!password || !apiKey)) {
    return deny(
      "Configure WORKSPACE_PASSWORD and PROMPT_STASH_API_KEY before exposing this workspace.",
      503,
    );
  }

  // Explicit logout endpoint: clears the session cookie so the next request re-auths.
  if (request.nextUrl.pathname === "/api/session/logout" && request.method === "POST") {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !isLocal,
    });
    return response;
  }

  // Bearer tokens authenticate machine callers (Codex, curl) for the entire API.
  if (authorization.startsWith("Bearer ")) {
    if (!isApi || !apiKey || !equalSecret(authorization.slice(7), apiKey)) {
      return deny("Invalid API key or unsupported API operation.", 401);
    }
    return NextResponse.next();
  }

  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const crossSite = request.headers.get("sec-fetch-site") === "cross-site";
    if (crossSite || (origin && origin !== expectedOrigin)) {
      return deny("Cross-origin requests are not allowed.", 403);
    }
  }

  if (password) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (validSessionCookie(cookie, password)) return NextResponse.next();

    let valid = false;
    if (authorization.startsWith("Basic ")) {
      try {
        const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
        const separator = decoded.indexOf(":");
        valid =
          separator >= 0 &&
          equalSecret(decoded.slice(0, separator), process.env.WORKSPACE_USERNAME || "owner") &&
          equalSecret(decoded.slice(separator + 1), password);
      } catch {
        valid = false;
      }
    }
    if (!valid) return deny("Workspace authentication required.", 401, true);
    // Successful Basic Auth mints a signed cookie so subsequent requests skip the prompt.
    const response = NextResponse.next();
    const cookiePayload = issueSessionCookie(password);
    response.cookies.set({
      ...cookiePayload,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: !isLocal,
    });
    return response;
  } else if (apiKey && isApi && !request.headers.get("origin")) {
    return deny("A Bearer API key is required.", 401);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
};
