"use client";

import { useState } from "react";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { OutputPanel } from "@/components/tools/output-panel";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { getToolById } from "@/config/tool-registry";
import {
  CHUNK_STRATEGIES,
  CHUNK_STRATEGY_LABELS,
  chunkText,
  compareChunkStrategies,
  type ChunkStrategy,
} from "@/lib/rag-chunking-tools";

const example = `# Production retrieval guide

Retrieval quality starts with documents that have clear structure. Preserve headings because they carry useful context into each chunk.

## Chunk sizing

Smaller chunks can improve precision, while larger chunks retain more surrounding meaning. Measure the tradeoff with your own queries and relevance labels.

## Example configuration

\`\`\`json
{
  "strategy": "markdown",
  "size": 120,
  "overlap": 20
}
\`\`\`

Use overlap deliberately. Too little can separate related ideas; too much increases index size and can return redundant passages.`;

export function RagChunkingPlaygroundTool() {
  const tool = getToolById("rag-chunking-playground");
  if (!tool) throw new Error("RAG chunking metadata is missing");
  const [text, setText] = useState(example),
    [strategy, setStrategy] = useState<ChunkStrategy>("markdown"),
    [sizeInput, setSizeInput] = useState("120"),
    [overlapInput, setOverlapInput] = useState("20"),
    size = Number(sizeInput),
    overlap = Number(overlapInput);
  let error = "",
    chunks: ReturnType<typeof chunkText>["chunks"] = [],
    warnings: string[] = [],
    comparison: ReturnType<typeof compareChunkStrategies> = [];
  try {
    const result = chunkText(text, { strategy, size, overlap });
    chunks = result.chunks;
    warnings = result.warnings;
    comparison = compareChunkStrategies(text, { size, overlap });
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Unable to chunk this text.";
  }
  const json = JSON.stringify(chunks, null, 2),
    jsonl = chunks.map((chunk) => JSON.stringify(chunk)).join("\n"),
    combined = chunks
      .map((chunk) => `--- Chunk ${chunk.index + 1} ---\n${chunk.text}`)
      .join("\n\n");

  function loadExample() {
    setText(example);
    setStrategy("markdown");
    setSizeInput("120");
    setOverlapInput("20");
  }

  function reset() {
    setText("");
    setStrategy("recursive");
    setSizeInput("500");
    setOverlapInput("50");
  }

  const input = (
    <div className="space-y-5">
      <section className="bg-card space-y-4 rounded-xl border p-5">
        <label className="block text-sm font-medium">
          Source document
          <textarea
            aria-label="Source document"
            className="bg-background mt-2 min-h-[28rem] w-full rounded-md border p-3 font-mono text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={200000}
            spellCheck={false}
          />
        </label>
        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          <span>{text.length.toLocaleString()} characters</span>
          <span>200,000 maximum</span>
        </div>
      </section>
      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Strategy
            <select
              aria-label="Chunking strategy"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              value={strategy}
              onChange={(event) =>
                setStrategy(event.target.value as ChunkStrategy)
              }
            >
              {CHUNK_STRATEGIES.map((value) => (
                <option value={value} key={value}>
                  {CHUNK_STRATEGY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Target size (estimated tokens)
            <input
              aria-label="Target chunk size"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              type="number"
              min={10}
              max={4000}
              step={1}
              value={sizeInput}
              onChange={(event) => setSizeInput(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Overlap (estimated tokens)
            <input
              aria-label="Chunk overlap"
              className="bg-background mt-2 h-11 w-full rounded-md border px-3"
              type="number"
              min={0}
              max={3999}
              step={1}
              value={overlapInput}
              onChange={(event) => setOverlapInput(event.target.value)}
            />
          </label>
        </div>
        <p className="text-muted-foreground text-sm">
          Semantic strategies prefer natural boundaries, then split oversized
          units safely. Exact model tokenizers differ by provider and model.
        </p>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );

  const output = (
    <OutputPanel
      title="RAG chunks"
      isEmpty={!chunks.length}
      emptyMessage={error || "Add source text to generate chunks."}
      toolbar={
        chunks.length ? (
          <>
            <CopyButton label="Copy all chunks" text={combined} />
            <DownloadButton
              label="Download chunks JSON"
              content={json}
              filename="rag-chunks.json"
              mimeType="application/json"
            />
            <DownloadButton
              label="Download chunks JSONL"
              content={jsonl}
              filename="rag-chunks.jsonl"
              mimeType="application/x-ndjson"
            />
          </>
        ) : null
      }
    >
      {chunks.length ? (
        <div className="space-y-5" data-testid="rag-chunking-result">
          <section className="overflow-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">
                Chunking strategy comparison
              </caption>
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Strategy</th>
                  <th className="p-3">Chunks</th>
                  <th className="p-3">Average tokens</th>
                  <th className="p-3">Maximum tokens</th>
                  <th className="p-3">Overlap characters</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    className={
                      row.strategy === strategy
                        ? "bg-accent border-t"
                        : "border-t"
                    }
                    key={row.strategy}
                  >
                    <td className="p-3 font-medium">
                      {CHUNK_STRATEGY_LABELS[row.strategy]}
                    </td>
                    <td className="p-3">{row.chunks}</td>
                    <td className="p-3">{row.averageTokens}</td>
                    <td className="p-3">{row.maximumTokens}</td>
                    <td className="p-3">{row.duplicatedCharacters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="space-y-2">
            {warnings.map((warning) => (
              <p
                className="text-sm text-amber-700 dark:text-amber-300"
                key={warning}
              >
                Note: {warning}
              </p>
            ))}
          </div>
          <section className="space-y-3" aria-label="Generated chunks">
            {chunks.map((chunk) => (
              <article
                className="rounded-lg border"
                key={chunk.id}
                data-testid="rag-chunk"
              >
                <header className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-sm">
                  <strong>Chunk {chunk.index + 1}</strong>
                  <span className="text-muted-foreground">
                    chars {chunk.start}–{chunk.end} · {chunk.characters}{" "}
                    characters · ~{chunk.estimatedTokens} tokens
                  </span>
                </header>
                <pre className="max-h-72 overflow-auto p-3 font-mono text-sm whitespace-pre-wrap">
                  {chunk.text}
                </pre>
              </article>
            ))}
          </section>
        </div>
      ) : null}
    </OutputPanel>
  );

  return (
    <RegisteredToolLayout
      tool={tool}
      input={input}
      output={output}
      toolbar={
        <>
          <ExampleButton onLoad={loadExample} />
          <ResetButton onReset={reset} />
        </>
      }
      instructions={[
        "Paste a representative source document and choose a target estimated-token budget.",
        "Compare strategies and inspect exact offsets, semantic boundaries, overlap, and chunk-size variance.",
        "Export JSON or JSONL, then evaluate retrieval with your real embedding model, queries, and relevance labels.",
      ]}
      faqs={[
        {
          question: "Does this create embeddings?",
          answer:
            "No. It prepares and compares chunks locally without calling a model or sending document text anywhere.",
        },
        {
          question: "Are token counts exact?",
          answer:
            "No. They are provider-neutral planning estimates. Validate final limits with the tokenizer for your embedding or generation model.",
        },
        {
          question: "Which strategy is best?",
          answer:
            "There is no universal winner. Markdown-aware chunking often helps structured docs, while sentence or recursive strategies can suit prose. Measure retrieval quality on representative queries.",
        },
      ]}
    />
  );
}
