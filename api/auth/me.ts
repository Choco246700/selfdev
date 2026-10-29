import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  handleError,
  methodNotAllowed,
  requireUser,
  serializeUser,
} from "../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === "GET") {
      return res.status(200).json({ user: serializeUser(user) });
    }

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as { onboardingCompleted?: boolean };
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(typeof body.onboardingCompleted === "boolean"
            ? { onboardingCompleted: body.onboardingCompleted }
            : {}),
        },
      });
      return res.status(200).json({ user: serializeUser(updated) });
    }

    return methodNotAllowed(res, ["GET", "PATCH"]);
  } catch (err) {
    return handleError(res, err);
  }
}