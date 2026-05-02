import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";

// Delete stale FCM token service
export const deleteStaleFcmTokenServices = async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const users = await prisma.user.findMany({
      select: { id: true, fcm: true },
    });

    for (const user of users) {
      const { id, fcm } = user;

      if (!Array.isArray(fcm) || fcm.length === 0) {
        continue;
      }

      const validTokens = fcm.filter((entry) => {
        const tokenDate = new Date(entry.createdAt);
        return tokenDate > oneMonthAgo;
      });

      if (validTokens.length === fcm.length) {
        continue;
      }

      await prisma.user.update({
        where: { id },
        data: { fcm: validTokens },
      });

      logger.info(`Stale FCM tokens removed for user ${id}`);
    }

    logger.info("Stale FCM token cleanup completed successfully.");
    return { success: true };
  } catch (error) {
    logger.error("Error in deleteStaleFcmTokenServices", error);
    throw error;
  }
};
