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

    const id = getId(req);

    // ─── /api/sessions/:id ──────────────────────────────────────
    if (id) {
      const existing = await prisma.session.findFirst({
        where: { id, userId: user.id },
      });
      if (!existing) throw new ApiError("Session not found", 404, "NOT_FOUND");

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
        return res.status(200).json({ session: serialize(row) });
      }

      if (req.method === "DELETE") {
        await prisma.session.delete({ where: { id } });
        return res.status(204).end();
      }

      return methodNotAllowed(res, ["PATCH", "DELETE"]);
    }

    // ─── /api/sessions ──────────────────────────────────────────
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
        throw new ApiError("skillId is required", 422, "VALIDATION");
      }
      const duration = Number(body.durationMinutes);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new ApiError("durationMinutes must be > 0", 422, "VALIDATION");
      }

      const skill = await prisma.skill.findFirst({
        where: { id: body.skillId, userId: user.id },
      });
      if (!skill) throw new ApiError("Skill not found", 404, "NOT_FOUND");

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