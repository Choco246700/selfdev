import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./prisma.js";
import {
  clearSessionCookie,
  getSessionToken,
  verifySession,
} from "./auth.js";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function handleError(res: VercelResponse, err: unknown) {
  console.error("[api]", err);
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }
  if (err instanceof Error) {
    return res.status(500).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
}

/**
 * Reads x-user-email header, looks up the user.
 * Sends a 401 and returns null on failure.
 */
export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
) {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  try {
    const payload = await verifySession(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: "User not found" });
      return null;
    }
    return user;
  } catch {
    clearSessionCookie(res);
    res.status(401).json({ error: "Session expired" });
    return null;
  }
}

/** Serializes Prisma User → frontend-friendly shape. */
export function serializeUser(u: {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  lastSignInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    isAdmin: u.isAdmin,
    onboardingCompleted: u.onboardingCompleted,
    lastSignInAt: u.lastSignInAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

/** Enforces that the current user is an admin. */
export function assertAdmin(user: { isAdmin: boolean }) {
  if (!user.isAdmin) {
    throw new ApiError("Admin access required", 403, "FORBIDDEN");
  }
}

/** Reads and validates a required string field. */
export function requireField(body: unknown, key: string): string {
  const v = (body as Record<string, unknown> | undefined)?.[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new ApiError(`Missing required field: ${key}`, 422, "VALIDATION");
  }
  return v.trim();
}

/** Reads an optional string field, returning undefined if absent. */
export function optionalField(body: unknown, key: string): string | undefined {
  const v = (body as Record<string, unknown> | undefined)?.[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return undefined;
  return v;
}

/** Standard 405 response. */
export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({ error: "Method not allowed" });
}