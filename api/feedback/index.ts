import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../_lib/prisma.js";
import {
  ApiError,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../_lib/server.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const body = req.body as {
      category?: string;
      message?: string;
      pageUrl?: string;
      userAgent?: string;
    };
    const message = body.message?.trim();
    if (!message || message.length < 5) {
      throw new ApiError("Message is too short", 422);
    }
    if (message.length > 1000) {
      throw new ApiError("Message is too long", 422);
    }
    const category = body.category ?? "general";
    if (!["bug", "feature", "general"].includes(category)) {
      throw new ApiError("Invalid category", 422);
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        category,
        message,
        pageUrl: body.pageUrl ?? null,
        userAgent: body.userAgent ?? null,
        status: "new",
      },
    });

    return res.status(201).json({
      feedback: { id: feedback.id, createdAt: feedback.createdAt.toISOString() },
    });
  } catch (err) {
    return handleError(res, err);
  }
}