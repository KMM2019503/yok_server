import jwt from "jsonwebtoken";

export const generateJwtToken = (userId: string, userPassword: string): string =>
  jwt.sign(
    { userId, userPassword },
    process.env.JWT_SECRET_KEY as string,
    { expiresIn: "7d" },
  );
