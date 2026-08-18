import { describe, expect, it } from "vitest";
import { convertCase, tokenizeCaseInput } from "@/lib/case-tools";

function values(input: string) {
  return Object.fromEntries(
    convertCase(input).map((item) => [item.format, item.value]),
  );
}

describe("case tools", () => {
  it("tokenizes acronyms and Pascal/camel boundaries", () => {
    expect(tokenizeCaseInput("XMLHttpRequestAPI")).toEqual([
      "XML",
      "Http",
      "Request",
      "API",
    ]);
    expect(values("XMLHttpRequestAPI")).toMatchObject({
      camelCase: "xmlHttpRequestApi",
      PascalCase: "XmlHttpRequestApi",
      snake_case: "xml_http_request_api",
    });
  });

  it("separates digits predictably", () => {
    expect(tokenizeCaseInput("version2APIResponse404")).toEqual([
      "version",
      "2",
      "API",
      "Response",
      "404",
    ]);
    expect(values("version2APIResponse404")["kebab-case"]).toBe(
      "version-2-api-response-404",
    );
  });

  it("collapses punctuation and multiple separators", () => {
    expect(values("  dev---toolbox__prompt...pack  ")).toMatchObject({
      camelCase: "devToolboxPromptPack",
      "dot.case": "dev.toolbox.prompt.pack",
      "path/case": "dev/toolbox/prompt/pack",
    });
  });

  it("retains and cases Unicode letters deterministically", () => {
    expect(values("ÉclairÜber Straße")).toMatchObject({
      snake_case: "éclair_über_straße",
      "Title Case": "Éclair Über Straße",
      UPPER: "ÉCLAIRÜBER STRASSE",
    });
  });

  it("handles empty and already-converted input", () => {
    expect(convertCase("").every((item) => item.value === "")).toBe(true);
    expect(values("already_converted")).toMatchObject({
      snake_case: "already_converted",
      camelCase: "alreadyConverted",
    });
  });

  it("provides all documented formats", () => {
    expect(values("Dev Toolbox")).toMatchObject({
      camelCase: "devToolbox",
      PascalCase: "DevToolbox",
      snake_case: "dev_toolbox",
      "kebab-case": "dev-toolbox",
      CONSTANT_CASE: "DEV_TOOLBOX",
      "dot.case": "dev.toolbox",
      "path/case": "dev/toolbox",
      "Title Case": "Dev Toolbox",
      "sentence case": "Dev toolbox",
      lower: "dev toolbox",
      UPPER: "DEV TOOLBOX",
    });
  });

  it("round trips token-preserving separator formats", () => {
    const snake = values("API response value").snake_case!;
    expect(values(snake).camelCase).toBe("apiResponseValue");
    expect(values(values(snake)["kebab-case"]!).snake_case).toBe(snake);
  });
});
