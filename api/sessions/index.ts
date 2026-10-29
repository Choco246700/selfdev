import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server";

function serialize(s: {
  id: string;
  userId: string;
  skillId: string;
  durationMinutes: number;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: s.id,
    userId: s.userId,
    skillId: s.skillId,
    durationMinutes: s.durationMinutes,
    notes: s.notes ?? "",
    createdAt: s.createdAt.toISOString(),
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
      const rows = await prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ sessions: rows.map(serialize) });
    }

    if (req.method === "POST") {
      const body = req.body as {
        id?: string;
        skillId?: string;
        durationMinutes?: number;
        notes?: string;
      };
      if (!body?.skillId || typeof body.skillId !== "string") {
        throw new ApiError("skillId is required", 422);
      }
      const duration = Number(body.durationMinutes);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new ApiError("durationMinutes must be > 0", 422);
      }

      const skill = await prisma.skill.findFirst({
        where: { id: body.skillId, userId: user.id },
      });
      if (!skill) throw new ApiError("Skill not found", 404);

      const row = await prisma.session.create({
        data: {
          ...(body.id ? { id: body.id } : {}),
          userId: user.id,
          skillId: body.skillId,
          durationMinutes: duration,
          notes: body.notes?.trim() || null,
        },
      });
      return res.status(201).json({ session: serialize(row) });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleError(res, err);
  }
}