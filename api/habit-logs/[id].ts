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

    const existing = await prisma.habitLog.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new ApiError("Habit log not found", 404);

    if (req.method === "DELETE") {
      await prisma.habitLog.delete({ where: { id } });
      return res.status(204).end();
    }

    return methodNotAllowed(res, ["DELETE"]);
  } catch (err) {
    return handleError(res, err);
  }
}