import { describe, expect, it } from "vitest";
import {
  formatComposeReport,
  validateDockerCompose,
} from "@/lib/docker-compose-tools";

const valid = `services:
  web:
    build: .
    image: example/web:1.0
    ports: ["8080:80"]
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: \${DATABASE_URL}
    networks: [app]
  db:
    image: postgres:16
    restart: unless-stopped
    healthcheck:
      test: [CMD-SHELL, pg_isready]
    volumes: [data:/var/lib/postgresql/data]
    networks: [app]
volumes:
  data: {}
networks:
  app: {}
`;

describe("Docker Compose tools", () => {
  it("validates a current multi-service file and formats it", () => {
    const report = validateDockerCompose(valid);
    expect(report.services).toEqual(["web", "db"]);
    expect(report.summary.error).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.summary.info).toBe(2);
    expect(report.formatted).toContain("services:");
  });

  it("supports ordinary anchors and aliases within limits", () => {
    const report = validateDockerCompose(`x-env: &env
  LOG_LEVEL: info
services:
  one:
    image: app:1
    environment: *env
  two:
    image: app:1
    environment: *env
`);
    expect(report.summary.error).toBe(0);
    expect(report.services).toEqual(["one", "two"]);
  });

  it("finds undefined resources and dependencies", () => {
    const report = validateDockerCompose(`services:
  web:
    image: web:1
    depends_on: [missing]
    volumes: [cache:/cache]
    networks: [private]
`);
    expect(report.findings.map((item) => item.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Dependency missing"),
        expect.stringContaining("Named volume cache"),
        expect.stringContaining("Network private"),
      ]),
    );
  });

  it("reports malformed and duplicate ports and malformed volumes", () => {
    const report = validateDockerCompose(`services:
  one:
    image: one:1
    ports: ["8080:80", bad]
    volumes: ["source:relative", "a:b:c:d"]
  two:
    image: two:1
    ports: ["8080:81"]
`);
    expect(
      report.findings.some(
        (item) =>
          item.path === "$.services.one.ports[1]" && item.severity === "error",
      ),
    ).toBe(true);
    expect(
      report.findings.some((item) =>
        item.message.includes("also used by service one"),
      ),
    ).toBe(true);
    expect(
      report.findings.filter((item) => item.path.includes("volumes")).length,
    ).toBeGreaterThan(1);
  });

  it("does not expand or leak secret-shaped values into the report", () => {
    const secret = "super-secret-value-123";
    const report = validateDockerCompose(`services:
  app:
    image: app:1
    environment:
      API_TOKEN: ${secret}
      FROM_HOST: \${HOST_VALUE}
`);
    const exported = formatComposeReport(report);
    expect(
      report.findings.some(
        (item) =>
          item.path.endsWith("API_TOKEN") && item.severity === "warning",
      ),
    ).toBe(true);
    expect(
      report.findings.some((item) =>
        item.message.includes("intentionally not performed"),
      ),
    ).toBe(true);
    expect(exported).not.toContain(secret);
  });

  it("warns about obsolete version and rejects duplicate keys", () => {
    expect(
      validateDockerCompose(
        'version: "3.8"\nservices:\n  app:\n    image: app:1\n',
      ).findings,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.version", severity: "warning" }),
      ]),
    );
    const duplicate = validateDockerCompose(
      "services:\n  app:\n    image: first:1\n    image: second:1\n",
    );
    expect(duplicate.summary.error).toBeGreaterThan(0);
    expect(duplicate.findings[0]?.message).toMatch(
      /Map keys must be unique|unique/i,
    );
  });

  it("blocks excessive alias expansion", () => {
    const aliases = Array.from({ length: 10 }, () => "*a").join(", "),
      nested = Array.from({ length: 10 }, () => "*b").join(", "),
      bomb = `a: &a [x, x, x, x, x, x, x, x, x, x]\nb: &b [${aliases}]\nservices: { app: { image: app:1, environment: { VALUE: [${nested}] } } }\n`;
    const report = validateDockerCompose(bomb);
    expect(report.summary.error).toBeGreaterThan(0);
    expect(
      report.findings.some((item) =>
        /alias|resource exhaustion/i.test(item.message),
      ),
    ).toBe(true);
  });
});
