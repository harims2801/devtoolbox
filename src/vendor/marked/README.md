# Vendored Marked

This directory contains the TypeScript source for Marked 18.0.10, pinned from
commit `8698d35b84c17f86ea8a299a6183d47ccb3d2bd7` in
https://github.com/markedjs/marked.

The source is vendored because package-registry access is unavailable in the
build workspace. The only local change to the upstream TypeScript files is a
first-line `@ts-nocheck` compatibility boundary for this application's stricter
`noUncheckedIndexedAccess` setting. See `LICENSE` for upstream license terms.
