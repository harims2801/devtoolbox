"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, FileUp, ImageIcon } from "lucide-react";
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
import {
  BASE64_MAX_FILE_BYTES,
  bytesToBase64,
  createDataUrl,
  decodeBase64ToUtf8,
  encodeUtf8ToBase64,
  getBase64FileSizeState,
  getEncodedByteSize,
  SAFE_IMAGE_MIME_TYPES,
  type Base64Variant,
} from "@/lib/base64-tools";
import { formatByteSize, getByteSize } from "@/lib/json-tools";

type ToolMode = "text" | "file";
type TextOperation = "encode" | "decode";

interface EncodedFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  base64: string;
  dataUrl: string;
}

const textExample = "Hello, DevToolbox! வணக்கம் 👋";

function blobFromBytes(bytes: Uint8Array, mimeType: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: mimeType });
}

export function Base64Tool() {
  const tool = getToolById("base64-encoder-decoder");
  if (!tool) throw new Error("Base64 tool metadata is missing");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ToolMode>("text");
  const [operation, setOperation] = useState<TextOperation>("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [padding, setPadding] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [encodedFile, setEncodedFile] = useState<EncodedFile>();
  const [fileWarning, setFileWarning] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const textInputBytes = useMemo(() => getByteSize(input), [input]);
  const textOutputBytes = useMemo(() => getByteSize(output), [output]);

  function clearText() {
    setInput("");
    setOutput("");
    setError("");
  }

  function runTextOperation() {
    try {
      const result =
        operation === "encode"
          ? encodeUtf8ToBase64(input, { variant, padding })
          : decodeBase64ToUtf8(input, variant);
      setOutput(result);
      setError("");
      toast.success(operation === "encode" ? "Text encoded" : "Base64 decoded");
    } catch (caught) {
      setOutput("");
      setError(
        caught instanceof Error ? caught.message : "Could not process input.",
      );
    }
  }

  function swapText() {
    setInput(output);
    setOutput(input);
    setOperation((current) => (current === "encode" ? "decode" : "encode"));
    setError("");
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const sizeState = getBase64FileSizeState(file.size);
    if (sizeState.level === "error") {
      setEncodedFile(undefined);
      setPreviewUrl("");
      setFileWarning(sizeState.message);
      toast.error(sizeState.message);
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const base64 = bytesToBase64(bytes);
      const mimeType = file.type || "application/octet-stream";
      setEncodedFile({
        name: file.name,
        mimeType,
        bytes,
        base64,
        dataUrl: createDataUrl(mimeType, base64),
      });
      setPreviewUrl(
        SAFE_IMAGE_MIME_TYPES.has(mimeType)
          ? URL.createObjectURL(blobFromBytes(bytes, mimeType))
          : "",
      );
      setFileWarning(sizeState.message ?? "");
      toast.success(`${file.name} encoded locally`);
    } catch {
      setEncodedFile(undefined);
      setPreviewUrl("");
      setFileWarning("Could not read this local file.");
    }
  }

  const textInput = (
    <CodeTextarea
      description={`Input size: ${formatByteSize(textInputBytes)}. Unicode text and emojis are encoded as UTF-8.`}
      error={error}
      label={operation === "encode" ? "Text to encode" : "Base64 to decode"}
      onChange={(event) => {
        setInput(event.target.value);
        if (error) setError("");
      }}
      placeholder={
        operation === "encode"
          ? "Enter UTF-8 text"
          : variant === "url-safe"
            ? "Enter Base64URL"
            : "Enter standard Base64"
      }
      value={input}
    />
  );

  const textOutput = (
    <OutputPanel
      emptyMessage="Run the encoder or decoder to see the result."
      isEmpty={!output}
      title={`Result · ${formatByteSize(textOutputBytes)}`}
    >
      <pre
        className="bg-muted/50 max-h-[32rem] overflow-auto rounded-lg p-4 text-sm leading-6 break-all whitespace-pre-wrap"
        data-testid="base64-output"
      >
        {output}
      </pre>
    </OutputPanel>
  );

  const fileInput = (
    <section
      aria-label="Local file input"
      className="bg-card min-h-80 rounded-xl border p-5"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void loadFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
        <FileUp aria-hidden="true" className="text-muted-foreground size-10" />
        <h2 className="mt-4 font-medium">Choose or drop a local file</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
          Files stay in this browser tab. The maximum supported size is{" "}
          {formatByteSize(BASE64_MAX_FILE_BYTES)}.
        </p>
        <Button
          className="mt-5"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Open file
        </Button>
        {fileWarning ? (
          <p
            className="text-destructive mt-4 text-sm"
            role={encodedFile ? undefined : "alert"}
          >
            {fileWarning}
          </p>
        ) : null}
      </div>
    </section>
  );

  const fileOutput = (
    <OutputPanel
      emptyMessage="Select a file to generate Base64 and a data URL."
      isEmpty={!encodedFile}
      title="Encoded file"
      toolbar={
        encodedFile ? (
          <>
            <CopyButton label="Copy Base64" text={encodedFile.base64} />
            <CopyButton label="Copy data URL" text={encodedFile.dataUrl} />
            <DownloadButton
              content={blobFromBytes(encodedFile.bytes, encodedFile.mimeType)}
              filename={encodedFile.name}
              label="Download decoded file"
              mimeType={encodedFile.mimeType}
            />
          </>
        ) : null
      }
    >
      {encodedFile ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Filename</dt>
              <dd className="mt-1 break-all">{encodedFile.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">MIME type</dt>
              <dd className="mt-1">{encodedFile.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Original size</dt>
              <dd className="mt-1">
                {formatByteSize(encodedFile.bytes.byteLength)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Encoded size</dt>
              <dd className="mt-1">
                {formatByteSize(getEncodedByteSize(encodedFile.base64))}
              </dd>
            </div>
          </dl>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`Preview of ${encodedFile.name}`}
              className="max-h-64 max-w-full rounded-lg border object-contain"
              src={previewUrl}
            />
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <ImageIcon aria-hidden="true" />
              Preview is available only for PNG, JPEG, GIF, and WebP images.
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-2 text-xs">Base64</p>
            <pre
              className="bg-muted/50 max-h-52 overflow-auto rounded-lg p-3 text-xs leading-5 break-all whitespace-pre-wrap"
              data-testid="file-base64"
            >
              {encodedFile.base64}
            </pre>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-xs">Data URL</p>
            <pre className="bg-muted/50 max-h-32 overflow-auto rounded-lg p-3 text-xs leading-5 break-all whitespace-pre-wrap">
              {encodedFile.dataUrl}
            </pre>
          </div>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Unicode text",
          description: "Encode Tamil text or emojis without corrupting UTF-8.",
        },
        {
          title: "URL-safe values",
          description:
            "Use Base64URL for values placed in URL paths, queries, or JWT segments.",
        },
      ]}
      faqs={[
        {
          question: "Are files uploaded?",
          answer:
            "No. Files are read, encoded, previewed, and downloaded entirely inside this browser tab.",
        },
        {
          question: "Will decoded HTML or JavaScript run?",
          answer:
            "No. Decoded text is rendered as plain text, and file previews are limited to common safe image formats.",
        },
      ]}
      input={mode === "text" ? textInput : fileInput}
      inputLabel={mode === "text" ? "Text input" : "File"}
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Select Text or File mode.</li>
          <li>Choose encode/decode and the Base64 variant for text.</li>
          <li>Control padding when encoding standard or URL-safe Base64.</li>
          <li>Copy or download the result; files never leave the browser.</li>
        </ol>
      }
      output={mode === "text" ? textOutput : fileOutput}
      outputLabel="Result"
      seoContent={
        <p>
          Encode and decode UTF-8 text, Base64URL values, and local binary
          files. Generate data URLs, inspect file metadata, and safely preview
          supported images without uploading content.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <div
            aria-label="Base64 mode"
            className="bg-muted flex rounded-lg p-1"
            role="group"
          >
            {(["text", "file"] as const).map((item) => (
              <Button
                aria-pressed={mode === item}
                key={item}
                onClick={() => setMode(item)}
                size="sm"
                type="button"
                variant={mode === item ? "secondary" : "ghost"}
              >
                {item === "text" ? "Text mode" : "File mode"}
              </Button>
            ))}
          </div>
          {mode === "text" ? (
            <>
              <select
                aria-label="Operation"
                className="bg-background h-9 rounded-md border px-2 text-sm"
                onChange={(event) => {
                  setOperation(event.target.value as TextOperation);
                  setOutput("");
                  setError("");
                }}
                value={operation}
              >
                <option value="encode">Encode</option>
                <option value="decode">Decode</option>
              </select>
              <select
                aria-label="Base64 variant"
                className="bg-background h-9 rounded-md border px-2 text-sm"
                onChange={(event) =>
                  setVariant(event.target.value as Base64Variant)
                }
                value={variant}
              >
                <option value="standard">Standard Base64</option>
                <option value="url-safe">URL-safe Base64</option>
              </select>
              {operation === "encode" ? (
                <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    checked={padding}
                    onChange={(event) => setPadding(event.target.checked)}
                    type="checkbox"
                  />
                  Include padding
                </label>
              ) : null}
              <Button onClick={runTextOperation} type="button">
                {operation === "encode" ? "Encode" : "Decode"}
              </Button>
              <Button
                disabled={!output}
                onClick={swapText}
                type="button"
                variant="outline"
              >
                <ArrowLeftRight aria-hidden="true" />
                Swap
              </Button>
              <ExampleButton
                onLoad={() => {
                  setInput(textExample);
                  setOperation("encode");
                  setOutput("");
                  setError("");
                }}
              />
              <ResetButton label="Clear" onReset={clearText} />
              <CopyButton disabled={!output} text={output} />
              <DownloadButton
                content={output}
                disabled={!output}
                filename={
                  operation === "encode"
                    ? "base64-encoded.txt"
                    : "base64-decoded.txt"
                }
              />
            </>
          ) : (
            <ResetButton
              label="Clear file"
              onReset={() => {
                setEncodedFile(undefined);
                setFileWarning("");
                setPreviewUrl("");
              }}
            />
          )}
        </>
      }
    />
  );
}
