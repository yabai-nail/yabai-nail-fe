# Tasks: FE-BE API Map

- [x] `MAP-01` Add failing parity tests
  - Acceptance: Tests require all 8 feature ids, 191 unique total operations, and
    182/9 audience counts.
  - Verify: focused Vitest fails against the current 183-operation FE catalog.
  - Files: `src/service/api/operations.test.ts`.

- [x] `MAP-02` Add the feature operation map
  - Depends on: `MAP-01`.
  - Acceptance: FE exports 164 canonical, 8 feature, 19 legacy, and 191 runtime
    operations with exact backend method/path pairs.
  - Verify: focused Vitest and TypeScript pass.
  - Files: `src/service/api/operations.ts`, `operations.test.ts`.

- [x] `MAP-03` Verify execution boundaries
  - Depends on: `MAP-02`.
  - Acceptance: all 182 app operations resolve; all 9 provider/internal operations
    are rejected by browser path construction.
  - Verify: focused Vitest passes.
  - Files: `operations.test.ts`.

- [x] `MAP-04` Update mapping documentation and run gates
  - Depends on: `MAP-03`.
  - Acceptance: docs report current 191-operation parity and all FE gates pass.
  - Verify: focused tests, TypeScript, lint, and production build.
  - Files: `docs/frontend-api-map.md`, this checklist, relevant docs index.

## Verification evidence — 2026-08-22

- RED: focused Vitest failed while `featureApiOperations` was absent from the
  183-operation FE catalog.
- GREEN: focused Vitest passed: 1 file, 6 tests.
- Full suite passed: 16 files, 56 tests.
- `pnpm exec tsc --noEmit` passed.
- `pnpm lint` passed.
- `pnpm build` passed after allowing access to the existing Google Fonts used by
  the application.
- Backend repository remained unchanged; all implementation files are under
  `yabai-nail-fe`.
