"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { CodeTextarea } from "@/components/tools/code-textarea";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  processUrlEncoding,
  type UrlEncodingOperation,
  type UrlEncodingScope,
} from "@/lib/url-encoding-tools";

const examples: Record<UrlEncodingScope, string> = {
  component: "status=ready & owner=தமிழ் + platform",
  "full-url":
    "https://example.com/release notes/தமிழ்?status=ready now&owner=platform#next step",
};

export function UrlEncoderTool() {
  const tool = getToolById("url-encoder-decoder");
  if (!tool) throw new Error("URL encoder metadata is missing");

  const [operation, setOperation] = useState<UrlEncodingOperation>("encode");
  const [scope, setScope] = useState<UrlEncodingScope>("component");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  function run() {
    try {
      const result = processUrlEncoding(input, operation, scope);
      setOutput(result.output);
      setWarning(result.warning ?? "");
      setError("");
      toast.success(operation === "encode" ? "URL encoded" : "URL decoded");
    } catch (caught) {
      setOutput("");
      setWarning("");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not process this value.",
      );
    }
  }

  function swap() {
    setInput(output);
    setOutput(input);
    setOperation((current) => (current === "encode" ? "decode" : "encode"));
    setError("");
    setWarning("");
  }

  function reset() {
    setInput("");
    setOutput("");
    setError("");
    setWarning("");
    setOperation("encode");
    setScope("component");
  }

  const inputPanel = (
    <CodeTextarea
      description={
        scope === "component"
          ? "Component mode encodes reserved characters such as /, ?, &, =, and # so the result can safely fit inside one URL part."
          : "Full URL mode preserves structural separators such as ://, /, ?, &, =, and # while encoding spaces and Unicode content."
      }
      error={error}
      label={operation === "encode" ? "Value to encode" : "Value to decode"}
      onChange={(event) => {
        setInput(event.target.value);
        setError("");
        setWarning("");
      }}
      placeholder={
        scope === "component" ? "Enter a URL component" : "Enter a complete URL"
      }
      value={input}
    />
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Choose a mode and run the encoder or decoder."
      isEmpty={!output}
      title="Result"
      toolbar={output ? <CopyButton text={output} /> : null}
    >
      {warning ? (
        <p
          className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
          role="status"
        >
          {warning}
        </p>
      ) : null}
      <pre
        className="bg-muted/50 max-h-[32rem] overflow-auto rounded-lg p-4 text-sm leading-6 break-all whitespace-pre-wrap"
        data-testid="url-output"
      >
        {output}
      </pre>
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Component versus full URL",
          description:
            "Encode a query value with component mode, or preserve an entire URL's separators with full URL mode.",
        },
      ]}
      faqs={[
        {
          question: "Does a plus sign decode to a space?",
          answer:
            "No. Percent decoding preserves literal + characters. Form-urlencoded data uses a separate convention where + may mean a space.",
        },
        {
          question: "Will malformed input be repaired?",
          answer:
            "No. Incomplete percent escapes and invalid UTF-8 byte sequences produce a precise error without changing the input.",
        },
      ]}
      input={inputPanel}
      inputLabel="Input"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Select Encode or Decode.</li>
          <li>
            Choose Component for one URL part or Full URL for a complete
            address.
          </li>
          <li>Enter UTF-8 text and process it locally.</li>
          <li>Review repeated-encoding warnings before copying the result.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel="Result"
      seoContent={
        <p>
          Encode or decode UTF-8 URL components and complete URLs locally with
          clear handling for reserved separators, plus signs, existing escapes,
          and malformed percent sequences.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <fieldset className="flex items-center gap-1">
            <legend className="sr-only">Operation</legend>
            {(["encode", "decode"] as const).map((value) => (
              <Button
                aria-pressed={operation === value}
                key={value}
                onClick={() => {
                  setOperation(value);
                  setError("");
                  setWarning("");
                }}
                size="sm"
                type="button"
                variant={operation === value ? "secondary" : "outline"}
              >
                {value === "encode" ? "Encode" : "Decode"}
              </Button>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            Scope
            <select
              aria-label="Encoding scope"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) => {
                setScope(event.target.value as UrlEncodingScope);
                setOutput("");
                setError("");
                setWarning("");
              }}
              value={scope}
            >
              <option value="component">URL component</option>
              <option value="full-url">Full URL</option>
            </select>
          </label>
          <Button onClick={run} size="sm" type="button">
            {operation === "encode" ? "Encode value" : "Decode value"}
          </Button>
          <Button
            disabled={!output}
            onClick={swap}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowLeftRight aria-hidden="true" /> Swap
          </Button>
          <ExampleButton onLoad={() => setInput(examples[scope])} />
          <ResetButton onReset={reset} />
        </>
      }
    />
  );
}
