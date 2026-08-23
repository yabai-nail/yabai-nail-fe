# Spec: FE-BE API Map

Module id: `fe-be-api-map`

## Objective

Update the frontend API operation catalog so every runtime backend operation has
one matching FE entry identified by the exact `METHOD /path` pair. The result is
an inventory and generic execution boundary only; existing pages remain unchanged.

## Tech Stack

- Next.js 16 and TypeScript 5
- Vitest 4
- Existing Axios operation executor
- Backend source files are read-only comparison inputs

## Commands

Run from `D:\tedo-nail\yabai-nail-fe`:

```powershell
pnpm test -- src/service/api/operations.test.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Project Structure

```text
src/service/api/operations.ts       Runtime operation inventory
src/service/api/operations.test.ts  Count, uniqueness, and boundary tests
docs/frontend-api-map.md            Human-readable FE-BE mapping summary
docs/specs/                         Capability and specification
docs/plans/                         Plan, tasks, and evidence
```

## Operation Contract

```ts
interface ApiOperation {
  readonly id: `${ApiMethod} ${string}`;
  readonly method: ApiMethod;
  readonly path: string;
  readonly audience: "app" | "provider" | "internal";
  readonly stability: "canonical" | "feature" | "legacy";
}
```

- `apiOperations`: exactly 164 frozen canonical operations.
- `featureApiOperations`: exactly 8 accepted feature operations.
- `compatibilityApiOperations`: exactly 19 legacy operations.
- `runtimeApiOperations`: concatenation of the three sets, exactly 191 unique ids.
- Paths and methods must match backend source byte-for-byte.
- Browser execution accepts only `audience: "app"`.
- Feature operations use `stability: "feature"`; they are not mislabeled canonical
  or legacy.

## Code Style

Follow the existing declarative source-list pattern:

```ts
const featureOperationSource = `
GET /api/v1/admin/auth/session
`;

export const featureApiOperations = parseOperations(
  featureOperationSource,
  "feature",
);
```

No generated abstraction, dependency, or backend import is introduced.

## Testing Strategy

1. RED tests assert the missing 8 feature operations and the 191 total count.
2. GREEN adds only the accepted feature operation source and composition logic.
3. Tests verify counts, uniqueness, exact operation ids, audience totals, and
   browser rejection for all 9 server-only operations.
4. Run focused tests, typecheck, lint, and production build.

## Boundaries

### Always

- Treat backend `operation-registry.ts` and concrete compatibility controllers as
  read-only comparison sources.
- Preserve the 164 canonical and 19 legacy FE entries.
- Keep exact method/path identity.
- Test every count and browser boundary.

### Ask first

- Adding or removing a backend operation.
- Changing an operation method, path, audience, or stability.
- Adding dependencies or changing UI/service behavior.

### Never

- Edit `yabai-nail-platform` source.
- Fetch every API from UI merely because it is cataloged.
- Allow provider/internal operations through the browser executor.
- Invent DTOs or response fields not defined by the backend.

## Success Criteria

- FE contains all 191 backend runtime operations exactly once.
- Counts are 164 canonical, 8 feature, and 19 legacy.
- Counts are 182 browser-facing and 9 provider/internal.
- The 8 previously missing feature operations resolve through `getApiOperation`.
- All 9 server-only operations are rejected by `buildOperationPath`.
- Focused tests, TypeScript, lint, and build pass.
- Backend working tree remains clean.

## Open Questions

None. Scope is catalog parity only; UI adoption is explicitly excluded.
