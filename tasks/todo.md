# Task List: YABAI Admin Dashboard

## Status

- Completed and verified on 2026-08-16.
- All tasks and checkpoints below passed.

## Task 1: `route-migration-a` — Create site group and move primary routes

**Description:** Add a pass-through `(site)` layout while the root layout still owns public chrome, then move the home, services, designs and branches routes without changing their URLs or behavior.

**Acceptance criteria:**

- [x] `(site)` is omitted from all public URLs.
- [x] `/`, `/services`, `/designs`, `/branches` still render with ShellNav and ShellFooter.
- [x] No source content inside moved page files changes.

**Verification:**

- [x] Run `pnpm exec next typegen`.
- [x] Run `pnpm exec tsc --noEmit`.
- [x] Request the four moved routes and confirm HTTP `200`.

**Dependencies:** None.

**Files likely touched:**

- `src/app/(site)/layout.tsx`
- `src/app/(site)/page.tsx`
- `src/app/(site)/services/page.tsx`
- `src/app/(site)/designs/page.tsx`
- `src/app/(site)/branches/page.tsx`

**Estimated scope:** Medium — 5 files, primarily mechanical moves.

## Task 2: `route-migration-b` — Complete public route migration

**Description:** Move the booking route into `(site)` so every existing public page can receive the dedicated site layout.

**Acceptance criteria:**

- [x] `/booking/services` URL and page output remain unchanged.
- [x] No routable public `page.tsx` remains directly under the visual root shell.

**Verification:**

- [x] Run `pnpm exec next typegen`.
- [x] Run `pnpm exec tsc --noEmit`.
- [x] Request `/booking/services` and confirm HTTP `200`.

**Dependencies:** Task 1.

**Files likely touched:**

- `src/app/(site)/booking/services/page.tsx`

**Estimated scope:** Small — 1 mechanical move.

## Task 3: `shell-split` — Separate public and admin shells

**Description:** Make the top-level layout provider-only, move ShellNav/ShellFooter into `(site)/layout.tsx`, and create the isolated `/admin` layout/page skeleton.

**Acceptance criteria:**

- [x] Public routes show exactly one ShellNav and one ShellFooter.
- [x] `/admin` returns `200` without public shell content.
- [x] Root providers, fonts and metadata continue to work.

**Verification:**

- [x] Stop `next dev`, remove generated `.next/dev`, then run `pnpm exec next typegen`.
- [x] Run `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build`.
- [x] Runtime-check all public routes and `/admin`.

**Dependencies:** Task 2.

**Files likely touched:**

- `src/app/layout.tsx`
- `src/app/(site)/layout.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/page.tsx`

**Estimated scope:** Medium — 4 files.

## Checkpoint A: Route foundation

- [x] All six routes return `200`.
- [x] Public/admin shell separation is correct.
- [x] Typecheck, lint and build pass.
- [x] No new Turbopack panic log is produced after clean restart.

## Task 4: `admin-shell` — Build responsive admin chrome

**Description:** Build the screenshot-inspired brand sidebar, active navigation, logout control, greeting header, notification badge, owner avatar/dropdown and mobile Drawer using HeroUI v3.

**Acceptance criteria:**

- [x] Desktop has fixed sidebar and top header matching screenshot hierarchy.
- [x] Mobile has an accessible HeroUI Drawer trigger and no duplicate navigation landmarks.
- [x] All icon-only controls have labels and focus states.

**Verification:**

- [x] Run `pnpm exec tsc --noEmit` and `pnpm run lint`.
- [x] Keyboard-check mobile menu, notification button and profile dropdown.

**Dependencies:** Task 3.

**Files likely touched:**

- `src/components/layouts/AdminShell/component.tsx`
- `src/components/layouts/AdminShell/index.tsx`
- `src/app/(admin)/admin/layout.tsx`

**Estimated scope:** Medium — 3 files.

## Task 5: `dashboard-core` — Add fixtures, KPI cards and composition

**Description:** Define readonly dashboard fixture contracts and render the page heading plus four KPI cards with HeroUI Card primitives.

**Acceptance criteria:**

- [x] Four KPI cards match reference order, tones and density.
- [x] Fixture arrays use stable ids and strict readonly types.
- [x] `/admin` renders one `h1` and no placeholder skeleton content.

**Verification:**

- [x] Run `pnpm exec tsc --noEmit` and `pnpm run lint`.
- [x] Runtime-check `/admin` heading and four KPI labels.

**Dependencies:** Task 4.

**Files likely touched:**

- `src/components/pages/AdminDashboard/data.ts`
- `src/components/pages/AdminDashboard/MetricCard.tsx`
- `src/components/pages/AdminDashboard/component.tsx`
- `src/components/pages/AdminDashboard/index.tsx`
- `src/app/(admin)/admin/page.tsx`

**Estimated scope:** Medium — 5 files.

## Task 6: `dashboard-detail-a` — Add appointments and revenue panels

**Description:** Render today's appointment timeline/status chips and the quick revenue/payment-method summary using HeroUI Cards, Chips, Buttons and Dropdown.

**Acceptance criteria:**

- [x] Five appointments show time, customer, service and text status.
- [x] Revenue panel shows gross, costs, commission, net receipt and payment-method breakdown.
- [x] Date filter and “Thêm lịch hẹn” controls are HeroUI controls.

**Verification:**

- [x] Run `pnpm exec tsc --noEmit` and `pnpm run lint`.
- [x] Inspect semantic headings and status labels at desktop/mobile widths.

**Dependencies:** Task 5.

**Files likely touched:**

- `src/components/pages/AdminDashboard/AppointmentsPanel.tsx`
- `src/components/pages/AdminDashboard/RevenuePanel.tsx`
- `src/components/pages/AdminDashboard/component.tsx`

**Estimated scope:** Medium — 3 files.

## Task 7: `dashboard-detail-b` — Complete utility and team panels

**Description:** Add quick actions, notifications, staff performance and monthly income summary to complete all screenshot sections.

**Acceptance criteria:**

- [x] Four quick-action buttons and three notifications match the screenshot hierarchy.
- [x] Staff panel shows four people with Avatar, status, revenue and payout.
- [x] Monthly summary emphasizes net income without relying on color alone.

**Verification:**

- [x] Run `pnpm exec tsc --noEmit` and `pnpm run lint`.
- [x] Check the full dashboard reading order and keyboard tab order.

**Dependencies:** Task 6.

**Files likely touched:**

- `src/components/pages/AdminDashboard/UtilityPanel.tsx`
- `src/components/pages/AdminDashboard/StaffPanel.tsx`
- `src/components/pages/AdminDashboard/MonthlySummaryPanel.tsx`
- `src/components/pages/AdminDashboard/component.tsx`

**Estimated scope:** Medium — 4 files.

## Checkpoint B: Dashboard complete

- [x] Every reference-image section is implemented.
- [x] All compatible primitives use HeroUI.
- [x] No component exceeds approximately 200 lines.
- [x] Typecheck and lint pass.

## Task 8: `responsive-polish` — Apply scoped theme and responsive tuning

**Description:** Add admin-only design tokens and tune sidebar, KPI grid, panel grid, spacing and typography for the four target viewports.

**Acceptance criteria:**

- [x] Admin palette closely matches the screenshot without altering public pages.
- [x] No horizontal page overflow at `320`, `768`, `1024`, `1440` widths.
- [x] Touch targets, focus rings and contrast meet the spec.

**Verification:**

- [x] Capture/inspect screenshots at all target viewports.
- [x] Revisit `/` and `/services` to confirm public palette/layout unchanged.
- [x] Run `pnpm exec tsc --noEmit` and `pnpm run lint`.

**Dependencies:** Task 7.

**Files likely touched:**

- `src/app/globals.css`
- `src/components/layouts/AdminShell/component.tsx`
- `src/components/layouts/AdminShell/index.tsx`
- `src/components/pages/AdminDashboard/component.tsx`

**Estimated scope:** Medium — 4 files.

## Task 9: `verification-review` — Final test and review gate

**Description:** Execute the full verification matrix, compare the result with the reference, inspect accessibility/runtime behavior and perform the five-axis code review.

**Acceptance criteria:**

- [x] All commands and HTTP route checks pass.
- [x] Browser console has no application error or hydration warning.
- [x] No Critical/Required review finding remains.

**Verification:**

- [x] Run `pnpm exec next typegen`.
- [x] Run `pnpm exec tsc --noEmit`.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run build` and production runtime checks.
- [x] Complete visual, keyboard and five-axis review checklist.

**Dependencies:** Task 8.

**Files likely touched:**

- `SPEC-admin-dashboard.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Small — verification and documentation only.

## Checkpoint C: Ready for human review

- [x] All spec success criteria are checked.
- [x] Public user changes remain preserved.
- [x] Final implementation summary lists files, verification and known limitations.
