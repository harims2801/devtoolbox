import YAML from "yaml";

export const KUBERNETES_VERSIONS = ["1.30", "1.29", "1.28"] as const;
export type KubernetesRule =
  | "resources"
  | "latest-tag"
  | "privileged"
  | "host-namespaces"
  | "root"
  | "probes"
  | "security-context"
  | "namespace"
  | "labels"
  | "node-port"
  | "wildcard-rbac";
export const KUBERNETES_RULES: { id: KubernetesRule; label: string }[] = [
  { id: "resources", label: "Resource requests and limits" },
  { id: "latest-tag", label: "Latest image tags" },
  { id: "privileged", label: "Privileged containers" },
  { id: "host-namespaces", label: "Host network, PID, and IPC" },
  { id: "root", label: "Running as root" },
  { id: "probes", label: "Readiness and liveness probes" },
  { id: "security-context", label: "Security context" },
  { id: "namespace", label: "Namespace" },
  { id: "labels", label: "Recommended labels" },
  { id: "node-port", label: "NodePort services" },
  { id: "wildcard-rbac", label: "Wildcard RBAC permissions" },
];
export interface KubernetesFinding {
  document: number;
  kind?: string;
  name?: string;
  path: string;
  message: string;
  type: "syntax" | "schema" | "recommendation";
  rule?: KubernetesRule;
}
export interface KubernetesReport {
  version: string;
  resources: {
    document: number;
    kind: string;
    apiVersion: string;
    name: string;
  }[];
  errors: KubernetesFinding[];
  recommendations: KubernetesFinding[];
  formatted: string;
}
interface KubernetesObject {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec?: KubernetesSpec;
  rules?: Array<{
    verbs?: string[];
    resources?: string[];
    apiGroups?: string[];
  }>;
}
interface KubernetesSpec {
  type?: string;
  hostNetwork?: boolean;
  hostPID?: boolean;
  hostIPC?: boolean;
  securityContext?: unknown;
  template?: { spec?: KubernetesSpec };
  containers?: Array<{
    image?: string;
    resources?: { requests?: unknown; limits?: unknown };
    securityContext?: { privileged?: boolean; runAsNonRoot?: boolean };
    readinessProbe?: unknown;
    livenessProbe?: unknown;
  }>;
}

function depth(value: unknown, seen = new Set<unknown>()): number {
  if (!value || typeof value !== "object") return 0;
  if (seen.has(value)) return 0;
  seen.add(value);
  return (
    1 +
    Math.max(
      0,
      ...Object.values(value as Record<string, unknown>).map((item) =>
        depth(item, seen),
      ),
    )
  );
}
function podSpec(value: KubernetesObject) {
  return value.kind === "Pod" ? value.spec : value.spec?.template?.spec;
}
function finding(
  document: number,
  value: KubernetesObject,
  path: string,
  message: string,
  type: KubernetesFinding["type"],
  rule?: KubernetesRule,
): KubernetesFinding {
  return {
    document,
    kind: value.kind,
    name: value.metadata?.name,
    path,
    message,
    type,
    rule,
  };
}

export function validateKubernetes(
  source: string,
  version = "1.30",
  disabled: KubernetesRule[] = [],
): KubernetesReport {
  if (source.length > 1_000_000)
    throw new Error("Manifest exceeds the 1 MB local limit.");
  const docs = YAML.parseAllDocuments(source, {
    strict: true,
    uniqueKeys: true,
  });
  const errors: KubernetesFinding[] = [],
    recommendations: KubernetesFinding[] = [],
    resources: KubernetesReport["resources"] = [],
    formatted: string[] = [];
  docs.forEach((doc, index) => {
    const number = index + 1;
    if (doc.errors.length) {
      doc.errors.forEach((error) =>
        errors.push({
          document: number,
          path: "$",
          message: error.message,
          type: "syntax",
        }),
      );
      return;
    }
    const value = doc.toJS({ maxAliasCount: 50 }) as KubernetesObject | null;
    if (!value) return;
    if (depth(value) > 40) {
      errors.push(
        finding(
          number,
          value,
          "$",
          "Manifest nesting exceeds 40 levels.",
          "schema",
        ),
      );
      return;
    }
    if (!value.apiVersion)
      errors.push(
        finding(
          number,
          value,
          "$.apiVersion",
          "apiVersion is required.",
          "schema",
        ),
      );
    if (!value.kind)
      errors.push(
        finding(number, value, "$.kind", "kind is required.", "schema"),
      );
    if (!value.metadata || typeof value.metadata !== "object")
      errors.push(
        finding(number, value, "$.metadata", "metadata is required.", "schema"),
      );
    if (!value.metadata?.name)
      errors.push(
        finding(
          number,
          value,
          "$.metadata.name",
          "metadata.name is required.",
          "schema",
        ),
      );
    if (
      value.kind &&
      ![
        "Pod",
        "Deployment",
        "StatefulSet",
        "DaemonSet",
        "Job",
        "CronJob",
        "Service",
        "ConfigMap",
        "Secret",
        "Role",
        "ClusterRole",
        "RoleBinding",
        "ClusterRoleBinding",
        "Namespace",
        "ServiceAccount",
        "Ingress",
      ].includes(value.kind)
    )
      errors.push(
        finding(
          number,
          value,
          "$.kind",
          "No bundled schema is available for this kind; a CRD may require a custom schema.",
          "schema",
        ),
      );
    resources.push({
      document: number,
      kind: String(value.kind ?? "Unknown"),
      apiVersion: String(value.apiVersion ?? "Unknown"),
      name: String(value.metadata?.name ?? "Unnamed"),
    });
    const add = (rule: KubernetesRule, path: string, message: string) => {
      if (!disabled.includes(rule))
        recommendations.push(
          finding(number, value, path, message, "recommendation", rule),
        );
    };
    if (
      !value.metadata?.namespace &&
      !["Namespace", "ClusterRole", "ClusterRoleBinding", "Node"].includes(
        value.kind ?? "",
      )
    )
      add("namespace", "$.metadata.namespace", "Set an explicit namespace.");
    if (!value.metadata?.labels?.["app.kubernetes.io/name"])
      add(
        "labels",
        "$.metadata.labels",
        "Add recommended app.kubernetes.io labels.",
      );
    if (value.kind === "Service" && value.spec?.type === "NodePort")
      add(
        "node-port",
        "$.spec.type",
        "Review whether a NodePort service is necessary.",
      );
    if (
      ["Role", "ClusterRole"].includes(value.kind ?? "") &&
      value.rules?.some(
        (rule) =>
          rule.verbs?.includes("*") ||
          rule.resources?.includes("*") ||
          rule.apiGroups?.includes("*"),
      )
    )
      add(
        "wildcard-rbac",
        "$.rules",
        "Avoid excessive wildcard RBAC permissions.",
      );
    const spec = podSpec(value);
    if (spec) {
      if (spec.hostNetwork || spec.hostPID || spec.hostIPC)
        add(
          "host-namespaces",
          "$.spec.template.spec",
          "Avoid sharing host namespaces unless required.",
        );
      if (!spec.securityContext)
        add(
          "security-context",
          "$.spec.template.spec.securityContext",
          "Add a pod security context.",
        );
      for (const [i, container] of (spec.containers ?? []).entries()) {
        const base = `$.spec.template.spec.containers[${i}]`;
        if (!container.resources?.requests || !container.resources?.limits)
          add(
            "resources",
            `${base}.resources`,
            "Set both resource requests and limits.",
          );
        if (
          !container.image?.includes(":") ||
          container.image?.endsWith(":latest")
        )
          add(
            "latest-tag",
            `${base}.image`,
            "Pin the image to a non-latest tag or digest.",
          );
        if (container.securityContext?.privileged)
          add(
            "privileged",
            `${base}.securityContext.privileged`,
            "Do not run privileged containers unless required.",
          );
        if (
          !container.securityContext ||
          container.securityContext.runAsNonRoot !== true
        )
          add(
            "root",
            `${base}.securityContext.runAsNonRoot`,
            "Set runAsNonRoot: true.",
          );
        if (!container.readinessProbe || !container.livenessProbe)
          add(
            "probes",
            base,
            "Add readiness and liveness probes where appropriate.",
          );
      }
    }
    formatted.push(doc.toString({ indent: 2 }).trim());
  });
  return {
    version,
    resources,
    errors,
    recommendations,
    formatted: formatted.join("\n---\n") + (formatted.length ? "\n" : ""),
  };
}
