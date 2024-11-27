import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";
import admin from "../utils/firebase";
import { removeSpacingOnPhoneNumber } from "../utils/helper";

export const login = async (req, res) => {
  try {
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

    const PhoneNumber = removeSpacingOnPhoneNumber(phone_number);

    // Check if the user exists in the database
    let existingUser = await prisma.user.findUnique({
      where: { firebaseUserId: uid },
      select: {
        id: true,
        phone: true,
        userName: true,
        firebaseUserId: true,
        profilePictureUrl: true,
      },
    });

    if (!existingUser) {
      // Create a new user if they do not exist
      existingUser = await prisma.user.create({
        data: {
          firebaseUserId: uid,
          phone: PhoneNumber,
          // Add additional fields if needed
        },
        select: {
          id: true,
          phone: true,
          userName: true,
          firebaseUserId: true,
          profilePictureUrl: true,
        },
      });
    }

    return {
      success: true,
      user: existingUser,
    };
  } catch (err) {
    logger.error("login ~ error:", err);
    return {
      success: false,
      error: err,
    };
  }
};
