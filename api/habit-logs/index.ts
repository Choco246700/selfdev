import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

function serialize(l: {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completed: boolean;
}) {
  return {
    id: l.id,
    userId: l.userId,
    habitId: l.habitId,
    date: l.date,
    completed: l.completed,
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
      const rows = await prisma.habitLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      });
      return res.status(200).json({ habitLogs: rows.map(serialize) });
    }

    if (req.method === "POST") {
      const body = req.body as {
        id?: string;
        habitId?: string;
        date?: string;
        completed?: boolean;
      };
      if (!body?.habitId || typeof body.habitId !== "string") {
        throw new ApiError("habitId is required", 422);
      }
      if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        throw new ApiError("date must be YYYY-MM-DD", 422);
      }

      const habit = await prisma.habit.findFirst({
        where: { id: body.habitId, userId: user.id },
      });
      if (!habit) throw new ApiError("Habit not found", 404);

      // Upsert handles the "already logged today" case (unique constraint)
      const row = await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: body.habitId, date: body.date } },
        update: { completed: body.completed ?? true },
        create: {
          ...(body.id ? { id: body.id } : {}),
          userId: user.id,
          habitId: body.habitId,
          date: body.date,
          completed: body.completed ?? true,
        },
      });
      return res.status(201).json({ habitLog: serialize(row) });
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    return handleError(res, err);
  }
}