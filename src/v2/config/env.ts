import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8888),
    JWT_SECRET_KEY: z.string().min(1, "JWT_SECRET_KEY is required"),
    V2_INTERNAL_ENABLED: booleanFromEnv,
    V2_INTERNAL_TOKEN: z.string().optional(),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    GEMINI_API_KEY: z.string().min(1).optional(),
    PERSONA_AI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
    PERSONA_AI_ENABLED: booleanFromEnv,
  })
  .superRefine((value, context) => {
    if (value.PERSONA_AI_ENABLED && !value.GEMINI_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY is required when PERSONA_AI_ENABLED=true",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment variables: ${formatted}`);
}

export const env = {
  ...parsed.data,
  V2_INTERNAL_ENABLED: parsed.data.V2_INTERNAL_ENABLED ?? false,
  PERSONA_AI_ENABLED: parsed.data.PERSONA_AI_ENABLED ?? false,
};

export type Env = typeof env;
