import { describe, expect, it } from "vitest";
import { validateKubernetes } from "@/lib/kubernetes-tools";
const deployment = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\nspec:\n  template:\n    spec:\n      containers:\n        - name: api\n          image: api:latest\n`;
describe("Kubernetes validation", () => {
  it("validates common resources and reports recommendations separately", () => {
    const report = validateKubernetes(deployment);
    expect(report.errors).toHaveLength(0);
    expect(report.resources[0]?.kind).toBe("Deployment");
    expect(report.recommendations.some((x) => x.rule === "latest-tag")).toBe(
      true,
    );
  });
  it("supports multi-document YAML", () =>
    expect(
      validateKubernetes(
        deployment +
          "---\napiVersion: v1\nkind: Service\nmetadata:\n  name: api\nspec:\n  type: NodePort\n",
      ).resources,
    ).toHaveLength(2));
  it("reports malformed manifests and required fields", () => {
    expect(
      validateKubernetes("kind: Pod\nmetadata: {}\n").errors.map((x) => x.path),
    ).toContain("$.apiVersion");
    expect(validateKubernetes("kind: [").errors[0]?.type).toBe("syntax");
  });
  it("can disable a best-practice rule", () =>
    expect(
      validateKubernetes(deployment, "1.30", [
        "latest-tag",
      ]).recommendations.some((x) => x.rule === "latest-tag"),
    ).toBe(false));
  it("warns when a custom resource has no bundled schema", () =>
    expect(
      validateKubernetes(
        "apiVersion: example.io/v1\nkind: Widget\nmetadata:\n  name: one\n",
      ).errors[0]?.message,
    ).toMatch(/custom schema/));
});
