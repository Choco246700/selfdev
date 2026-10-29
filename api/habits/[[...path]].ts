import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

function getId(req: VercelRequest): string | undefined {
  const url = (req.url ?? "").split("?")[0];
  const parts = url.split("/").filter(Boolean);
  return parts[2];
}

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

    const id = getId(req);

    // ─── /api/habits/:id ────────────────────────────────────────
    if (id) {
      const existing = await prisma.habit.findFirst({
        where: { id, userId: user.id },
      });
      if (!existing) throw new ApiError("Habit not found", 404, "NOT_FOUND");

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
        return res.status(200).json({ habit: serialize(row) });
      }

      if (req.method === "DELETE") {
        await prisma.habit.delete({ where: { id } });
        return res.status(204).end();
      }

      return methodNotAllowed(res, ["PATCH", "DELETE"]);
    }

    // ─── /api/habits ────────────────────────────────────────────
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
        throw new ApiError("emoji and name are required", 422, "VALIDATION");
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