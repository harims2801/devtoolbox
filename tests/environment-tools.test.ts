import { describe, expect, it } from "vitest";
import {
  convertEnvironment,
  maskEnvironment,
  parseDotEnv,
  parseEnvironment,
} from "@/lib/environment-tools";
describe("environment parser", () => {
  it("parses comments, quotes, escapes, and blanks", () => {
    const result = parseDotEnv(
      '# note\nA="hello world"\nB="line\\nnext"\nEMPTY=',
    );
    expect(result.comments).toEqual(["note"]);
    expect(result.entries.map((x) => x.value)).toEqual([
      "hello world",
      "line\nnext",
      "",
    ]);
  });
  it("supports shell exports and inline comments", () =>
    expect(
      parseEnvironment("export PORT=3000 # local", "shell").entries[0],
    ).toMatchObject({ key: "PORT", value: "3000" }));
  it("detects duplicates and invalid names", () => {
    const result = parseDotEnv("A=1\nA=2\n1BAD=x");
    expect(result.duplicates).toEqual(["A"]);
    expect(result.errors.join(" ")).toMatch(/invalid variable name/);
  });
  it("converts env to JSON and YAML", () => {
    const entries = parseDotEnv("B=2\nA=1").entries;
    expect(convertEnvironment(entries, "json", { sort: true })).toBe(
      '{\n  "A": "1",\n  "B": "2"\n}',
    );
    expect(convertEnvironment(entries, "yaml")).toContain('B: "2"');
  });
  it("converts JSON and YAML to env", () => {
    expect(parseEnvironment('{"A":1,"EMPTY":""}', "json").entries).toEqual([
      { key: "A", value: "1" },
      { key: "EMPTY", value: "" },
    ]);
    expect(parseEnvironment("A: one", "yaml").entries[0]?.value).toBe("one");
  });
  it("generates shell and Docker Compose output", () => {
    const entries = parseDotEnv("A=hello world").entries;
    expect(convertEnvironment(entries, "shell")).toBe('export A="hello world"');
    expect(convertEnvironment(entries, "docker")).toContain("environment:");
  });
  it("generates ConfigMap and Secret warnings-compatible output", () => {
    const entries = parseDotEnv("TOKEN=hello").entries;
    expect(
      convertEnvironment(entries, "configmap", { name: "demo" }),
    ).toContain("kind: ConfigMap");
    expect(convertEnvironment(entries, "secret", { name: "demo" })).toContain(
      "aGVsbG8=",
    );
  });
  it("parses Docker and ConfigMap structures", () => {
    expect(
      parseEnvironment("environment:\n  - A=1\n  - B=2", "docker").entries,
    ).toHaveLength(2);
    expect(
      parseEnvironment("data:\n  A: one", "configmap").entries[0]?.key,
    ).toBe("A");
  });
  it("masks likely secrets with customizable patterns", () => {
    const entries = parseDotEnv("API_TOKEN=secret\nPUBLIC=value").entries;
    expect(maskEnvironment(entries)[0]?.value).toBe("••••••••");
    expect(maskEnvironment(entries, "PUBLIC")[1]?.value).toBe("••••••••");
  });
  it("rejects malformed inputs and patterns", () => {
    expect(() => parseEnvironment("{", "json")).toThrow();
    expect(() => maskEnvironment([], "[")).toThrow(/valid regular expression/);
  });
});
