import {
  BadgeCheck,
  Binary,
  BookOpenCheck,
  Boxes,
  Braces,
  CalendarClock,
  CalendarDays,
  CaseSensitive,
  Clock3,
  CodeXml,
  Container,
  Database,
  Dices,
  Eye,
  FileCode2,
  FileCog,
  FileJson,
  Fingerprint,
  GitCompareArrows,
  Globe2,
  Hash,
  KeyRound,
  Link2,
  ListFilter,
  ListTree,
  LockKeyhole,
  MonitorSmartphone,
  Network,
  Pilcrow,
  Radar,
  Regex,
  ScanSearch,
  ScrollText,
  ServerCog,
  ShieldCheck,
  Sigma,
  Sparkles,
  Variable,
  Webhook,
  type LucideIcon,
} from "lucide-react";

export type ProcessingType = "browser" | "server-assisted";
export type ToolSort = "alphabetical" | "popularity";
export type ToolAvailability = "available" | "planned";
export type ToolDataType =
  | "text"
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "markdown"
  | "file"
  | "url"
  | "token"
  | "date"
  | "number";

export interface ToolCategoryDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  order: number;
}

export const toolCategories = [
  {
    id: "formatting-validation",
    name: "Formatting & Validation",
    slug: "formatting-validation",
    description: "Format, validate, and inspect structured data.",
    icon: Braces,
    order: 1,
  },
  {
    id: "encoding-decoding",
    name: "Encoding & Decoding",
    slug: "encoding-decoding",
    description: "Translate data between common transport formats.",
    icon: Binary,
    order: 2,
  },
  {
    id: "generators",
    name: "Generators",
    slug: "generators",
    description: "Create identifiers, hashes, and safe sample data.",
    icon: Sparkles,
    order: 3,
  },
  {
    id: "date-time",
    name: "Date & Time",
    slug: "date-time",
    description: "Convert timestamps, dates, zones, and schedules.",
    icon: CalendarClock,
    order: 4,
  },
  {
    id: "comparison-text",
    name: "Comparison & Text",
    slug: "comparison-text",
    description: "Compare, transform, and analyze text.",
    icon: GitCompareArrows,
    order: 5,
  },
  {
    id: "devops-sre",
    name: "DevOps & SRE",
    slug: "devops-sre",
    description: "Inspect infrastructure configuration and operational data.",
    icon: ServerCog,
    order: 6,
  },
  {
    id: "networking-web",
    name: "Networking & Web",
    slug: "networking-web",
    description: "Understand addresses, URLs, headers, and web behavior.",
    icon: Network,
    order: 7,
  },
] as const satisfies readonly ToolCategoryDefinition[];

export type ToolCategoryId = (typeof toolCategories)[number]["id"];

export interface ToolExampleDefinition {
  name: string;
  input?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ToolCategoryId;
  keywords: readonly string[];
  icon: LucideIcon;
  route: `/tools/${string}`;
  processingType: ProcessingType;
  privacyLabel: string;
  isNew: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  requiresNetwork: boolean;
  relatedToolIds: readonly string[];
  keyboardShortcut?: string;
  examples: readonly ToolExampleDefinition[];
  supportedInputTypes: readonly ToolDataType[];
  supportedOutputTypes: readonly ToolDataType[];
  availability: ToolAvailability;
  popularityRank: number;
  addedAt: string;
}

interface ToolSeed {
  id: string;
  name: string;
  shortName?: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: ToolCategoryId;
  keywords: readonly string[];
  icon: LucideIcon;
  processingType?: ProcessingType;
  relatedToolIds?: readonly string[];
  keyboardShortcut?: string;
  example?: string;
  input?: readonly ToolDataType[];
  output?: readonly ToolDataType[];
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  availability?: ToolAvailability;
  popularityRank?: number;
  addedAt?: string;
}

function defineTool(seed: ToolSeed): ToolDefinition {
  const processingType = seed.processingType ?? "browser";

  return {
    id: seed.id,
    name: seed.name,
    shortName: seed.shortName ?? seed.name,
    slug: seed.slug,
    description: seed.description,
    longDescription: seed.longDescription ?? seed.description,
    category: seed.category,
    keywords: seed.keywords,
    icon: seed.icon,
    route: `/tools/${seed.slug}`,
    processingType,
    privacyLabel:
      processingType === "browser"
        ? "Processed locally in your browser"
        : "Uses a secure server request",
    isNew: seed.isNew ?? false,
    isPopular: seed.isPopular ?? false,
    isFeatured: seed.isFeatured ?? false,
    requiresNetwork: processingType === "server-assisted",
    relatedToolIds: seed.relatedToolIds ?? [],
    keyboardShortcut: seed.keyboardShortcut,
    examples: seed.example
      ? [{ name: "Example input", input: seed.example }]
      : [],
    supportedInputTypes: seed.input ?? ["text"],
    supportedOutputTypes: seed.output ?? ["text"],
    availability: seed.availability ?? "planned",
    popularityRank: seed.popularityRank ?? 999,
    addedAt: seed.addedAt ?? "2026-07-01",
  };
}

export const toolRegistry: readonly ToolDefinition[] = [
  defineTool({
    id: "json-formatter-validator",
    name: "JSON Formatter and Validator",
    shortName: "JSON Formatter",
    slug: "json-formatter",
    description: "Format, validate, minify, and inspect JSON safely.",
    category: "formatting-validation",
    keywords: ["json", "format", "validate", "minify"],
    icon: FileJson,
    relatedToolIds: ["yaml-formatter-converter", "json-diff-checker"],
    keyboardShortcut: "J",
    example: '{"service":"api","healthy":true}',
    input: ["json", "file"],
    output: ["json", "file"],
    availability: "available",
    isPopular: true,
    isFeatured: true,
    popularityRank: 1,
    addedAt: "2026-07-22",
  }),
  defineTool({
    id: "yaml-formatter-converter",
    name: "YAML Formatter, Validator and Converter",
    shortName: "YAML Converter",
    slug: "yaml-formatter",
    description: "Validate YAML and convert between YAML and JSON.",
    category: "formatting-validation",
    keywords: ["yaml", "yml", "json", "convert", "validate"],
    icon: Braces,
    relatedToolIds: ["json-formatter-validator", "kubernetes-yaml-validator"],
    example: "service:\n  port: 3000",
    input: ["yaml", "json", "file"],
    output: ["yaml", "json", "file"],
    availability: "available",
    isPopular: true,
    isFeatured: true,
    popularityRank: 4,
    addedAt: "2026-07-21",
  }),
  defineTool({
    id: "xml-formatter-validator",
    name: "XML Formatter and Validator",
    shortName: "XML Formatter",
    slug: "xml-formatter",
    description: "Format XML documents and identify structural errors.",
    category: "formatting-validation",
    keywords: ["xml", "format", "validate", "document"],
    icon: CodeXml,
    relatedToolIds: ["json-formatter-validator", "html-entity-encoder-decoder"],
    example: "<service><port>3000</port></service>",
    input: ["xml", "file"],
    output: ["xml", "file"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "sql-formatter",
    name: "SQL Formatter",
    slug: "sql-formatter",
    description: "Format SQL queries for clearer review and debugging.",
    category: "formatting-validation",
    keywords: ["sql", "query", "database", "format"],
    icon: Database,
    example: "select id,name from users where active=true;",
    input: ["sql", "file"],
    output: ["sql", "file"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "markdown-previewer",
    name: "Markdown Previewer",
    slug: "markdown-previewer",
    description: "Preview Markdown with a synchronized rendered view.",
    category: "formatting-validation",
    keywords: ["markdown", "md", "preview", "render"],
    icon: Eye,
    example: "# Release notes",
    input: ["markdown", "file"],
    output: ["markdown"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "base64-encoder-decoder",
    name: "Base64 Encoder and Decoder",
    shortName: "Base64 Encoder",
    slug: "base64",
    description: "Encode or decode UTF-8 text and local files.",
    category: "encoding-decoding",
    keywords: ["base64", "encode", "decode", "utf-8"],
    icon: Binary,
    relatedToolIds: [
      "url-encoder-decoder",
      "hex-binary-decimal-ascii-converter",
    ],
    example: "Hello, DevToolbox!",
    input: ["text", "file"],
    output: ["text", "file"],
    availability: "available",
    isPopular: true,
    isFeatured: true,
    popularityRank: 3,
    addedAt: "2026-07-20",
  }),
  defineTool({
    id: "url-encoder-decoder",
    name: "URL Encoder and Decoder",
    shortName: "URL Encoder",
    slug: "url-encoder",
    description: "Encode and decode URL components without a network request.",
    category: "encoding-decoding",
    keywords: ["url", "percent", "encode", "decode"],
    icon: Link2,
    relatedToolIds: ["url-parser", "query-string-builder"],
    example: "status=ready & owner=dev",
    input: ["text", "url"],
    output: ["text", "url"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "html-entity-encoder-decoder",
    name: "HTML Entity Encoder and Decoder",
    shortName: "HTML Entities",
    slug: "html-entities",
    description: "Convert reserved characters to and from HTML entities.",
    category: "encoding-decoding",
    keywords: ["html", "entity", "escape", "encode", "decode"],
    icon: FileCode2,
    example: '<button aria-label="Next">',
    input: ["text"],
    output: ["text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "jwt-decoder-inspector",
    name: "JWT Decoder and Inspector",
    shortName: "JWT Decoder",
    slug: "jwt-decoder",
    description: "Inspect JWT headers, claims, dates, and token structure.",
    category: "encoding-decoding",
    keywords: ["jwt", "token", "claims", "decode", "oauth"],
    icon: KeyRound,
    relatedToolIds: ["base64-encoder-decoder", "unix-timestamp-converter"],
    example: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
    input: ["token"],
    output: ["json"],
    availability: "available",
    isPopular: true,
    isFeatured: true,
    popularityRank: 2,
    addedAt: "2026-07-19",
  }),
  defineTool({
    id: "hex-binary-decimal-ascii-converter",
    name: "Hex, Binary, Decimal and ASCII Converter",
    shortName: "Number Base Converter",
    slug: "number-base-converter",
    description: "Convert values between common numeric and text encodings.",
    category: "encoding-decoding",
    keywords: ["hex", "binary", "decimal", "ascii", "convert"],
    icon: Sigma,
    example: "0x2A",
    input: ["text", "number"],
    output: ["text", "number"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "uuid-generator",
    name: "UUID Generator",
    slug: "uuid-generator",
    description: "Generate secure UUID v4 values individually or in batches.",
    category: "generators",
    keywords: ["uuid", "guid", "random", "identifier"],
    icon: Fingerprint,
    relatedToolIds: ["random-password-generator", "fake-test-data-generator"],
    input: ["number"],
    output: ["text", "file"],
    availability: "available",
    isPopular: true,
    popularityRank: 5,
    addedAt: "2026-07-18",
  }),
  defineTool({
    id: "random-password-generator",
    name: "Random Password Generator",
    shortName: "Password Generator",
    slug: "password-generator",
    description: "Create cryptographically secure passwords with custom rules.",
    category: "generators",
    keywords: ["password", "random", "secure", "generate"],
    icon: LockKeyhole,
    relatedToolIds: ["uuid-generator", "hash-generator"],
    input: ["number"],
    output: ["text"],
    isPopular: true,
    popularityRank: 9,
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "hash-generator",
    name: "Hash Generator",
    slug: "hash-generator",
    description: "Create SHA hashes for local text and files using Web Crypto.",
    category: "generators",
    keywords: ["hash", "sha", "checksum", "crypto", "file"],
    icon: Hash,
    relatedToolIds: ["sensitive-data-masker", "random-password-generator"],
    example: "release-artifact-v1",
    input: ["text", "file"],
    output: ["text"],
    availability: "available",
    isPopular: true,
    isFeatured: true,
    popularityRank: 7,
    addedAt: "2026-07-17",
  }),
  defineTool({
    id: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    slug: "lorem-ipsum",
    description: "Generate placeholder words, sentences, and paragraphs.",
    category: "generators",
    keywords: ["lorem", "placeholder", "text", "generate"],
    icon: Pilcrow,
    input: ["number"],
    output: ["text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "fake-test-data-generator",
    name: "Fake Test Data Generator",
    shortName: "Test Data Generator",
    slug: "test-data-generator",
    description: "Generate non-sensitive sample records for development.",
    category: "generators",
    keywords: ["fake", "mock", "test", "data", "generate"],
    icon: Dices,
    relatedToolIds: ["uuid-generator", "json-formatter-validator"],
    input: ["number", "json"],
    output: ["json", "file"],
    isNew: true,
    addedAt: "2026-07-22",
    availability: "available",
  }),
  defineTool({
    id: "unix-timestamp-converter",
    name: "Unix Timestamp Converter",
    shortName: "Timestamp Converter",
    slug: "timestamp-converter",
    description: "Convert Unix timestamps and readable dates across zones.",
    category: "date-time",
    keywords: ["unix", "epoch", "timestamp", "date", "time"],
    icon: Clock3,
    relatedToolIds: ["iso-date-formatter", "time-zone-converter"],
    example: "1714564800",
    input: ["date", "number", "text"],
    output: ["date", "number", "text"],
    availability: "available",
    isPopular: true,
    popularityRank: 6,
  }),
  defineTool({
    id: "time-zone-converter",
    name: "Time Zone Converter",
    slug: "time-zone-converter",
    description: "Translate a date and time between named time zones.",
    category: "date-time",
    keywords: ["timezone", "utc", "date", "convert"],
    icon: Globe2,
    relatedToolIds: ["unix-timestamp-converter", "iso-date-formatter"],
    input: ["date", "text"],
    output: ["date", "text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "date-difference-calculator",
    name: "Date Difference Calculator",
    slug: "date-difference",
    description: "Calculate precise durations between two dates.",
    category: "date-time",
    keywords: ["date", "difference", "duration", "calculate"],
    icon: CalendarDays,
    relatedToolIds: ["time-zone-converter", "iso-date-formatter"],
    input: ["date"],
    output: ["number", "text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "iso-date-formatter",
    name: "ISO Date Formatter",
    slug: "iso-date-formatter",
    description: "Parse, normalize, and display ISO 8601 date values.",
    category: "date-time",
    keywords: ["iso", "8601", "date", "format"],
    icon: CalendarClock,
    relatedToolIds: ["unix-timestamp-converter", "time-zone-converter"],
    example: "2026-07-22T12:30:00Z",
    input: ["date", "text"],
    output: ["date", "text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "cron-expression-builder",
    name: "Cron Expression Builder",
    shortName: "Cron Builder",
    slug: "cron-builder",
    description: "Build, validate, and explain standard Unix cron expressions.",
    category: "date-time",
    keywords: ["cron", "schedule", "unix", "expression"],
    icon: ScrollText,
    relatedToolIds: ["unix-timestamp-converter", "time-zone-converter"],
    example: "0 9 * * 1-5",
    input: ["text"],
    output: ["text", "date"],
    availability: "available",
    isPopular: true,
    popularityRank: 10,
  }),
  defineTool({
    id: "text-diff-checker",
    name: "Text Diff Checker",
    slug: "text-diff",
    description: "Compare two text inputs with clear line-level changes.",
    category: "comparison-text",
    keywords: ["text", "diff", "compare", "changes"],
    icon: GitCompareArrows,
    relatedToolIds: ["json-diff-checker", "text-sorter-deduplicator"],
    input: ["text", "file"],
    output: ["text"],
    isPopular: true,
    isFeatured: true,
    popularityRank: 8,
    availability: "available",
  }),
  defineTool({
    id: "json-diff-checker",
    name: "JSON Diff Checker",
    slug: "json-diff",
    description: "Compare parsed JSON values without key-order noise.",
    category: "comparison-text",
    keywords: ["json", "diff", "compare", "semantic"],
    icon: FileJson,
    relatedToolIds: ["text-diff-checker", "json-formatter-validator"],
    input: ["json", "file"],
    output: ["json", "text"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "text-sorter-deduplicator",
    name: "Text Sorter and Deduplicator",
    shortName: "Text Sorter",
    slug: "text-sorter",
    description: "Sort lines and remove duplicates with predictable options.",
    category: "comparison-text",
    keywords: ["text", "sort", "deduplicate", "lines"],
    icon: ListFilter,
    relatedToolIds: ["case-converter", "text-counter"],
    example: "pear\napple\npear",
    input: ["text", "file"],
    output: ["text", "file"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "case-converter",
    name: "Case Converter",
    slug: "case-converter",
    description: "Convert text between common programming case styles.",
    category: "comparison-text",
    keywords: ["case", "camel", "snake", "kebab", "text"],
    icon: CaseSensitive,
    relatedToolIds: ["text-sorter-deduplicator", "text-counter"],
    example: "Dev Toolbox",
  }),
  defineTool({
    id: "text-counter",
    name: "Character, Word and Line Counter",
    shortName: "Text Counter",
    slug: "text-counter",
    description: "Count characters, words, lines, and byte size.",
    category: "comparison-text",
    keywords: ["character", "word", "line", "count", "text"],
    icon: Sigma,
    example: "Measure this text.",
    output: ["number", "text"],
  }),
  defineTool({
    id: "regex-tester",
    name: "Regular Expression Tester",
    shortName: "Regex Tester",
    slug: "regex-tester",
    description: "Test JavaScript-compatible patterns and inspect matches.",
    category: "comparison-text",
    keywords: ["regex", "regexp", "pattern", "match", "javascript"],
    icon: Regex,
    relatedToolIds: ["text-diff-checker", "sensitive-data-masker"],
    example: "\\b[A-Z]{2,}\\b",
    availability: "available",
    isNew: true,
    addedAt: "2026-07-23",
  }),
  defineTool({
    id: "kubernetes-yaml-validator",
    name: "Kubernetes YAML Validator",
    shortName: "Kubernetes Validator",
    slug: "kubernetes-validator",
    description:
      "Validate Kubernetes manifests and common configuration issues.",
    category: "devops-sre",
    keywords: ["kubernetes", "k8s", "yaml", "manifest", "validate"],
    icon: Boxes,
    relatedToolIds: ["yaml-formatter-converter", "docker-compose-validator"],
    input: ["yaml", "file"],
    output: ["text", "json"],
    isNew: true,
    addedAt: "2026-07-23",
    availability: "available",
  }),
  defineTool({
    id: "docker-compose-validator",
    name: "Docker Compose Validator",
    slug: "docker-compose-validator",
    description: "Inspect Compose files for structure and common mistakes.",
    category: "devops-sre",
    keywords: ["docker", "compose", "yaml", "validate"],
    icon: Container,
    relatedToolIds: [
      "kubernetes-yaml-validator",
      "environment-variable-parser",
    ],
    input: ["yaml", "file"],
    output: ["text", "json"],
  }),
  defineTool({
    id: "terraform-variable-generator",
    name: "Terraform Variable Generator",
    shortName: "Terraform Variables",
    slug: "terraform-variable-generator",
    description: "Generate typed Terraform variable and tfvars blocks.",
    category: "devops-sre",
    keywords: ["terraform", "hcl", "variable", "tfvars"],
    icon: Variable,
    relatedToolIds: ["environment-variable-parser", "json-formatter-validator"],
    input: ["json", "text"],
    output: ["text", "file"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "environment-variable-parser",
    name: "Environment Variable Parser",
    shortName: "Environment Parser",
    slug: "environment-parser",
    description:
      "Parse, validate, sort, and convert environment variable files.",
    category: "devops-sre",
    keywords: ["env", "dotenv", "environment", "config", "parse"],
    icon: FileCog,
    relatedToolIds: ["sensitive-data-masker", "terraform-variable-generator"],
    example: "PORT=3000\nNODE_ENV=production",
    input: ["text", "file"],
    output: ["text", "json", "file"],
    availability: "available",
  }),
  defineTool({
    id: "log-formatter-analyzer",
    name: "Log Formatter and Analyzer",
    shortName: "Log Analyzer",
    slug: "log-analyzer",
    description: "Format structured logs and summarize levels and patterns.",
    category: "devops-sre",
    keywords: ["log", "jsonl", "analyze", "level", "sre"],
    icon: ScrollText,
    relatedToolIds: ["sensitive-data-masker", "json-formatter-validator"],
    input: ["text", "json", "file"],
    output: ["text", "json"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "sensitive-data-masker",
    name: "Sensitive Data Masker",
    slug: "sensitive-data-masker",
    description: "Detect and redact common secrets and personal identifiers.",
    category: "devops-sre",
    keywords: ["mask", "redact", "secret", "pii", "security"],
    icon: ShieldCheck,
    relatedToolIds: ["log-formatter-analyzer", "environment-variable-parser"],
    input: ["text", "json", "file"],
    output: ["text", "json", "file"],
    availability: "available",
    isNew: true,
    addedAt: "2026-07-23",
  }),
  defineTool({
    id: "certificate-expiry-checker",
    name: "Certificate Expiry Checker",
    shortName: "Certificate Checker",
    slug: "certificate-checker",
    description: "Inspect a remote TLS certificate and its expiration window.",
    category: "devops-sre",
    keywords: ["tls", "ssl", "certificate", "expiry", "https"],
    icon: BadgeCheck,
    processingType: "server-assisted",
    relatedToolIds: ["dns-lookup", "http-header-analyzer"],
    example: "example.com",
    input: ["url", "text"],
    output: ["json", "date"],
    availability: "available",
    isNew: true,
    addedAt: "2026-08-18",
  }),
  defineTool({
    id: "http-status-code-reference",
    name: "HTTP Status Code Reference",
    shortName: "HTTP Status Codes",
    slug: "http-status-codes",
    description: "Search HTTP response codes and practical explanations.",
    category: "devops-sre",
    keywords: ["http", "status", "response", "reference"],
    icon: BookOpenCheck,
    relatedToolIds: ["http-header-analyzer", "webhook-payload-tester"],
    input: ["number", "text"],
    output: ["text"],
  }),
  defineTool({
    id: "cidr-ip-calculator",
    name: "CIDR and IP Calculator",
    shortName: "CIDR Calculator",
    slug: "cidr-calculator",
    description: "Calculate network ranges, masks, hosts, and address details.",
    category: "devops-sre",
    keywords: ["cidr", "ip", "subnet", "network", "mask"],
    icon: Network,
    relatedToolIds: ["dns-lookup", "url-parser"],
    example: "10.0.0.0/24",
    input: ["text"],
    output: ["text", "json"],
  }),
  defineTool({
    id: "dns-lookup",
    name: "DNS Lookup",
    slug: "dns-lookup",
    description: "Query common DNS record types for a hostname.",
    category: "networking-web",
    keywords: ["dns", "domain", "record", "lookup"],
    icon: Radar,
    processingType: "server-assisted",
    relatedToolIds: ["certificate-expiry-checker", "cidr-ip-calculator"],
    example: "example.com",
    input: ["url", "text"],
    output: ["json", "text"],
  }),
  defineTool({
    id: "http-header-analyzer",
    name: "HTTP Header Analyzer",
    slug: "http-header-analyzer",
    description: "Inspect response headers and common security directives.",
    category: "networking-web",
    keywords: ["http", "header", "security", "response"],
    icon: ScanSearch,
    processingType: "server-assisted",
    relatedToolIds: [
      "http-status-code-reference",
      "certificate-expiry-checker",
    ],
    example: "https://example.com",
    input: ["url"],
    output: ["json", "text"],
  }),
  defineTool({
    id: "user-agent-parser",
    name: "User-Agent Parser",
    slug: "user-agent-parser",
    description: "Parse browser, operating system, and device information.",
    category: "networking-web",
    keywords: ["user-agent", "browser", "device", "parse"],
    icon: MonitorSmartphone,
    relatedToolIds: ["http-header-analyzer", "url-parser"],
    input: ["text"],
    output: ["json", "text"],
  }),
  defineTool({
    id: "url-parser",
    name: "URL Parser",
    slug: "url-parser",
    description: "Break a URL into protocol, host, path, and parameters.",
    category: "networking-web",
    keywords: ["url", "uri", "parse", "host", "path"],
    icon: Link2,
    relatedToolIds: ["url-encoder-decoder", "query-string-builder"],
    example: "https://example.com/tools?sort=name#results",
    input: ["url", "text"],
    output: ["json", "text"],
  }),
  defineTool({
    id: "query-string-builder",
    name: "Query String Builder",
    slug: "query-string-builder",
    description: "Build and inspect encoded URL query parameters.",
    category: "networking-web",
    keywords: ["query", "url", "parameter", "encode"],
    icon: ListTree,
    relatedToolIds: ["url-parser", "url-encoder-decoder"],
    input: ["json", "text"],
    output: ["url", "text"],
  }),
  defineTool({
    id: "webhook-payload-tester",
    name: "Webhook Payload Tester",
    shortName: "Webhook Tester",
    slug: "webhook-tester",
    description: "Send sample payloads through a controlled test endpoint.",
    category: "networking-web",
    keywords: ["webhook", "payload", "http", "test"],
    icon: Webhook,
    processingType: "server-assisted",
    relatedToolIds: ["http-header-analyzer", "json-formatter-validator"],
    input: ["url", "json"],
    output: ["json", "text"],
  }),
];

export function getCategoryById(id: string) {
  return toolCategories.find((category) => category.id === id);
}

export function getCategoryBySlug(slug: string) {
  return toolCategories.find((category) => category.slug === slug);
}

export function isToolCategoryId(value: string): value is ToolCategoryId {
  return toolCategories.some((category) => category.id === value);
}

export function getToolById(id: string) {
  return toolRegistry.find((tool) => tool.id === id);
}

export function getToolBySlug(slug: string) {
  return toolRegistry.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategoryId) {
  return toolRegistry.filter((tool) => tool.category === category);
}

export function getRelatedTools(toolOrId: ToolDefinition | string, limit = 4) {
  const tool = typeof toolOrId === "string" ? getToolById(toolOrId) : toolOrId;

  if (!tool) return [];

  const explicit = tool.relatedToolIds
    .map(getToolById)
    .filter((item): item is ToolDefinition => Boolean(item));
  const sameCategory = toolRegistry.filter(
    (item) =>
      item.id !== tool.id &&
      item.category === tool.category &&
      !explicit.some((related) => related.id === item.id),
  );

  return [...explicit, ...sameCategory].slice(0, limit);
}

export function getFeaturedTools(limit?: number) {
  const tools = toolRegistry.filter((tool) => tool.isFeatured);
  return typeof limit === "number" ? tools.slice(0, limit) : tools;
}

export function getPopularTools(limit?: number) {
  const tools = toolRegistry
    .filter((tool) => tool.isPopular)
    .toSorted((a, b) => a.popularityRank - b.popularityRank);
  return typeof limit === "number" ? tools.slice(0, limit) : tools;
}

export function getRecentlyAddedTools(limit = 6) {
  return toolRegistry
    .toSorted(
      (a, b) =>
        b.addedAt.localeCompare(a.addedAt) || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}

export function searchTools(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...toolRegistry];

  return toolRegistry.filter((tool) =>
    [
      tool.name,
      tool.shortName,
      tool.description,
      tool.category,
      ...tool.keywords,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}

export function filterTools({
  tools = toolRegistry,
  category,
  processingType,
}: {
  tools?: readonly ToolDefinition[];
  category?: ToolCategoryId;
  processingType?: ProcessingType;
}) {
  return tools.filter(
    (tool) =>
      (!category || tool.category === category) &&
      (!processingType || tool.processingType === processingType),
  );
}

export function sortTools(
  tools: readonly ToolDefinition[],
  sort: ToolSort = "alphabetical",
) {
  return tools.toSorted((a, b) =>
    sort === "popularity"
      ? a.popularityRank - b.popularityRank || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name),
  );
}
