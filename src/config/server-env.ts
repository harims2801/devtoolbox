import { z } from "zod";
const positiveInteger = z.coerce.number().int().positive();
const serverEnvironmentSchema = z.object({
  CANONICAL_HOST: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  FEEDBACK_WEBHOOK_URL: z.url().optional(),
  FEEDBACK_WEBHOOK_TOKEN: z.string().min(12).optional(),
  FEEDBACK_RATE_LIMIT_PER_MINUTE: positiveInteger.max(100).default(5),
  CERTIFICATE_RATE_LIMIT_PER_MINUTE: positiveInteger.max(100).default(10),
  SERVER_REQUEST_TIMEOUT_MS: positiveInteger
    .min(500)
    .max(15_000)
    .default(5_000),
});
export function getServerEnvironment() {
  const parsed = serverEnvironmentSchema.safeParse(process.env);
  if (!parsed.success)
    throw new Error("Invalid server environment configuration.");
  return parsed.data;
}
