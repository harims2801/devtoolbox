"use client";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  detectSensitive,
  MASKING_RULES,
  maskingCounts,
  maskingSegments,
  maskSensitiveText,
  type MaskingStyle,
  type SensitiveCategory,
} from "@/lib/masking-tools";
const sample =
  "User ada@example.com connected from 192.168.1.10\nAuthorization: Bearer sample_token_1234567890\npassword=not-a-real-secret\nCard test: 4111 1111 1111 1111";
export function SensitiveDataMaskerTool() {
  const tool = getToolById("sensitive-data-masker");
  if (!tool) throw new Error("Masker metadata is missing");
  const [input, setInput] = useState(sample),
    [enabled, setEnabled] = useState<SensitiveCategory[]>(
      MASKING_RULES.map((x) => x.category),
    ),
    [style, setStyle] = useState<MaskingStyle>("complete"),
    [customPattern, setCustomPattern] = useState(""),
    [salt, setSalt] = useState(""),
    [sanitized, setSanitized] = useState(""),
    [error, setError] = useState("");
  const detectionResult = useMemo(() => {
    try {
      return {
        detections: detectSensitive(input, { enabled, customPattern }),
        error: "",
      };
    } catch (caught) {
      return {
        detections: [],
        error:
          caught instanceof Error
            ? caught.message
            : "Could not scan this input.",
      };
    }
  }, [input, enabled, customPattern]);
  const counts = maskingCounts(detectionResult.detections);
  function toggle(category: SensitiveCategory) {
    setEnabled((values) =>
      values.includes(category)
        ? values.filter((value) => value !== category)
        : [...values, category],
    );
    setSanitized("");
  }
  async function mask() {
    try {
      setSanitized(
        await maskSensitiveText(input, detectionResult.detections, style, salt),
      );
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not mask this input.",
      );
    }
  }
  function clear() {
    setInput("");
    setSanitized("");
    setCustomPattern("");
    setSalt("");
    setError("");
  }
  const inputPanel = (
    <section
      aria-label="Sensitive input"
      className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
    >
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        Automated detection can produce false positives and false negatives.
        Review the sanitized result; this tool does not guarantee compliance.
      </div>
      <label className="block text-sm font-medium" htmlFor="masking-input">
        Text, logs, or configuration
      </label>
      <textarea
        className="bg-background min-h-64 w-full rounded-md border p-3 font-mono text-sm"
        id="masking-input"
        maxLength={250000}
        onChange={(e) => {
          setInput(e.target.value);
          setSanitized("");
        }}
        value={input}
      />
      {detectionResult.error || error ? (
        <p className="text-destructive text-sm" role="alert">
          {detectionResult.error || error}
        </p>
      ) : null}
      <fieldset>
        <legend className="text-sm font-medium">Detection rules</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {MASKING_RULES.map((rule) => (
            <label className="text-sm" key={rule.category}>
              <input
                checked={enabled.includes(rule.category)}
                className="mr-2"
                onChange={() => toggle(rule.category)}
                type="checkbox"
              />
              {rule.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label
        className="block text-sm font-medium"
        htmlFor="custom-mask-pattern"
      >
        Custom regular expression
      </label>
      <input
        className="bg-background h-10 w-full rounded-md border px-3 font-mono"
        id="custom-mask-pattern"
        onChange={(e) => {
          setCustomPattern(e.target.value);
          setSanitized("");
        }}
        placeholder="Optional pattern"
        value={customPattern}
      />
      <label className="block text-sm font-medium" htmlFor="masking-style">
        Masking style
      </label>
      <select
        className="bg-background h-10 w-full rounded-md border px-3"
        id="masking-style"
        onChange={(e) => {
          setStyle(e.target.value as MaskingStyle);
          setSanitized("");
        }}
        value={style}
      >
        <option value="complete">Complete replacement</option>
        <option value="preserve">Preserve first and last characters</option>
        <option value="pseudonym">Deterministic pseudonym</option>
      </select>
      {style === "pseudonym" ? (
        <>
          <label className="block text-sm font-medium" htmlFor="pseudonym-salt">
            Optional local salt
          </label>
          <input
            className="bg-background h-10 w-full rounded-md border px-3"
            id="pseudonym-salt"
            onChange={(e) => setSalt(e.target.value)}
            type="password"
            value={salt}
          />
          <p className="text-muted-foreground text-xs">
            The salt is not stored. Weak or predictable salts may still allow
            records to be correlated or guessed.
          </p>
        </>
      ) : null}
    </section>
  );
  const outputPanel = (
    <OutputPanel
      isEmpty={!sanitized}
      emptyMessage="Review detections, then mask the input to generate sanitized text."
      title="Sanitized result"
      toolbar={
        <>
          <CopyButton
            disabled={!sanitized}
            label="Copy sanitized"
            text={sanitized}
          />
          <DownloadButton
            content={sanitized}
            disabled={!sanitized}
            filename="sanitized.txt"
            label="Download"
          />
        </>
      }
    >
      {sanitized ? (
        <pre
          className="max-h-[36rem] overflow-auto rounded-md border p-3 font-mono text-sm break-words whitespace-pre-wrap"
          data-testid="masked-output"
        >
          {sanitized}
        </pre>
      ) : null}
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={inputPanel}
      inputLabel="Original text"
      output={outputPanel}
      outputLabel="Sanitized"
      toolbar={
        <>
          <Button
            disabled={Boolean(detectionResult.error)}
            onClick={() => void mask()}
          >
            <ShieldCheck />
            Mask {detectionResult.detections.length} detections
          </Button>
          <ExampleButton
            onLoad={() => {
              setInput(sample);
              setSanitized("");
            }}
          />
          <ResetButton label="Clear" onReset={clear} />
        </>
      }
      instructions={
        <div>
          <p>
            Enable conservative rules, inspect the safely highlighted preview
            and category-only counts, select a masking style, then generate and
            review sanitized text.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_16rem]">
            <div
              className="max-h-72 overflow-auto rounded-md border p-3 font-mono text-sm break-words whitespace-pre-wrap"
              data-testid="detection-preview"
            >
              {maskingSegments(input, detectionResult.detections).map(
                (segment, index) =>
                  segment.detection ? (
                    <mark
                      className="bg-amber-300 text-black"
                      key={index}
                      title={segment.detection.category}
                    >
                      {segment.text}
                    </mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
              )}
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Detection counts</p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(counts).map(([category, count]) => (
                  <li className="flex justify-between" key={category}>
                    <span>{category}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-3 text-xs">
                Full detected values are intentionally omitted from this
                summary.
              </p>
            </div>
          </div>
        </div>
      }
      examples={[
        { title: "Sanitize an application log" },
        { title: "Redact a configuration snippet" },
      ]}
      faqs={[
        {
          question: "Does this guarantee compliance?",
          answer:
            "No. Automated rules can miss sensitive data or mask non-sensitive text. Always review output against your organization’s requirements.",
        },
        {
          question: "How do deterministic pseudonyms work?",
          answer:
            "A local SHA-256 digest of the value and optional salt creates a stable label. The salt is never stored; weak salts can permit correlation or guessing.",
        },
      ]}
      seoContent={
        <p>
          Detect and locally mask common secrets and personal identifiers using
          configurable conservative rules, safe text highlighting, input limits,
          and no retention of the original content.
        </p>
      }
    />
  );
}
