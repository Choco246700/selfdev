import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const id = req.query.id;
    if (typeof id !== "string" || !id) {
      throw new ApiError("Missing id", 400);
    }

    const existing = await prisma.session.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new ApiError("Session not found", 404);

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as {
        durationMinutes?: number;
        notes?: string;
      };
      const row = await prisma.session.update({
        where: { id },
        data: {
          ...(body.durationMinutes !== undefined
            ? { durationMinutes: body.durationMinutes }
            : {}),
          ...(body.notes !== undefined
            ? { notes: body.notes?.trim() || null }
            : {}),
        },
      });
      return res.status(200).json({
        session: {
          ...row,
          notes: row.notes ?? "",
          createdAt: row.createdAt.toISOString(),
        },
      });
    }

    if (req.method === "DELETE") {
      await prisma.session.delete({ where: { id } });
      return res.status(204).end();
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (err) {
    return handleError(res, err);
  }
}