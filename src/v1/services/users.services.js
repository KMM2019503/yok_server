import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
const prisma = new PrismaClient();

export const updateUserService = async (req) => {
  try {
    const { userId, body } = req;

    // Validate the userId and body if necessary
    if (!body) {
      throw new Error("Data are required.");
    }

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Only update the fields that are provided in the body
        phone: body.phone,
        userName: body.userName,
        profilePictureUrl: body.profilePictureUrl,
        updatedAt: new Date(), // Update the updatedAt timestamp
      },
    });
    // Respond with the updated user data
    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    throw error;
  }
};

export const deleteUserService = async (req) => {
  try {
    const { userId } = req.params;

    // Validate the userId if necessary
    if (!userId) {
      throw new Error("User ID is required.");
    }

    // Delete the user from the database
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    // Respond with a success message
    return deletedUser;
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw error;
  }
};
