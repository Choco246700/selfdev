import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  assertAdmin,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

const VALID_STATUSES = ["new", "read", "resolved", "wontfix"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getSegments(req: VercelRequest): string[] {
  const url = (req.url ?? "").split("?")[0];
  const parts = url.split("/").filter(Boolean);
  return parts.slice(2);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    assertAdmin(user);

    const segments = getSegments(req);
    const first = segments[0];
    const second = segments[1];

    if (first === "users") {
      if (second) return await userById(req, res, user, second);
      return await users(req, res);
    }
    if (first === "stats") return await stats(req, res);
    if (first === "feedback") {
      if (second) return await feedbackById(req, res, second);
      return await feedbackList(req, res);
    }

    return res.status(404).json({ error: "Not found", segments });
  } catch (err) {
    return handleError(res, err);
  }
}

async function users(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      lastSignInAt: true,
    },
  });

  return res.status(200).json({
    users: rows.map((u) => ({
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt.toISOString(),
      lastSignInAt: u.lastSignInAt?.toISOString() ?? null,
      emailConfirmed: true,
    })),
  });
}

async function userById(
  req: VercelRequest,
  res: VercelResponse,
  currentUser: { id: string },
  targetId: string,
) {
  if (req.method !== "DELETE") return methodNotAllowed(res, ["DELETE"]);

  // Can't delete yourself
  if (targetId === currentUser.id) {
    throw new ApiError(
      "You can't delete your own account",
      400,
      "SELF_DELETE",
    );
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new ApiError("User not found", 404, "NOT_FOUND");

  // Prevent deleting the last admin
  if (target.isAdmin) {
    const adminCount = await prisma.user.count({
      where: { isAdmin: true },
    });
    if (adminCount <= 1) {
      throw new ApiError(
        "Can't delete the last admin — promote another user first",
        400,
        "LAST_ADMIN",
      );
    }
  }

  await prisma.user.delete({ where: { id: targetId } });
  return res.status(204).end();
}

async function stats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

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
}

async function feedbackList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({
    feedback: rows.map((f) => ({
      id: f.id,
      userId: f.userId,
      userEmail: f.userEmail,
      category: f.category,
      message: f.message,
      pageUrl: f.pageUrl,
      userAgent: f.userAgent,
      status: f.status,
      adminNotes: f.adminNotes,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

async function feedbackById(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
) {
  if (req.method === "PATCH") {
    const body = (req.body ?? {}) as {
      status?: string;
      adminNotes?: string;
    };
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      throw new ApiError("Invalid status", 422, "VALIDATION");
    }

    const row = await prisma.feedback.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.adminNotes !== undefined
          ? { adminNotes: body.adminNotes || null }
          : {}),
      },
    });

    return res.status(200).json({
      feedback: {
        id: row.id,
        status: row.status,
        adminNotes: row.adminNotes,
      },
    });
  }

  if (req.method === "DELETE") {
    await prisma.feedback.delete({ where: { id } });
    return res.status(204).end();
  }

  return methodNotAllowed(res, ["PATCH", "DELETE"]);
}