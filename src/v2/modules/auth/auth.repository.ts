import prisma from "../../shared/db/prisma";

type PrismaClientLike = {
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<AuthUserRecord | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<AuthUserRecord>;
  };
};

export type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  [key: string]: unknown;
};

export class AuthRepository {
  constructor(
    private readonly db: PrismaClientLike = prisma as unknown as PrismaClientLike,
  ) {}

  findUserByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  createUser(data: {
    userName: string;
    profilePictureUrl?: string;
    email: string;
    gender?: "M" | "F" | "T";
    dateOfBirth?: Date;
    passwordHash: string;
    userUniqueID: string;
  }) {
    return this.db.user.create({
      data: {
        userName: data.userName,
        profilePictureUrl: data.profilePictureUrl,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        passwordHash: data.passwordHash,
        userUniqueID: data.userUniqueID,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
