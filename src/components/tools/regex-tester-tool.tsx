"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { highlightSegments, replaceRegex, testRegex } from "@/lib/regex-tools";

const flagOptions = [
  ["g", "Global"],
  ["i", "Ignore case"],
  ["m", "Multiline"],
  ["s", "dotAll"],
  ["u", "Unicode"],
  ["y", "Sticky"],
] as const;
const examples = [
  [
    "Email-like",
    "[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}",
    "Contact dev@example.com",
  ],
  ["URL", "https?://[^\\s]+", "Visit https://example.com/docs"],
  ["IPv4", "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", "Host 192.168.1.10"],
  ["Date", "\\b\\d{4}-\\d{2}-\\d{2}\\b", "Released 2026-08-18"],
  [
    "UUID",
    "\\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\\b",
    "ID 550e8400-e29b-41d4-a716-446655440000",
  ],
  ["Whitespace", "\\s+", "one   two\nthree"],
] as const;

export function RegexTesterTool() {
  const tool = getToolById("regex-tester");
  if (!tool) throw new Error("Regex tool metadata is missing");
  const [pattern, setPattern] = useState("(?<word>\\b[A-Z]{2,}\\b)");
  const [text, setText] = useState("API and HTTP are common terms.");
  const [flags, setFlags] = useState("g");
  const [replacement, setReplacement] = useState("[$<word>]");
  const result = useMemo(() => {
    try {
      return {
        ...testRegex(pattern, flags, text),
        replaced: replaceRegex(pattern, flags, text, replacement),
        error: "",
      };
    } catch (error) {
      return {
        matches: [],
        replaced: "",
        error:
          error instanceof Error
            ? error.message
            : "Invalid regular expression.",
      };
    }
  }, [pattern, flags, text, replacement]);
  function toggle(flag: string) {
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, "") : current + flag,
    );
  }
  function loadExample(index = 0) {
    const sample = examples[index]!;
    setPattern(sample[1]);
    setText(sample[2]);
    setFlags("g");
  }

  const input = (
    <section
      aria-label="Regex input"
      className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
    >
      <label className="block text-sm font-medium" htmlFor="regex-pattern">
        Regular expression
      </label>
      <div className="flex rounded-md border">
        <span className="px-3 py-2 font-mono">/</span>
        <input
          className="bg-background min-w-0 flex-1 px-1 font-mono outline-none"
          id="regex-pattern"
          onChange={(e) => setPattern(e.target.value)}
          value={pattern}
        />
        <span className="px-3 py-2 font-mono">/{flags}</span>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Flags</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {flagOptions.map(([flag, label]) => (
            <label className="text-sm" key={flag}>
              <input
                checked={flags.includes(flag)}
                className="mr-1"
                onChange={() => toggle(flag)}
                type="checkbox"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium" htmlFor="regex-text">
        Test text
      </label>
      <textarea
        className="bg-background min-h-40 w-full rounded-md border p-3 font-mono text-sm"
        id="regex-text"
        maxLength={100000}
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <label className="block text-sm font-medium" htmlFor="regex-replacement">
        Replacement text
      </label>
      <input
        className="bg-background h-10 w-full rounded-md border px-3 font-mono"
        id="regex-replacement"
        onChange={(e) => setReplacement(e.target.value)}
        value={replacement}
      />
      <div>
        <p className="text-sm font-medium">Common examples</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((sample, index) => (
            <Button
              key={sample[0]}
              onClick={() => loadExample(index)}
              size="sm"
              type="button"
              variant="outline"
            >
              {sample[0]}
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Sample patterns are educational and may not validate every real-world
          case.
        </p>
      </div>
    </section>
  );

  const output = (
    <OutputPanel
      isEmpty={Boolean(result.error)}
      emptyMessage={result.error}
      title={`${result.matches.length} match${result.matches.length === 1 ? "" : "es"}`}
      toolbar={
        <CopyButton label="Copy replaced output" text={result.replaced} />
      }
    >
      <div data-testid="regex-output">
        <div className="bg-muted/40 rounded-md border p-3 font-mono text-sm break-words whitespace-pre-wrap">
          {highlightSegments(text, result.matches).map((segment, index) =>
            segment.matched ? (
              <mark className="bg-amber-300 text-black" key={index}>
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </div>
        <h3 className="mt-5 font-medium">Matches</h3>
        <div className="mt-2 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Index</th>
                <th className="p-2">Match</th>
                <th className="p-2">Groups</th>
                <th className="p-2">Named groups</th>
              </tr>
            </thead>
            <tbody>
              {result.matches.map((match, index) => (
                <tr className="border-t" key={`${match.index}-${index}`}>
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-mono">{match.index}</td>
                  <td className="p-2 font-mono">{match.value || "(empty)"}</td>
                  <td className="p-2 font-mono">
                    {match.groups.map((g) => g ?? "undefined").join(", ") ||
                      "—"}
                  </td>
                  <td className="p-2 font-mono">
                    {Object.entries(match.namedGroups)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 font-medium">Replacement preview</h3>
        <pre className="bg-muted/40 mt-2 rounded-md border p-3 text-sm whitespace-pre-wrap">
          {result.replaced}
        </pre>
      </div>
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Pattern and text"
      output={output}
      outputLabel="Matches"
      toolbar={
        <>
          <Button type="button">
            <Play aria-hidden="true" />
            Test automatically
          </Button>
          <ExampleButton onLoad={() => loadExample(0)} />
          <ResetButton
            onReset={() => {
              setPattern("");
              setText("");
              setFlags("g");
              setReplacement("");
            }}
          />
        </>
      }
      instructions={
        <p>
          Enter a JavaScript-compatible pattern, select flags, and inspect
          matches, groups, highlighting, and replacement output in real time.
        </p>
      }
      examples={examples.slice(0, 3).map(([title]) => ({ title }))}
      faqs={[
        {
          question: "Is my text uploaded?",
          answer: "No. Matching and replacement run locally in your browser.",
        },
        {
          question: "Can regex freeze a page?",
          answer:
            "Some nested repetitions can cause catastrophic backtracking. This tool blocks common risky shapes and limits input size, but review untrusted patterns carefully.",
        },
      ]}
      seoContent={
        <p>
          Safely test JavaScript regular expressions, flags, capture groups,
          named groups, zero-length matches, and replacements without raw HTML
          rendering.
        </p>
      }
    />
  );
}
