import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server";

function serialize(h: {
  id: string;
  userId: string;
  emoji: string;
  name: string;
  targetTime: string | null;
  location: string | null;
  frozen: boolean;
  createdAt: Date;
}) {
  return {
    id: h.id,
    userId: h.userId,
    emoji: h.emoji,
    name: h.name,
    targetTime: h.targetTime ?? "",
    location: h.location ?? "",
    frozen: h.frozen,
    createdAt: h.createdAt.toISOString(),
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const rows = await prisma.habit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
      return res.status(200).json({ habits: rows.map(serialize) });
    }

    if (req.method === "POST") {
      const body = req.body as {
        id?: string;
        emoji?: string;
        name?: string;
        targetTime?: string;
        location?: string;
      };
      if (!body?.emoji || !body?.name) {
        throw new ApiError("emoji and name are required", 422);
      }

      const row = await prisma.habit.create({
        data: {
          ...(body.id ? { id: body.id } : {}),
          userId: user.id,
          emoji: body.emoji,
          name: body.name.trim(),
          targetTime: body.targetTime?.trim() || null,
          location: body.location?.trim() || null,
          frozen: false,
        },
      });
      return res.status(201).json({ habit: serialize(row) });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleError(res, err);
  }
}