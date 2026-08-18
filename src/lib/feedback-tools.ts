import { z } from "zod";
import { getToolById } from "@/config/tool-registry";
export const FEEDBACK_CATEGORIES = [
  "bug",
  "suggestion",
  "incorrect_output",
  "accessibility_issue",
  "other",
] as const;
export const feedbackSchema = z
  .object({
    category: z.enum(FEEDBACK_CATEGORIES),
    message: z.string().trim().min(10).max(4000),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    toolId: z
      .string()
      .refine((value) => Boolean(getToolById(value)), "Unknown tool."),
    toolName: z.string().min(1).max(120),
    browser: z.string().max(300),
    appVersion: z.string().max(30),
    consent: z.literal(true),
    website: z.string().max(0),
    startedAt: z.number().int().positive(),
  })
  .strict();
export type FeedbackSubmission = z.infer<typeof feedbackSchema>;
export function safeFeedbackPayload(value: FeedbackSubmission) {
  return {
    category: value.category,
    message: value.message,
    email: value.email || undefined,
    toolId: value.toolId,
    toolName: value.toolName,
    browser: value.browser,
    appVersion: value.appVersion,
    submittedAt: new Date().toISOString(),
  };
}
export function isLikelyFeedbackSpam(
  value: FeedbackSubmission,
  now = Date.now(),
) {
  const elapsed = now - value.startedAt;
  return Boolean(value.website) || elapsed < 2000 || elapsed > 86400000;
}
