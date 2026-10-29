import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { prisma } from "../_lib/prisma.js";
import { setSessionCookie, signSession } from "../_lib/auth.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  serializeUser,
} from "../_lib/server.js";

const ROUNDS = 12;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!rawEmail) {
      throw new ApiError("Email is required", 422, "MISSING_EMAIL");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      throw new ApiError("Enter a valid email address", 422, "INVALID_EMAIL");
    }
    if (password.length < 8) {
      throw new ApiError(
        "Password must be at least 8 characters",
        422,
        "WEAK_PASSWORD",
      );
    }

    const email = rawEmail.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    let user;

    if (!existing) {
      // ─── First time: create account ───────────────────────────────
      const passwordHash = await bcrypt.hash(password, ROUNDS);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          lastSignInAt: new Date(),
        },
      });
    } else if (!existing.passwordHash) {
      // ─── Existing user migrating from x-user-email auth ───────────
      const passwordHash = await bcrypt.hash(password, ROUNDS);
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, lastSignInAt: new Date() },
      });
    } else {
      // ─── Existing user with password: verify ──────────────────────
      const ok = await bcrypt.compare(password, existing.passwordHash);
      if (!ok) {
        throw new ApiError(
          "Incorrect email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { lastSignInAt: new Date() },
      });
    }

    const jwt = await signSession({ sub: user.id, email: user.email });
    setSessionCookie(res, jwt);

    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    return handleError(res, err);
  }
}