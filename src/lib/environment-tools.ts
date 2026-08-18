import YAML from "yaml";
export type EnvironmentFormat =
  "env" | "json" | "yaml" | "shell" | "docker" | "configmap" | "secret";
export interface EnvironmentEntry {
  key: string;
  value: string;
  line?: number;
}
export interface EnvironmentParseResult {
  entries: EnvironmentEntry[];
  duplicates: string[];
  errors: string[];
  comments: string[];
}
export const DEFAULT_SENSITIVE_PATTERN =
  "password|secret|token|api[_-]?key|private[_-]?key|connection[_-]?string|credential";

function unquote(value: string) {
  if (
    value.length >= 2 &&
    value[0] === value.at(-1) &&
    ['"', "'"].includes(value[0]!)
  ) {
    const body = value.slice(1, -1);
    return value[0] === '"'
      ? body
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
      : body;
  }
  return value.replace(/\s+#.*$/, "").trim();
}
export function parseDotEnv(source: string): EnvironmentParseResult {
  const entries: EnvironmentEntry[] = [],
    duplicates: string[] = [],
    errors: string[] = [],
    comments: string[] = [];
  const seen = new Set<string>();
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith("#")) {
      comments.push(line.slice(1).trim());
      return;
    }
    const normalized = line.replace(/^export\s+/, "");
    const match = /^([^=\s]+)\s*=\s*(.*)$/.exec(normalized);
    if (!match) {
      errors.push(`Line ${index + 1}: expected NAME=value.`);
      return;
    }
    const key = match[1]!;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
      errors.push(`Line ${index + 1}: invalid variable name “${key}”.`);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    entries.push({ key, value: unquote(match[2]!), line: index + 1 });
  });
  return { entries, duplicates: [...new Set(duplicates)], errors, comments };
}
function scalarEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "Input must contain an object of environment keys and scalar values.",
    );
  return Object.entries(value as Record<string, unknown>).map(
    ([key, item]) => ({
      key,
      value:
        item === null
          ? ""
          : typeof item === "object"
            ? JSON.stringify(item)
            : String(item),
    }),
  );
}
export function parseEnvironment(
  source: string,
  format: EnvironmentFormat,
): EnvironmentParseResult {
  if (format === "env" || format === "shell") return parseDotEnv(source);
  try {
    const value = format === "json" ? JSON.parse(source) : YAML.parse(source);
    let entries: EnvironmentEntry[];
    if (format === "docker") {
      const list = Array.isArray(value)
        ? value
        : (value as { environment?: unknown })?.environment;
      if (Array.isArray(list)) return parseDotEnv(list.join("\n"));
      entries = scalarEntries(list);
    } else if (format === "configmap" || format === "secret")
      entries = scalarEntries((value as { data?: unknown })?.data);
    else entries = scalarEntries(value);
    const invalid = entries
      .filter((x) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(x.key))
      .map((x) => `Invalid variable name “${x.key}”.`);
    return { entries, duplicates: [], errors: invalid, comments: [] };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not parse environment input.",
    );
  }
}
function quoteEnv(value: string) {
  return value === ""
    ? ""
    : /\s|#|["'\\]/.test(value)
      ? JSON.stringify(value)
      : value;
}
function utf8Base64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function convertEnvironment(
  entries: EnvironmentEntry[],
  format: EnvironmentFormat,
  options: { sort?: boolean; name?: string } = {},
) {
  const values = options.sort
    ? [...entries].sort((a, b) => a.key.localeCompare(b.key))
    : entries;
  const object = Object.fromEntries(values.map((x) => [x.key, x.value]));
  switch (format) {
    case "env":
      return values.map((x) => `${x.key}=${quoteEnv(x.value)}`).join("\n");
    case "json":
      return JSON.stringify(object, null, 2);
    case "yaml":
      return YAML.stringify(object);
    case "shell":
      return values
        .map((x) => `export ${x.key}=${quoteEnv(x.value)}`)
        .join("\n");
    case "docker":
      return YAML.stringify({
        environment: values.map((x) => `${x.key}=${x.value}`),
      });
    case "configmap":
      return YAML.stringify({
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: { name: options.name || "app-config" },
        data: object,
      });
    case "secret":
      return YAML.stringify({
        apiVersion: "v1",
        kind: "Secret",
        type: "Opaque",
        metadata: { name: options.name || "app-secret" },
        data: Object.fromEntries(
          values.map((x) => [x.key, utf8Base64(x.value)]),
        ),
      });
  }
}
export function maskEnvironment(
  entries: EnvironmentEntry[],
  pattern = DEFAULT_SENSITIVE_PATTERN,
) {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, "i");
  } catch {
    throw new Error("Sensitive-key pattern is not a valid regular expression.");
  }
  return entries.map((entry) =>
    regex.test(entry.key)
      ? { ...entry, value: entry.value ? "••••••••" : "" }
      : entry,
  );
}
