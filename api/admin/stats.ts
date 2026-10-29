import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  assertAdmin,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    const user = await requireUser(req, res);
    if (!user) return;
    assertAdmin(user);

    const weekAgo = new Date(Date.now() - WEEK_MS);

    const [
      totalUsers,
      newUsersThisWeek,
      activeUsersThisWeek,
      totalSkills,
      totalSessions,
      totalHabits,
      totalHabitLogs,
      totalFeedback,
      unreadFeedback,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { lastSignInAt: { gte: weekAgo } } }),
      prisma.skill.count(),
      prisma.session.count(),
      prisma.habit.count(),
      prisma.habitLog.count(),
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "new" } }),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        newUsersThisWeek,
        confirmedUsers: totalUsers,
        activeUsersThisWeek,
        totalSkills,
        totalSessions,
        totalHabits,
        totalHabitLogs,
        totalFeedback,
        unreadFeedback,
      },
    });
  } catch (err) {
    return handleError(res, err);
  }
}