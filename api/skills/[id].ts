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
      throw new ApiError("Missing id", 400, "BAD_REQUEST");
    }

    const existing = await prisma.skill.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new ApiError("Skill not found", 404, "NOT_FOUND");

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as {
        name?: string;
        color?: string;
        weeklyGoalHours?: number;
      };
      const skill = await prisma.skill.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.color !== undefined ? { color: body.color } : {}),
          ...(body.weeklyGoalHours !== undefined
            ? { weeklyGoalHours: body.weeklyGoalHours }
            : {}),
        },
      });
      return res.status(200).json({ skill });
    }

    if (req.method === "DELETE") {
      await prisma.skill.delete({ where: { id } });
      return res.status(204).end();
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (err) {
    return handleError(res, err);
  }
}