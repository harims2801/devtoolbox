declare module "next/dist/compiled/ua-parser-js" {
  export interface UaParserResult {
    ua: string;
    browser: { name?: string; version?: string; major?: string };
    engine: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { vendor?: string; model?: string; type?: string };
    cpu: { architecture?: string };
  }

  export default function parseUserAgent(input?: string): UaParserResult;
}
