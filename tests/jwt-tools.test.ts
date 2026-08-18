import { describe, expect, it } from "vitest";

import {
  createExampleJwt,
  encodeJwtSegment,
  formatJwtTimestamp,
  inspectJwt,
} from "@/lib/jwt-tools";

function token(
  payload: Record<string, string | number | boolean | null | string[]>,
  header: Record<string, string> = { alg: "HS256", typ: "JWT" },
) {
  return `${encodeJwtSegment(header)}.${encodeJwtSegment(payload)}.signature`;
}

describe("JWT inspection utilities", () => {
  it("decodes a valid three-segment token and displays the algorithm", () => {
    const result = inspectJwt(token({ sub: "123", exp: 2000 }), 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.value.payload.sub).toBe("123");
    expect(result.value.algorithm).toBe("HS256");
    expect(result.value.tokenType).toBe("JWT");
    expect(result.value.status).toBe("active");
  });

  it("rejects malformed structure and invalid Base64URL", () => {
    expect(inspectJwt("one.two").ok).toBe(false);
    const result = inspectJwt("invalid@.e30.signature");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Base64URL/i);
  });

  it("detects expired and future not-before claims", () => {
    const expired = inspectJwt(token({ exp: 999 }), 1000);
    expect(expired.ok && expired.value.status).toBe("expired");

    const future = inspectJwt(token({ nbf: 1100, exp: 2000 }), 1000);
    expect(future.ok && future.value.status).toBe("not-active-yet");
  });

  it("accepts missing optional claims without inventing values", () => {
    const result = inspectJwt(token({ role: "developer" }), 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.remainingSeconds).toBeUndefined();
    expect(result.value.payload.exp).toBeUndefined();
  });

  it("preserves Unicode claim values", () => {
    const result = inspectJwt(token({ name: "வணக்கம் 👋" }), 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.payload.name).toBe("வணக்கம் 👋");
  });

  it("decodes none only as unverified metadata", () => {
    const result = inspectJwt(token({ sub: "demo" }, { alg: "none" }), 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.algorithm).toBe("none");
  });

  it("formats NumericDate claims and creates a safe example", () => {
    expect(formatJwtTimestamp(0)?.iso).toBe("1970-01-01T00:00:00.000Z");
    const example = inspectJwt(createExampleJwt(1000), 1000);
    expect(example.ok).toBe(true);
    if (!example.ok) return;
    expect(example.value.payload.jti).toBe("demo-token-001");
  });
});
