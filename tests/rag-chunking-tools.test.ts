import { describe, expect, it } from "vitest";
import {
  CHUNK_STRATEGIES,
  chunkText,
  compareChunkStrategies,
} from "@/lib/rag-chunking-tools";

const prose = [
  "First sentence explains retrieval. Second sentence adds useful context.",
  "A new paragraph should remain a meaningful boundary. It has two sentences.",
  "The final paragraph is short.",
].join("\n\n");

describe("RAG chunking algorithms", () => {
  it("reconstructs the exact source with zero overlap and preserves offsets", () => {
    for (const strategy of CHUNK_STRATEGIES) {
      const chunks = chunkText(prose, {
        strategy,
        size: 20,
        overlap: 0,
      }).chunks;
      expect(chunks.map((chunk) => chunk.text).join("")).toBe(prose);
      for (const chunk of chunks) {
        expect(prose.slice(chunk.start, chunk.end)).toBe(chunk.text);
        expect(chunk.estimatedTokens).toBeLessThanOrEqual(20);
      }
    }
  });

  it("prefers complete sentences when they fit the budget", () => {
    const chunks = chunkText(prose, {
      strategy: "sentence",
      size: 22,
      overlap: 0,
    }).chunks;
    expect(chunks[0]?.text).toBe(
      "First sentence explains retrieval. Second sentence adds useful context.\n\n",
    );
  });

  it("prefers paragraph boundaries over filling every available token", () => {
    const paragraph = chunkText(prose, {
        strategy: "paragraph",
        size: 35,
        overlap: 0,
      }).chunks,
      token = chunkText(prose, {
        strategy: "token",
        size: 35,
        overlap: 0,
      }).chunks;
    expect(paragraph[0]?.text).toBe(
      "First sentence explains retrieval. Second sentence adds useful context.\n\n",
    );
    expect(token[0]?.end).toBeGreaterThan(paragraph[0]!.end);
  });

  it("keeps a bounded Markdown code fence in one chunk", () => {
    const source =
      '# Config\n\n```json\n{\n  "enabled": true\n}\n```\n\nAfterward.\n';
    const chunks = chunkText(source, {
      strategy: "markdown",
      size: 15,
      overlap: 0,
    }).chunks;
    expect(
      chunks.some(
        (chunk) =>
          chunk.text.includes("```json") && chunk.text.includes("```\n"),
      ),
    ).toBe(true);
  });

  it("adds bounded overlap while keeping exact source slices", () => {
    const chunks = chunkText(prose, {
      strategy: "token",
      size: 15,
      overlap: 4,
    }).chunks;
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]!.start).toBeLessThan(chunks[0]!.end);
    for (const chunk of chunks)
      expect(chunk.text).toBe(prose.slice(chunk.start, chunk.end));
  });

  it("does not split surrogate pairs or joined emoji during hard boundaries", () => {
    const source = `${"界".repeat(30)}👩‍💻${"界".repeat(30)}`;
    const chunks = chunkText(source, {
      strategy: "token",
      size: 10,
      overlap: 0,
    }).chunks;
    expect(chunks.map((chunk) => chunk.text).join("")).toBe(source);
    expect(chunks.some((chunk) => chunk.text.includes("👩‍💻"))).toBe(true);
    expect(chunks.every((chunk) => !chunk.text.includes("�"))).toBe(true);
  });

  it("compares all strategies with overlap and size metrics", () => {
    const rows = compareChunkStrategies(prose, { size: 18, overlap: 3 });
    expect(rows.map((row) => row.strategy)).toEqual(CHUNK_STRATEGIES);
    expect(rows.every((row) => row.chunks > 0)).toBe(true);
    expect(rows.every((row) => row.maximumTokens <= 18)).toBe(true);
    expect(rows.some((row) => row.duplicatedCharacters > 0)).toBe(true);
  });

  it("rejects unsafe sizes, overlaps, and oversized documents", () => {
    expect(() =>
      chunkText("text", { strategy: "token", size: 9, overlap: 0 }),
    ).toThrow(/10 to 4,000/);
    expect(() =>
      chunkText("text", { strategy: "token", size: 10, overlap: 10 }),
    ).toThrow(/smaller/);
    expect(() =>
      chunkText("x".repeat(200_001), {
        strategy: "token",
        size: 10,
        overlap: 0,
      }),
    ).toThrow(/200,000/);
  });
});
