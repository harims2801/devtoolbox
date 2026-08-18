import type { JsonValue } from "@/lib/json-tools";

function primitiveLabel(value: JsonValue) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function Highlight({
  children,
  matches,
}: {
  children: string;
  matches: boolean;
}) {
  return matches ? (
    <mark className="rounded px-0.5">{children}</mark>
  ) : (
    children
  );
}

function TreeNode({
  value,
  label,
  query,
  depth,
}: {
  value: JsonValue;
  label?: string;
  query: string;
  depth: number;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const labelMatches = Boolean(
    normalizedQuery && label?.toLocaleLowerCase().includes(normalizedQuery),
  );

  if (Array.isArray(value)) {
    return (
      <li>
        <details open={depth < 2 || Boolean(query.trim())}>
          <summary className="cursor-pointer py-0.5">
            {label ? (
              <>
                <Highlight matches={labelMatches}>{label}</Highlight>
                <span>: </span>
              </>
            ) : null}
            <span className="text-muted-foreground">Array({value.length})</span>
          </summary>
          <ul className="ml-5 border-l pl-3">
            {value.map((item, index) => (
              <TreeNode
                depth={depth + 1}
                key={index}
                label={String(index)}
                query={query}
                value={item}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <li>
        <details open={depth < 2 || Boolean(query.trim())}>
          <summary className="cursor-pointer py-0.5">
            {label ? (
              <>
                <Highlight matches={labelMatches}>{label}</Highlight>
                <span>: </span>
              </>
            ) : null}
            <span className="text-muted-foreground">
              Object({entries.length})
            </span>
          </summary>
          <ul className="ml-5 border-l pl-3">
            {entries.map(([key, item]) => (
              <TreeNode
                depth={depth + 1}
                key={key}
                label={key}
                query={query}
                value={item}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  }

  const renderedValue = primitiveLabel(value);
  const valueMatches = Boolean(
    normalizedQuery &&
    renderedValue.toLocaleLowerCase().includes(normalizedQuery),
  );

  return (
    <li className="py-0.5">
      {label ? (
        <>
          <Highlight matches={labelMatches}>{label}</Highlight>
          <span>: </span>
        </>
      ) : null}
      <Highlight matches={valueMatches}>{renderedValue}</Highlight>
    </li>
  );
}

export function JsonTreeView({
  value,
  query = "",
}: {
  value: JsonValue;
  query?: string;
}) {
  return (
    <ul className="font-mono text-sm leading-6">
      <TreeNode depth={0} query={query} value={value} />
    </ul>
  );
}
