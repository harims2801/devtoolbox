export const REGEX_LIMITS = { pattern: 500, text: 100_000 } as const;

export interface RegexMatch {
  value: string;
  index: number;
  end: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string | undefined>;
}

export function regexRiskWarning(pattern: string) {
  if (
    /\([^)]*[+*][^)]*\)[+*{]/.test(pattern) ||
    /(\.\*){2,}|(\.\+){2,}/.test(pattern)
  )
    return "This pattern may contain nested repetition and could cause catastrophic backtracking.";
  return "";
}

export function compileRegex(pattern: string, flags: string) {
  if (pattern.length > REGEX_LIMITS.pattern)
    throw new Error(
      `Patterns are limited to ${REGEX_LIMITS.pattern} characters.`,
    );
  return new RegExp(pattern, [...new Set(flags)].join(""));
}

export function testRegex(pattern: string, flags: string, text: string) {
  if (text.length > REGEX_LIMITS.text)
    throw new Error("Test text is limited to 100,000 characters.");
  const warning = regexRiskWarning(pattern);
  if (warning) throw new Error(warning);
  const regex = compileRegex(pattern, flags);
  const matches: RegexMatch[] = [];
  const iterative = regex.global || regex.sticky;
  if (!iterative) {
    const match = regex.exec(text);
    if (match) matches.push(toMatch(match));
  } else {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) && matches.length < 10_000) {
      matches.push(toMatch(match));
      if (match[0] === "") regex.lastIndex += 1;
    }
  }
  return { matches, warning };
}

function toMatch(match: RegExpExecArray): RegexMatch {
  return {
    value: match[0],
    index: match.index,
    end: match.index + match[0].length,
    groups: match.slice(1),
    namedGroups: { ...(match.groups ?? {}) },
  };
}

export function replaceRegex(
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
) {
  const warning = regexRiskWarning(pattern);
  if (warning) throw new Error(warning);
  return text.replace(compileRegex(pattern, flags), replacement);
}

export function highlightSegments(text: string, matches: RegexMatch[]) {
  const segments: { text: string; matched: boolean }[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index > cursor)
      segments.push({ text: text.slice(cursor, match.index), matched: false });
    if (match.end > match.index)
      segments.push({
        text: text.slice(match.index, match.end),
        matched: true,
      });
    cursor = Math.max(cursor, match.end);
  }
  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), matched: false });
  return segments;
}
