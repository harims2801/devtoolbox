import YAML from "yaml";

export type ComposeSeverity = "error" | "warning" | "info";

export interface ComposeFinding {
  severity: ComposeSeverity;
  path: string;
  service?: string;
  message: string;
}

export interface ComposeReport {
  findings: ComposeFinding[];
  formatted: string;
  services: string[];
  summary: Record<ComposeSeverity, number>;
}

type Mapping = Record<string, unknown>;

function mapping(value: unknown): value is Mapping {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function depth(value: unknown, seen = new Set<unknown>()): number {
  if (!value || typeof value !== "object") return 0;
  if (seen.has(value)) return 0;
  seen.add(value);
  return (
    1 +
    Math.max(
      0,
      ...Object.values(value as Mapping).map((child) => depth(child, seen)),
    )
  );
}

function shortPortValid(value: string) {
  return /^(?:\d{1,5}(?:\.\d{1,3}){3}:)?(?:\d{1,5}(?:-\d{1,5})?:)?\d{1,5}(?:-\d{1,5})?(?:\/(?:tcp|udp))?$/.test(
    value,
  );
}

function publishedPort(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const withoutProtocol = value.replace(/\/(?:tcp|udp)$/, ""),
      parts = withoutProtocol.split(":");
    return parts.length > 1 ? parts.at(-2) : undefined;
  }
  if (
    mapping(value) &&
    (typeof value.published === "string" || typeof value.published === "number")
  )
    return String(value.published);
  return undefined;
}

function namedSource(value: string) {
  return (
    value !== "" &&
    !value.startsWith(".") &&
    !value.startsWith("/") &&
    !value.includes("\\")
  );
}

export function validateDockerCompose(source: string): ComposeReport {
  if (source.length > 1_000_000)
    throw new Error("Compose file exceeds the 1 MB local limit.");
  const document = YAML.parseDocument(source, {
      strict: true,
      uniqueKeys: true,
    }),
    findings: ComposeFinding[] = [];
  for (const error of document.errors)
    findings.push({ severity: "error", path: "$", message: error.message });
  if (document.errors.length)
    return {
      findings,
      formatted: "",
      services: [],
      summary: summarize(findings),
    };

  let root: unknown;
  try {
    root = document.toJS({ maxAliasCount: 50 });
  } catch (caught) {
    findings.push({
      severity: "error",
      path: "$",
      message:
        caught instanceof Error
          ? caught.message
          : "YAML aliases exceed the safe expansion limit.",
    });
    return {
      findings,
      formatted: "",
      services: [],
      summary: summarize(findings),
    };
  }
  if (depth(root) > 40)
    findings.push({
      severity: "error",
      path: "$",
      message: "Compose nesting exceeds the 40-level safety limit.",
    });
  if (!mapping(root)) {
    findings.push({
      severity: "error",
      path: "$",
      message: "A Compose document must be a YAML mapping.",
    });
    return {
      findings,
      formatted: document.toString(),
      services: [],
      summary: summarize(findings),
    };
  }
  const add = (
    severity: ComposeSeverity,
    path: string,
    message: string,
    service?: string,
  ) => findings.push({ severity, path, message, service });
  if (Object.hasOwn(root, "version"))
    add(
      "warning",
      "$.version",
      "The top-level version field is obsolete in the current Compose Specification.",
    );
  if (!mapping(root.services) || Object.keys(root.services).length === 0) {
    add("error", "$.services", "services must be a non-empty mapping.");
    return {
      findings,
      formatted: document.toString(),
      services: [],
      summary: summarize(findings),
    };
  }
  const services = root.services,
    serviceNames = Object.keys(services),
    declaredVolumes = mapping(root.volumes)
      ? new Set(Object.keys(root.volumes))
      : new Set<string>(),
    declaredNetworks = mapping(root.networks)
      ? new Set(Object.keys(root.networks))
      : new Set<string>(),
    portsSeen = new Map<string, string>();

  for (const [name, rawService] of Object.entries(services)) {
    const base = `$.services.${name}`;
    if (!mapping(rawService)) {
      add("error", base, "A service definition must be a mapping.", name);
      continue;
    }
    const service = rawService;
    if (
      typeof service.image !== "string" &&
      !mapping(service.build) &&
      typeof service.build !== "string"
    )
      add("warning", base, "Specify image or build for this service.", name);
    if (
      typeof service.image === "string" &&
      (mapping(service.build) || typeof service.build === "string")
    )
      add(
        "info",
        base,
        "Both build and image are set; Compose will tag the built image with this name.",
        name,
      );

    if (service.ports !== undefined) {
      if (!Array.isArray(service.ports))
        add("error", `${base}.ports`, "ports must be a sequence.", name);
      else
        service.ports.forEach((port, index) => {
          const path = `${base}.ports[${index}]`;
          if (!(
            (typeof port === "string" && shortPortValid(port)) ||
            (typeof port === "number" && port > 0 && port <= 65535) ||
            (mapping(port) &&
              (typeof port.target === "number" ||
                typeof port.target === "string"))
          ))
            add(
              "error",
              path,
              "Use a valid short port string, port number, or long syntax with target.",
              name,
            );
          const published = publishedPort(port);
          if (published) {
            const owner = portsSeen.get(published);
            if (owner)
              add(
                "warning",
                path,
                `Published port ${published} is also used by service ${owner}.`,
                name,
              );
            else portsSeen.set(published, name);
          }
        });
    }

    if (service.volumes !== undefined) {
      if (!Array.isArray(service.volumes))
        add("error", `${base}.volumes`, "volumes must be a sequence.", name);
      else
        service.volumes.forEach((volume, index) => {
          const path = `${base}.volumes[${index}]`;
          let sourceName: string | undefined, target: unknown;
          if (typeof volume === "string") {
            const parts = volume.split(":");
            if (parts.length === 1) target = parts[0];
            else if (parts.length <= 3) [sourceName, target] = parts;
            else
              add(
                "error",
                path,
                "The short volume syntax has too many colon-separated fields.",
                name,
              );
          } else if (mapping(volume)) {
            sourceName =
              typeof volume.source === "string" ? volume.source : undefined;
            target = volume.target;
          } else
            add(
              "error",
              path,
              "Use a short volume string or long syntax mapping.",
              name,
            );
          if (typeof target !== "string" || !target.startsWith("/"))
            add(
              "error",
              path,
              "A volume target must be an absolute container path.",
              name,
            );
          if (
            sourceName &&
            namedSource(sourceName) &&
            !declaredVolumes.has(sourceName)
          )
            add(
              "error",
              path,
              `Named volume ${sourceName} is not declared at the top level.`,
              name,
            );
        });
    }

    const networkNames = Array.isArray(service.networks)
      ? service.networks
      : mapping(service.networks)
        ? Object.keys(service.networks)
        : service.networks === undefined
          ? []
          : null;
    if (networkNames === null)
      add(
        "error",
        `${base}.networks`,
        "networks must be a sequence or mapping.",
        name,
      );
    else
      for (const network of networkNames)
        if (
          typeof network !== "string" ||
          (!declaredNetworks.has(network) && network !== "default")
        )
          add(
            "error",
            `${base}.networks`,
            `Network ${String(network)} is not declared at the top level.`,
            name,
          );

    const dependencies = Array.isArray(service.depends_on)
      ? service.depends_on
      : mapping(service.depends_on)
        ? Object.keys(service.depends_on)
        : service.depends_on === undefined
          ? []
          : null;
    if (dependencies === null)
      add(
        "error",
        `${base}.depends_on`,
        "depends_on must be a sequence or mapping.",
        name,
      );
    else
      for (const dependency of dependencies)
        if (
          typeof dependency !== "string" ||
          !serviceNames.includes(dependency)
        )
          add(
            "error",
            `${base}.depends_on`,
            `Dependency ${String(dependency)} does not name a defined service.`,
            name,
          );

    if (service.healthcheck !== undefined) {
      if (!mapping(service.healthcheck))
        add(
          "error",
          `${base}.healthcheck`,
          "healthcheck must be a mapping.",
          name,
        );
      else if (
        service.healthcheck.disable !== true &&
        !(
          typeof service.healthcheck.test === "string" ||
          (Array.isArray(service.healthcheck.test) &&
            service.healthcheck.test.every((part) => typeof part === "string"))
        )
      )
        add(
          "error",
          `${base}.healthcheck.test`,
          "Provide a string/sequence test or set disable: true.",
          name,
        );
    }
    if (
      service.restart !== undefined &&
      (typeof service.restart !== "string" ||
        !/^(?:no|always|unless-stopped|on-failure(?::\d+)?)$/.test(
          service.restart,
        ))
    )
      add(
        "error",
        `${base}.restart`,
        "Use no, always, unless-stopped, or on-failure[:max-retries].",
        name,
      );

    if (service.environment !== undefined) {
      const environment = service.environment;
      if (!(
        (Array.isArray(environment) &&
          environment.every((entry) => typeof entry === "string")) ||
        (mapping(environment) &&
          Object.values(environment).every(
            (value) =>
              value === null ||
              ["string", "number", "boolean"].includes(typeof value),
          ))
      ))
        add(
          "error",
          `${base}.environment`,
          "environment must be a string sequence or scalar-value mapping.",
          name,
        );
      if (mapping(environment))
        for (const [key, value] of Object.entries(environment)) {
          if (
            /secret|password|token|api[_-]?key/i.test(key) &&
            value !== null &&
            value !== ""
          )
            add(
              "warning",
              `${base}.environment.${key}`,
              "A secret-shaped variable contains an inline value; use a secret provider. Value was not expanded or included in this finding.",
              name,
            );
          if (typeof value === "string" && value.includes("${"))
            add(
              "info",
              `${base}.environment.${key}`,
              "Environment interpolation was intentionally not performed.",
              name,
            );
        }
    }
  }
  return {
    findings,
    formatted: document.toString(),
    services: serviceNames,
    summary: summarize(findings),
  };
}

function summarize(findings: ComposeFinding[]) {
  const summary = { error: 0, warning: 0, info: 0 } satisfies Record<
    ComposeSeverity,
    number
  >;
  for (const finding of findings) summary[finding.severity]++;
  return summary;
}

export function formatComposeReport(report: ComposeReport) {
  return JSON.stringify(
    {
      services: report.services,
      summary: report.summary,
      findings: report.findings,
    },
    null,
    2,
  );
}
