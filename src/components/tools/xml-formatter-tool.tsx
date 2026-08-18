"use client";

import { useMemo, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";

import { CodeTextarea } from "@/components/tools/code-textarea";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { formatByteSize, getByteSize } from "@/lib/json-tools";
import {
  formatXml,
  minifyXml,
  validateXml,
  XML_MAX_BYTES,
  type XmlProcessingError,
} from "@/lib/xml-tools";

const exampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Local service configuration -->
<service xmlns="https://devtoolbox.example/schema" enabled="true">
  <name>payments-api</name>
  <owners>
    <owner team="platform"><![CDATA[SRE & Operations]]></owner>
  </owners>
</service>`;

export function XmlFormatterTool() {
  const tool = getToolById("xml-formatter-validator");
  if (!tool) throw new Error("XML formatter metadata is missing");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentation, setIndentation] = useState<2 | 4>(2);
  const [error, setError] = useState<XmlProcessingError>();
  const inputBytes = useMemo(() => getByteSize(input), [input]);
  const outputBytes = useMemo(() => getByteSize(output), [output]);

  function run(mode: "format" | "minify" | "validate") {
    const result =
      mode === "format"
        ? formatXml(input, indentation)
        : mode === "minify"
          ? minifyXml(input)
          : validateXml(input);
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }
    setError(undefined);
    setOutput(result.output);
    toast.success(
      mode === "validate"
        ? "XML is valid"
        : `XML ${mode === "format" ? "formatted" : "minified"}`,
    );
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Choose an .xml file");
      return;
    }
    if (file.size > XML_MAX_BYTES) {
      toast.error("File exceeds the 5 MB processing limit");
      return;
    }
    try {
      setInput(await file.text());
      setOutput("");
      setError(undefined);
      toast.success(`${file.name} loaded locally`);
    } catch {
      toast.error("Could not read this local file");
    }
  }

  const inputPanel = (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void loadFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        accept=".xml,application/xml,text/xml"
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <CodeTextarea
        description={`Input size: ${formatByteSize(inputBytes)}. XML stays in this browser tab. Drop an XML file here.`}
        error={error?.message}
        label="XML input"
        onChange={(event) => {
          setInput(event.target.value);
          setError(undefined);
        }}
        placeholder="Paste XML here"
        toolbar={
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            type="button"
            variant="ghost"
          >
            <FileUp aria-hidden="true" /> Open file
          </Button>
        }
        value={input}
      />
      {error?.contextLine ? (
        <div className="bg-muted mt-3 overflow-x-auto rounded-lg p-3 font-mono text-xs">
          <p>
            Problem near line {error.line}, column {error.column}
          </p>
          <pre>{error.contextLine}</pre>
          <pre aria-hidden="true">
            {" ".repeat(Math.max((error.column ?? 1) - 1, 0))}^
          </pre>
        </div>
      ) : null}
    </div>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Format, minify, or validate XML to see the result."
      isEmpty={!output}
      title={`XML output · ${formatByteSize(outputBytes)}`}
      toolbar={
        output ? (
          <>
            <CopyButton text={output} />
            <DownloadButton
              content={output}
              filename="formatted.xml"
              mimeType="application/xml;charset=utf-8"
            />
          </>
        ) : null
      }
    >
      {output ? (
        <pre
          className="bg-muted/50 max-h-[36rem] overflow-auto rounded-lg p-4 text-sm leading-6 whitespace-pre-wrap"
          data-testid="xml-output"
        >
          {output}
        </pre>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Namespaced configuration",
          description:
            "Format declarations, namespaces, attributes, comments, and CDATA without uploading them.",
        },
      ]}
      faqs={[
        {
          question: "Is XML uploaded?",
          answer:
            "No. Parsing, formatting, file reading, and downloads happen locally in this browser tab.",
        },
        {
          question: "Are DTDs and external entities supported?",
          answer:
            "No. DOCTYPE and entity declarations are rejected to prevent unsafe external-entity behavior.",
        },
      ]}
      input={inputPanel}
      inputLabel="XML input"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste XML or open a local .xml file up to 5 MB.</li>
          <li>Select indentation and choose Format, Minify, or Validate.</li>
          <li>Review any structural error and its nearest source position.</li>
          <li>Copy or download the safe text result.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel="XML output"
      seoContent={
        <p>
          Format, minify, and validate XML locally while preserving
          declarations, namespaces, attributes, comments, CDATA, and mixed text
          content.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            Indent
            <select
              aria-label="Indentation"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) =>
                setIndentation(Number(event.target.value) as 2 | 4)
              }
              value={indentation}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
          <Button
            disabled={!input.trim() || inputBytes > XML_MAX_BYTES}
            onClick={() => run("format")}
            type="button"
          >
            Format
          </Button>
          <Button
            disabled={!input.trim() || inputBytes > XML_MAX_BYTES}
            onClick={() => run("minify")}
            type="button"
            variant="outline"
          >
            Minify
          </Button>
          <Button
            disabled={!input.trim() || inputBytes > XML_MAX_BYTES}
            onClick={() => run("validate")}
            type="button"
            variant="outline"
          >
            Validate
          </Button>
          <ExampleButton
            onLoad={() => {
              setInput(exampleXml);
              setOutput("");
              setError(undefined);
            }}
          />
          <ResetButton
            disabled={!input && !output}
            onReset={() => {
              setInput("");
              setOutput("");
              setError(undefined);
            }}
          />
        </>
      }
    />
  );
}
