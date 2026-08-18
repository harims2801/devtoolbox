"use client";
import { useMemo, useState } from "react";
import { Network } from "lucide-react";
import { RegisteredToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/tools/output-panel";
import {
  CopyButton,
  DownloadButton,
  ExampleButton,
  ResetButton,
} from "@/components/tools/tool-actions";
import { Button } from "@/components/ui/button";
import { getToolById } from "@/config/tool-registry";
import {
  calculateIPv4,
  cidrOverlap,
  containsIPv4,
  expandIPv6,
  maskToPrefix,
  prefixToMask,
  bigIntToIPv4,
  subnetIPv4,
} from "@/lib/ip-tools";
export function CidrCalculatorTool() {
  const tool = getToolById("cidr-ip-calculator");
  if (!tool) throw new Error("CIDR calculator metadata is missing");
  const [cidr, setCidr] = useState("192.168.10.42/24"),
    [contains, setContains] = useState("192.168.10.100"),
    [other, setOther] = useState("192.168.10.128/25"),
    [newPrefix, setNewPrefix] = useState(26),
    [page, setPage] = useState(0),
    [mask, setMask] = useState("255.255.255.0"),
    [ipv6, setIpv6] = useState("2001:db8::1/64");
  const result = useMemo(() => {
    try {
      return { value: calculateIPv4(cidr), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid CIDR.",
      };
    }
  }, [cidr]);
  const subnets = useMemo(() => {
    try {
      return subnetIPv4(cidr, newPrefix, page * 20, 20);
    } catch {
      return { items: [], total: 0n, next: null };
    }
  }, [cidr, newPrefix, page]);
  const v6 = useMemo(() => {
    try {
      return { value: expandIPv6(ipv6), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid IPv6.",
      };
    }
  }, [ipv6]);
  const value = result.value,
    csv = "subnet\n" + subnets.items.join("\n") + "\n";
  return (
    <RegisteredToolLayout
      tool={tool}
      inputLabel="Network input"
      outputLabel="Calculated network"
      toolbar={
        <>
          <Button>
            <Network />
            Calculate locally
          </Button>
          <ExampleButton onLoad={() => setCidr("192.168.10.42/24")} />
          <ResetButton
            label="Reset"
            onReset={() => {
              setCidr("");
              setPage(0);
            }}
          />
        </>
      }
      input={
        <section
          aria-label="CIDR inputs"
          className="bg-card min-h-80 space-y-4 rounded-xl border p-5"
        >
          <label htmlFor="cidr-input">IPv4 address with prefix</label>
          <input
            id="cidr-input"
            className="bg-background h-10 w-full rounded border px-3 font-mono"
            value={cidr}
            onChange={(e) => {
              setCidr(e.target.value);
              setPage(0);
            }}
          />
          {result.error ? (
            <p role="alert" className="text-destructive">
              {result.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Contains IP?
              <input
                className="mt-1 w-full rounded border px-2 py-1 font-mono"
                value={contains}
                onChange={(e) => setContains(e.target.value)}
              />
              <span className="block text-sm">
                {value
                  ? (() => {
                      try {
                        return containsIPv4(cidr, contains) ? "Yes" : "No";
                      } catch {
                        return "Invalid IP";
                      }
                    })()
                  : "—"}
              </span>
            </label>
            <label>
              Overlap CIDR
              <input
                className="mt-1 w-full rounded border px-2 py-1 font-mono"
                value={other}
                onChange={(e) => setOther(e.target.value)}
              />
              <span className="block text-sm">
                {value
                  ? (() => {
                      try {
                        return cidrOverlap(cidr, other)
                          ? "Overlaps"
                          : "Does not overlap";
                      } catch {
                        return "Invalid CIDR";
                      }
                    })()
                  : "—"}
              </span>
            </label>
          </div>
          <label>
            Subnet into prefix /
            <input
              className="ml-2 w-20 rounded border px-2"
              type="number"
              min={value?.prefix ?? 0}
              max={32}
              value={newPrefix}
              onChange={(e) => {
                setNewPrefix(Number(e.target.value));
                setPage(0);
              }}
            />
          </label>
          <label>
            Subnet mask to CIDR
            <input
              className="mt-1 w-full rounded border px-2 py-1 font-mono"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
            />
            <span className="block text-sm">
              {(() => {
                try {
                  return `/${maskToPrefix(mask)}`;
                } catch {
                  return "Invalid mask";
                }
              })()}
            </span>
          </label>
          <section className="border-t pt-4">
            <h3 className="font-semibold">IPv6 parsing</h3>
            <input
              aria-label="IPv6 address"
              className="mt-2 w-full rounded border px-2 py-1 font-mono"
              value={ipv6}
              onChange={(e) => setIpv6(e.target.value)}
            />
            {v6.error ? (
              <p role="alert" className="text-destructive">
                {v6.error}
              </p>
            ) : v6.value ? (
              <dl className="mt-2 text-sm">
                <dt>Expanded</dt>
                <dd className="font-mono break-all">{v6.value.expanded}</dd>
                <dt>Compressed</dt>
                <dd className="font-mono">
                  {v6.value.compressed}/{v6.value.prefix}
                </dd>
                <dt>Type</dt>
                <dd>{v6.value.type}</dd>
              </dl>
            ) : null}
            <p className="text-muted-foreground mt-2 text-xs">
              IPv6 has no IPv4-style broadcast address.
            </p>
          </section>
        </section>
      }
      output={
        <OutputPanel
          title="IPv4 results"
          isEmpty={!value}
          toolbar={
            <>
              {value ? (
                <CopyButton
                  label="Copy network"
                  text={`${value.network}/${value.prefix}`}
                />
              ) : null}
              <DownloadButton
                content={csv}
                filename="subnets.csv"
                label="Export CSV"
              />
            </>
          }
        >
          <>
            {value ? (
              <div className="space-y-4">
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Network", value.network],
                    ["Broadcast", value.broadcast],
                    ["Subnet mask", value.subnetMask],
                    ["Wildcard mask", value.wildcardMask],
                    ["First usable", value.firstUsable],
                    ["Last usable", value.lastUsable],
                    ["Total addresses", value.totalAddresses.toString()],
                    ["Traditional usable hosts", value.usableHosts.toString()],
                    ["Prefix", `/${value.prefix}`],
                    ["Binary", value.binary],
                    ["CIDR to mask", bigIntToIPv4(prefixToMask(value.prefix))],
                  ].map(([label, item]) => (
                    <div className="rounded border p-2" key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-mono break-all">{item}</dd>
                    </div>
                  ))}
                </dl>
                {value.pointToPoint ? (
                  <p className="rounded bg-blue-50 p-3 text-sm text-blue-950">
                    /31 is commonly used for point-to-point links; both
                    addresses are usable and there is no traditional
                    network/broadcast reservation.
                  </p>
                ) : value.prefix === 32 ? (
                  <p className="rounded bg-blue-50 p-3 text-sm text-blue-950">
                    /32 represents one host address.
                  </p>
                ) : null}
                <section>
                  <h3 className="font-semibold">
                    Generated subnets ({subnets.total.toString()})
                  </h3>
                  <ol className="mt-2 font-mono text-sm">
                    {subnets.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((x) => x - 1)}
                    >
                      Previous
                    </button>
                    <button
                      disabled={subnets.next === null}
                      onClick={() => setPage((x) => x + 1)}
                    >
                      Next
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        </OutputPanel>
      }
      instructions={
        <p>
          All IPv4 calculations use BigInt bit operations rather than
          floating-point arithmetic. Subnet pages contain up to 20 rows. IPv6
          support validates, expands, compresses, reports the prefix and a basic
          address type without inventing broadcast concepts.
        </p>
      }
    />
  );
}
