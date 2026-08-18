export const SQL_MAX_BYTES = 5 * 1024 * 1024;

export type SqlDialect =
  "standard" | "postgresql" | "mysql" | "sqlite" | "sqlserver" | "bigquery";
export type SqlKeywordCase = "upper" | "lower" | "preserve";

interface Token {
  value: string;
  kind:
    | "word"
    | "string"
    | "comment"
    | "number"
    | "operator"
    | "punctuation"
    | "placeholder";
}
export type SqlResult =
  { ok: true; output: string } | { ok: false; error: string };

const keywords = new Set(
  `select from where and or not as distinct all with recursive insert into values update set delete create alter drop table view index join inner left right full outer cross on using group by order having limit offset fetch union intersect except case when then else end is null like ilike in exists between asc desc returning over partition window qualify merge call grant revoke primary key foreign references constraint default check begin commit rollback`.split(
    " ",
  ),
);
const lineKeywords = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "FETCH",
  "VALUES",
  "SET",
  "RETURNING",
  "UNION",
  "INTERSECT",
  "EXCEPT",
  "WITH",
  "QUALIFY",
]);
const joinKeywords = new Set([
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "CROSS JOIN",
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
]);
const compoundKeywords = [
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
  "GROUP BY",
  "ORDER BY",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "CROSS JOIN",
  "UNION ALL",
  "PRIMARY KEY",
  "FOREIGN KEY",
];

function size(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function tokenize(input: string): SqlResult | { ok: true; tokens: Token[] } {
  if (!input.trim()) return { ok: false, error: "Enter SQL to format." };
  if (size(input) > SQL_MAX_BYTES)
    return { ok: false, error: "SQL exceeds the 5 MB processing limit." };
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const rest = input.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    if (rest.startsWith("--")) {
      const end = rest.indexOf("\n");
      const value = end < 0 ? rest : rest.slice(0, end);
      tokens.push({ value, kind: "comment" });
      index += value.length;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = rest.indexOf("*/", 2);
      if (end < 0) return { ok: false, error: "Unterminated block comment." };
      const value = rest.slice(0, end + 2);
      tokens.push({ value, kind: "comment" });
      index += value.length;
      continue;
    }
    const quote = rest[0];
    if (quote === "'" || quote === '"' || quote === "`") {
      let end = 1;
      while (end < rest.length) {
        if (rest[end] === quote) {
          if (rest[end + 1] === quote) {
            end += 2;
            continue;
          }
          break;
        }
        if (rest[end] === "\\" && quote !== '"') end += 2;
        else end += 1;
      }
      if (end >= rest.length)
        return { ok: false, error: "Unterminated quoted value or identifier." };
      const value = rest.slice(0, end + 1);
      tokens.push({ value, kind: "string" });
      index += value.length;
      continue;
    }
    if (quote === "[") {
      const end = rest.indexOf("]", 1);
      if (end < 0)
        return { ok: false, error: "Unterminated bracketed identifier." };
      const value = rest.slice(0, end + 1);
      tokens.push({ value, kind: "string" });
      index += value.length;
      continue;
    }
    const placeholder = rest.match(/^(?:\$\d+|[:@][A-Za-z_][\w$]*|\?)/);
    if (placeholder) {
      tokens.push({ value: placeholder[0], kind: "placeholder" });
      index += placeholder[0].length;
      continue;
    }
    const word = rest.match(/^[A-Za-z_][\w$]*/);
    if (word) {
      tokens.push({ value: word[0], kind: "word" });
      index += word[0].length;
      continue;
    }
    const number = rest.match(/^\d+(?:\.\d+)?/);
    if (number) {
      tokens.push({ value: number[0], kind: "number" });
      index += number[0].length;
      continue;
    }
    const operator = rest.match(/^(?:<>|!=|<=|>=|::|->>|->|\|\||[-+*/%=<>])/);
    if (operator) {
      tokens.push({ value: operator[0], kind: "operator" });
      index += operator[0].length;
      continue;
    }
    if (",;().".includes(rest[0]!)) {
      tokens.push({ value: rest[0]!, kind: "punctuation" });
      index += 1;
      continue;
    }
    tokens.push({ value: rest[0]!, kind: "operator" });
    index += 1;
  }
  return { ok: true, tokens };
}

function combine(tokens: Token[]) {
  const combined: Token[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    let matched = false;
    for (const phrase of compoundKeywords) {
      const parts = phrase.split(" ");
      const values = tokens
        .slice(index, index + parts.length)
        .map((token) => token.value.toUpperCase());
      if (values.join(" ") === phrase) {
        combined.push({ value: phrase, kind: "word" });
        index += parts.length - 1;
        matched = true;
        break;
      }
    }
    if (!matched) combined.push(tokens[index]!);
  }
  return combined;
}

function applyCase(token: Token, keywordCase: SqlKeywordCase) {
  if (
    token.kind !== "word" ||
    !token.value
      .split(" ")
      .every((part) => keywords.has(part.toLowerCase()) || part === "OUTER")
  )
    return token.value;
  return keywordCase === "upper"
    ? token.value.toUpperCase()
    : keywordCase === "lower"
      ? token.value.toLowerCase()
      : token.value;
}

function needsSpace(previous: string, current: string) {
  if (
    !previous ||
    current === "," ||
    current === ";" ||
    current === ")" ||
    current === "."
  )
    return false;
  if (previous.endsWith("(") || previous.endsWith(".")) return false;
  return true;
}

export function formatSql(
  input: string,
  options: {
    dialect?: SqlDialect;
    indentation?: 2 | 4;
    keywordCase?: SqlKeywordCase;
    minify?: boolean;
  } = {},
): SqlResult {
  const parsed = tokenize(input);
  if (!parsed.ok || !("tokens" in parsed)) return parsed;
  const { indentation = 2, keywordCase = "upper", minify = false } = options;
  const tokens = combine(parsed.tokens);
  if (minify) {
    let output = "";
    for (const token of tokens) {
      const value = applyCase(token, keywordCase);
      if (token.kind === "comment")
        output += `${output ? " " : ""}${value}${value.startsWith("--") ? "\n" : ""}`;
      else output += `${needsSpace(output, value) ? " " : ""}${value}`;
    }
    return { ok: true, output: output.trim() };
  }
  const lines: string[] = [];
  let line = "";
  let depth = 0;
  const flush = () => {
    if (line.trim())
      lines.push(`${" ".repeat(depth * indentation)}${line.trim()}`);
    line = "";
  };
  for (const token of tokens) {
    const upper = token.value.toUpperCase();
    const value = applyCase(token, keywordCase);
    if (token.kind === "comment") {
      flush();
      lines.push(`${" ".repeat(depth * indentation)}${value}`);
      continue;
    }
    if (upper === ")") {
      flush();
      depth = Math.max(0, depth - 1);
      line = `${" ".repeat(depth * indentation)})`;
      continue;
    }
    if (upper === "(") {
      line += `${needsSpace(line, value) ? " " : ""}(`;
      flush();
      depth += 1;
      continue;
    }
    if (lineKeywords.has(upper) || joinKeywords.has(upper) || upper === "ON") {
      flush();
      line = value;
      continue;
    }
    if (upper === ",") {
      line += ",";
      if (depth > 0) flush();
      continue;
    }
    if (upper === ";") {
      line += ";";
      flush();
      continue;
    }
    line += `${needsSpace(line, value) ? " " : ""}${value}`;
  }
  flush();
  return { ok: true, output: lines.join("\n") };
}
