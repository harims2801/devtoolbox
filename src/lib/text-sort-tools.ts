export type TextSortMode = "lexical" | "natural" | "numeric" | "locale";
export type EmptyLineMode = "keep" | "remove" | "first" | "last";
export type DuplicatePolicy = "first" | "last";

export interface TextSortOptions {
  direction?: "ascending" | "descending";
  mode?: TextSortMode;
  locale?: string;
  caseSensitive?: boolean;
  trimBeforeCompare?: boolean;
  emptyLines?: EmptyLineMode;
  removeDuplicates?: boolean;
  duplicatePolicy?: DuplicatePolicy;
}

export interface TextSortResult {
  output: string;
  inputLines: number;
  outputLines: number;
  duplicatesRemoved: number;
  emptyLinesRemoved: number;
}

interface IndexedLine {
  value: string;
  index: number;
}

function lines(text: string) {
  return text === "" ? [] : text.split(/\r\n|\r|\n/);
}

function comparisonValue(value: string, options: TextSortOptions) {
  let result = options.trimBeforeCompare ? value.trim() : value;
  if (!options.caseSensitive)
    result = result.toLocaleLowerCase(options.locale || undefined);
  return result;
}

export function sortAndDeduplicateText(
  text: string,
  options: TextSortOptions = {},
): TextSortResult {
  const input = lines(text),
    emptyMode = options.emptyLines ?? "keep";
  let working: IndexedLine[] = input.map((value, index) => ({ value, index }));
  const beforeEmpty = working.length;
  if (emptyMode === "remove")
    working = working.filter((line) => line.value.trim() !== "");
  const emptyLinesRemoved = beforeEmpty - working.length;

  let duplicatesRemoved = 0;
  if (options.removeDuplicates) {
    const selected = new Map<string, IndexedLine>(),
      preserveLast = options.duplicatePolicy === "last";
    for (const line of working) {
      const key = comparisonValue(line.value, options);
      if (!selected.has(key) || preserveLast) selected.set(key, line);
      else duplicatesRemoved++;
    }
    if (preserveLast) duplicatesRemoved = working.length - selected.size;
    working = Array.from(selected.values());
  }

  const mode = options.mode ?? "lexical",
    localeOptions: Intl.CollatorOptions = {
      sensitivity: options.caseSensitive ? "variant" : "base",
      numeric: mode === "natural",
    },
    collator = new Intl.Collator(options.locale || undefined, localeOptions),
    direction = options.direction === "descending" ? -1 : 1;

  function compare(left: IndexedLine, right: IndexedLine) {
    const leftValue = comparisonValue(left.value, options),
      rightValue = comparisonValue(right.value, options),
      leftEmpty = left.value.trim() === "",
      rightEmpty = right.value.trim() === "";
    if (
      leftEmpty !== rightEmpty &&
      (emptyMode === "first" || emptyMode === "last")
    )
      return leftEmpty === (emptyMode === "first") ? -1 : 1;
    let order = 0;
    if (mode === "numeric") {
      const leftNumber = Number(leftValue),
        rightNumber = Number(rightValue),
        leftValid = leftValue !== "" && Number.isFinite(leftNumber),
        rightValid = rightValue !== "" && Number.isFinite(rightNumber);
      if (leftValid !== rightValid) return leftValid ? -1 : 1;
      if (leftValid && rightValid) order = leftNumber - rightNumber;
      else order = collator.compare(leftValue, rightValue);
    } else if (mode === "lexical") {
      order = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
    } else order = collator.compare(leftValue, rightValue);
    return order === 0 ? left.index - right.index : direction * order;
  }

  working.sort(compare);
  return {
    output: working.map((line) => line.value).join("\n"),
    inputLines: input.length,
    outputLines: working.length,
    duplicatesRemoved,
    emptyLinesRemoved,
  };
}
