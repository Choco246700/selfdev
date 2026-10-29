import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma.js";
import {
  assertAdmin,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireUser(req, res);
    if (!user) return;
    assertAdmin(user);

    const rows = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      feedback: rows.map((f) => ({
        id: f.id,
        userId: f.userId,
        userEmail: f.userEmail,
        category: f.category,
        message: f.message,
        pageUrl: f.pageUrl,
        userAgent: f.userAgent,
        status: f.status,
        adminNotes: f.adminNotes,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(res, err);
  }
}