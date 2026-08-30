"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { OutputPanel } from "@/components/tools/output-panel";
import { CopyButton, DownloadButton } from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  analyzePasswordOptions,
  generatePasswords,
  type PasswordOptions,
} from "@/lib/password-tools";

const defaults: PasswordOptions = {
  length: 20,
  count: 5,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  exclusions: "",
  inclusions: "",
};

export function PasswordGeneratorTool() {
  const tool = getToolById("random-password-generator");
  if (!tool) throw new Error("Password generator metadata is missing");
  const [options, setOptions] = useState<PasswordOptions>(defaults);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState("");
  const analysis = useMemo(() => {
    try {
      return analyzePasswordOptions(options);
    } catch {
      return undefined;
    }
  }, [options]);

  function update<K extends keyof PasswordOptions>(
    key: K,
    value: PasswordOptions[K],
  ) {
    setOptions((current) => ({ ...current, [key]: value }));
    setPasswords([]);
    setError("");
  }

  function generate() {
    try {
      setPasswords(generatePasswords(options));
      setError("");
    } catch (caught) {
      setPasswords([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not generate passwords.",
      );
    }
  }

  const optionPanel = (
    <section
      aria-label="Password options"
      className="bg-card min-h-80 space-y-5 rounded-xl border p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Length (1–256)
          <input
            aria-label="Password length"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            max={256}
            min={1}
            onChange={(event) => update("length", Number(event.target.value))}
            type="number"
            value={options.length}
          />
        </label>
        <label className="text-sm font-medium">
          Passwords (1–100)
          <input
            aria-label="Password count"
            className="bg-background mt-2 h-10 w-full rounded-md border px-3"
            max={100}
            min={1}
            onChange={(event) => update("count", Number(event.target.value))}
            type="number"
            value={options.count}
          />
        </label>
      </div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">
          Required character sets
        </legend>
        {(["uppercase", "lowercase", "numbers", "symbols"] as const).map(
          (name) => (
            <label className="flex items-center gap-2 text-sm" key={name}>
              <input
                checked={options[name]}
                onChange={(event) => update(name, event.target.checked)}
                type="checkbox"
              />
              {name[0]!.toUpperCase() + name.slice(1)}
            </label>
          ),
        )}
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={options.excludeAmbiguous}
          onChange={(event) => update("excludeAmbiguous", event.target.checked)}
          type="checkbox"
        />
        Exclude ambiguous characters (I, l, 1, O, 0, o, |)
      </label>
      <label className="block text-sm font-medium">
        Custom exclusions
        <input
          aria-label="Custom exclusions"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3 font-mono"
          onChange={(event) => update("exclusions", event.target.value)}
          placeholder="Characters never to use"
          value={options.exclusions}
        />
      </label>
      <label className="block text-sm font-medium">
        Required custom inclusions
        <input
          aria-describedby="password-inclusions-help"
          aria-label="Required custom inclusions"
          className="bg-background mt-2 h-10 w-full rounded-md border px-3 font-mono"
          onChange={(event) => update("inclusions", event.target.value)}
          placeholder={'For example: @, #, ","'}
          value={options.inclusions}
        />
      </label>
      <p
        className="text-muted-foreground -mt-3 text-xs leading-5"
        id="password-inclusions-help"
      >
        Enter comma-separated characters that must appear in every password. To
        require a comma, enter <code>&quot;,&quot;</code> or{" "}
        <code>&apos;,&apos;</code>. Each entry must be one character or Unicode
        symbol.
      </p>
      <p className="text-muted-foreground text-xs leading-5">
        Every enabled set and custom inclusion is guaranteed. Selection and
        shuffling use Web Crypto with rejection sampling; passwords are never
        saved or logged.
      </p>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );

  const outputPanel = (
    <OutputPanel
      emptyMessage="Configure the rules, then generate a password batch."
      isEmpty={!passwords.length}
      title="Generated passwords"
      toolbar={
        <>
          <CopyButton
            disabled={!passwords.length}
            label="Copy all"
            text={passwords.join("\n")}
          />
          <DownloadButton
            content={passwords.join("\n")}
            disabled={!passwords.length}
            filename="passwords.txt"
            label="Download"
          />
        </>
      }
    >
      {analysis ? (
        <div
          className="mb-4 space-y-2 rounded-lg border p-3 text-sm"
          data-testid="entropy-summary"
        >
          <p>
            <strong>{analysis.strength}</strong> · about{" "}
            {analysis.entropyBits.toFixed(1)} bits per password
          </p>
          <p className="text-muted-foreground text-xs">
            Upper-bound estimate: {options.length} independent uniform choices
            from a {analysis.poolSize}-character pool. Required-set constraints
            and human handling can reduce real-world entropy.
          </p>
          {analysis.warnings.map((warning) => (
            <p className="text-amber-700 dark:text-amber-300" key={warning}>
              Warning: {warning}
            </p>
          ))}
        </div>
      ) : null}
      <ol
        className="max-h-[36rem] divide-y overflow-auto rounded-md border"
        data-testid="password-output"
      >
        {passwords.map((password, index) => (
          <li
            className="flex items-center gap-2 px-3 py-2"
            key={`${password}-${index}`}
          >
            <code className="min-w-0 flex-1 break-all">{password}</code>
            <CopyButton label={`Copy password ${index + 1}`} text={password} />
          </li>
        ))}
      </ol>
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Account credentials",
          description:
            "Generate independent high-entropy passwords and store them in a trusted password manager.",
        },
      ]}
      faqs={[
        {
          question: "How is randomness generated?",
          answer:
            "The browser's cryptographic random-number generator supplies bytes. Rejection sampling avoids modulo bias, and every enabled set and custom inclusion is guaranteed to appear.",
        },
        {
          question: "Are passwords stored?",
          answer:
            "No. They exist only in this page's memory until you regenerate, navigate away, or close the tab. The tool does not log or persist them.",
        },
      ]}
      input={optionPanel}
      inputLabel="Rules"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Choose length, batch size, and required character sets.</li>
          <li>
            Remove unwanted characters and add any required custom symbols.
          </li>
          <li>Review the estimate and warnings, then generate.</li>
          <li>
            Copy one password or export the batch, then store it securely.
          </li>
        </ol>
      }
      output={outputPanel}
      outputLabel="Passwords"
      seoContent={
        <p>
          Create cryptographically secure password batches locally with unbiased
          sampling, guaranteed character categories, explicit exclusions, and an
          honest entropy estimate.
        </p>
      }
      tool={tool}
      toolbar={
        <Button onClick={generate} type="button">
          <RefreshCw aria-hidden="true" />
          {passwords.length ? "Regenerate" : "Generate"}
        </Button>
      }
    />
  );
}
