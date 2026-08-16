# Plan: Admin Appointments

## Trạng thái

- Spec: `docs/specs/SPEC-admin-appointments.md` — đề xuất, chờ duyệt.
- Task target: `docs/plans/admin-appointments-todo.md`.
- Capability id: `admin-appointments`.
- Implementation: Chưa bắt đầu; chỉ triển khai sau khi người dùng duyệt spec và plan.

## Mục tiêu

Triển khai `/admin/appointments` thành một vertical feature hoàn chỉnh trên `admin-foundation`: route/menu, typed fixture, date/status/view state, list/calendar/detail đồng bộ và local create/edit/cancel. Mỗi lát phải có verification riêng và không làm regression các route admin đã hoàn thành.

## Dependency graph

```text
admin-foundation (done)
└── appointment contracts + pure state helpers
    ├── route + shell metadata
    ├── date/status toolbar
    ├── appointment list + daily summary
    └── calendar views
         └── shared selection + detail panel
              └── local create/edit/cancel dialogs
                   └── dashboard navigation integration
                        └── responsive/browser review
```

Build order:

`domain-tests → route-shell → list-summary → calendar-views → detail-selection → local-mutations → dashboard-integration → responsive-review`

## Architecture decisions

1. **Appointment domain tự sở hữu contract.** `AdminAppointments/data.ts` chứa fixture snapshot cho customer/service/staff; không import `data.ts` từ Customers, Services hoặc Staff.
2. **Pure state trước UI.** Filter, date range, summary, conflict và immutable create/edit/cancel nằm trong `appointment-state.ts` và được khóa bằng Vitest trước khi nối component.
3. **Một nguồn state.** Connected component sở hữu appointment collection, view, selected date, status filter và selected id; list/calendar/detail chỉ nhận derived props.
4. **Selection luôn theo visible set.** Dùng `resolveVisibleSelection` để không giữ detail cũ khi đổi ngày/view/filter.
5. **Calendar riêng theo domain.** Không thêm package calendar và không tạo generic calendar framework; ba view là presentation branches của cùng typed contract.
6. **Local CRUD có ranh giới rõ.** HeroUI Modal/AlertDialog chỉ thay đổi client state; reload khôi phục fixture gốc.
7. **Route bật cùng page.** Chỉ đổi `appointments.isAvailable` sang `true` khi route và page render đã tồn tại.
8. **Internal navigation dùng SPA.** Sidebar và dashboard “Xem lịch” dùng Next Link/router; message action chuyển tới `/admin/messages`.

## Vertical slices

### Slice 1 — Domain model and tests

- Tạo `Appointment`, status/view contracts và fixture ngày mặc định.
- Viết RED tests cho filter/sort/summary/conflict/create/edit/cancel.
- Implement pure helpers đến khi focused tests xanh.

Checkpoint: appointment tests pass, helpers không mutate input và không phụ thuộc React.

### Slice 2 — Route and page shell

- Tạo server route, page index và connected component skeleton.
- Bật sidebar link, header metadata và active route.
- Dùng `AdminPageLayout`; không tạo `h1` thứ hai.

Checkpoint: typegen nhận route, HTTP `200`, sidebar navigation không reload.

### Slice 3 — Day list and summary

- Dựng date toolbar, status filter và create trigger.
- Dựng appointment list sắp xếp theo giờ và daily summary derive từ state.
- Đồng bộ selection sau date/status filter.

Checkpoint: unit tests xanh; browser xác nhận filter/date/list/summary nhất quán.

### Slice 4 — Calendar views

- Dựng day timeline theo ảnh tham chiếu.
- Bổ sung week/month read-only views từ cùng source.
- Click block ở mọi view cập nhật selected id.

Checkpoint: tabs chuyển nội dung, selected state dùng chung và calendar không làm page overflow.

### Slice 5 — Detail and local mutations

- Dựng appointment/customer detail panel.
- Dựng HeroUI form Modal cho create/edit và AlertDialog cho cancel.
- Nối validation duration/conflict và message navigation.

Checkpoint: create/edit/cancel/browser keyboard flow đạt; invalid schedule không lưu.

### Slice 6 — Integration and final review

- Nối dashboard “Xem lịch” tới route mới; kiểm tra các quick action liên quan trong phạm vi đã duyệt.
- Polish responsive tại 320/768/1024/1440px.
- Chạy full tests/type/lint/build/browser QA và five-axis review.
- Cập nhật spec/task completion record sau khi thực sự đạt.

## Verification matrix

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

- Route: `/admin/appointments` trả `200`; các route admin/public hiện có tiếp tục build.
- Unit: filter, ranges, summary, selection, conflict và immutable mutations.
- Interaction: date navigation, view tabs, filter, select list/calendar, create/edit/cancel, message link.
- Accessibility: focus order, accessible names, form errors, Modal/AlertDialog focus return, một `h1` và một `main`.
- Responsive: 320×800, 768×1024, 1024×768, 1440×900; chỉ calendar region được phép scroll ngang.
- Review: không có Critical/Required finding trước khi đánh dấu hoàn thành.

## Checkpoints and commit strategy

1. `test: add appointment domain regression coverage`
2. `feat: add admin appointment route and daily schedule`
3. `feat: add appointment calendar views and detail`
4. `feat: add local appointment management dialogs`
5. `fix: polish appointment responsive behavior`
6. `docs: record verified appointment delivery`

Mỗi commit chỉ được tạo sau focused tests và TypeScript; full lint/build/browser chạy ở checkpoint cuối.

## Risks and mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Ba calendar view làm component quá lớn | Cao | Tách view presentation theo file hoặc pure render helpers; connected state vẫn ở một nơi |
| Summary/list/calendar lệch dữ liệu | Cao | Derive tất cả từ một collection và cùng date/status selectors có unit tests |
| Conflict validation sai với lịch edit | Cao | Helper nhận `excludeId`; test boundary liền kề và overlap cùng/khác staff |
| Modal form làm scope tăng mạnh | Trung bình | Chỉ local required fields; không persistence, async states hoặc server errors |
| Timeline gây overflow mobile | Trung bình | Scroll chỉ trong calendar container; browser-check bốn viewport sau slice 4 |
| Import fixture giữa page modules | Trung bình | Appointment snapshot contract tự sở hữu dữ liệu demo; chưa tạo cross-page dependency |

## Parallelization

- Không cần sub-agent cho capability này; dependency giữa state, selection và UI khá chặt.
- Sau khi domain contract ổn định, calendar presentation và form/dialog có thể làm song song nếu có yêu cầu explicit dùng agents.
- Route config và dashboard integration phải tuần tự để không bật link trước khi route tồn tại.

## Completion gate

- Người dùng đã duyệt spec và plan.
- Tất cả task checklist đạt bằng bằng chứng test/runtime/browser thật.
- Không còn hard-coded derived count hoặc stale selection.
- Không thêm runtime dependency hoặc backend call.
- Spec, plan và docs index phản ánh đúng trạng thái triển khai.

## Open questions

- Chờ duyệt các giả định trong spec, đặc biệt phạm vi local CRUD và cách hiển thị Week/Month không có drag-and-drop.
