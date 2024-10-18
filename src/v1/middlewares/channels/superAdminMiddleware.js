import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger";

const prisma = new PrismaClient();

export const isSuperAdmin = async (req, res, next) => {
  try {
    const { userId } = req;
    const { channelId } = req.params;

    // Check if the current user is the super admin of the channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { superAdminId: true },
    });

    if (!channel) {
      logger.error(`Channel not found: ${channelId}`);
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.superAdminId !== userId) {
      logger.warn(
        `User ${userId} is not the super admin of channel ${channelId}`
      );
      return res
        .status(403)
        .json({ message: "Access denied: Not a super admin" });
    }

    // User is the super admin, proceed to the next middleware or controller
    req.channelId = channelId;
    next();
  } catch (error) {
    logger.error("🚀 ~ isSuperAdmin ~ error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
