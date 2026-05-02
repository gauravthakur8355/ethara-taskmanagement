import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../middleware/error.middleware";
import { prisma } from "../../config/database";
import { sendSuccess } from "../../shared/utils/response";

const router = Router();

router.use(authenticate as any);

// GET /api/v1/users/search?email=xxx — search users by email for project invitations
router.get(
  "/search",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query;

    if (!email || typeof email !== "string" || email.trim().length < 2) {
      sendSuccess(res, [], "Provide at least 2 characters to search");
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email.trim(), mode: "insensitive" },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
      take: 10,
    });

    sendSuccess(res, users, `Found ${users.length} users`);
  })
);

export default router;
