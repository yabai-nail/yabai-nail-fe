# Implementation Plan: FE-BE API Map

## Status

- Capability: `fe-be-api-map`
- Spec: `docs/specs/SPEC-fe-be-api-map.md`
- Task target: `docs/plans/fe-be-api-map-todo.md`
- Backend write boundary: none
- Implementation: complete (2026-08-22)

## Overview

Close the eight-operation drift between the backend runtime and the frontend
catalog while preserving existing canonical and legacy entries.

## Dependency graph

```text
read-only backend inventory
          |
          v
   failing FE parity tests
          |
          v
    feature operation set
          |
          v
  191-operation runtime map
          |
          v
      docs + full gate
```

## Vertical slices

### Slice 1 — RED parity tests

- Assert 8 feature operation ids.
- Assert 191 total unique operations and 182/9 audience counts.

### Slice 2 — FE catalog parity

- Add `featureOperationSource` and `featureApiOperations`.
- Compose canonical, feature, and legacy sets into `runtimeApiOperations`.
- Extend stability type with `feature`.

### Slice 3 — Verification and documentation

- Verify all server-only routes remain blocked.
- Update mapping documentation and task evidence.
- Run focused tests, typecheck, lint, and build.

## Risks

| Risk | Mitigation |
|---|---|
| Accidentally classify feature routes as legacy | Separate exported feature list and assert stability. |
| Duplicate method/path pair | Assert set size equals 191. |
| Server-only route becomes callable | Iterate all non-app operations in tests. |
| Scope expands into UI integration | Do not touch components, domain services, or hooks. |

## Verification

```powershell
pnpm test -- src/service/api/operations.test.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

All commands passed on 2026-08-22. The first sandboxed build could not download
Google Fonts; the approved network-enabled retry completed successfully.
