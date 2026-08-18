export type MaskingStyle = "complete" | "preserve" | "pseudonym";
export type SensitiveCategory =
  | "private-key"
  | "jwt"
  | "bearer-token"
  | "aws-access-key"
  | "connection-string"
  | "credential-url"
  | "password"
  | "api-key"
  | "credit-card"
  | "email"
  | "ipv4"
  | "ipv6"
  | "phone"
  | "custom";
export interface SensitiveDetection {
  category: SensitiveCategory;
  start: number;
  end: number;
  value: string;
}
export interface MaskingRule {
  category: SensitiveCategory;
  label: string;
  source: string;
  flags?: string;
  validate?: (value: string) => boolean;
}
const ipv4Valid = (value: string) =>
  value.split(".").every((part) => Number(part) <= 255);
const luhn = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19 || /^0+$/.test(digits))
    return false;
  let sum = 0,
    alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};
export const MASKING_RULES: MaskingRule[] = [
  {
    category: "private-key",
    label: "Private-key blocks",
    source:
      "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\\s\\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    flags: "g",
  },
  {
    category: "jwt",
    label: "JWT tokens",
    source: "\\beyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b",
    flags: "g",
  },
  {
    category: "bearer-token",
    label: "Bearer tokens",
    source: "\\bBearer\\s+[A-Za-z0-9._~+/-]{12,}={0,2}",
    flags: "gi",
  },
  {
    category: "aws-access-key",
    label: "AWS access-key identifiers",
    source: "\\b(?:AKIA|ASIA)[A-Z0-9]{16}\\b",
    flags: "g",
  },
  {
    category: "connection-string",
    label: "Connection strings",
    source:
      "\\b(?:mongodb(?:\\+srv)?|postgres(?:ql)?|mysql|redis):\\/\\/[^\\s'\"]+",
    flags: "gi",
  },
  {
    category: "credential-url",
    label: "URLs with credentials",
    source: "\\bhttps?:\\/\\/[^\\s/@:]+:[^\\s/@]+@[^\\s]+",
    flags: "gi",
  },
  {
    category: "password",
    label: "Passwords in key-value text",
    source: "\\b(?:password|passwd|pwd)\\s*[:=]\\s*[^\\s,;]+",
    flags: "gi",
  },
  {
    category: "api-key",
    label: "API-key-like values",
    source:
      "\\b(?:api[_-]?key|access[_-]?token|secret[_-]?key)\\s*[:=]\\s*[A-Za-z0-9_./+~-]{12,}={0,2}",
    flags: "gi",
  },
  {
    category: "credit-card",
    label: "Credit-card-like numbers",
    source: "\\b(?:\\d[ -]*?){13,19}\\b",
    flags: "g",
    validate: luhn,
  },
  {
    category: "email",
    label: "Email addresses",
    source: "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b",
    flags: "gi",
  },
  {
    category: "ipv4",
    label: "IPv4 addresses",
    source: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
    flags: "g",
    validate: ipv4Valid,
  },
  {
    category: "ipv6",
    label: "IPv6 addresses",
    source:
      "(?<![A-Fa-f0-9:])(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{0,4}(?![A-Fa-f0-9:])",
    flags: "g",
  },
  {
    category: "phone",
    label: "Phone numbers",
    source:
      "(?<!\\w)(?:\\+?\\d{1,3}[ .-]?)?(?:\\(\\d{2,4}\\)[ .-]?)?\\d{3}[ .-]\\d{3,4}[ .-]\\d{3,4}(?!\\w)",
    flags: "g",
  },
];
export const MASKING_INPUT_LIMIT = 250_000;
export function detectSensitive(
  text: string,
  options: { enabled?: SensitiveCategory[]; customPattern?: string } = {},
) {
  if (text.length > MASKING_INPUT_LIMIT)
    throw new Error(
      "Input is limited to 250,000 characters to keep local processing responsive.",
    );
  const enabled = options.enabled ? new Set(options.enabled) : undefined;
  const detections: SensitiveDetection[] = [];
  for (const rule of MASKING_RULES) {
    if (enabled && !enabled.has(rule.category)) continue;
    const regex = new RegExp(rule.source, rule.flags ?? "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      if (!rule.validate || rule.validate(match[0]))
        detections.push({
          category: rule.category,
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
        });
      if (match[0] === "") regex.lastIndex++;
    }
  }
  if (options.customPattern) {
    let regex: RegExp;
    try {
      regex = new RegExp(options.customPattern, "g");
    } catch {
      throw new Error(
        "Custom masking pattern is not a valid regular expression.",
      );
    }
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      detections.push({
        category: "custom",
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
      });
      if (match[0] === "") regex.lastIndex++;
    }
  }
  detections.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  );
  const filtered: SensitiveDetection[] = [];
  for (const detection of detections) {
    if (
      !filtered.some(
        (item) => detection.start < item.end && detection.end > item.start,
      )
    )
      filtered.push(detection);
  }
  return filtered;
}
async function pseudonym(value: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}\0${value}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return `pseudo_${Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
export async function maskSensitiveText(
  text: string,
  detections: SensitiveDetection[],
  style: MaskingStyle,
  salt = "",
) {
  let output = "",
    cursor = 0;
  for (const detection of detections) {
    output += text.slice(cursor, detection.start);
    let replacement: string;
    if (style === "complete") replacement = `[MASKED:${detection.category}]`;
    else if (style === "preserve")
      replacement =
        detection.value.length <= 4
          ? "****"
          : `${detection.value.slice(0, 2)}${"*".repeat(Math.min(12, detection.value.length - 4))}${detection.value.slice(-2)}`;
    else replacement = await pseudonym(detection.value, salt);
    output += replacement;
    cursor = detection.end;
  }
  return output + text.slice(cursor);
}
export function maskingCounts(detections: SensitiveDetection[]) {
  return detections.reduce<Record<string, number>>((counts, item) => {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, {});
}
export function maskingSegments(
  text: string,
  detections: SensitiveDetection[],
) {
  const segments: { text: string; detection?: SensitiveDetection }[] = [];
  let cursor = 0;
  for (const detection of detections) {
    if (detection.start > cursor)
      segments.push({ text: text.slice(cursor, detection.start) });
    segments.push({
      text: text.slice(detection.start, detection.end),
      detection,
    });
    cursor = detection.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
