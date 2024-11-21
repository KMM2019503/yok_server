import { PrismaClient } from "@prisma/client";
import logger from "../../utils/logger";

const prisma = new PrismaClient();

export const checkIsAdmin = async (req, res, next) => {
  try {
    const { userid } = req.headers; // Ensure the correct usage of headers
    const { channelId } = req.body;

    // Fetch the channel with superAdmin and admin details
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        superAdmin: true,
      },
    });

    console.log("🚀 ~ checkIsAdmin ~ channel:", channel);

    if (!channel) {
      logger.error(`Channel not found: ${channelId}`);
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the user is the super admin or an admin
    const isSuperAdmin = channel.superAdminId === userid;
    const isAdmin = channel.adminIds.includes(userid);

    if (!isSuperAdmin && !isAdmin) {
      logger.warn(
        `User ${userid} is neither super admin nor admin of channel ${channelId}`
      );
      return res
        .status(403)
        .json({ message: "Access denied: Not an admin or super admin" });
    }

    // Pass the channel object to the request for further processing
    req.headers.channel = channel; // Attach the channel object to the request headers
    next();
  } catch (error) {
    logger.error("Error in checkIsAdmin middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
