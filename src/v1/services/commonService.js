import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";

// Delete stale FCM token service
export const deleteStaleFcmTokenServices = async () => {
  try {
    // Calculate the date 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Fetch all users with their FCM tokens
    const users = await prisma.user.findMany({
      select: { id: true, fcm: true },
    });

    for (const user of users) {
      const { id, fcm } = user;

      if (Array.isArray(fcm) && fcm.length > 0) {
        // Filter out stale tokens
        const validTokens = fcm.filter((entry) => {
          const tokenDate = new Date(entry.createdAt);
          return tokenDate > oneMonthAgo; // Keep tokens less than 1 month old
        });

        // Check if stale tokens exist
        if (validTokens.length !== fcm.length) {
          // Update user FCM tokens with valid ones
          await prisma.user.update({
            where: { id },
            data: { fcm: validTokens },
          });

          logger.info(`Stale FCM tokens removed for user ${id}`);
        }
      }
    }

    logger.info("Stale FCM token cleanup completed successfully.");
    return { success: true };
  } catch (error) {
    logger.error("Error in deleteStaleFcmTokenServices:", error);
    throw error;
  }
};
