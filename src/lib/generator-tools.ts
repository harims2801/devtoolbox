export interface BatchGeneratorOptions<T> {
  count: number;
  generate: () => T;
  transform?: (value: T, index: number) => T;
}
export function generateBatch<T>({
  count,
  generate,
  transform,
}: BatchGeneratorOptions<T>) {
  if (!Number.isInteger(count) || count < 1 || count > 1000)
    throw new Error("Count must be an integer between 1 and 1,000.");
  return Array.from({ length: count }, (_, index) => {
    const value = generate();
    return transform ? transform(value, index) : value;
  });
}
