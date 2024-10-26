import { PrismaClient } from "@prisma/client";
import { loginSchema } from "../validation/auth.validation";
import { ValidationError } from "../utils/validationErrors";
import logger from "../utils/logger";
import admin from "../utils/firebase";

const prisma = new PrismaClient();

export const login = async (req, res) => {
  try {
    logger.debug("login routed called");
    // const { error } = loginSchema.validate(req.headers, { abortEarly: false });

    // if (error) {
    //   const validationErrors = error.details.map((detail) => detail.message);
    //   logger.error("login ~ validationErrors:", validationErrors);
    //   throw new ValidationError(validationErrors.join(", "));
    // }

    const authHeader = req.headers.authorization; // Extract the Authorization header
    const authToken = authHeader.split(" ")[1];

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(authToken);
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
    return {
      success: false,
      error: err,
    };
  }
};
