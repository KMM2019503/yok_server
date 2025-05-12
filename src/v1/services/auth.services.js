import prisma from "../../../prisma/prismaClient";
import logger from "../utils/logger";
import { removeSpacingOnPhoneNumber } from "../utils/helper";
import { generateJwtTokenAndSetCookie } from "../utils/generateJwtTokenAndSetCookie.utils";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = generateJwtTokenAndSetCookie(user, user.passwordHash);
    console.log("🚀 ~ login ~ token:", token)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
      sameSite: "Strict",
    });

    return {
      success: true,
      user,
    };
  } catch (err) {
    logger.error("login ~ error:", err);
    return {
      success: false,
      error: "Internal server error",
    };
  }
};

export const signUp = async (userData, res) => {
  try {
    const { userName, profilePictureUrl, email, gender, dob, passwords } =
      userData;

    if (!userName || !email) {
      return res.status(400).json({
        success: false,
        error: "User name and email are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwords, salt);

    const userUniqueID = `${userName.charAt(0).toUpperCase()}#${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newUser = await prisma.user.create({
      data: {
        userName,
        email,
        gender,
        dateOfBirth: dob,
        profilePictureUrl,
        passwordHash,
        userUniqueID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const token = generateJwtTokenAndSetCookie(newUser, newUser.passwordHash);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3 * 60 * 1000,
      sameSite: "Strict",
    });
    return {
      success: true,
      user: newUser,
    };
  } catch (err) {
    logger.error("signUp ~ error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("AuthToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Error occurred during logout:", error);
    res.status(500).json({ error: error.message });
  }
};
