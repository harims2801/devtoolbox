export type DiffKind = "equal" | "added" | "removed";
export interface TextDiffLine {
  kind: DiffKind;
  text: string;
  oldLine?: number;
  newLine?: number;
}
export interface JsonDifference {
  path: string;
  kind: "added" | "removed" | "changed" | "type";
  before?: unknown;
  after?: unknown;
}

function normalize(
  value: string,
  ignoreWhitespace: boolean,
  ignoreCase: boolean,
) {
  let result = ignoreWhitespace ? value.replace(/\s+/g, " ").trim() : value;
  if (ignoreCase) result = result.toLocaleLowerCase();
  return result;
}

export function diffLines(
  original: string,
  modified: string,
  options: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {},
) {
  const a = original.split("\n"),
    b = modified.split("\n");
  if (a.length * b.length > 1_000_000)
    throw new Error(
      "This comparison is too large for the interactive diff. Reduce the inputs below 1,000 combined lines.",
    );
  const same = (x: string, y: string) =>
    normalize(x, !!options.ignoreWhitespace, !!options.ignoreCase) ===
    normalize(y, !!options.ignoreWhitespace, !!options.ignoreCase);
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i]![j] = same(a[i]!, b[j]!)
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const lines: TextDiffLine[] = [];
  let i = 0,
    j = 0,
    oldLine = 1,
    newLine = 1;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && same(a[i]!, b[j]!)) {
      lines.push({
        kind: "equal",
        text: b[j]!,
        oldLine: oldLine++,
        newLine: newLine++,
      });
      i++;
      j++;
    } else if (
      j < b.length &&
      (i === a.length || table[i]![j + 1]! >= table[i + 1]![j]!)
    ) {
      lines.push({ kind: "added", text: b[j++]!, newLine: newLine++ });
    } else {
      lines.push({ kind: "removed", text: a[i++]!, oldLine: oldLine++ });
    }
  }
  return lines;
}

export function diffStats(lines: TextDiffLine[]) {
  const added = lines.filter((x) => x.kind === "added").length,
    removed = lines.filter((x) => x.kind === "removed").length;
  let changed = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const pair = `${lines[i]!.kind}:${lines[i + 1]!.kind}`;
    if (pair === "removed:added" || pair === "added:removed") {
      changed++;
      i++;
    }
  }
  return { added: added - changed, removed: removed - changed, changed };
}

export function unifiedDiff(original: string, modified: string, options = {}) {
  return [
    "--- original",
    "+++ modified",
    "@@ -1 +1 @@",
    ...diffLines(original, modified, options).map(
      (line) =>
        `${line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "}${line.text}`,
    ),
  ].join("\n");
}

export function diffWords(original: string, modified: string, options = {}) {
  return diffLines(
    original.split(/(\s+)/).join("\n"),
    modified.split(/(\s+)/).join("\n"),
    options,
  );
}

function valueType(value: unknown) {
  return value === null
    ? "null"
    : Array.isArray(value)
      ? "array"
      : typeof value;
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).sort().join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function diffJson(
  originalText: string,
  modifiedText: string,
  options: { unorderedArrays?: boolean; ignoredPaths?: string[] } = {},
) {
  let original: unknown, modified: unknown;
  try {
    original = JSON.parse(originalText);
  } catch {
    throw new Error("Original is not valid JSON.");
  }
  try {
    modified = JSON.parse(modifiedText);
  } catch {
    throw new Error("Modified is not valid JSON.");
  }
  const ignored = new Set(
    options.ignoredPaths?.map((x) => x.trim()).filter(Boolean),
  );
  const differences: JsonDifference[] = [];
  function walk(before: unknown, after: unknown, path: string) {
    if (ignored.has(path)) return;
    const beforeType = valueType(before),
      afterType = valueType(after);
    if (beforeType !== afterType) {
      differences.push({ path: path || "$", kind: "type", before, after });
      return;
    }
    if (Array.isArray(before) && Array.isArray(after)) {
      if (options.unorderedArrays) {
        if (stable(before) !== stable(after))
          differences.push({
            path: path || "$",
            kind: "changed",
            before,
            after,
          });
        return;
      }
      const max = Math.max(before.length, after.length);
      for (let i = 0; i < max; i++) {
        const next = `${path}[${i}]`;
        if (i >= before.length)
          differences.push({ path: next, kind: "added", after: after[i] });
        else if (i >= after.length)
          differences.push({ path: next, kind: "removed", before: before[i] });
        else walk(before[i], after[i], next);
      }
      return;
    }
    if (
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object"
    ) {
      const a = before as Record<string, unknown>,
        b = after as Record<string, unknown>;
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const next = path ? `${path}.${key}` : key;
        if (!(key in a))
          differences.push({ path: next, kind: "added", after: b[key] });
        else if (!(key in b))
          differences.push({ path: next, kind: "removed", before: a[key] });
        else walk(a[key], b[key], next);
      }
      return;
    }
    if (!Object.is(before, after))
      differences.push({ path: path || "$", kind: "changed", before, after });
  }
  walk(original, modified, "");
  return differences;
}

export function jsonDiffReport(differences: JsonDifference[]) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      differenceCount: differences.length,
      differences,
    },
    null,
    2,
  );
}
