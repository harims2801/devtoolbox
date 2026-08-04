import {
  parseAllDocuments,
  stringify,
  type Document,
  type ParsedNode,
} from "yaml";

import {
  calculateJsonStatistics,
  getByteSize,
  parseJson,
  sortJsonKeys,
  type JsonStatistics,
  type JsonValue,
} from "@/lib/json-tools";

export type StructuredFormat = "yaml" | "json";

export const YAML_WARNING_BYTES = 1_000_000;
export const YAML_MAX_BYTES = 5_000_000;
export const YAML_MAX_DEPTH = 100;
export const YAML_MAX_ALIASES = 50;

export interface StructuredParseError {
  message: string;
  line: number;
  column: number;
  contextLine: string;
}

export interface StructuredDocumentStatistics extends JsonStatistics {
  documentCount: number;
}

export type StructuredParseResult =
  | {
      ok: true;
      format: StructuredFormat;
      documents: JsonValue[];
      statistics: StructuredDocumentStatistics;
    }
  | { ok: false; error: StructuredParseError };

function errorAt(
  input: string,
  message: string,
  line = 1,
  column = 1,
): StructuredParseError {
  return {
    message: `${message} (line ${line}, column ${column})`,
    line,
    column,
    contextLine: input.split(/\r?\n/)[line - 1] ?? "",
  };
}

function mergeStatistics(documents: JsonValue[]): StructuredDocumentStatistics {
  const total: StructuredDocumentStatistics = {
    documentCount: documents.length,
    objectCount: 0,
    arrayCount: 0,
    keyCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    maximumDepth: 0,
  };

  for (const document of documents) {
    const statistics = calculateJsonStatistics(document);
    total.objectCount += statistics.objectCount;
    total.arrayCount += statistics.arrayCount;
    total.keyCount += statistics.keyCount;
    total.stringCount += statistics.stringCount;
    total.numberCount += statistics.numberCount;
    total.booleanCount += statistics.booleanCount;
    total.nullCount += statistics.nullCount;
    total.maximumDepth = Math.max(total.maximumDepth, statistics.maximumDepth);
  }

  return total;
}

function assertJsonCompatible(
  value: unknown,
  depth = 1,
  seen = new WeakSet<object>(),
): asserts value is JsonValue {
  if (depth > YAML_MAX_DEPTH) {
    throw new Error(`Nesting exceeds the supported depth of ${YAML_MAX_DEPTH}`);
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite numbers are not supported");
    }
    return;
  }

  if (typeof value !== "object") {
    throw new Error(`Unsupported YAML value type: ${typeof value}`);
  }

  if (seen.has(value)) {
    throw new Error("Recursive aliases are not supported");
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => assertJsonCompatible(item, depth + 1, seen));
  } else {
    for (const [key, item] of Object.entries(value)) {
      if (typeof key !== "string") {
        throw new Error("Only string mapping keys are supported");
      }
      assertJsonCompatible(item, depth + 1, seen);
    }
  }

  seen.delete(value);
}

function yamlError(
  input: string,
  error: { message: string; linePos?: Array<{ line: number; col: number }> },
) {
  const position = error.linePos?.[0];
  return errorAt(
    input,
    error.message.replace(/\s+at line.*$/is, "").trim(),
    position?.line ?? 1,
    position?.col ?? 1,
  );
}

export function detectStructuredFormat(input: string): StructuredFormat {
  if (!input.trim()) return "yaml";
  return parseJson(input).ok ? "json" : "yaml";
}

export function getStructuredSizeState(input: string) {
  const bytes = getByteSize(input);
  if (bytes > YAML_MAX_BYTES) {
    return {
      bytes,
      level: "error" as const,
      message: "Input exceeds the 5 MB processing limit.",
    };
  }
  if (bytes > YAML_WARNING_BYTES) {
    return {
      bytes,
      level: "warning" as const,
      message: "Large input may temporarily slow this browser tab.",
    };
  }
  return { bytes, level: "ok" as const, message: undefined };
}

function parseYamlDocuments(input: string): StructuredParseResult {
  let parsedDocuments: Document.Parsed<ParsedNode>[];
  try {
    parsedDocuments = parseAllDocuments(input, {
      logLevel: "silent",
      prettyErrors: true,
      schema: "core",
      uniqueKeys: true,
    });
  } catch (error) {
    return {
      ok: false,
      error: errorAt(
        input,
        error instanceof Error ? error.message : "Invalid YAML syntax",
      ),
    };
  }

  const parserError = parsedDocuments
    .flatMap((document) => document.errors)
    .at(0);
  if (parserError) {
    return { ok: false, error: yamlError(input, parserError) };
  }

  const unresolvedTag = parsedDocuments
    .flatMap((document) => document.warnings)
    .find((warning) => /unresolved tag/i.test(warning.message));
  if (unresolvedTag) {
    return { ok: false, error: yamlError(input, unresolvedTag) };
  }

  try {
    const documents = parsedDocuments.map((document) =>
      document.toJS({ maxAliasCount: YAML_MAX_ALIASES }),
    );
    documents.forEach((document) => assertJsonCompatible(document));
    return {
      ok: true,
      format: "yaml",
      documents,
      statistics: mergeStatistics(documents),
    };
  } catch (error) {
    return {
      ok: false,
      error: errorAt(
        input,
        error instanceof Error
          ? error.message
          : "YAML cannot be processed safely",
      ),
    };
  }
}

export function parseStructuredInput(
  input: string,
  format: StructuredFormat | "auto" = "auto",
): StructuredParseResult {
  if (!input.trim()) {
    return {
      ok: false,
      error: errorAt(input, "Paste YAML or JSON, or open a local file first"),
    };
  }

  const size = getStructuredSizeState(input);
  if (size.level === "error") {
    return { ok: false, error: errorAt(input, size.message) };
  }

  const resolvedFormat =
    format === "auto" ? detectStructuredFormat(input) : format;
  if (resolvedFormat === "yaml") return parseYamlDocuments(input);

  const result = parseJson(input);
  if (!result.ok) {
    return {
      ok: false,
      error: {
        message: result.error.message,
        line: result.error.line,
        column: result.error.column,
        contextLine: result.error.contextLine,
      },
    };
  }

  try {
    assertJsonCompatible(result.value);
    return {
      ok: true,
      format: "json",
      documents: [result.value],
      statistics: mergeStatistics([result.value]),
    };
  } catch (error) {
    return {
      ok: false,
      error: errorAt(
        input,
        error instanceof Error ? error.message : "JSON cannot be processed",
      ),
    };
  }
}

export function renderStructuredOutput(
  documents: JsonValue[],
  outputFormat: StructuredFormat,
  sortKeys = false,
) {
  const values = sortKeys ? documents.map(sortJsonKeys) : documents;
  if (outputFormat === "json") {
    return JSON.stringify(values.length === 1 ? values[0] : values, null, 2);
  }

  return values
    .map((value, index) => {
      const rendered = stringify(value, {
        indent: 2,
        lineWidth: 0,
        schema: "core",
      }).trimEnd();
      return values.length > 1 || index > 0 ? `---\n${rendered}` : rendered;
    })
    .join("\n");
}
