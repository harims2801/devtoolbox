# HTTP status registry refresh

The offline snapshot is versioned in `src/data/http-status-codes.ts`. Its current IANA source date is `2025-09-15` and snapshot version is `2025-09-15.1`.

To refresh it:

1. Download the CSV linked from the official IANA HTTP Status Code Registry.
2. Compare every assigned numeric entry, description, reference, temporary expiry, unused entry, and obsolete marker with the `iana` tuples. Do not add unassigned ranges as entries.
3. Update concise explanations and practical notes in original wording. Keep protocol implications conditional; do not turn optional caching, authentication, or retry behavior into universal advice.
4. Review the separately labeled `observed` non-standard list against vendor documentation. Never represent these codes as IANA registrations.
5. Set `lastUpdated` to IANA's displayed registry date and increment `snapshotVersion` when local notes change without an IANA date change.
6. Run the focused HTTP status tests, the offline/no-fetch test, and `pnpm check`. Review the rendered keyboard navigation and filters before merging.

Source: <https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml>
