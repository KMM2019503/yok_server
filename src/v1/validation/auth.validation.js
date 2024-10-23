import Joi from "joi";

export const loginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "string.empty": "ID token is required",
  }),
});
