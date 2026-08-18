export interface TextMetrics {
  codePoints: number;
  utf16Units: number;
  graphemeClusters: number;
  graphemeSupported: boolean;
  words: number;
  sentences: number;
  lines: number;
  nonWhitespace: number;
  utf8Bytes: number;
  whitespace: number;
  spaces: number;
  tabs: number;
  lineBreaks: number;
  readingMinutes: number;
  wordsPerMinute: number;
}

function segments(text: string, granularity: "grapheme" | "word" | "sentence") {
  if (typeof Intl.Segmenter !== "function") return null;
  return Array.from(
    new Intl.Segmenter(undefined, { granularity }).segment(text),
  );
}

export function countText(text: string, wordsPerMinute = 200): TextMetrics {
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0)
    throw new Error("Words per minute must be greater than zero.");
  const points = Array.from(text),
    graphemes = segments(text, "grapheme"),
    wordSegments = segments(text, "word"),
    sentenceSegments = segments(text, "sentence"),
    words = wordSegments
      ? wordSegments.filter((segment) => segment.isWordLike).length
      : (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length,
    sentences = sentenceSegments
      ? sentenceSegments.filter((segment) => segment.segment.trim() !== "")
          .length
      : (text.match(/[^.!?。！？]+[.!?。！？]*/gu) ?? []).filter((value) =>
          value.trim(),
        ).length,
    lineBreaks = (text.match(/\r\n|\r|\n/g) ?? []).length,
    whitespace = points.filter((point) => /\s/u.test(point)).length;
  return {
    codePoints: points.length,
    utf16Units: text.length,
    graphemeClusters: graphemes?.length ?? points.length,
    graphemeSupported: graphemes !== null,
    words,
    sentences,
    lines: text === "" ? 0 : lineBreaks + 1,
    nonWhitespace: points.length - whitespace,
    utf8Bytes: new TextEncoder().encode(text).byteLength,
    whitespace,
    spaces: (text.match(/ /g) ?? []).length,
    tabs: (text.match(/\t/g) ?? []).length,
    lineBreaks,
    readingMinutes: words / wordsPerMinute,
    wordsPerMinute,
  };
}

export function formatTextMetrics(metrics: TextMetrics) {
  return [
    `Unicode code points: ${metrics.codePoints}`,
    `UTF-16 code units: ${metrics.utf16Units}`,
    `Grapheme clusters: ${metrics.graphemeClusters}${metrics.graphemeSupported ? "" : " (fallback)"}`,
    `Words: ${metrics.words}`,
    `Sentences: ${metrics.sentences}`,
    `Lines: ${metrics.lines}`,
    `Non-whitespace characters: ${metrics.nonWhitespace}`,
    `UTF-8 bytes: ${metrics.utf8Bytes}`,
    `Whitespace code points: ${metrics.whitespace}`,
    `Spaces: ${metrics.spaces}`,
    `Tabs: ${metrics.tabs}`,
    `Line breaks: ${metrics.lineBreaks}`,
    `Reading time (${metrics.wordsPerMinute} WPM): ${metrics.readingMinutes.toFixed(2)} minutes`,
  ].join("\n");
}
