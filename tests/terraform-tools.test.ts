import { describe, expect, it } from "vitest";
import {
  buildTerraformVariables,
  generateTerraformFiles,
  inferTerraformType,
  parseTerraformInput,
  sanitizeTerraformIdentifier,
  toHcl,
} from "@/lib/terraform-tools";
describe("Terraform variable tools", () => {
  it("infers primitives and collections", () => {
    expect(inferTerraformType("x").type).toBe("string");
    expect(inferTerraformType(2).type).toBe("number");
    expect(inferTerraformType(true).type).toBe("bool");
    expect(inferTerraformType([1, 2]).type).toBe("list(number)");
    expect(inferTerraformType({ a: 1, b: 2 }).type).toBe("map(number)");
    expect(inferTerraformType({ name: "x", port: 2 }).type).toMatch(/^object/);
  });
  it("flags null, empty, mixed, and invalid identifiers", () => {
    expect(inferTerraformType(null).ambiguous).toBe(true);
    expect(inferTerraformType([]).ambiguous).toBe(true);
    expect(inferTerraformType([1, "x"]).warning).toMatch(/Mixed/);
    expect(sanitizeTerraformIdentifier("2 bad.key")).toEqual({
      name: "_2_bad_key",
      renamed: true,
    });
  });
  it("parses all input modes", () => {
    expect(parseTerraformInput('{"port":3}', "json")).toEqual({ port: 3 });
    expect(parseTerraformInput("port: 3", "yaml")).toEqual({ port: 3 });
    expect(parseTerraformInput("port=3", "key-value")).toEqual({ port: 3 });
  });
  it("escapes HCL strings", () => expect(toHcl('a"b\n')).toBe('"a\\"b\\n"'));
  it("generates declarations and files", () => {
    const variables = buildTerraformVariables({ port: 3, secret: "x" });
    variables[1]!.sensitive = true;
    const files = generateTerraformFiles(variables, {
      includeEnvironment: true,
    });
    expect(files.variablesTf).toContain('variable "port"');
    expect(files.tfvars).toContain("port = 3");
    expect(files.tfvarsJson).toContain('"port": 3');
    expect(files.environment).toContain('TF_VAR_secret="••••••••"');
  });
});
