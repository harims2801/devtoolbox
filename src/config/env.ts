import { z } from "zod";

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const parsedEnvironment = clientEnvironmentSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsedEnvironment.success) {
  throw new Error("Invalid public environment configuration.");
}

export const env = Object.freeze(parsedEnvironment.data);
