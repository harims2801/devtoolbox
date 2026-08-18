export const XML_MAX_BYTES = 5 * 1024 * 1024;

export interface XmlProcessingError {
  message: string;
  line?: number;
  column?: number;
  contextLine?: string;
}

export type XmlProcessingResult =
  { ok: true; output: string } | { ok: false; error: XmlProcessingError };

function byteSize(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function findPosition(input: string, offset: number) {
  const before = input.slice(0, Math.max(0, offset));
  const lines = before.split(/\r?\n/);
  const line = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;
  return { line, column, contextLine: input.split(/\r?\n/)[line - 1] ?? "" };
}

function parserError(
  input: string,
  document: XMLDocument,
): XmlProcessingError | undefined {
  const error = document.querySelector("parsererror");
  if (!error) return undefined;
  const raw =
    error.textContent?.replace(/\s+/g, " ").trim() || "Malformed XML.";
  const location = raw.match(
    /(?:line|Line)\s*(?:Number\s*)?(\d+)[^\d]+(?:column|Column)\s*(\d+)/,
  );
  if (location) {
    const line = Number(location[1]);
    const column = Number(location[2]);
    return {
      message: `Malformed XML near line ${line}, column ${column}.`,
      line,
      column,
      contextLine: input.split(/\r?\n/)[line - 1] ?? "",
    };
  }
  const offset = input.search(/<[^>]*$/m);
  return {
    message: "Malformed XML. Check tag nesting, attributes, and entities.",
    ...findPosition(input, offset < 0 ? 0 : offset),
  };
}

function parseXml(
  input: string,
): XmlProcessingResult | { ok: true; document: XMLDocument } {
  if (!input.trim())
    return { ok: false, error: { message: "Enter XML to process." } };
  if (byteSize(input) > XML_MAX_BYTES)
    return {
      ok: false,
      error: { message: "XML exceeds the 5 MB processing limit." },
    };
  if (/<!DOCTYPE\b|<!ENTITY\b/i.test(input))
    return {
      ok: false,
      error: {
        message:
          "DOCTYPE and entity declarations are blocked for safe local parsing.",
      },
    };
  const document = new DOMParser().parseFromString(input, "application/xml");
  const error = parserError(input, document);
  return error ? { ok: false, error } : { ok: true, document };
}

function hasMixedContent(node: Element) {
  let hasText = false;
  let hasElement = false;
  node.childNodes.forEach((child) => {
    if (child.nodeType === 1) hasElement = true;
    if (child.nodeType === 3 && child.textContent?.trim()) hasText = true;
  });
  return hasText && hasElement;
}

function prettyNode(node: Node, depth: number, indent: string): string {
  const pad = indent.repeat(depth);
  if (node.nodeType === 1) {
    const element = node as Element;
    if (!element.childNodes.length || hasMixedContent(element))
      return `${pad}${new XMLSerializer().serializeToString(element)}`;
    const opening = `<${element.tagName}${[...element.attributes]
      .map(
        (attribute) =>
          ` ${attribute.name}="${attribute.value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`,
      )
      .join("")}>`;
    const children = [...element.childNodes]
      .filter((child) => child.nodeType !== 3 || child.textContent?.trim())
      .map((child) => prettyNode(child, depth + 1, indent));
    return `${pad}${opening}\n${children.join("\n")}\n${pad}</${element.tagName}>`;
  }
  if (node.nodeType === 3) return `${pad}${node.textContent?.trim() ?? ""}`;
  return `${pad}${new XMLSerializer().serializeToString(node)}`;
}

export function formatXml(
  input: string,
  indentation: 2 | 4 = 2,
): XmlProcessingResult {
  const parsed = parseXml(input);
  if (!parsed.ok || !("document" in parsed)) return parsed;
  const indent = " ".repeat(indentation);
  const declaration = input.trimStart().match(/^<\?xml\s[^?]*\?>/i)?.[0];
  const body = [...parsed.document.childNodes]
    .filter((node) => node.nodeType !== 3 || node.textContent?.trim())
    .map((node) => prettyNode(node, 0, indent))
    .join("\n");
  const output = declaration ? `${declaration}\n${body}` : body;
  return { ok: true, output };
}

export function minifyXml(input: string): XmlProcessingResult {
  const parsed = parseXml(input);
  if (!parsed.ok || !("document" in parsed)) return parsed;
  const clone = parsed.document.cloneNode(true) as XMLDocument;
  const removeWhitespace = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3 && !child.textContent?.trim()) child.remove();
      else removeWhitespace(child);
    });
  };
  removeWhitespace(clone);
  const declaration = input.trimStart().match(/^<\?xml\s[^?]*\?>/i)?.[0];
  const body = new XMLSerializer().serializeToString(clone);
  return { ok: true, output: declaration ? `${declaration}${body}` : body };
}

export function validateXml(input: string): XmlProcessingResult {
  const parsed = parseXml(input);
  return parsed.ok ? { ok: true, output: input } : parsed;
}
