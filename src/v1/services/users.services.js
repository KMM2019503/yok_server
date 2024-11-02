import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { removeSpacingOnPhoneNumber } from "../utils/helper";
import { ErrorCodes } from "../utils/error/error_codes";
import { AppError } from "../utils/error/app_error";
const prisma = new PrismaClient();

export const updateUserService = async (req) => {
  try {
    const { userid } = req.header;
    const { body } = req;

    // Validate the userId and body if necessary
    if (!body) {
      throw new Error("Data are required.");
    }

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userid },
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

export const fetchUserByPhoneNumberService = async (req) => {
  let { phoneNumber } = req.params;

  // Remove any spaces from the phone number
  phoneNumber = removeSpacingOnPhoneNumber(phoneNumber);
  console.log("🚀 ~ fetchUserByPhoneNumberService ~ phoneNumber:", phoneNumber);

  // Validate phone number format: must start with '+' followed by digits
  const phoneRegex = /^\+\d+$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error(
      "Invalid phone number format. The phone number should start with '+' followed by digits."
    );
  }

  // Fetch the user from the database using Prisma
  const user = await prisma.user.findUnique({
    where: {
      phone: phoneNumber,
    },
  });

  // If no user is found, return an appropriate response
  if (!user) {
    // Throw a specific error with a custom message, status code, and error code
    throw new AppError("User not found", 404, ErrorCodes.UserNotFound);
  }

  // Return the found user
  return {
    success: true,
    user: user,
  };
};
