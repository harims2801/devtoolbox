export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonIndentation = 2 | 4 | "tab";

export const JSON_WARNING_BYTES = 1_000_000;
export const JSON_MAX_BYTES = 5_000_000;

export interface JsonParseError {
  message: string;
  position: number;
  line: number;
  column: number;
  contextLine: string;
}

export type JsonParseResult =
  { ok: true; value: JsonValue } | { ok: false; error: JsonParseError };

export interface JsonStatistics {
  objectCount: number;
  arrayCount: number;
  keyCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  maximumDepth: number;
}

export interface JsonSearchMatch {
  path: string;
  value: JsonValue;
}

export function getByteSize(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function formatByteSize(bytes: number) {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

export function getJsonSizeState(input: string) {
  const bytes = getByteSize(input);

  if (bytes > JSON_MAX_BYTES) {
    return {
      bytes,
      level: "error" as const,
      message: `Input exceeds the ${formatByteSize(JSON_MAX_BYTES)} processing limit.`,
    };
  }

  if (bytes > JSON_WARNING_BYTES) {
    return {
      bytes,
      level: "warning" as const,
      message:
        "Large JSON may take longer to process and can temporarily slow this browser tab.",
    };
  }

  return { bytes, level: "ok" as const, message: undefined };
}

function positionFromLineColumn(input: string, line: number, column: number) {
  const lines = input.split("\n");
  let position = 0;

  for (let index = 0; index < line - 1; index += 1) {
    position += (lines[index]?.length ?? 0) + 1;
  }

  return Math.min(position + Math.max(column - 1, 0), input.length);
}

function lineColumnFromPosition(input: string, position: number) {
  const prefix = input.slice(0, position);
  const lines = prefix.split("\n");

  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function createParseError(input: string, error: unknown): JsonParseError {
  const originalMessage =
    error instanceof Error ? error.message : "Invalid JSON syntax";
  const positionMatch = originalMessage.match(/position\s+(\d+)/i);
  const lineColumnMatch = originalMessage.match(
    /line\s+(\d+)\s+column\s+(\d+)/i,
  );
  const providedLine = lineColumnMatch
    ? Number.parseInt(lineColumnMatch[1] ?? "1", 10)
    : undefined;
  const providedColumn = lineColumnMatch
    ? Number.parseInt(lineColumnMatch[2] ?? "1", 10)
    : undefined;
  const position = positionMatch
    ? Math.min(Number.parseInt(positionMatch[1] ?? "0", 10), input.length)
    : providedLine && providedColumn
      ? positionFromLineColumn(input, providedLine, providedColumn)
      : input.length;
  const calculated = lineColumnFromPosition(input, position);
  const line = providedLine ?? calculated.line;
  const column = providedColumn ?? calculated.column;
  const contextLine = input.split("\n")[line - 1] ?? "";
  const cleanMessage = originalMessage
    .replace(/\s+at position\s+\d+.*$/i, "")
    .replace(/\s+at line\s+\d+\s+column\s+\d+.*$/i, "");

  return {
    message: `${cleanMessage || "Invalid JSON syntax"} (line ${line}, column ${column})`,
    position,
    line,
    column,
    contextLine,
  };
}

export function parseJson(input: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(input) as JsonValue };
  } catch (error) {
    return { ok: false, error: createParseError(input, error) };
  }
}

function indentationValue(indentation: JsonIndentation) {
  return indentation === "tab" ? "\t" : indentation;
}

export function formatJson(value: JsonValue, indentation: JsonIndentation = 2) {
  return JSON.stringify(value, null, indentationValue(indentation));
}

export function minifyJson(value: JsonValue) {
  return JSON.stringify(value);
}

export function sortJsonKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJsonKeys(item)]),
    );
  }

  return value;
}

export function calculateJsonStatistics(value: JsonValue): JsonStatistics {
  const statistics: JsonStatistics = {
    objectCount: 0,
    arrayCount: 0,
    keyCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    maximumDepth: 0,
  };

  function visit(item: JsonValue, depth: number) {
    statistics.maximumDepth = Math.max(statistics.maximumDepth, depth);

    if (item === null) {
      statistics.nullCount += 1;
    } else if (Array.isArray(item)) {
      statistics.arrayCount += 1;
      item.forEach((child) => visit(child, depth + 1));
    } else if (typeof item === "object") {
      statistics.objectCount += 1;
      const entries = Object.entries(item);
      statistics.keyCount += entries.length;
      entries.forEach(([, child]) => visit(child, depth + 1));
    } else if (typeof item === "string") {
      statistics.stringCount += 1;
    } else if (typeof item === "number") {
      statistics.numberCount += 1;
    } else if (typeof item === "boolean") {
      statistics.booleanCount += 1;
    }
  }

  visit(value, 1);
  return statistics;
}

export function searchJson(value: JsonValue, query: string): JsonSearchMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const matches: JsonSearchMatch[] = [];

  function visit(item: JsonValue, path: string) {
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }

    if (item !== null && typeof item === "object") {
      Object.entries(item).forEach(([key, child]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (key.toLocaleLowerCase().includes(normalizedQuery)) {
          matches.push({ path: childPath, value: child });
        }
        visit(child, childPath);
      });
      return;
    }

    if (String(item).toLocaleLowerCase().includes(normalizedQuery)) {
      matches.push({ path: path || "$", value: item });
    }
  }

  visit(value, "");
  return matches.filter(
    (match, index, allMatches) =>
      allMatches.findIndex(
        (candidate) =>
          candidate.path === match.path && candidate.value === match.value,
      ) === index,
  );
}
