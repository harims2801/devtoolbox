"use client";
import { useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FEEDBACK_CATEGORIES,
  type FeedbackSubmission,
} from "@/lib/feedback-tools";
import type { ToolDefinition } from "@/config/tool-registry";
const labels: Record<(typeof FEEDBACK_CATEGORIES)[number], string> = {
  bug: "Bug",
  suggestion: "Suggestion",
  incorrect_output: "Incorrect output",
  accessibility_issue: "Accessibility issue",
  other: "Other",
};
export function FeedbackButton({ tool }: { tool: ToolDefinition }) {
  const [open, setOpen] = useState(false),
    [category, setCategory] = useState<FeedbackSubmission["category"]>("bug"),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [website, setWebsite] = useState(""),
    [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
      "idle",
    ),
    [error, setError] = useState("");
  const startedAt = useRef(0);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const body = {
      category,
      message,
      email,
      toolId: tool.id,
      toolName: tool.name,
      browser: navigator.userAgent.slice(0, 300),
      appVersion: "0.1.0",
      consent,
      website,
      startedAt: startedAt.current,
    };
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Feedback could not be submitted.");
      setStatus("success");
      setMessage("");
      setEmail("");
      setConsent(false);
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Feedback could not be submitted.",
      );
    }
  }
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          startedAt.current = Date.now();
          setOpen(true);
          setStatus("idle");
        }}
      >
        <MessageSquare />
        Feedback
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
        >
          <section
            aria-labelledby="feedback-title"
            aria-modal="true"
            className="bg-background max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border p-6 shadow-xl"
            role="dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" id="feedback-title">
                Feedback for {tool.name}
              </h2>
              <Button
                aria-label="Close feedback"
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
            {status === "success" ? (
              <div className="mt-6" role="status">
                <p className="font-medium text-emerald-700">
                  Thank you. Your feedback was submitted.
                </p>
                <Button className="mt-4" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => void submit(event)}
              >
                <label className="block">
                  Category
                  <select
                    className="mt-1 w-full rounded border p-2"
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as FeedbackSubmission["category"],
                      )
                    }
                  >
                    {FEEDBACK_CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {labels[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Feedback
                  <textarea
                    className="mt-1 min-h-28 w-full rounded border p-2"
                    minLength={10}
                    maxLength={4000}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>
                <label className="block">
                  Email (optional)
                  <input
                    className="mt-1 w-full rounded border p-2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="sr-only" aria-hidden="true">
                  Website
                  <input
                    autoComplete="off"
                    tabIndex={-1}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
                <div className="rounded border p-3 text-sm">
                  <p className="font-medium">Exactly what will be submitted</p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Category and your feedback message</li>
                    <li>Optional email, if provided</li>
                    <li>Tool: {tool.name}</li>
                    <li>
                      Browser:{" "}
                      {typeof navigator !== "undefined"
                        ? navigator.userAgent
                        : "Browser details"}
                    </li>
                    <li>Application version: 0.1.0</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    Tool input and output are never included.
                  </p>
                </div>
                <label className="flex gap-2 text-sm">
                  <input
                    checked={consent}
                    required
                    type="checkbox"
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I consent to submitting the metadata listed above.
                </label>
                {status === "error" ? (
                  <p className="text-destructive text-sm" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  disabled={status === "sending" || !consent}
                  type="submit"
                >
                  <Send />
                  {status === "sending" ? "Submitting…" : "Submit feedback"}
                </Button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
