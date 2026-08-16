# Spec: Admin Messages

## Trạng thái

- Capability id: `admin-messages`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16
- URL: `/admin/messages`
- Phụ thuộc: `admin-foundation`

## Objective

Dựng màn Tin nhắn gồm inbox, cuộc hội thoại đang chọn và panel thông tin khách hàng như ảnh tham chiếu. Dữ liệu và thao tác gửi tin nhắn chỉ tồn tại trong local state, chưa kết nối dịch vụ messaging.

## Acceptance flow

1. Mở `/admin/messages` và thấy inbox, conversation và customer summary.
2. Search và tab Tất cả/Chưa đọc/Đã đọc/Lưu trữ lọc fixture conversations.
3. Chọn conversation cập nhật thread và panel khách hàng tương ứng.
4. Nhập nội dung và gửi sẽ thêm bubble local, xóa input và giữ focus hợp lý.
5. Unread badge có text thay thế; message composer có label và keyboard support.

## Tech stack and commands

- Kế thừa stack từ `docs/specs/SPEC-admin-foundation.md`; không thêm dependency.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/messages/page.tsx
src/components/pages/admin/AdminMessages/
├── component.tsx
├── data.ts
├── ConversationList.tsx
├── MessageThread.tsx
├── MessageComposer.tsx
├── CustomerSummary.tsx
└── index.tsx
```

## Code style

```tsx
type Conversation = {
  readonly id: string;
  readonly customerId: string;
  readonly preview: string;
  readonly unreadCount: number;
  readonly status: "unread" | "read" | "archived";
};
```

- Container quản lý selection/filter/composer state; child components chỉ render typed props.
- Stable id làm key; không index key, `any`, inline style hoặc component trên 200 dòng.

## Testing strategy

- Typecheck, lint, build và runtime route `200`.
- Browser test filter, conversation selection, composer gửi local và active sidebar.
- Kiểm tra focus order, accessible names, empty search state và layout tại 320/768/1024/1440px.

## Boundaries

- Always: dữ liệu fixture, semantic list/form, status bằng text, HeroUI/Heroicons.
- Ask first: API chat, WebSocket, upload file, gọi điện hoặc template persistence.
- Never: gửi tin nhắn thật, đọc credential/browser storage, dùng dữ liệu cá nhân thật.

## Success criteria

- [x] Ba vùng inbox/thread/customer detail bám hierarchy ảnh desktop.
- [x] Search, filters, selection và local send hoạt động.
- [x] Mobile hiển thị tuần tự, không mất composer hoặc overflow trang.
- [x] Sidebar bật link Tin nhắn và chuyển trang SPA.
- [x] Test, typecheck, lint, build và browser verification pass.

## Open questions

- Không còn câu hỏi mở; attachments, gọi điện và gửi thật nằm ngoài phạm vi.
