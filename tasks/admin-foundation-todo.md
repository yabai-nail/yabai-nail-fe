# Tasks: Admin Foundation

- [x] `AF-01` Tạo typed admin route config
  - Acceptance: Config có stable route metadata cho dashboard và các module đã duyệt.
  - Verify: TypeScript và 4 route-resolver cases pass.
  - Files: `src/components/layouts/AdminShell/config.ts`.

- [x] `AF-02` Làm sidebar route-aware và giữ SPA navigation
  - Depends on: `AF-01`.
  - Acceptance: Route khả dụng dùng `Link`; active style và `aria-current` đúng; disabled item không điều hướng.
  - Verify: Browser navigation và mobile Drawer audit pass.
  - Files: `src/components/layouts/AdminShell/navigation.tsx`, `src/components/layouts/AdminShell/config.ts`.

- [x] `AF-03` Làm header động theo route
  - Depends on: `AF-01`.
  - Acceptance: Header hiển thị đúng metadata; bell và owner menu không lệch; mỗi route có một `h1`.
  - Verify: DOM và viewport 320/1440px pass.
  - Files: `src/components/layouts/AdminShell/component.tsx`, `src/components/layouts/AdminShell/config.ts`, `src/components/pages/AdminDashboard/component.tsx`.

- [x] `AF-04` Tạo `AdminPageLayout` và migrate dashboard
  - Depends on: `AF-03`.
  - Acceptance: `main#main-content` và padding được tái sử dụng; dashboard giữ hierarchy và spacing.
  - Verify: Visual/runtime comparison `/admin` pass.
  - Files: `src/components/blocks/admin/AdminPageLayout/component.tsx`, `src/components/blocks/admin/AdminPageLayout/index.tsx`, `src/components/pages/AdminDashboard/component.tsx`.

- [x] `AF-05` Kiểm chứng foundation
  - Depends on: `AF-02`, `AF-04`.
  - Acceptance: Typecheck, lint, build pass; dashboard không regression; không có application console error mới.
  - Verify: Browser checks tại 320/768/1024/1440px pass.

## Verification record

- `pnpm test`: Pass — 6 files, 15 tests.
- `pnpm exec next typegen`: Pass.
- `pnpm exec tsc --noEmit`: Pass.
- `pnpm run lint`: Pass.
- `pnpm run build`: Pass.
- Route resolver: 4/4 cases pass.
- Browser: không horizontal overflow; heading, main landmark, active navigation và mobile Drawer đúng contract.
