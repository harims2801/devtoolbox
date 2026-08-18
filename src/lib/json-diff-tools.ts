export type JsonDiffKind = "added" | "removed" | "changed" | "type-changed";

export interface JsonDifference {
  path: string;
  kind: JsonDiffKind;
  before?: unknown;
  after?: unknown;
}

export interface JsonValidationError {
  label: string;
  message: string;
  line: number;
  column: number;
  position: number;
}

export interface JsonDiffResult {
  differences: JsonDifference[];
  summary: Record<JsonDiffKind, number>;
  patch: JsonPatchOperation[] | null;
  patchUnavailableReason?: string;
}

export type JsonPatchOperation =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown };

export class JsonDocumentError extends Error {
  detail: JsonValidationError;

  constructor(detail: JsonValidationError) {
    super(
      `${detail.label}: ${detail.message} (line ${detail.line}, column ${detail.column})`,
    );
    this.detail = detail;
  }
}

function location(text: string, error: Error) {
  const positionMatch = /position\s+(\d+)/i.exec(error.message),
    lineColumnMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(error.message);
  let position = positionMatch ? Number(positionMatch[1]) : 0;
  if (!positionMatch && lineColumnMatch) {
    const targetLine = Number(lineColumnMatch[1]),
      targetColumn = Number(lineColumnMatch[2]),
      lines = text.split("\n");
    position =
      lines
        .slice(0, targetLine - 1)
        .reduce((sum, line) => sum + line.length + 1, 0) +
      targetColumn -
      1;
  }
  if (!positionMatch && !lineColumnMatch) {
    const unexpected = /Unexpected token '([^']+)'/i.exec(error.message);
    if (unexpected) position = Math.max(0, text.lastIndexOf(unexpected[1]!));
    else if (/Unexpected end/i.test(error.message)) position = text.length;
  }
  const before = text.slice(0, Math.max(0, position)),
    lines = before.split("\n");
  return { position, line: lines.length, column: lines.at(-1)!.length + 1 };
}

export function parseJsonDocument(text: string, label: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error("Invalid JSON"),
      where = location(text, error);
    throw new JsonDocumentError({
      label,
      message: error.message.replace(/\s+at position\s+\d+.*/i, ""),
      ...where,
    });
  }
}

function typeOf(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function escapePointer(value: string) {
  return value.replace(/~/g, "~0").replace(/\//g, "~1");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).sort().join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function compareJsonValues(
  before: unknown,
  after: unknown,
  options: { unorderedArrays?: boolean } = {},
): JsonDiffResult {
  const differences: JsonDifference[] = [];

  function walk(left: unknown, right: unknown, path: string) {
    const leftType = typeOf(left),
      rightType = typeOf(right);
    if (leftType !== rightType) {
      differences.push({
        path,
        kind: "type-changed",
        before: left,
        after: right,
      });
      return;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      if (options.unorderedArrays) {
        if (stable(left) !== stable(right))
          differences.push({
            path,
            kind: "changed",
            before: left,
            after: right,
          });
        return;
      }
      const shared = Math.min(left.length, right.length);
      for (let index = 0; index < shared; index++)
        walk(left[index], right[index], `${path}/${index}`);
      for (let index = left.length - 1; index >= right.length; index--)
        differences.push({
          path: `${path}/${index}`,
          kind: "removed",
          before: left[index],
        });
      for (let index = left.length; index < right.length; index++)
        differences.push({
          path: `${path}/${index}`,
          kind: "added",
          after: right[index],
        });
      return;
    }
    if (left !== null && typeof left === "object") {
      const leftObject = left as Record<string, unknown>,
        rightObject = right as Record<string, unknown>;
      for (const key of Object.keys(leftObject)) {
        const next = `${path}/${escapePointer(key)}`;
        if (!Object.hasOwn(rightObject, key))
          differences.push({
            path: next,
            kind: "removed",
            before: leftObject[key],
          });
        else walk(leftObject[key], rightObject[key], next);
      }
      for (const key of Object.keys(rightObject))
        if (!Object.hasOwn(leftObject, key))
          differences.push({
            path: `${path}/${escapePointer(key)}`,
            kind: "added",
            after: rightObject[key],
          });
      return;
    }
    if (!Object.is(left, right))
      differences.push({ path, kind: "changed", before: left, after: right });
  }

  walk(before, after, "");
  const summary = {
    added: 0,
    removed: 0,
    changed: 0,
    "type-changed": 0,
  } satisfies Record<JsonDiffKind, number>;
  for (const difference of differences) summary[difference.kind]++;
  const patch = options.unorderedArrays
    ? null
    : differences.map((difference): JsonPatchOperation => {
        if (difference.kind === "added")
          return { op: "add", path: difference.path, value: difference.after };
        if (difference.kind === "removed")
          return { op: "remove", path: difference.path };
        return {
          op: "replace",
          path: difference.path,
          value: difference.after,
        };
      });
  return {
    differences,
    summary,
    patch,
    patchUnavailableReason: options.unorderedArrays
      ? "JSON Patch is disabled because unordered-array comparison intentionally ignores array positions."
      : undefined,
  };
}

export function compareJsonDocuments(
  beforeText: string,
  afterText: string,
  options: { unorderedArrays?: boolean } = {},
) {
  const before = parseJsonDocument(beforeText, "Original"),
    after = parseJsonDocument(afterText, "Modified");
  return compareJsonValues(before, after, options);
}

export function jsonDiffReport(result: JsonDiffResult) {
  return JSON.stringify(
    {
      summary: result.summary,
      differences: result.differences,
      jsonPatch: result.patch,
      patchUnavailableReason: result.patchUnavailableReason,
    },
    null,
    2,
  );
}
