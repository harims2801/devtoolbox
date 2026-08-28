import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RagChunkingPlaygroundTool } from "@/components/tools/rag-chunking-playground-tool";

afterEach(cleanup);

describe("RAG chunking playground UI", () => {
  it("renders chunks, exact offsets, comparison metrics, and all strategies", () => {
    render(<RagChunkingPlaygroundTool />);
    expect(screen.getAllByTestId("rag-chunking-result")[0]).toHaveTextContent(
      "chars 0–",
    );
    expect(screen.getAllByTestId("rag-chunk").length).toBeGreaterThan(0);
    for (const label of [
      "Recursive",
      "Estimated token",
      "Sentence-aware",
      "Paragraph-aware",
      "Markdown-aware",
    ])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it("recalculates with a selected strategy, size, and overlap", () => {
    render(<RagChunkingPlaygroundTool />);
    fireEvent.change(screen.getAllByLabelText("Source document")[0]!, {
      target: { value: "One sentence. Two sentence. Three sentence." },
    });
    fireEvent.change(screen.getAllByLabelText("Chunking strategy")[0]!, {
      target: { value: "sentence" },
    });
    fireEvent.change(screen.getAllByLabelText("Target chunk size")[0]!, {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByLabelText("Chunk overlap")[0]!, {
      target: { value: "2" },
    });
    expect(screen.getAllByTestId("rag-chunk").length).toBeGreaterThan(1);
    expect(screen.getAllByTestId("rag-chunking-result")[0]).toHaveTextContent(
      "Sentence-aware",
    );
  });

  it("validates bounds instead of generating misleading chunks", () => {
    render(<RagChunkingPlaygroundTool />);
    fireEvent.change(screen.getAllByLabelText("Target chunk size")[0]!, {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByLabelText("Chunk overlap")[0]!, {
      target: { value: "10" },
    });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "smaller than chunk size",
    );
    expect(screen.queryAllByTestId("rag-chunking-result")).toHaveLength(0);
  });

  it("reset clears document content and restores safe defaults", () => {
    render(<RagChunkingPlaygroundTool />);
    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]!);
    expect(screen.getAllByLabelText("Source document")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Chunking strategy")[0]).toHaveValue(
      "recursive",
    );
    expect(screen.getAllByLabelText("Target chunk size")[0]).toHaveValue(500);
    expect(screen.getAllByLabelText("Chunk overlap")[0]).toHaveValue(50);
  });
});
