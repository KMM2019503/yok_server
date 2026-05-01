import bcrypt from "bcryptjs";
import { ValidationError, UnauthorizedError } from "../../shared/errors";
import { generateJwtToken } from "./auth.jwt";
import type { LoginBody, SignUpBody } from "./auth.types";
import type { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(input: LoginBody) {
    const user = await this.repository.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateJwtToken(user.id, user.passwordHash);

    return {
      token,
      payload: {
        success: true,
        user,
      },
    };
  }

  async signUp(input: SignUpBody) {
    const existingUser = await this.repository.findUserByEmail(input.email);

    if (existingUser) {
      throw new ValidationError("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.passwords, salt);

    const userUniqueID = `${input.userName.charAt(0).toUpperCase()}#${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const genderAvatar = input.gender === "M" ? "boy" : "girl";
    const autoAvatar =
      `https://avatar.iran.liara.run/public/${genderAvatar}?username=[${input.userName}]`;

    const newUser = await this.repository.createUser({
      userName: input.userName,
      profilePictureUrl: input.profilePictureUrl ?? autoAvatar,
      email: input.email,
      gender: input.gender,
      dateOfBirth: input.dob ? new Date(input.dob) : undefined,
      passwordHash,
      userUniqueID,
    });

    const token = generateJwtToken(newUser.id, newUser.passwordHash);

    return {
      token,
      payload: {
        success: true,
        user: newUser,
      },
    };
  }

  logout() {
    return {
      success: true,
      message: "Logged out successfully",
    };
  }
}
