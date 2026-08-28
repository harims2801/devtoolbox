import { estimateTokens } from "@/lib/llm-cost-tools";

export type ChunkStrategy =
  "recursive" | "token" | "sentence" | "paragraph" | "markdown";

export interface RagChunk {
  id: string;
  index: number;
  text: string;
  start: number;
  end: number;
  characters: number;
  estimatedTokens: number;
}

export interface ChunkResult {
  chunks: RagChunk[];
  warnings: string[];
}

export interface ChunkOptions {
  strategy: ChunkStrategy;
  size: number;
  overlap: number;
}

export interface ChunkComparison {
  strategy: ChunkStrategy;
  chunks: number;
  averageTokens: number;
  maximumTokens: number;
  duplicatedCharacters: number;
}

export const CHUNK_STRATEGIES: readonly ChunkStrategy[] = [
  "recursive",
  "token",
  "sentence",
  "paragraph",
  "markdown",
];

export const CHUNK_STRATEGY_LABELS: Record<ChunkStrategy, string> = {
  recursive: "Recursive",
  token: "Estimated token",
  sentence: "Sentence-aware",
  paragraph: "Paragraph-aware",
  markdown: "Markdown-aware",
};

function validate(text: string, options: ChunkOptions) {
  if (text.length > 200_000)
    throw new Error("Use no more than 200,000 characters.");
  if (
    !Number.isInteger(options.size) ||
    options.size < 10 ||
    options.size > 4_000
  )
    throw new Error("Chunk size must be a whole number from 10 to 4,000.");
  if (
    !Number.isInteger(options.overlap) ||
    options.overlap < 0 ||
    options.overlap >= options.size
  )
    throw new Error("Overlap must be a whole number smaller than chunk size.");
}

function graphemeEnds(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(text)].map(
    (segment) => segment.index + segment.segment.length,
  );
}

function wordEnds(text: string) {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  return [...segmenter.segment(text)].map(
    (segment) => segment.index + segment.segment.length,
  );
}

function sentenceEnds(text: string) {
  try {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "sentence",
    });
    return [...segmenter.segment(text)].map(
      (segment) => segment.index + segment.segment.length,
    );
  } catch {
    const ends: number[] = [];
    for (const match of text.matchAll(/[.!?]+(?:\s+|$)/gu))
      ends.push((match.index ?? 0) + match[0].length);
    return ends;
  }
}

function paragraphEnds(text: string) {
  const ends: number[] = [];
  for (const match of text.matchAll(/(?:\r?\n){2,}/g))
    ends.push((match.index ?? 0) + match[0].length);
  ends.push(text.length);
  return ends;
}

function markdownEnds(text: string) {
  const ends: number[] = [];
  let offset = 0,
    fenced = false;
  for (const line of text.match(/.*(?:\r?\n|$)/g) ?? []) {
    if (!line) continue;
    offset += line.length;
    const trimmed = line.trimStart();
    if (/^(```|~~~)/.test(trimmed)) {
      fenced = !fenced;
      if (!fenced) ends.push(offset);
      continue;
    }
    if (fenced) continue;
    if (
      /^#{1,6}\s/.test(trimmed) ||
      /^([-*+]\s|\d+[.)]\s)/.test(trimmed) ||
      !trimmed.trim()
    )
      ends.push(offset);
  }
  ends.push(text.length);
  return ends;
}

function boundaryGroups(text: string, strategy: ChunkStrategy) {
  const groups =
    strategy === "token"
      ? [wordEnds(text)]
      : strategy === "sentence"
        ? [sentenceEnds(text), wordEnds(text)]
        : strategy === "paragraph"
          ? [paragraphEnds(text), sentenceEnds(text), wordEnds(text)]
          : strategy === "markdown"
            ? [markdownEnds(text), paragraphEnds(text), wordEnds(text)]
            : [paragraphEnds(text), sentenceEnds(text), wordEnds(text)];
  return groups.map((values) =>
    [...new Set([...values, text.length])]
      .filter((value) => value > 0 && value <= text.length)
      .sort((a, b) => a - b),
  );
}

function firstGreater(values: readonly number[], target: number) {
  let low = 0,
    high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle]! <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function hardEnd(
  text: string,
  graphemes: readonly number[],
  start: number,
  size: number,
) {
  const first = firstGreater(graphemes, start);
  let chosen = graphemes[first] ?? text.length;
  for (let index = first; index < graphemes.length; index += 1) {
    const end = graphemes[index]!;
    if (estimateTokens(text.slice(start, end)) > size) break;
    chosen = end;
  }
  return chosen;
}

function overlapStart(
  text: string,
  graphemes: readonly number[],
  start: number,
  end: number,
  overlap: number,
) {
  if (!overlap) return end;
  if (estimateTokens(text.slice(start, end)) <= overlap) return end;
  const first = firstGreater(graphemes, start);
  for (let index = first; index < graphemes.length; index += 1) {
    const candidate = graphemes[index]!;
    if (candidate >= end) break;
    if (estimateTokens(text.slice(candidate, end)) <= overlap) return candidate;
  }
  return end;
}

export function chunkText(text: string, options: ChunkOptions): ChunkResult {
  validate(text, options);
  if (!text) return { chunks: [], warnings: [] };
  const groups = boundaryGroups(text, options.strategy),
    graphemes = graphemeEnds(text),
    chunks: RagChunk[] = [],
    warnings: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < 10_000) {
    let end = start;
    for (const points of groups) {
      let candidateEnd = start,
        pointIndex = firstGreater(points, start);
      for (; pointIndex < points.length; pointIndex += 1) {
        const candidate = points[pointIndex]!;
        if (estimateTokens(text.slice(start, candidate)) > options.size) break;
        candidateEnd = candidate;
      }
      if (candidateEnd > start) {
        end = candidateEnd;
        break;
      }
    }
    if (end === start) {
      end = hardEnd(text, graphemes, start, options.size);
      if (
        !warnings.includes(
          "Oversized semantic units were split at Unicode-safe character boundaries.",
        )
      )
        warnings.push(
          "Oversized semantic units were split at Unicode-safe character boundaries.",
        );
    }
    const value = text.slice(start, end),
      index = chunks.length;
    chunks.push({
      id: `chunk-${index + 1}-${start}-${end}`,
      index,
      text: value,
      start,
      end,
      characters: value.length,
      estimatedTokens: estimateTokens(value),
    });
    if (end >= text.length) break;
    const next = overlapStart(text, graphemes, start, end, options.overlap);
    start = next > start ? next : end;
  }
  if (chunks.length >= 10_000)
    warnings.push("Chunking stopped at the 10,000-chunk safety limit.");
  warnings.unshift(
    "Token counts are provider-neutral estimates, not exact model tokenizer output.",
  );
  return { chunks, warnings };
}

export function compareChunkStrategies(
  text: string,
  options: Omit<ChunkOptions, "strategy">,
): ChunkComparison[] {
  return CHUNK_STRATEGIES.map((strategy) => {
    const chunks = chunkText(text, { ...options, strategy }).chunks,
      total = chunks.reduce((sum, chunk) => sum + chunk.estimatedTokens, 0),
      covered = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
    return {
      strategy,
      chunks: chunks.length,
      averageTokens: chunks.length
        ? Math.round((total / chunks.length) * 10) / 10
        : 0,
      maximumTokens: Math.max(
        0,
        ...chunks.map((chunk) => chunk.estimatedTokens),
      ),
      duplicatedCharacters: Math.max(0, covered - text.length),
    };
  });
}
