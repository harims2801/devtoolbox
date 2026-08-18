export function StructuredData({ value }: { value: Record<string, unknown> }) {
  return (
    <script type="application/ld+json">
      {JSON.stringify(value).replace(/</g, "\\u003c")}
    </script>
  );
}
