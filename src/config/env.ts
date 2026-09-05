import { z } from "zod";

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ENABLE_KAU_COW: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsedEnvironment = clientEnvironmentSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENABLE_KAU_COW: process.env.NEXT_PUBLIC_ENABLE_KAU_COW,
});

if (!parsedEnvironment.success) {
  throw new Error("Invalid public environment configuration.");
}

export const env = Object.freeze(parsedEnvironment.data);
