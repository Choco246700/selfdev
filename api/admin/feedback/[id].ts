import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../../_lib/prisma";
import {
  ApiError,
  assertAdmin,
  handleError,
  methodNotAllowed,
  requireUser,
} from "../../_lib/server";

const VALID_STATUSES = ["new", "read", "resolved", "wontfix"];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    assertAdmin(user);

    const id = req.query.id;
    if (typeof id !== "string" || !id) {
      throw new ApiError("Missing id", 400);
    }

    if (req.method === "PATCH") {
      const body = (req.body ?? {}) as { status?: string; adminNotes?: string };
      if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
        throw new ApiError("Invalid status", 422);
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
  } catch (err) {
    return handleError(res, err);
  }
}