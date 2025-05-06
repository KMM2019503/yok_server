import jwt from "jsonwebtoken";

export const generateJwtTokenAndSetCookie = (user, password) => {
  // Generate JWT token

  return jwt.sign(
    { userId: user.id, userPassword: password },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "3m" }
  );
};
