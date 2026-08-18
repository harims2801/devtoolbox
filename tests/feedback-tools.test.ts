import { describe, expect, it } from "vitest";
import {
  feedbackSchema,
  isLikelyFeedbackSpam,
  safeFeedbackPayload,
} from "@/lib/feedback-tools";
const valid = {
  category: "bug",
  message: "The output order appears incorrect.",
  email: "",
  toolId: "json-formatter-validator",
  toolName: "JSON Formatter and Validator",
  browser: "Test Browser",
  appVersion: "0.1.0",
  consent: true,
  website: "",
  startedAt: Date.now() - 3000,
} as const;
describe("feedback validation", () => {
  it("accepts safe feedback metadata", () =>
    expect(feedbackSchema.parse(valid)).toMatchObject({
      category: "bug",
      toolId: "json-formatter-validator",
    }));
  it("rejects unknown fields and missing consent", () => {
    expect(
      feedbackSchema.safeParse({ ...valid, input: "secret" }).success,
    ).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, consent: false }).success).toBe(
      false,
    );
  });
  it("detects honeypot and too-fast submissions", () => {
    expect(isLikelyFeedbackSpam({ ...valid, website: "spam" })).toBe(true);
    expect(isLikelyFeedbackSpam({ ...valid, startedAt: Date.now() })).toBe(
      true,
    );
  });
  it("forwards no input or output fields", () =>
    expect(safeFeedbackPayload(feedbackSchema.parse(valid))).not.toHaveProperty(
      "input",
    ));
});
