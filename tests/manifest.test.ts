import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
describe("PWA manifest", () => {
  it("is installable and declares required icons", () => {
    const value = manifest();
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192" }),
        expect.objectContaining({ sizes: "512x512" }),
      ]),
    );
  });
});
