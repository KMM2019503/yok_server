import { PrismaClient } from "@prisma/client";
import { loginSchema } from "../validation/auth.validation";
import { ValidationError } from "../utils/validationErrors";
import logger from "../utils/logger";
import admin from "../utils/firebase";

const prisma = new PrismaClient();

export const login = async (data, res) => {
  try {
    const { error } = loginSchema.validate(data, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      logger.error("login ~ validationErrors:", validationErrors);
      throw new ValidationError(validationErrors.join(", "));
    }

    // Extract ID token from the request
    const { idToken } = data;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number } = decodedToken;

    // Check if the user exists in the database
    let existingUser = await prisma.user.findUnique({
      where: { firebaseUserId: uid },
    });

    if (!existingUser) {
      // Create a new user if they do not exist
      existingUser = await prisma.user.create({
        data: {
          firebaseUserId: uid,
          phone: phone_number,
          // Add additional fields if needed
        },
      });
    }

    return {
      success: true,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        userName: existingUser.userName,
        profilePictureUrl: existingUser.profilePictureUrl,
        status: existingUser.status,
      },
    };
  } catch (err) {
    logger.error("login ~ error:", err);
    throw err;
  }
};
