import { SignJWT, jwtVerify } from "jose";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const SESSION_COOKIE = "selfdev_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: {
  sub: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(
  token: string,
): Promise<{ sub: string; email: string }> {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub) throw new Error("Invalid token");
  return { sub: payload.sub, email: String(payload.email ?? "") };
}

/* ─── Manual cookie handling (no `cookie` package) ──────────────── */

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function writeCookie(
  name: string,
  value: string,
  opts: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
    maxAge?: number;
  },
): string {
  let out = `${name}=${encodeURIComponent(value)}`;
  if (opts.path) out += `; Path=${opts.path}`;
  if (opts.maxAge !== undefined) out += `; Max-Age=${opts.maxAge}`;
  if (opts.httpOnly) out += `; HttpOnly`;
  if (opts.secure) out += `; Secure`;
  if (opts.sameSite) out += `; SameSite=${opts.sameSite}`;
  return out;
}

const IS_PROD = process.env.NODE_ENV === "production";

export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    writeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "Lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    }),
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    writeCookie(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    }),
  );
}

export function getSessionToken(req: VercelRequest): string | null {
  return readCookie(req.headers.cookie, SESSION_COOKIE);
}

export function redirect(res: VercelResponse, location: string) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}