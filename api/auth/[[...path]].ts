import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { prisma } from "../_lib/prisma.js";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "../_lib/auth.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
  serializeUser,
} from "../_lib/server.js";

const ROUNDS = 12;

function getAction(req: VercelRequest): string | undefined {
  const url = (req.url ?? "").split("?")[0];
  const parts = url.split("/").filter(Boolean); // ['api', 'auth', 'signin']
  return parts[2];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const action = getAction(req);
  try {
    if (action === "signin") return await signin(req, res);
    if (action === "me") return await me(req, res);
    if (action === "logout") return await logout(req, res);
    return res.status(404).json({ error: "Not found", action });
  } catch (err) {
    return handleError(res, err);
  }
}

async function signin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!rawEmail) throw new ApiError("Email is required", 422, "MISSING_EMAIL");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail))
    throw new ApiError("Enter a valid email address", 422, "INVALID_EMAIL");
  if (password.length < 8)
    throw new ApiError(
      "Password must be at least 8 characters",
      422,
      "WEAK_PASSWORD",
    );

  const email = rawEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  let user;

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);
    user = await prisma.user.create({
      data: { email, passwordHash, lastSignInAt: new Date() },
    });
  } else if (!existing.passwordHash) {
    const passwordHash = await bcrypt.hash(password, ROUNDS);
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, lastSignInAt: new Date() },
    });
  } else {
    const ok = await bcrypt.compare(password, existing.passwordHash);
    if (!ok)
      throw new ApiError(
        "Incorrect email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { lastSignInAt: new Date() },
    });
  }

  const jwt = await signSession({ sub: user.id, email: user.email });
  setSessionCookie(res, jwt);
  return res.status(200).json({ user: serializeUser(user) });
}

async function me(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    return res.status(200).json({ user: serializeUser(user) });
  }

  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as { onboardingCompleted?: boolean };
    const updated = await prisma.user.update({
      where: { id: user.id },
      data:
        typeof body.onboardingCompleted === "boolean"
          ? { onboardingCompleted: body.onboardingCompleted }
          : {},
    });
    return res.status(200).json({ user: serializeUser(updated) });
  }

  return methodNotAllowed(res, ["GET", "PATCH"]);
}

async function logout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  clearSessionCookie(res);
  return res.status(204).end();
}