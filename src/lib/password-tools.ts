export const PASSWORD_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;

export const AMBIGUOUS_PASSWORD_CHARACTERS = "Il1O0o|";

export type PasswordSetName = keyof typeof PASSWORD_SETS;
export type PasswordRandomSource = (bytes: Uint8Array) => Uint8Array;

export interface PasswordOptions {
  length: number;
  count: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
  exclusions?: string;
  inclusions?: string;
}

export interface PasswordAnalysis {
  poolSize: number;
  enabledSetCount: number;
  entropyBits: number;
  strength: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  warnings: string[];
}

function defaultRandomSource(bytes: Uint8Array) {
  return globalThis.crypto.getRandomValues(bytes);
}

function filteredSets(options: PasswordOptions) {
  const excluded = new Set(options.exclusions ?? "");
  if (options.excludeAmbiguous) {
    for (const character of AMBIGUOUS_PASSWORD_CHARACTERS)
      excluded.add(character);
  }
  return (Object.keys(PASSWORD_SETS) as PasswordSetName[])
    .filter((name) => options[name])
    .map((name) => ({
      name,
      characters: Array.from(PASSWORD_SETS[name]).filter(
        (character) => !excluded.has(character),
      ),
    }));
}

export function parsePasswordInclusions(value = "") {
  if (!value.trim()) return [];
  const entries: string[] = [];
  let current = "",
    quote: "'" | '"' | undefined,
    quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (quote) {
      if (character === quote) {
        if (value[index + 1] === quote) {
          current += quote;
          index += 1;
        } else {
          quote = undefined;
        }
      } else current += character;
      continue;
    }
    if ((character === "'" || character === '"') && !current.trim()) {
      quote = character;
      quoted = true;
      current = "";
      continue;
    }
    if (character === ",") {
      const entry = quoted ? current : current.trim();
      if (!entry)
        throw new Error("Custom inclusions cannot contain empty entries.");
      entries.push(entry);
      current = "";
      quoted = false;
      continue;
    }
    if (quoted && !character.trim()) continue;
    if (quoted)
      throw new Error("Only spaces and commas may follow a quoted inclusion.");
    current += character;
  }
  if (quote) throw new Error("Custom inclusions contain an unclosed quote.");
  const finalEntry = quoted ? current : current.trim();
  if (!finalEntry)
    throw new Error("Custom inclusions cannot contain empty entries.");
  entries.push(finalEntry);

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" }),
    seen = new Set<string>();
  for (const entry of entries) {
    if ([...segmenter.segment(entry)].length !== 1)
      throw new Error(
        `Custom inclusion ${JSON.stringify(entry)} must be exactly one character or symbol.`,
      );
    if (seen.has(entry))
      throw new Error(
        `Custom inclusion ${JSON.stringify(entry)} is duplicated.`,
      );
    seen.add(entry);
  }
  return entries;
}

function validateOptions(options: PasswordOptions) {
  if (
    !Number.isInteger(options.length) ||
    options.length < 1 ||
    options.length > 256
  ) {
    throw new Error("Password length must be a whole number from 1 to 256.");
  }
  if (
    !Number.isInteger(options.count) ||
    options.count < 1 ||
    options.count > 100
  ) {
    throw new Error("Password count must be a whole number from 1 to 100.");
  }
  const sets = filteredSets(options),
    inclusions = parsePasswordInclusions(options.inclusions),
    excluded = new Set(options.exclusions ?? "");
  if (options.excludeAmbiguous)
    for (const character of AMBIGUOUS_PASSWORD_CHARACTERS)
      excluded.add(character);
  const conflict = inclusions.find((character) => excluded.has(character));
  if (conflict)
    throw new Error(
      `Custom inclusion ${JSON.stringify(conflict)} is also excluded. Remove it from one rule.`,
    );
  if (!sets.length) throw new Error("Enable at least one character set.");
  const empty = sets.find((set) => !set.characters.length);
  if (empty)
    throw new Error(
      `Every ${empty.name} character was excluded. Remove an exclusion or disable that set.`,
    );
  const unsatisfiedSets = sets.filter(
      (set) =>
        !inclusions.some((character) => set.characters.includes(character)),
    ),
    minimumLength = inclusions.length + unsatisfiedSets.length;
  if (options.length < minimumLength) {
    throw new Error(
      inclusions.length
        ? `Length ${options.length} cannot include all ${inclusions.length} custom inclusions and ${unsatisfiedSets.length} remaining required character sets.`
        : `Length ${options.length} cannot include all ${sets.length} enabled character sets.`,
    );
  }
  return { sets, inclusions, unsatisfiedSets };
}

function secureIndex(maxExclusive: number, randomSource: PasswordRandomSource) {
  if (
    !Number.isInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > 256
  ) {
    throw new Error(
      "Secure sampling requires a pool containing 1 to 256 characters.",
    );
  }
  const acceptanceLimit = Math.floor(256 / maxExclusive) * maxExclusive;
  const bytes = new Uint8Array(1);
  do {
    randomSource(bytes);
  } while (bytes[0]! >= acceptanceLimit);
  return bytes[0]! % maxExclusive;
}

export function analyzePasswordOptions(
  options: PasswordOptions,
): PasswordAnalysis {
  const { sets, inclusions } = validateOptions(options);
  const pool = new Set([
    ...sets.flatMap((set) => set.characters),
    ...inclusions,
  ]);
  const entropyBits = options.length * Math.log2(pool.size);
  const strength =
    entropyBits < 28
      ? "Very weak"
      : entropyBits < 40
        ? "Weak"
        : entropyBits < 60
          ? "Fair"
          : entropyBits < 80
            ? "Strong"
            : "Very strong";
  const warnings: string[] = [];
  if (options.length < 12)
    warnings.push("Passwords shorter than 12 characters are easier to guess.");
  if (pool.size < 20)
    warnings.push(
      "The remaining character pool is small because of the selected sets or exclusions.",
    );
  if (!options.lowercase || !options.uppercase || !options.numbers) {
    warnings.push(
      "Using fewer character categories reduces the estimated search space.",
    );
  }
  return {
    poolSize: pool.size,
    enabledSetCount: sets.length,
    entropyBits,
    strength,
    warnings,
  };
}

export function generatePasswords(
  options: PasswordOptions,
  randomSource: PasswordRandomSource = defaultRandomSource,
) {
  const { sets, inclusions, unsatisfiedSets } = validateOptions(options);
  const pool = Array.from(
    new Set([...sets.flatMap((set) => set.characters), ...inclusions]),
  );
  return Array.from({ length: options.count }, () => {
    const password = [
      ...inclusions,
      ...unsatisfiedSets.map(
        (set) =>
          set.characters[secureIndex(set.characters.length, randomSource)]!,
      ),
    ];
    while (password.length < options.length) {
      password.push(pool[secureIndex(pool.length, randomSource)]!);
    }
    for (let index = password.length - 1; index > 0; index -= 1) {
      const swapIndex = secureIndex(index + 1, randomSource);
      [password[index], password[swapIndex]] = [
        password[swapIndex]!,
        password[index]!,
      ];
    }
    return password.join("");
  });
}
