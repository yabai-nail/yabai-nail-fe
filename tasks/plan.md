# Implementation Plan: YABAI Admin Dashboard

## Status

- Spec: Approved — `SPEC-admin-dashboard.md`
- Plan: Approved and implemented on 2026-08-16
- Task target: `tasks/todo.md`
- Capability id: `admin-dashboard`

## Overview

Xây dựng dashboard quản trị `/admin` theo ảnh tham chiếu, dùng HeroUI v3 cho UI primitives và Heroicons cho icon. Public site được đưa vào route group `(site)` để nhận `ShellNav`/`ShellFooter`; admin nằm trong `(admin)` và nhận `AdminShell`. Top-level root layout tiếp tục sở hữu `<html>`, fonts và providers để chuyển qua lại giữa public/admin không tạo multiple-root-layout full reload.

## Dependency graph

```text
Approved spec
    │
    ├── Safe route migration
    │      ├── (site) pass-through layout + public route batches
    │      └── Root/site shell split + /admin route
    │
    ├── Admin typed fixture data
    │      └── Dashboard panels
    │             └── Responsive composition
    │
    └── Admin shell primitives
           └── Desktop sidebar/header + mobile Drawer
                  └── Integrated /admin dashboard
                         └── Runtime/visual/accessibility review
```

Build order:

`route-migration-a → route-migration-b → shell-split → admin-shell → dashboard-core → dashboard-detail → responsive-polish → verification-review`

## Architecture decisions

1. **One root layout, two nested route groups.** `app/layout.tsx` giữ document/providers. `(site)/layout.tsx` sở hữu public shell; `(admin)/admin/layout.tsx` sở hữu admin shell. Route groups không xuất hiện trong URL và không tạo multiple-root-layout boundary.
2. **Migration in two safe batches.** Tạo pass-through `(site)/layout.tsx` trước, rồi chuyển public route files theo batch trong khi root vẫn render public shell. Sau khi mọi public route đã nằm trong `(site)`, mới chuyển shell ownership. Mỗi checkpoint vẫn giữ public UI hoạt động.
3. **Static server data, client shell interaction.** Fixture dashboard là readonly TypeScript data. Dashboard panels là presentation components. Chỉ `AdminShell/index.tsx` cần client state cho mobile Drawer/profile interactions.
4. **HeroUI compound API.** Dùng `Card.*`, `Dropdown.*`, `Drawer.*`, `Button`, `Avatar`, `Badge`, `Chip`, `Separator` và `ScrollShadow` theo API v3.2.4; Tailwind chỉ điều khiển layout và visual tuning.
5. **Scoped light admin theme.** `.admin-shell` sở hữu admin-specific CSS variables để palette hồng sáng không rò sang public site.
6. **No new dependencies.** Không thêm test runner hoặc asset package; verification dùng toolchain hiện tại và runtime/visual inspection.

## Authoritative references

- Next.js route groups: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Next.js layouts: https://nextjs.org/docs/app/api-reference/file-conventions/layout
- HeroUI Card: https://heroui.com/en/docs/react/components/card
- HeroUI Button: https://heroui.com/en/docs/react/components/button
- HeroUI Dropdown: https://heroui.com/en/docs/react/components/dropdown
- HeroUI Drawer: https://heroui.com/en/docs/react/components/drawer
- HeroUI Avatar: https://heroui.com/en/docs/react/components/avatar
- HeroUI Badge: https://heroui.com/en/docs/react/components/badge
- HeroUI Chip: https://heroui.com/en/docs/react/components/chip

## Task list

### Phase 1: Route foundation

- [x] Task 1 — `route-migration-a`: Create pass-through site group and move four public routes.
- [x] Task 2 — `route-migration-b`: Move remaining booking route and refresh route types.
- [x] Task 3 — `shell-split`: Move public chrome to site layout and create isolated `/admin` route skeleton.

### Checkpoint: Route foundation

- [x] `/`, `/services`, `/designs`, `/branches`, `/booking/services`, `/admin` resolve.
- [x] Public routes retain ShellNav/ShellFooter; `/admin` excludes them.
- [x] Typecheck, lint and production build pass.
- [x] Turbopack dev cache is regenerated after the filesystem migration.

### Phase 2: Admin shell and dashboard

- [x] Task 4 — `admin-shell`: Build desktop/mobile admin navigation and top header using HeroUI.
- [x] Task 5 — `dashboard-core`: Add typed fixtures, KPI cards and dashboard composition.
- [x] Task 6 — `dashboard-detail-a`: Add appointments and revenue panels.
- [x] Task 7 — `dashboard-detail-b`: Add quick actions, notifications, staff and monthly summary panels.

### Checkpoint: Dashboard complete

- [x] All screenshot sections exist with correct hierarchy and fixture content.
- [x] HeroUI primitives compile against installed 3.2.4 types.
- [x] No component exceeds approximately 200 lines.
- [x] Typecheck and lint pass.

### Phase 3: Responsive polish and verification

- [x] Task 8 — `responsive-polish`: Scope admin tokens and tune layouts at target viewports.
- [x] Task 9 — `verification-review`: Run build/runtime checks, visual QA, accessibility inspection and five-axis code review.

### Checkpoint: Complete

- [x] All spec success criteria pass.
- [x] No Critical/Required review findings remain.
- [x] Public UI changes owned by the user remain preserved.

## Verification checkpoints

### After route migration

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

Runtime URLs: `/`, `/services`, `/designs`, `/branches`, `/booking/services`, `/admin`.

### After dashboard composition

```powershell
pnpm exec tsc --noEmit
pnpm run lint
```

Inspect DOM semantics and HeroUI interactive controls before responsive polish.

### Final gate

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm start
```

Verify HTTP status, public/admin shell separation, browser console, keyboard focus and screenshots at `320×800`, `768×1024`, `1024×768`, `1440×900`.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Turbopack keeps stale loader-tree cells while route files move | High | Stop current dev server before migration; use batch moves; remove only generated `.next/dev`; run `next typegen`; restart once route tree is stable. |
| HeroUI v2 examples conflict with installed v3 API | High | Use official v3 docs and installed `.d.ts`; compile after each UI slice. |
| Public shell disappears or duplicates during migration | High | Use temporary pass-through `(site)/layout`; transfer shell ownership only after all public routes are inside the group. |
| Dashboard component becomes monolithic | Medium | Split panels by responsibility and keep composition file under ~200 lines. |
| Admin color tokens leak into public theme | Medium | Scope variables/styles under `.admin-shell`; runtime-check public routes after styling. |
| Screenshot avatar imagery cannot be copied | Low | Use HeroUI Avatar fallback initials; preserve layout density without copyrighted assets. |
| Existing dirty user changes are overwritten | High | Use targeted `apply_patch`; compare git status before/after each phase; never reset or checkout user files. |

## Parallelization

Appointments/revenue panels and utility/staff panels are conceptually independent after fixtures exist. Implementation will remain sequential because they share dashboard composition/data files and the user did not request sub-agent delegation.

## Open questions

None. All spec defaults were approved on 2026-08-16.

## Completion record

- Implementation: Complete
- Type generation, TypeScript, ESLint and production build: Passed
- Runtime routes: 6/6 returned HTTP 200
- Browser QA: Passed at 320×800, 768×1024, 1024×768 and 1440×900
- Accessibility/runtime review: No blocking findings
