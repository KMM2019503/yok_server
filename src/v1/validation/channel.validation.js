import Joi from "joi";

export const createChannelSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Channel name is required.",
    "string.min": "Channel name should be at least 3 characters long.",
    "string.max": "Channel name should not exceed 50 characters.",
  }),
  description: Joi.string().max(255).optional().messages({
    "string.max": "Description should not exceed 255 characters.",
  }),
  isPublic: Joi.boolean().default(true).messages({
    "boolean.base": "isPublic should be a boolean value.",
  }),
  profilePictureUrl: Joi.string().uri().optional().messages({
    "string.uri": "Profile picture URL must be a valid URL.",
  }),
  adminIds: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Admins should be an array of user IDs.",
    "string.base": "Each admin ID should be a string.",
  }),
});
