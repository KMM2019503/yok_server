import { PrismaClient } from "@prisma/client";
import { signUpSchema } from "../validation/auth.validation";
import bcrypt from "bcrypt";
import { generateJwtTokenAndSetCookie } from "../utils/generateJwtTokenAndSetCookie.utils";
import { ValidationError } from "../utils/validationErrors";

const prisma = new PrismaClient();

export const signUp = async (data, res) => {
  try {
    const { error } = signUpSchema.validate(data, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message);
      console.log("🚀 ~ signUp ~ validationErrors:", validationErrors);
      throw new ValidationError(validationErrors.join(", "));
    }

    const { phone, userName, profilePictureUrl } = data;

    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
      throw new ConflictError("User with this phone number already exists");
    }

    const newUser = await prisma.user.create({
      data: {
        phone,
        userName,
        profilePictureUrl,
        status: "OFFLINE",
      },
    });

    generateJwtTokenAndSetCookie(res, newUser.id); // This should work now

    return {
      id: newUser.id,
      phone: newUser.phone,
      userName: newUser.userName,
      profilePictureUrl: newUser.profilePictureUrl,
      status: newUser.status,
    };
  } catch (err) {
    console.error("Error occurred during sign-up:", err);
    throw err; // Rethrow or handle the error as needed
  }
};

export const login = (data) => {};
