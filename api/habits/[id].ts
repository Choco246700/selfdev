import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server";

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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new ApiError("Habit not found", 404);

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as {
        emoji?: string;
        name?: string;
        targetTime?: string;
        location?: string;
        frozen?: boolean;
      };
      const row = await prisma.habit.update({
        where: { id },
        data: {
          ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.targetTime !== undefined
            ? { targetTime: body.targetTime?.trim() || null }
            : {}),
          ...(body.location !== undefined
            ? { location: body.location?.trim() || null }
            : {}),
          ...(body.frozen !== undefined ? { frozen: body.frozen } : {}),
        },
      });
      return res.status(200).json({
        habit: {
          ...row,
          targetTime: row.targetTime ?? "",
          location: row.location ?? "",
          createdAt: row.createdAt.toISOString(),
        },
      });
    }

    if (req.method === "DELETE") {
      await prisma.habit.delete({ where: { id } });
      return res.status(204).end();
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (err) {
    return handleError(res, err);
  }
}