"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";

import { CodeTextarea } from "@/components/tools/code-textarea";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import { getByteSize } from "@/lib/json-tools";
import { MARKDOWN_MAX_BYTES, renderMarkdown } from "@/lib/markdown-tools";

type Layout = "input" | "split" | "output";

const exampleMarkdown = `# Release checklist 🚀

> Preview Markdown locally before publishing it.

- [x] Add the feature
- [ ] Share the release notes

| Environment | Status |
| --- | --- |
| Production | Ready |

\`\`\`ts
const privacy = "browser-only";
\`\`\`

[Read the guide](https://example.com/docs)

![Remote architecture](https://example.com/diagram.png)`;

export function MarkdownPreviewerTool() {
  const tool = getToolById("markdown-previewer");
  if (!tool) throw new Error("Markdown previewer metadata is missing");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [markdown, setMarkdown] = useState("");
  const [layout, setLayout] = useState<Layout>("split");
  const [syncScroll, setSyncScroll] = useState(true);
  const [allowRemoteImages, setAllowRemoteImages] = useState(false);
  const deferredMarkdown = useDeferredValue(markdown);
  const rendered = useMemo(
    () => renderMarkdown(deferredMarkdown, { allowRemoteImages }),
    [allowRemoteImages, deferredMarkdown],
  );

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".md")) {
      toast.error("Choose a .md file");
      return;
    }
    if (file.size > MARKDOWN_MAX_BYTES) {
      toast.error("File exceeds the 1 MB preview limit");
      return;
    }
    try {
      setMarkdown(await file.text());
      toast.success(`${file.name} loaded locally`);
    } catch {
      toast.error("Could not read this local file");
    }
  }

  const editor = (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void loadFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        accept=".md,text/markdown,text/plain"
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <CodeTextarea
        className="min-h-[32rem]"
        description="Markdown stays in this browser tab. Drop a .md file here (1 MB maximum)."
        label="Markdown editor"
        onChange={(event) => {
          const value = event.target.value;
          if (getByteSize(value) <= MARKDOWN_MAX_BYTES) setMarkdown(value);
        }}
        onScroll={(event) => {
          if (!syncScroll || !previewRef.current) return;
          const source = event.currentTarget;
          const maximum = source.scrollHeight - source.clientHeight;
          const ratio = maximum > 0 ? source.scrollTop / maximum : 0;
          previewRef.current.scrollTop =
            ratio *
            (previewRef.current.scrollHeight - previewRef.current.clientHeight);
        }}
        placeholder="Write or paste Markdown here"
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
        value={markdown}
      />
    </div>
  );

  const preview = (
    <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="bg-muted/30 flex min-h-11 items-center justify-between gap-3 border-b px-3">
        <h2 className="text-sm font-medium">Rendered preview</h2>
        {rendered.blockedImages ? (
          <span className="text-muted-foreground text-xs">
            {rendered.blockedImages} image blocked
          </span>
        ) : null}
      </div>
      <div
        aria-label="Rendered Markdown preview"
        className="markdown-preview max-h-[48rem] min-h-[32rem] overflow-auto p-5 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        dangerouslySetInnerHTML={{ __html: rendered.html }}
        ref={previewRef}
        tabIndex={0}
      />
      {!markdown ? (
        <p className="text-muted-foreground border-t px-3 py-2 text-xs">
          Start typing or load an example to see the sanitized preview.
        </p>
      ) : null}
    </section>
  );

  return (
    <RegisteredToolLayout
      examples={[
        {
          title: "Safe release notes",
          description:
            "Preview GFM tables, tasks, links, and code without uploading the document.",
        },
      ]}
      faqs={[
        {
          question: "Can Markdown run scripts?",
          answer:
            "No. Raw HTML is rendered as text, and a strict allowlist removes scripts, event handlers, frames, unsafe URLs, and unsupported attributes.",
        },
        {
          question: "Why are images blocked?",
          answer:
            "Remote images can reveal your IP address and document-view timing. They remain disabled unless you explicitly enable HTTPS image requests.",
        },
      ]}
      input={editor}
      inputLabel="Edit"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste Markdown or open a local .md file.</li>
          <li>Choose edit, split, or preview layout.</li>
          <li>
            Keep remote images blocked unless you accept the privacy tradeoff.
          </li>
          <li>Copy or download the original Markdown when finished.</li>
        </ol>
      }
      output={preview}
      outputLabel="Preview"
      seoContent={
        <p>
          Preview GitHub-flavored Markdown locally with safe links, disabled raw
          HTML, strict sanitization, and explicit remote-image controls.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <fieldset
            className="flex items-center gap-1"
            data-testid="layout-controls"
          >
            <legend className="sr-only">Preview layout</legend>
            {(["input", "split", "output"] as const).map((mode) => (
              <Button
                aria-pressed={layout === mode}
                key={mode}
                onClick={() => setLayout(mode)}
                size="sm"
                type="button"
                variant={layout === mode ? "secondary" : "outline"}
              >
                {mode === "input"
                  ? "Edit only"
                  : mode === "output"
                    ? "Preview only"
                    : "Split"}
              </Button>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={syncScroll}
              onChange={(event) => setSyncScroll(event.target.checked)}
              type="checkbox"
            />
            Synchronize scrolling
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={allowRemoteImages}
              onChange={(event) => setAllowRemoteImages(event.target.checked)}
              type="checkbox"
            />
            Load remote HTTPS images (privacy risk)
          </label>
          <ExampleButton onLoad={() => setMarkdown(exampleMarkdown)} />
          <CopyButton
            disabled={!markdown}
            label="Copy Markdown"
            text={markdown}
          />
          <DownloadButton
            content={markdown}
            disabled={!markdown}
            filename="document.md"
            label="Download .md"
            mimeType="text/markdown;charset=utf-8"
          />
          <ResetButton onReset={() => setMarkdown("")} />
        </>
      }
      workspaceMode={layout}
    />
  );
}
