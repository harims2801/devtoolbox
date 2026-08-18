"use client";

import { useMemo, useState } from "react";
import { CopyButton, ResetButton } from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { getToolById } from "@/config/tool-registry";
import {
  HTTP_STATUS_CODES,
  HTTP_STATUS_REGISTRY_SOURCE,
  type HttpStatusClassification,
} from "@/data/http-status-codes";
import {
  formatHttpStatusEntry,
  searchHttpStatuses,
  unknownHttpStatus,
} from "@/lib/http-status-tools";

export function HttpStatusReferenceTool() {
  const tool = getToolById("http-status-code-reference");
  if (!tool) throw new Error("HTTP status metadata is missing");
  const [query, setQuery] = useState(""),
    [categories, setCategories] = useState<number[]>([]),
    [classifications, setClassifications] = useState<
      HttpStatusClassification[]
    >([]),
    [selectedCode, setSelectedCode] = useState(
      HTTP_STATUS_CODES.find((entry) => entry.code === 200)!.code,
    ),
    [activeIndex, setActiveIndex] = useState(0),
    results = useMemo(
      () => searchHttpStatuses(query, { categories, classifications }),
      [categories, classifications, query],
    ),
    selected = HTTP_STATUS_CODES.find((entry) => entry.code === selectedCode),
    unknown =
      /^\d{3}$/.test(query) && !results.length
        ? unknownHttpStatus(Number(query))
        : null;

  function toggle<T>(values: T[], value: T, setter: (next: T[]) => void) {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
    setActiveIndex(0);
  }

  function reset() {
    setQuery("");
    setCategories([]);
    setClassifications([]);
    setSelectedCode(200);
    setActiveIndex(0);
  }

  const input = (
    <section className="bg-card min-h-80 space-y-4 rounded-xl border p-5">
      <label className="block text-sm font-medium">
        Search status codes
        <input
          aria-activedescendant={
            results[activeIndex]
              ? `status-${results[activeIndex]!.code}`
              : undefined
          }
          aria-controls="http-status-results"
          aria-expanded="true"
          aria-autocomplete="list"
          role="combobox"
          className="bg-background mt-2 h-11 w-full rounded-md border px-3"
          placeholder="404, retry, authentication, redirection…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.max(0, Math.min(results.length - 1, index + 1)),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(0, index - 1));
            }
            if (event.key === "Enter" && results[activeIndex]) {
              event.preventDefault();
              setSelectedCode(results[activeIndex]!.code);
            }
          }}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {[1, 2, 3, 4, 5].map((category) => (
            <label key={category}>
              <input
                className="mr-1"
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggle(categories, category, setCategories)}
              />
              {category}xx
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Registry status</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {(["standard", "deprecated", "non-standard"] as const).map(
            (classification) => (
              <label key={classification}>
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={classifications.includes(classification)}
                  onChange={() =>
                    toggle(classifications, classification, setClassifications)
                  }
                />
                {classification}
              </label>
            ),
          )}
        </div>
      </fieldset>
      <p className="text-muted-foreground text-xs">
        Offline snapshot {HTTP_STATUS_REGISTRY_SOURCE.snapshotVersion} · IANA
        registry source date {HTTP_STATUS_REGISTRY_SOURCE.lastUpdated}. Search
        and selection stay in browser state and are not added to the URL.
      </p>
      <div
        id="http-status-results"
        role="listbox"
        aria-label="HTTP status search results"
        className="max-h-96 overflow-auto rounded-lg border"
      >
        {results.map((entry, index) => (
          <button
            id={`status-${entry.code}`}
            role="option"
            aria-selected={selectedCode === entry.code}
            className={`flex w-full items-center justify-between border-b px-3 py-2 text-left last:border-b-0 ${index === activeIndex ? "bg-accent" : ""}`}
            key={entry.code}
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => setSelectedCode(entry.code)}
          >
            <span>
              <strong>{entry.code}</strong> {entry.title}
            </span>
            <span className="text-muted-foreground text-xs">
              {entry.classification}
            </span>
          </button>
        ))}
        {!results.length ? (
          <p className="text-muted-foreground p-3 text-sm">
            No bundled entries match.
          </p>
        ) : null}
      </div>
    </section>
  );

  const output = (
    <OutputPanel
      emptyMessage="Select an HTTP status entry."
      isEmpty={!selected && !unknown}
      title="Selected status"
      toolbar={
        selected && !unknown ? (
          <CopyButton
            label="Copy entry"
            text={formatHttpStatusEntry(selected)}
          />
        ) : null
      }
    >
      {unknown ? (
        <article data-testid="http-status-output">
          <h2 className="text-2xl font-semibold">
            {unknown.code} {unknown.title}
          </h2>
          <p className="mt-3 text-sm">{unknown.explanation}</p>
        </article>
      ) : selected ? (
        <article className="space-y-5" data-testid="http-status-output">
          <header>
            <p className="text-muted-foreground text-sm uppercase">
              {selected.classification} · {selected.category}xx
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {selected.code} {selected.title}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {selected.reference}
            </p>
          </header>
          <section>
            <h3 className="font-medium">What it means</h3>
            <p className="mt-1 text-sm leading-6">{selected.explanation}</p>
          </section>
          <section>
            <h3 className="font-medium">Troubleshooting</h3>
            <p className="mt-1 text-sm leading-6">{selected.troubleshooting}</p>
          </section>
          {selected.cache || selected.auth || selected.retry ? (
            <section className="rounded-lg border p-4">
              <h3 className="font-medium">Protocol considerations</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {selected.cache ? (
                  <div>
                    <dt className="font-medium">Cache</dt>
                    <dd>{selected.cache}</dd>
                  </div>
                ) : null}
                {selected.auth ? (
                  <div>
                    <dt className="font-medium">Authentication</dt>
                    <dd>{selected.auth}</dd>
                  </div>
                ) : null}
                {selected.retry ? (
                  <div>
                    <dt className="font-medium">Retry</dt>
                    <dd>{selected.retry}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="text-muted-foreground mt-3 text-xs">
                These are conditional considerations, not universal application
                behavior.
              </p>
            </section>
          ) : null}
        </article>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      inputLabel="Search and filter"
      output={output}
      outputLabel="Reference entry"
      toolbar={<ResetButton onReset={reset} />}
      instructions={
        <p>
          Search the versioned offline IANA snapshot and curated non-standard
          list, filter classifications, navigate results with Arrow keys, and
          press Enter to select.
        </p>
      }
      examples={[{ title: "Debug a 502" }, { title: "Review retry semantics" }]}
      faqs={[
        {
          question: "Is every listed code standardized?",
          answer:
            "No. IANA entries, deprecated/unused entries, and commonly observed vendor codes are labeled separately.",
        },
        {
          question: "Does a retry note mean every request is safe to retry?",
          answer:
            "No. Method safety, idempotency, request-body replay, application guarantees, and retry budgets still apply.",
        },
      ]}
      seoContent={
        <p>
          Search an offline, versioned HTTP status reference with IANA
          classifications, practical troubleshooting, conditional
          cache/auth/retry notes, keyboard navigation, and no search URL
          leakage.
        </p>
      }
    />
  );
}
