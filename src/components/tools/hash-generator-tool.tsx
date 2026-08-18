"use client";
import { useRef, useState } from "react";
import { FileUp, Hash, X } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  compareHash,
  formatFileSize,
  hashBytes,
  hashText,
  type HashAlgorithm,
  type HashResult,
} from "@/lib/hash-tools";

const algorithms: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
export function HashGeneratorTool() {
  const tool = getToolById("hash-generator");
  if (!tool) throw new Error("Hash metadata is missing");
  const [text, setText] = useState(""),
    [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256"),
    [result, setResult] = useState<HashResult>(),
    [expected, setExpected] = useState(""),
    [comparison, setComparison] = useState<boolean>(),
    [error, setError] = useState(""),
    [file, setFile] = useState<File>(),
    [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false);
  const operation = useRef(0);
  async function runText() {
    const id = ++operation.current;
    setBusy(true);
    setProgress(25);
    try {
      const next = await hashText(text, algorithm);
      if (id !== operation.current) return;
      setResult(next);
      setProgress(100);
      setError("");
      setComparison(expected ? compareHash(next, expected) : undefined);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not hash this input.",
      );
    } finally {
      if (id === operation.current) setBusy(false);
    }
  }
  async function runFile(selected: File) {
    const id = ++operation.current;
    setFile(selected);
    setBusy(true);
    setProgress(10);
    try {
      const buffer = await selected.arrayBuffer();
      if (id !== operation.current) return;
      setProgress(60);
      const next = await hashBytes(buffer, algorithm);
      if (id !== operation.current) return;
      setResult(next);
      setProgress(100);
      setError("");
      setComparison(expected ? compareHash(next, expected) : undefined);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not hash this file.",
      );
    } finally {
      if (id === operation.current) setBusy(false);
    }
  }
  function cancel() {
    operation.current++;
    setBusy(false);
    setProgress(0);
  }
  function clear() {
    operation.current++;
    setText("");
    setFile(undefined);
    setResult(undefined);
    setExpected("");
    setComparison(undefined);
    setError("");
    setProgress(0);
  }
  function check(value: string) {
    setExpected(value);
    if (!result || !value) {
      setComparison(undefined);
      setError("");
      return;
    }
    try {
      setComparison(compareHash(result, value));
      setError("");
    } catch (caught) {
      setComparison(undefined);
      setError(
        caught instanceof Error ? caught.message : "Invalid expected hash.",
      );
    }
  }
  const input = (
    <section
      aria-label="Hash input"
      className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
    >
      <label className="block text-sm font-medium" htmlFor="hash-algorithm">
        Algorithm
      </label>
      <select
        className="bg-background h-11 w-full rounded-md border px-3"
        id="hash-algorithm"
        onChange={(e) => {
          setAlgorithm(e.target.value as HashAlgorithm);
          setResult(undefined);
          setComparison(undefined);
        }}
        value={algorithm}
      >
        {algorithms.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      {algorithm === "SHA-1" ? (
        <p
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
          role="alert"
        >
          SHA-1 is retained only for compatibility and is not
          collision-resistant for security-sensitive use.
        </p>
      ) : null}
      <label className="block text-sm font-medium" htmlFor="hash-text">
        Text to hash
      </label>
      <textarea
        className="bg-background min-h-40 w-full rounded-md border p-3 font-mono text-sm"
        id="hash-text"
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <div className="text-muted-foreground text-center text-xs">or</div>
      <label
        className="hover:bg-muted/40 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const selected = e.dataTransfer.files[0];
          if (selected) void runFile(selected);
        }}
      >
        <FileUp />
        <span className="mt-2 text-sm font-medium">
          Drop a file or choose one
        </span>
        <input
          className="sr-only"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void runFile(selected);
          }}
          type="file"
        />
      </label>
      {file ? (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">{file.name}</p>
          <p className="text-muted-foreground">
            {file.type || "Unknown type"} · {formatFileSize(file.size)}
          </p>
        </div>
      ) : null}
      {busy || progress ? (
        <div>
          <progress className="w-full" max={100} value={progress} />
          <p className="text-muted-foreground text-xs">
            Hashing progress: {progress}%
          </p>
        </div>
      ) : null}
      <label className="block text-sm font-medium" htmlFor="expected-hash">
        Expected hash
      </label>
      <input
        className="bg-background h-11 w-full rounded-md border px-3 font-mono"
        id="expected-hash"
        onChange={(e) => check(e.target.value)}
        placeholder="Paste hexadecimal or Base64"
        value={expected}
      />
      {comparison !== undefined ? (
        <p
          className={`rounded-md p-3 text-sm ${comparison ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}
        >
          {comparison ? "Hashes match." : "Hashes do not match."}
        </p>
      ) : null}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
  const output = (
    <OutputPanel
      isEmpty={!result}
      emptyMessage="Hash text or a local file to see hexadecimal and Base64 digests."
      title={`${algorithm} digest`}
    >
      {result ? (
        <div className="space-y-4" data-testid="hash-output">
          {[
            ["Lowercase hexadecimal", result.hexLower],
            ["Uppercase hexadecimal", result.hexUpper],
            ["Base64", result.base64],
          ].map(([label, value]) => (
            <div className="rounded-md border p-3" key={label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{label}</p>
                <CopyButton label={`Copy ${label}`} text={value} />
              </div>
              <code className="mt-2 block text-sm break-all">{value}</code>
            </div>
          ))}
        </div>
      ) : null}
    </OutputPanel>
  );
  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Source"
      output={output}
      outputLabel="Digest"
      toolbar={
        <>
          <Button disabled={busy} onClick={runText}>
            <Hash />
            Hash text
          </Button>
          {busy ? (
            <Button onClick={cancel} variant="destructive">
              <X />
              Cancel
            </Button>
          ) : null}
          <ExampleButton
            onLoad={() => {
              setText("Hello, DevToolbox!");
              setFile(undefined);
              setResult(undefined);
            }}
          />
          <ResetButton label="Clear" onReset={clear} />
        </>
      }
      instructions={
        <p>
          Choose a Web Crypto algorithm, enter text or select a local file, then
          copy or compare the resulting digest. Source content never leaves your
          browser.
        </p>
      }
      examples={[
        { title: "Verify a downloaded file" },
        { title: "Compare configuration text" },
      ]}
      faqs={[
        {
          question: "Is hashing encryption?",
          answer:
            "No. Encryption is reversible with a key; cryptographic hashing produces a one-way fixed-length digest.",
        },
        {
          question: "Can I store passwords with these hashes?",
          answer:
            "No. Raw SHA hashes are unsuitable for password storage. Use Argon2, bcrypt, scrypt, or PBKDF2 with appropriate salts and parameters.",
        },
      ]}
      seoContent={
        <p>
          Generate lowercase hex, uppercase hex, and Base64 SHA digests for text
          and files using the reviewed browser Web Crypto implementation—never
          custom cryptography or uploads.
        </p>
      }
    />
  );
}
