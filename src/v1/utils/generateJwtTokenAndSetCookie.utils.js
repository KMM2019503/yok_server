import jwt from "jsonwebtoken";

export const generateJwtTokenAndSetCookie = (res, userId) => {
  // Generate JWT token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "5d",
  });

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 24 * 60 * 60 * 1000,
  };

  // Set the AuthToken cookie
  res.cookie("AuthToken", token, cookieOptions);

  return token;
};
