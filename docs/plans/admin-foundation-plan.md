# Plan: Admin Foundation

## Trạng thái

- Spec: Đã duyệt và triển khai — `docs/specs/SPEC-admin-foundation.md`.
- Verification: Vitest, type generation, TypeScript, ESLint, production build và browser checks đều đạt ngày 2026-08-16.
- Browser console chỉ có lỗi do extension Edge chèn thuộc tính vào HTML; không có lỗi xuất phát từ source ứng dụng.

## Mục tiêu

Triển khai capability `admin-foundation`: route config tập trung, sidebar điều hướng SPA theo pathname, header động theo route và page layout dùng chung. Không thêm dependency và không kết nối backend.

## Dependency graph

```text
typed admin route config
├── route-aware sidebar
└── route-aware shell header
    └── shared admin page layout
        └── dashboard regression verification
```

Các module `admin-customers`, `admin-messages`, `admin-staff`, `admin-services` và `admin-settings` dùng foundation này sau khi hoàn tất spec riêng.

## Implementation order

### 1. Tập trung hóa route metadata

- Cấu hình readonly chứa `href`, label, icon, title, description, badge và trạng thái khả dụng.
- Helper xác định route hiện tại hỗ trợ URL chính xác và URL con.

### 2. Chuyển sidebar sang route-aware navigation

- Dùng `usePathname()` và `next/link` cho route khả dụng.
- Dùng `aria-current="page"` đúng một mục đang hiển thị.
- Thanh toán và Báo cáo tiếp tục ở trạng thái chưa khả dụng.

### 3. Chuyển shell header sang route-aware heading

- Header đọc route metadata và sở hữu một `h1` duy nhất.
- Dashboard giữ lời chào; trang con dùng title/mô tả nghiệp vụ.
- Bell và owner menu không tràn trên viewport nhỏ.

### 4. Tạo page layout dùng chung

- `AdminPageLayout` sở hữu `main#main-content` và responsive padding.
- Dashboard được migrate mà không thay đổi hierarchy hoặc spacing.
- Table/toolbar/detail panel chỉ được trích xuất khi có ít nhất hai consumer thật.

### 5. Verification

- Chạy route type generation, TypeScript, ESLint và production build.
- Kiểm tra route resolver, DOM semantics, responsive overflow và mobile Drawer.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Route nghiệp vụ chưa có page | Chỉ bật navigation trong cùng lát triển khai với page tương ứng |
| Hai `h1` sau khi đưa title vào shell | Shell sở hữu `h1`; page content bắt đầu từ `h2` |
| Shared component quá tổng quát | Foundation chỉ tạo `AdminPageLayout`; block khác chờ consumer thứ hai |
| Layout desktop làm vỡ mobile | Kiểm tra 320, 768, 1024 và 1440px |

## Verification commands

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Completion record

- Route resolver: 4/4 trường hợp đạt.
- Vitest: 6 files, 15 tests đạt.
- Browser: đúng một `h1`, một `main#main-content` và một navigation hiển thị trong mobile Drawer.
- Không có horizontal overflow ở bốn viewport mục tiêu.
- Dashboard và các public route vẫn build thành công.
