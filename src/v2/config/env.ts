import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8888),
  JWT_SECRET_KEY: z.string().min(1, "JWT_SECRET_KEY is required"),
  V2_INTERNAL_ENABLED: booleanFromEnv,
  V2_INTERNAL_TOKEN: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
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
};

export type Env = typeof env;
