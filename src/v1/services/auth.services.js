import { PrismaClient } from "@prisma/client";
import { loginSchema, signUpSchema } from "../validation/auth.validation";
import { generateJwtTokenAndSetCookie } from "../utils/generateJwtTokenAndSetCookie.utils";
import { ValidationError } from "../utils/validationErrors";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export const signUp = async (data, res) => {
  try {
    const { error } = signUpSchema.validate(data, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      throw new ValidationError(validationErrors.join(", "));
    }

    const { phone, userName, profilePictureUrl } = data;

    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
      throw new Error("User with this phone number already exists");
    }

    const newUser = await prisma.user.create({
      data: {
        phone,
        userName,
        profilePictureUrl,
        status: "OFFLINE",
      },
    });

    generateJwtTokenAndSetCookie(res, newUser.id);

    return {
      id: newUser.id,
      phone: newUser.phone,
      userName: newUser.userName,
      profilePictureUrl: newUser.profilePictureUrl,
      status: newUser.status,
    };
  } catch (err) {
    throw err;
  }
};

export const login = async (data, res) => {
  try {
    const { error } = loginSchema.validate(data, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      logger.error("login ~ validationErrors:", validationErrors);
      throw new ValidationError(validationErrors.join(", "));
    }

    const { phone } = data;

    // Find user by phone
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (!existingUser) {
      throw new Error("User with this phone number does not exist");
    }

    // Generate JWT and set cookie
    generateJwtTokenAndSetCookie(res, existingUser.id);

    return {
      id: existingUser.id,
      phone: existingUser.phone,
      userName: existingUser.userName,
      profilePictureUrl: existingUser.profilePictureUrl,
      status: existingUser.status,
    };
  } catch (err) {
    throw err;
  }
};
