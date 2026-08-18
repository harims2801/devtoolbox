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
  decodeHtmlEntities,
  encodeHtmlEntities,
  type HtmlEntityFormat,
} from "@/lib/html-entity-tools";

type Operation = "encode" | "decode";
const encodeExample =
  '<section aria-label="R&D">Tamil தமிழ் & emoji 🚀</section>';
const decodeExample = "&lt;strong&gt;Safe &amp; sound &#x1F680;&lt;/strong&gt;";

export function HtmlEntitiesTool() {
  const tool = getToolById("html-entity-encoder-decoder");
  if (!tool) throw new Error("HTML entity tool metadata is missing");
  const [operation, setOperation] = useState<Operation>("encode");
  const [format, setFormat] = useState<HtmlEntityFormat>("named");
  const [encodeQuotes, setEncodeQuotes] = useState(true);
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  function run() {
    setOutput(
      operation === "encode"
        ? encodeHtmlEntities(input, { format, encodeQuotes, encodeNonAscii })
        : decodeHtmlEntities(input),
    );
    toast.success(
      operation === "encode"
        ? "HTML entities encoded"
        : "HTML entities decoded",
    );
  }

  function swap() {
    setInput(output);
    setOutput(input);
    setOperation((current) => (current === "encode" ? "decode" : "encode"));
  }

  function reset() {
    setInput("");
    setOutput("");
    setOperation("encode");
    setFormat("named");
    setEncodeQuotes(true);
    setEncodeNonAscii(false);
  }

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Safe text conversion",
          description:
            "Encode reserved markup characters or decode entities to plain, inert text.",
        },
      ]}
      faqs={[
        {
          question: "Can decoded output execute as HTML?",
          answer:
            "No. The result is inserted only as text inside a preformatted output panel. Scripts, SVG handlers, and tags never become DOM elements.",
        },
        {
          question: "What happens to unknown entities?",
          answer:
            "Unknown, incomplete, out-of-range, and malformed entities remain unchanged so the tool never guesses silently.",
        },
      ]}
      input={
        <CodeTextarea
          description="Input is processed locally. Entity decoding never interprets the result as markup."
          label={
            operation === "encode" ? "Text to encode" : "Entities to decode"
          }
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            operation === "encode"
              ? "Enter text or markup-shaped text"
              : "Enter named or numeric entities"
          }
          value={input}
        />
      }
      inputLabel="Input"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Select Encode or Decode.</li>
          <li>For encoding, choose named, decimal, or hexadecimal output.</li>
          <li>Choose whether to encode quotes and non-ASCII characters.</li>
          <li>Run the conversion and copy the inert text result.</li>
        </ol>
      }
      output={
        <OutputPanel
          emptyMessage="Run the encoder or decoder to see the text result."
          isEmpty={!output}
          title="Text result"
          toolbar={output ? <CopyButton text={output} /> : null}
        >
          <pre
            className="bg-muted/50 max-h-[32rem] overflow-auto rounded-lg p-4 text-sm leading-6 break-all whitespace-pre-wrap"
            data-testid="entity-output"
          >
            {output}
          </pre>
        </OutputPanel>
      }
      outputLabel="Result"
      seoContent={
        <p>
          Encode reserved HTML characters or decode named, decimal, and
          hexadecimal entities locally. Results remain plain text, including
          markup-shaped and script-shaped values.
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
                  setOutput("");
                }}
                size="sm"
                type="button"
                variant={operation === value ? "secondary" : "outline"}
              >
                {value === "encode" ? "Encode" : "Decode"}
              </Button>
            ))}
          </fieldset>
          {operation === "encode" ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                Format
                <select
                  aria-label="Entity format"
                  className="bg-background h-9 rounded-md border px-2"
                  onChange={(event) =>
                    setFormat(event.target.value as HtmlEntityFormat)
                  }
                  value={format}
                >
                  <option value="named">Named</option>
                  <option value="decimal">Decimal</option>
                  <option value="hexadecimal">Hexadecimal</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={encodeQuotes}
                  onChange={(event) => setEncodeQuotes(event.target.checked)}
                  type="checkbox"
                />
                Encode quotes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={encodeNonAscii}
                  onChange={(event) => setEncodeNonAscii(event.target.checked)}
                  type="checkbox"
                />
                Encode non-ASCII
              </label>
            </>
          ) : null}
          <Button onClick={run} size="sm" type="button">
            {operation === "encode" ? "Encode text" : "Decode entities"}
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
          <ExampleButton
            onLoad={() =>
              setInput(operation === "encode" ? encodeExample : decodeExample)
            }
          />
          <ResetButton onReset={reset} />
        </>
      }
    />
  );
}
