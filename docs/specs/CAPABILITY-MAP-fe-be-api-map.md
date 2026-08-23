# Capability Map: FE-BE API Map

## Objective

Keep one frontend operation inventory that maps 1:1 to every runtime API exposed
by `yabai-nail-platform`, without changing backend source or wiring APIs into UI
screens.

## Scope

| Module id | Responsibility | Depends on |
|---|---|---|
| `fe-be-api-map` | Mirror all backend runtime method/path pairs in the FE catalog with matching audience and stability metadata. | Existing backend source |

## Contract baseline

- 164 canonical operations from the backend canonical registry.
- 8 accepted feature operations from the backend feature registry.
- 19 controller-only legacy compatibility operations.
- 191 unique runtime method/path pairs in total.
- 182 browser-facing operations.
- 9 provider/internal operations retained for coverage but blocked in browser execution.

## Boundaries

- Only `yabai-nail-fe` source, tests, and documentation may change.
- `yabai-nail-platform` is read-only and remains the source used for comparison.
- This capability does not add service wrappers, hooks, component fetches, or UI
  mutations.

## Build order

`parity-tests -> feature-operation-map -> runtime-catalog-verification -> docs`

## Documents

- `docs/specs/SPEC-fe-be-api-map.md`
- `docs/plans/fe-be-api-map-plan.md`
- `docs/plans/fe-be-api-map-todo.md`
