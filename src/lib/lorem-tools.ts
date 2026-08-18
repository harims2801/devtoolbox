export type LoremUnit = "words" | "sentences" | "paragraphs";
export type LoremFormat = "text" | "html";
export interface LoremOptions {
  unit: LoremUnit;
  count: number;
  format: LoremFormat;
  startWithLorem?: boolean;
  seed?: string;
}

const words =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum posuere malesuada pellentesque habitant morbi tristique senectus netus fames turpis egestas integer eget aliquet nibh praesent tristique magna sit amet purus gravida quis blandit turpis cursus in hac habitasse platea dictumst vestibulum rhoncus est pellentesque pharetra convallis posuere morbi leo urna molestie at elementum eu facilisis café naïve".split(
    " ",
  );
const bounds: Record<LoremUnit, [number, number]> = {
  words: [1, 1000],
  sentences: [1, 100],
  paragraphs: [1, 50],
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}
function seededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function cryptoRandom() {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0]! / 4294967296;
}
function pick(random: () => number) {
  return words[Math.floor(random() * words.length)]!;
}
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function sentence(random: () => number, opening = false) {
  const count = 8 + Math.floor(random() * 9);
  const selected = Array.from({ length: count }, () => pick(random));
  if (opening)
    selected.splice(0, Math.min(2, selected.length), "lorem", "ipsum");
  return `${capitalize(selected.join(" "))}.`;
}
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function toLoremHtml(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
}
export function validateLoremOptions(options: LoremOptions) {
  const [minimum, maximum] = bounds[options.unit];
  if (
    !Number.isInteger(options.count) ||
    options.count < minimum ||
    options.count > maximum
  )
    throw new Error(
      `${options.unit[0]!.toUpperCase() + options.unit.slice(1)} count must be a whole number from ${minimum} to ${maximum}.`,
    );
}
export function generateLorem(
  options: LoremOptions,
  normalRandom: () => number = cryptoRandom,
) {
  validateLoremOptions(options);
  const random = options.seed ? seededRandom(options.seed) : normalRandom;
  let paragraphs: string[];
  if (options.unit === "words") {
    const selected = Array.from({ length: options.count }, () => pick(random));
    if (options.startWithLorem)
      selected.splice(
        0,
        Math.min(2, selected.length),
        ...["lorem", "ipsum"].slice(0, selected.length),
      );
    paragraphs = [selected.join(" ")];
  } else if (options.unit === "sentences")
    paragraphs = [
      Array.from({ length: options.count }, (_, index) =>
        sentence(random, Boolean(options.startWithLorem && index === 0)),
      ).join(" "),
    ];
  else
    paragraphs = Array.from({ length: options.count }, (_, paragraphIndex) =>
      Array.from({ length: 3 + Math.floor(random() * 5) }, (_, sentenceIndex) =>
        sentence(
          random,
          Boolean(
            options.startWithLorem &&
            paragraphIndex === 0 &&
            sentenceIndex === 0,
          ),
        ),
      ).join(" "),
    );
  const text = paragraphs.join("\n\n");
  return {
    text,
    output: options.format === "html" ? toLoremHtml(paragraphs) : text,
    paragraphs,
  };
}
export function countTextStats(value: string) {
  return {
    words: value.trim() ? value.trim().split(/\s+/u).length : 0,
    characters: Array.from(value).length,
  };
}
