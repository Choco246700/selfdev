import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireField,
  requireUser,
} from "../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === "GET") {
      const skills = await prisma.skill.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
      return res.status(200).json({ skills });
    }

    if (req.method === "POST") {
      const name = requireField(req.body, "name");
      const color = requireField(req.body, "color");
      const weeklyGoalHours = Number(
        (req.body as { weeklyGoalHours?: unknown })?.weeklyGoalHours,
      );
      if (!Number.isFinite(weeklyGoalHours) || weeklyGoalHours <= 0) {
        throw new ApiError("weeklyGoalHours must be > 0", 422, "VALIDATION");
      }

      const bodyId = (req.body as { id?: string })?.id;
      const skill = await prisma.skill.create({
        data: {
          ...(bodyId ? { id: bodyId } : {}),
          userId: user.id,
          name,
          color,
          weeklyGoalHours,
        },
      });
      return res.status(201).json({ skill });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleError(res, err);
  }
}