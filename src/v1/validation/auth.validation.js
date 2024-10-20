import Joi from "joi";

export const signUpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must contain only digits and be 10-15 characters long, with an optional leading '+'",
      "string.empty": "Phone number is required",
    }),
  userName: Joi.string().min(3).max(30).required().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 30 characters long",
    "string.empty": "Username is required",
  }),
  profilePictureUrl: Joi.string().uri().optional().messages({
    "string.uri": "Profile picture URL must be a valid URI",
  }),
});

export const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must contain only digits and be 10-15 characters long, with an optional leading '+'",
      "string.empty": "Phone number is required",
    }),
});
