import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  assertAdmin,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireUser(req, res);
    if (!user) return;
    assertAdmin(user);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        lastSignInAt: true,
      },
    });

    return res.status(200).json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt.toISOString(),
        lastSignInAt: u.lastSignInAt?.toISOString() ?? null,
        emailConfirmed: true,
      })),
    });
  } catch (err) {
    return handleError(res, err);
  }
}