import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { toolRegistry } from "@/config/tool-registry";

describe("available tool implementation contract", () => {
  const availableTools = toolRegistry.filter(
    (tool) => tool.availability === "available",
  );

  it("requires a dedicated page for every available registry entry", () => {
    const missingPages = availableTools
      .filter(
        (tool) =>
          !existsSync(
            join(process.cwd(), "src", "app", "tools", tool.slug, "page.tsx"),
          ),
      )
      .map((tool) => tool.slug);

    expect(missingPages).toEqual([]);
  });

  it("requires a browser workflow for every available tool route", () => {
    const e2eDirectory = join(process.cwd(), "e2e");
    const browserCoverage = readdirSync(e2eDirectory)
      .filter((filename) => filename.endsWith(".spec.ts"))
      .map((filename) => readFileSync(join(e2eDirectory, filename), "utf8"))
      .join("\n");
    const missingWorkflows = availableTools
      .filter((tool) => !browserCoverage.includes(`\"${tool.route}\"`))
      .map((tool) => tool.slug);

    expect(missingWorkflows).toEqual([]);
  });
});
