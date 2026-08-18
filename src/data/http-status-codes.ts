export const HTTP_STATUS_REGISTRY_SOURCE = {
  name: "IANA HTTP Status Code Registry",
  url: "https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml",
  lastUpdated: "2025-09-15",
  snapshotVersion: "2025-09-15.1",
} as const;

export type HttpStatusClassification =
  "standard" | "deprecated" | "non-standard";

export interface HttpStatusEntry {
  code: number;
  title: string;
  category: 1 | 2 | 3 | 4 | 5;
  classification: HttpStatusClassification;
  reference: string;
  explanation: string;
  troubleshooting: string;
  cache?: string;
  auth?: string;
  retry?: string;
  keywords: string[];
}

type RegistryTuple = readonly [
  number,
  string,
  string,
  HttpStatusClassification?,
];

const iana: RegistryTuple[] = [
  [100, "Continue", "RFC 9110 §15.2.1"],
  [101, "Switching Protocols", "RFC 9110 §15.2.2"],
  [102, "Processing", "RFC 2518"],
  [103, "Early Hints", "RFC 8297"],
  [
    104,
    "Upload Resumption Supported",
    "Temporary registration; draft-ietf-httpbis-resumable-upload-05",
  ],
  [200, "OK", "RFC 9110 §15.3.1"],
  [201, "Created", "RFC 9110 §15.3.2"],
  [202, "Accepted", "RFC 9110 §15.3.3"],
  [203, "Non-Authoritative Information", "RFC 9110 §15.3.4"],
  [204, "No Content", "RFC 9110 §15.3.5"],
  [205, "Reset Content", "RFC 9110 §15.3.6"],
  [206, "Partial Content", "RFC 9110 §15.3.7"],
  [207, "Multi-Status", "RFC 4918"],
  [208, "Already Reported", "RFC 5842"],
  [226, "IM Used", "RFC 3229"],
  [300, "Multiple Choices", "RFC 9110 §15.4.1"],
  [301, "Moved Permanently", "RFC 9110 §15.4.2"],
  [302, "Found", "RFC 9110 §15.4.3"],
  [303, "See Other", "RFC 9110 §15.4.4"],
  [304, "Not Modified", "RFC 9110 §15.4.5"],
  [305, "Use Proxy", "RFC 9110 §15.4.6", "deprecated"],
  [306, "Unused", "RFC 9110 §15.4.7", "deprecated"],
  [307, "Temporary Redirect", "RFC 9110 §15.4.8"],
  [308, "Permanent Redirect", "RFC 9110 §15.4.9"],
  [400, "Bad Request", "RFC 9110 §15.5.1"],
  [401, "Unauthorized", "RFC 9110 §15.5.2"],
  [402, "Payment Required", "RFC 9110 §15.5.3"],
  [403, "Forbidden", "RFC 9110 §15.5.4"],
  [404, "Not Found", "RFC 9110 §15.5.5"],
  [405, "Method Not Allowed", "RFC 9110 §15.5.6"],
  [406, "Not Acceptable", "RFC 9110 §15.5.7"],
  [407, "Proxy Authentication Required", "RFC 9110 §15.5.8"],
  [408, "Request Timeout", "RFC 9110 §15.5.9"],
  [409, "Conflict", "RFC 9110 §15.5.10"],
  [410, "Gone", "RFC 9110 §15.5.11"],
  [411, "Length Required", "RFC 9110 §15.5.12"],
  [412, "Precondition Failed", "RFC 9110 §15.5.13"],
  [413, "Content Too Large", "RFC 9110 §15.5.14"],
  [414, "URI Too Long", "RFC 9110 §15.5.15"],
  [415, "Unsupported Media Type", "RFC 9110 §15.5.16"],
  [416, "Range Not Satisfiable", "RFC 9110 §15.5.17"],
  [417, "Expectation Failed", "RFC 9110 §15.5.18"],
  [418, "Unused", "RFC 9110 §15.5.19", "deprecated"],
  [421, "Misdirected Request", "RFC 9110 §15.5.20"],
  [422, "Unprocessable Content", "RFC 9110 §15.5.21"],
  [423, "Locked", "RFC 4918"],
  [424, "Failed Dependency", "RFC 4918"],
  [425, "Too Early", "RFC 8470"],
  [426, "Upgrade Required", "RFC 9110 §15.5.22"],
  [428, "Precondition Required", "RFC 6585"],
  [429, "Too Many Requests", "RFC 6585"],
  [431, "Request Header Fields Too Large", "RFC 6585"],
  [451, "Unavailable For Legal Reasons", "RFC 7725"],
  [500, "Internal Server Error", "RFC 9110 §15.6.1"],
  [501, "Not Implemented", "RFC 9110 §15.6.2"],
  [502, "Bad Gateway", "RFC 9110 §15.6.3"],
  [503, "Service Unavailable", "RFC 9110 §15.6.4"],
  [504, "Gateway Timeout", "RFC 9110 §15.6.5"],
  [505, "HTTP Version Not Supported", "RFC 9110 §15.6.6"],
  [506, "Variant Also Negotiates", "RFC 2295"],
  [507, "Insufficient Storage", "RFC 4918"],
  [508, "Loop Detected", "RFC 5842"],
  [510, "Not Extended", "RFC 2774; obsolete", "deprecated"],
  [511, "Network Authentication Required", "RFC 6585"],
];

const observed: RegistryTuple[] = [
  [419, "Page Expired", "Common framework convention", "non-standard"],
  [
    420,
    "Enhance Your Calm / Method Failure",
    "Observed vendor conventions",
    "non-standard",
  ],
  [444, "No Response", "Observed nginx convention", "non-standard"],
  [499, "Client Closed Request", "Observed nginx convention", "non-standard"],
  [
    520,
    "Web Server Returned an Unknown Error",
    "Observed CDN convention",
    "non-standard",
  ],
  [521, "Web Server Is Down", "Observed CDN convention", "non-standard"],
  [522, "Connection Timed Out", "Observed CDN convention", "non-standard"],
  [523, "Origin Is Unreachable", "Observed CDN convention", "non-standard"],
  [524, "A Timeout Occurred", "Observed CDN convention", "non-standard"],
  [525, "SSL Handshake Failed", "Observed CDN convention", "non-standard"],
  [526, "Invalid SSL Certificate", "Observed CDN convention", "non-standard"],
];

const explanations: Record<number, string> = {
  100: "The server received the request headers and invites the client to send the body.",
  103: "The server provides preliminary links that a client may preload before the final response.",
  200: "The request succeeded; the representation and meaning depend on the request method.",
  201: "The request succeeded and created one or more resources, usually identified by Location.",
  202: "The request was accepted for processing, but processing has not necessarily completed.",
  204: "The request succeeded and intentionally has no response content.",
  206: "The response contains one or more requested byte ranges rather than the full representation.",
  301: "The resource has a new permanent target and clients can update stored references.",
  302: "The resource is temporarily available at another URI.",
  304: "A conditional request confirmed the cached representation is still valid; no content is sent.",
  307: "The request should be repeated temporarily at another URI without changing its method.",
  308: "The request should be repeated permanently at another URI without changing its method.",
  400: "The server cannot process the request because its syntax or framing is invalid.",
  401: "The request lacks valid authentication credentials and the response should include a challenge.",
  403: "The server understood the request but refuses to authorize it.",
  404: "The server did not find a current representation for the target resource.",
  405: "The target resource does not support the request method; Allow should list supported methods.",
  408: "The server timed out while waiting for the client to complete the request.",
  409: "The request conflicts with the current state of the target resource.",
  410: "The target resource is intentionally no longer available and this is likely permanent.",
  412: "A request precondition such as If-Match evaluated to false.",
  413: "The request content exceeds a limit the server is willing or able to process.",
  415: "The request content format or content coding is not supported for this target.",
  422: "The content is syntactically valid but cannot be processed as instructed.",
  425: "The server declines to risk processing a request that might be replayed as early data.",
  428: "The server requires a conditional request to avoid a lost update.",
  429: "The client sent too many requests within the server's policy window.",
  451: "Access is denied because of a legal demand or restriction.",
  500: "The server encountered an unexpected condition that prevented completion.",
  501: "The server does not support the functionality required to fulfill the request.",
  502: "A gateway or proxy received an invalid response from an upstream server.",
  503: "The server is temporarily unable to handle the request, often because of overload or maintenance.",
  504: "A gateway or proxy did not receive a timely response from an upstream server.",
  511: "A network intermediary requires authentication, commonly for a captive portal.",
};

const troubleshooting: Record<number, string> = {
  401: "Inspect the WWW-Authenticate challenge, credential scope, expiry, and clock skew.",
  403: "Check authorization policy and resource ownership; repeatedly changing credentials may not help.",
  404: "Verify routing, identifier encoding, deployment version, and whether disclosure is intentionally hidden.",
  409: "Fetch current state, reconcile the conflict, and retry only with an appropriate concurrency strategy.",
  422: "Inspect field-level validation errors and domain rules rather than retrying the same content.",
  429: "Reduce request rate and honor Retry-After when supplied; add jitter to coordinated clients.",
  500: "Correlate the request with server logs and traces; avoid exposing internal exception details.",
  502: "Check gateway-to-origin DNS, TLS, connection reuse, and upstream response validity.",
  503: "Check capacity, health checks, maintenance state, and dependency availability.",
  504: "Trace latency across the gateway and origin, then align timeouts without masking a slow dependency.",
};

const implications: Record<
  number,
  Pick<HttpStatusEntry, "cache" | "auth" | "retry">
> = {
  204: {
    cache:
      "Cacheable by default under HTTP semantics, unless method or explicit controls say otherwise.",
  },
  301: {
    cache:
      "Often heuristically cacheable; explicit Cache-Control remains clearer.",
  },
  304: {
    cache:
      "Updates stored response metadata; reuse the cached content rather than treating this as an empty 200.",
  },
  401: {
    auth: "A WWW-Authenticate challenge is expected; send credentials only to the intended origin and scheme.",
  },
  404: {
    cache:
      "Can be heuristically cached, so temporary absence may need explicit controls.",
  },
  407: {
    auth: "Proxy-Authenticate challenges proxy credentials, distinct from origin authentication.",
  },
  408: {
    retry:
      "A new connection and retry can be reasonable for replay-safe requests; consider body replay and idempotency.",
  },
  410: {
    cache:
      "Can be heuristically cached and signals a more permanent absence than 404.",
  },
  425: {
    retry:
      "Retry after the early-data risk has passed, normally without 0-RTT.",
  },
  429: {
    retry:
      "Retry-After may indicate a delay; rate-limit policies and safe retry behavior remain application-specific.",
  },
  500: {
    retry:
      "Retry only when the operation is safe or idempotency is enforced, preferably with bounded backoff.",
  },
  502: {
    retry:
      "A bounded retry may help for a transient upstream failure, subject to method safety and budgets.",
  },
  503: {
    retry:
      "Retry-After may be supplied; use bounded backoff and avoid amplifying overload.",
  },
  504: {
    retry:
      "The origin might still have processed the request, so retry only with idempotency safeguards.",
  },
  511: {
    auth: "Authenticate with the intercepting network portal, not by sending origin credentials to it.",
  },
};

function categoryName(category: number) {
  return [
    "",
    "informational",
    "success",
    "redirection",
    "client error",
    "server error",
  ][category]!;
}

function entry(tuple: RegistryTuple): HttpStatusEntry {
  const [code, title, reference, classification = "standard"] = tuple,
    category = Math.floor(code / 100) as HttpStatusEntry["category"];
  return {
    code,
    title,
    category,
    classification,
    reference,
    explanation:
      explanations[code] ??
      `${title} is a ${classification === "non-standard" ? "commonly observed, non-standard" : "registered"} ${categoryName(category)} response. Consult the cited specification or implementation for its precise conditions.`,
    troubleshooting:
      troubleshooting[code] ??
      `Confirm the response was generated by the expected hop, then inspect request context, response headers, and ${category >= 5 ? "upstream/server" : "client/resource"} logs.`,
    ...implications[code],
    keywords: [categoryName(category), classification, title, reference],
  };
}

export const HTTP_STATUS_CODES: readonly HttpStatusEntry[] = [
  ...iana,
  ...observed,
]
  .map(entry)
  .sort((left, right) => left.code - right.code);
