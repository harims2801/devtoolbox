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
  formatSql,
  SQL_MAX_BYTES,
  type SqlDialect,
  type SqlKeywordCase,
} from "@/lib/sql-tools";

const exampleSql = `with active_users as (
select id, display_name from users where active = true
)
select u.id, u.display_name, count(o.id) as order_count
from active_users u left join orders o on o.user_id = u.id
group by u.id, u.display_name order by order_count desc;`;

export function SqlFormatterTool() {
  const tool = getToolById("sql-formatter");
  if (!tool) throw new Error("SQL formatter metadata is missing");
  const fileRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("standard");
  const [indentation, setIndentation] = useState<2 | 4>(2);
  const [keywordCase, setKeywordCase] = useState<SqlKeywordCase>("upper");
  const bytes = useMemo(() => getByteSize(input), [input]);

  function run(minify = false) {
    const result = formatSql(input, {
      dialect,
      indentation,
      keywordCase,
      minify,
    });
    if (!result.ok) {
      setError(result.error);
      setOutput("");
      return;
    }
    setError("");
    setOutput(result.output);
    toast.success(minify ? "SQL minified" : "SQL formatted");
  }

  async function loadFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".sql")) {
      toast.error("Choose a .sql file");
      return;
    }
    if (file.size > SQL_MAX_BYTES) {
      toast.error("File exceeds the 5 MB processing limit");
      return;
    }
    try {
      setInput(await file.text());
      setOutput("");
      setError("");
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
        accept=".sql,application/sql,text/sql,text/plain"
        className="sr-only"
        onChange={(event) => {
          void loadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={fileRef}
        type="file"
      />
      <CodeTextarea
        description={`Input size: ${formatByteSize(bytes)}. SQL is formatted locally and is never executed.`}
        error={error}
        label="SQL input"
        onChange={(event) => {
          setInput(event.target.value);
          setError("");
        }}
        placeholder="Paste SQL here"
        toolbar={
          <Button
            onClick={() => fileRef.current?.click()}
            size="sm"
            type="button"
            variant="ghost"
          >
            <FileUp aria-hidden="true" /> Open file
          </Button>
        }
        value={input}
      />
    </div>
  );
  const outputPanel = (
    <OutputPanel
      emptyMessage="Format or minify SQL to see output."
      isEmpty={!output}
      title={`SQL output · ${formatByteSize(getByteSize(output))}`}
      toolbar={
        output ? (
          <>
            <CopyButton text={output} />
            <DownloadButton
              content={output}
              filename="formatted.sql"
              mimeType="application/sql;charset=utf-8"
            />
          </>
        ) : null
      }
    >
      {output ? (
        <pre
          className="bg-muted/50 max-h-[36rem] overflow-auto rounded-lg p-4 text-sm leading-6 whitespace-pre-wrap"
          data-testid="sql-output"
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
          title: "CTEs and joins",
          description:
            "Format multi-clause queries while preserving comments, strings, quoted identifiers, and placeholders.",
        },
      ]}
      faqs={[
        {
          question: "Is SQL executed or uploaded?",
          answer:
            "No. The formatter only tokenizes text locally in this browser tab and never connects to a database.",
        },
        {
          question: "Does formatting prove a query is valid?",
          answer:
            "No. It detects unterminated strings, identifiers, and comments, but it does not perform schema-aware or semantic validation.",
        },
      ]}
      input={inputPanel}
      inputLabel="SQL input"
      instructions={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste SQL or open a local .sql file up to 5 MB.</li>
          <li>Select a dialect label, indentation width, and keyword case.</li>
          <li>
            Format for review or minify while preserving literals and comments.
          </li>
          <li>Copy or download the result. Review it before production use.</li>
        </ol>
      }
      output={outputPanel}
      outputLabel="SQL output"
      seoContent={
        <p>
          Format common SQL, PostgreSQL, MySQL, SQLite, SQL Server, and BigQuery
          text locally without executing queries or sending database code to a
          server.
        </p>
      }
      tool={tool}
      toolbar={
        <>
          <label className="flex items-center gap-2 text-sm">
            Dialect
            <select
              aria-label="SQL dialect"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) => setDialect(event.target.value as SqlDialect)}
              value={dialect}
            >
              <option value="standard">Common SQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
              <option value="bigquery">BigQuery</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Indent
            <select
              aria-label="SQL indentation"
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
          <label className="flex items-center gap-2 text-sm">
            Keywords
            <select
              aria-label="SQL keyword case"
              className="bg-background h-9 rounded-md border px-2"
              onChange={(event) =>
                setKeywordCase(event.target.value as SqlKeywordCase)
              }
              value={keywordCase}
            >
              <option value="upper">UPPER</option>
              <option value="lower">lower</option>
              <option value="preserve">Preserve</option>
            </select>
          </label>
          <Button
            disabled={!input.trim() || bytes > SQL_MAX_BYTES}
            onClick={() => run()}
            type="button"
          >
            Format
          </Button>
          <Button
            disabled={!input.trim() || bytes > SQL_MAX_BYTES}
            onClick={() => run(true)}
            type="button"
            variant="outline"
          >
            Minify
          </Button>
          <ExampleButton
            onLoad={() => {
              setInput(exampleSql);
              setOutput("");
              setError("");
            }}
          />
          <ResetButton
            disabled={!input && !output}
            onReset={() => {
              setInput("");
              setOutput("");
              setError("");
            }}
          />
        </>
      }
    />
  );
}
