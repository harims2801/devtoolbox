import { describe, expect, it } from "vitest";

import { env } from "@/config/env";

describe("environment configuration", () => {
  it("provides a valid application URL", () => {
    expect(() => new URL(env.NEXT_PUBLIC_APP_URL)).not.toThrow();
  });

  it("keeps Kau mode disabled unless explicitly enabled", () => {
    expect(env.NEXT_PUBLIC_ENABLE_KAU_COW).toBe(false);
  });
});
