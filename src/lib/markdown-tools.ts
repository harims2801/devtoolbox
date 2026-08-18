import { Renderer, marked } from "@/vendor/marked/marked";

export const MARKDOWN_MAX_BYTES = 1_000_000;

const allowedTags = new Set([
  "A",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "DEL",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HR",
  "INPUT",
  "LI",
  "OL",
  "P",
  "PRE",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);

const allowedAttributes: Record<string, Set<string>> = {
  A: new Set(["href", "rel", "target", "title"]),
  CODE: new Set(["class"]),
  IMG: new Set(["alt", "src", "title"]),
  INPUT: new Set(["checked", "disabled", "type"]),
  OL: new Set(["start"]),
  TD: new Set(["align"]),
  TH: new Set(["align"]),
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeLink(href: string) {
  const value = href.trim();
  if (
    value.startsWith("#") ||
    value.startsWith("/") ||
    value.startsWith("./")
  ) {
    return value;
  }
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export interface MarkdownRenderOptions {
  allowRemoteImages?: boolean;
}

export interface MarkdownRenderResult {
  html: string;
  blockedImages: number;
}

export function renderMarkdown(
  markdown: string,
  { allowRemoteImages = false }: MarkdownRenderOptions = {},
): MarkdownRenderResult {
  if (!markdown) return { html: "", blockedImages: 0 };

  let blockedImages = 0;
  const renderer = new Renderer();
  renderer.html = ({ text }) => escapeHtml(text);
  renderer.link = function ({ href, title, tokens }) {
    const label = this.parser.parseInline(tokens);
    const safeHref = safeLink(href);
    if (!safeHref) return label;
    const external = /^https?:/i.test(safeHref);
    return `<a href="${escapeHtml(safeHref)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer external"' : ""}>${label}</a>`;
  };
  renderer.image = ({ href, text }) => {
    let remote: URL | undefined;
    try {
      remote = new URL(href);
    } catch {
      // Relative and malformed image sources stay disabled.
    }
    if (!allowRemoteImages || remote?.protocol !== "https:") {
      blockedImages += 1;
      return `<span>[Image blocked: ${escapeHtml(text || "image")}]</span>`;
    }
    return `<img src="${escapeHtml(remote.href)}" alt="${escapeHtml(text)}">`;
  };

  const parsed = marked(markdown, { gfm: true, renderer });
  if (typeof parsed !== "string") {
    throw new Error("Asynchronous Markdown extensions are not supported");
  }

  return {
    html: sanitizeMarkdownHtml(parsed, allowRemoteImages),
    blockedImages,
  };
}

export function sanitizeMarkdownHtml(html: string, allowRemoteImages = false) {
  if (typeof DOMParser === "undefined") return "";
  const document = new DOMParser().parseFromString(html, "text/html");

  for (const node of Array.from(document.body.querySelectorAll("*"))) {
    if (
      !allowedTags.has(node.tagName) &&
      !(allowRemoteImages && node.tagName === "IMG")
    ) {
      node.replaceWith(...Array.from(node.childNodes));
      continue;
    }
    for (const attribute of Array.from(node.attributes)) {
      if (!allowedAttributes[node.tagName]?.has(attribute.name)) {
        node.removeAttribute(attribute.name);
      }
    }
    if (node instanceof HTMLAnchorElement) {
      const href = safeLink(node.getAttribute("href") ?? "");
      if (!href) {
        node.removeAttribute("href");
        node.removeAttribute("target");
        node.removeAttribute("rel");
      } else if (/^https?:/i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer external");
      }
    }
    if (node instanceof HTMLInputElement) {
      node.type = "checkbox";
      node.disabled = true;
    }
    if (node instanceof HTMLImageElement) {
      try {
        const source = new URL(node.src);
        if (!allowRemoteImages || source.protocol !== "https:") node.remove();
      } catch {
        node.remove();
      }
    }
  }

  return document.body.innerHTML;
}
