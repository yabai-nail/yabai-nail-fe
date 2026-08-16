# Spec: Admin Appointments

## Trạng thái

- Capability id: `admin-appointments`
- Trạng thái: Hoàn tất — đã duyệt, implement và kiểm chứng ngày 2026-08-16
- URL: `/admin/appointments`
- Phụ thuộc: `admin-foundation`
- Ảnh tham chiếu: màn “Quản lý lịch hẹn” do người dùng cung cấp ngày 2026-08-16

## Giả định đã duyệt

1. Route thực là `/admin/appointments`, khớp metadata đã có trong `AdminShell`.
2. Đây là fixture prototype: thêm, sửa, hủy chỉ cập nhật local state và mất sau khi reload.
3. Ba chế độ Ngày/Tuần/Tháng đều chuyển được; không có drag-and-drop hoặc resize lịch.
4. Form thêm/sửa và xác nhận hủy dùng HeroUI Modal/AlertDialog; không thêm dependency.
5. “Nhắn tin cho khách” điều hướng SPA tới `/admin/messages`; chưa tự mở đúng conversation bằng query param.
6. Ngày fixture mặc định là `16/08/2026` để nhất quán với dashboard hiện tại; bố cục vẫn bám ảnh tham chiếu.

## Objective

Dựng màn quản lý lịch hẹn để chủ tiệm xem lịch theo ngày/tuần/tháng, lọc theo trạng thái, chọn lịch để xem chi tiết và thử luồng thêm/sửa/hủy trên dữ liệu fixture. UI phải giữ cùng palette hồng, typography, radius và mật độ thông tin của các màn admin hiện tại, đồng thời bám sát bố cục ba vùng trong ảnh:

1. Danh sách lịch hẹn và tổng quan ngày.
2. Calendar/timeline trung tâm.
3. Panel chi tiết lịch hẹn đang chọn.

## Acceptance flow

1. Mở `/admin/appointments`; sidebar active “Lịch hẹn”, header hiển thị đúng title/description và route trả `200`.
2. Ngày mặc định hiển thị danh sách, timeline và thống kê được derive từ cùng một fixture source.
3. Nút trước/sau thay đổi ngày theo view hiện tại; “Hôm nay” đưa về ngày fixture mặc định.
4. Chuyển Ngày/Tuần/Tháng cập nhật calendar tương ứng mà không reload trang.
5. Lọc trạng thái cập nhật đồng thời danh sách và calendar; selection tự chuyển sang lịch đầu tiên còn hiển thị hoặc empty state.
6. Chọn item ở danh sách hoặc calendar cập nhật panel chi tiết cùng một appointment.
7. Thêm/sửa lịch bằng form local; lịch hợp lệ xuất hiện lại đúng ngày, đúng trạng thái và cập nhật thống kê.
8. Hủy lịch qua confirmation dialog sẽ đổi status thành `cancelled`, không xóa record khỏi fixture local state.
9. Nếu nhân viên đã có lịch giao nhau, form hiển thị validation error và không lưu.
10. “Nhắn tin cho khách” chuyển SPA tới `/admin/messages`.

## Functional scope

### Toolbar và điều hướng thời gian

- Nút previous, next và “Hôm nay”.
- Nhãn ngày/tuần/tháng dùng tiếng Việt và timezone hiển thị cố định theo dữ liệu fixture.
- Nút “Thêm lịch hẹn” mở form ở create mode.
- Nút “Bộ lọc” mở filter control phù hợp HeroUI; status filter tối thiểu gồm tất cả, đã xác nhận, chờ xác nhận và đã hủy.

### Danh sách và thống kê

- Sắp xếp theo thời gian bắt đầu tăng dần.
- Item hiển thị giờ, khách hàng, dịch vụ và status bằng text/chip; màu không phải tín hiệu duy nhất.
- Summary derive từ dữ liệu đang thuộc ngày được chọn: tổng, đã xác nhận, chờ xác nhận, đã hủy.
- Không có kết quả thì hiển thị status/empty state, không giữ detail của item đã bị filter khỏi danh sách.

### Calendar views

- `day`: timeline theo giờ, block có start/end time, khách, dịch vụ và status.
- `week`: bảy cột ngày, appointment block đặt theo ngày và giờ; cho phép cuộn ngang trong vùng calendar trên màn nhỏ.
- `month`: lưới tháng, mỗi ngày hiển thị tối đa ba appointment summary và số lượng còn lại.
- Click appointment ở mọi view dùng cùng selected id.
- Không drag/drop, resize, recurring appointment hoặc timezone conversion trong capability này.

### Appointment detail

- Thông tin khách: tên, segment, số điện thoại, ngày sinh, sở thích, số lần đến và tổng chi tiêu.
- Thông tin lịch: ngày, start/end, duration, dịch vụ, nhân viên, status và ghi chú.
- Actions: sửa, hủy, nhắn tin.
- Detail panel dùng semantic `aside`; khi không có selection hiển thị `AdminEmptySelection`.

### Local create/edit/cancel

- Form fields: ngày, giờ bắt đầu, giờ kết thúc, khách hàng, dịch vụ, nhân viên, trạng thái, ghi chú.
- Bắt buộc: ngày, start/end, customer, service, staff và status.
- `endTime` phải sau `startTime`; không cho lịch của cùng nhân viên giao nhau, trừ chính record đang edit.
- Create tạo stable local id; edit giữ nguyên id; cancel chỉ cập nhật status.
- Đóng dialog hoặc reload sẽ không ghi dữ liệu ra ngoài local state.

## Data contracts

```ts
type AppointmentStatus = "confirmed" | "pending" | "cancelled";
type AppointmentView = "day" | "week" | "month";

type Appointment = {
  readonly id: string;
  readonly date: string; // YYYY-MM-DD
  readonly startTime: string; // HH:mm
  readonly endTime: string; // HH:mm
  readonly customer: AppointmentCustomer;
  readonly service: AppointmentService;
  readonly staff: AppointmentStaff;
  readonly status: AppointmentStatus;
  readonly note: string;
};
```

- Fixture có stable id và không chứa dữ liệu khách hàng thật.
- Pure helpers nhận readonly input, không mutate fixture.
- Customer/service/staff snapshot nằm trong appointment domain để không import `data.ts` từ page module khác.
- Khi nối backend, snapshot sẽ được thay bằng id/reference từ API contract riêng.

## Tech stack and commands

- Kế thừa Next.js 16, React 19, TypeScript, HeroUI 3, Heroicons và Tailwind từ `docs/specs/SPEC-admin-foundation.md`.
- Dùng Vitest cho pure state/domain logic.
- Không thêm dependency.

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/appointments/page.tsx
src/components/pages/AdminAppointments/
├── component.tsx
├── data.ts
├── appointment-state.ts
├── appointment-state.test.ts
├── AppointmentToolbar.tsx
├── AppointmentList.tsx
├── AppointmentCalendar.tsx
├── AppointmentDetailPanel.tsx
├── AppointmentFormModal.tsx
├── CancelAppointmentDialog.tsx
└── index.tsx
```

- `component.tsx` là connected component sở hữu local UI state và orchestration.
- `data.ts` chỉ chứa readonly contracts/fixtures.
- `appointment-state.ts` chỉ chứa pure filter, range, summary, conflict và mutation helpers.
- Presentation components nhận typed props; không tự import fixture.

## Code style

```tsx
const selectedAppointment = resolveVisibleSelection(
  visibleAppointments,
  selectedId,
);

<AppointmentCalendar
  appointments={visibleAppointments}
  selectedId={selectedAppointment?.id ?? null}
  view={view}
  onSelect={setSelectedId}
/>
```

- Dùng `readonly` types, discriminated union và stable id.
- Không dùng `any`, inline style cho layout tĩnh hoặc raw clickable `div`.
- Giữ file khoảng 200 dòng; tách theo trách nhiệm, không tạo calendar abstraction tổng quát chưa có consumer.
- Dùng `next/link` hoặc router cho navigation nội bộ; không dùng `window.location`.

## Responsive behavior

- `1440px`: ba vùng song song, calendar chiếm vùng lớn nhất; mật độ gần ảnh tham chiếu.
- `1024px`: sidebar admin dùng Drawer; list và calendar giữ hai cột, detail xuống hàng.
- `768px`: toolbar wrap; list, calendar, detail xếp dọc; calendar có vùng scroll riêng khi cần.
- `320px`: một cột; tabs và toolbar không làm tràn trang; chỉ calendar grid được phép cuộn ngang có chủ đích.
- Không có page-level horizontal overflow tại bốn viewport mục tiêu.

## Accessibility

- Một `h1` do `AdminShell` sở hữu và một `main#main-content`.
- Icon-only buttons có accessible name; date/status controls có label rõ ràng.
- Tabs dùng keyboard navigation; list/calendar item dùng Button hoặc semantic interactive primitive.
- Modal và AlertDialog dùng focus management của HeroUI, đóng được bằng Escape và trả focus đúng trigger.
- Form error liên kết với field; status có text, không chỉ biểu đạt bằng màu.
- Timeline dùng cấu trúc đọc được bằng screen reader và không yêu cầu thao tác kéo thả.

## Testing strategy

### Unit tests

- Filter/sort theo ngày, range và status không mutate input.
- Summary counts derive đúng từ fixture.
- Selection fallback đúng khi filter/date làm item đang chọn biến mất.
- Conflict validation chỉ chặn appointment trùng giờ của cùng staff.
- Create/edit/cancel helpers giữ immutable state và stable id.

### Runtime and browser

- Route `/admin/appointments` trả `200`; sidebar navigation là SPA và active state đúng.
- Kiểm tra date navigation, view tabs, status filter, selection từ list/calendar.
- Kiểm tra create/edit/cancel local và validation conflict.
- Kiểm tra Modal/AlertDialog bằng keyboard và focus return.
- Kiểm tra 320×800, 768×1024, 1024×768, 1440×900; không page-level overflow.
- Console không có application error, hydration warning hoặc accessibility warning mới.

## Boundaries

### Always do

- Dùng HeroUI/Heroicons và admin design tokens hiện tại.
- Derive list, calendar, detail và summary từ một nguồn state.
- Đồng bộ selection với tập appointment đang hiển thị.
- Viết unit test trước cho pure appointment logic và chạy full quality gate trước commit.

### Ask first

- Kết nối API/backend, persistence hoặc authentication.
- Thêm dependency calendar/date mới.
- Thêm drag/drop, recurring appointment, notification hoặc payment flow.
- Thay đổi URL `/admin/appointments` hoặc chia route con.

### Never do

- Dùng dữ liệu khách hàng thật hoặc copy avatar từ screenshot.
- Hard-code summary không khớp fixture.
- Import presentation/data trực tiếp từ một page module nghiệp vụ khác.
- Dùng `window.location`, clickable `div`, `any` hoặc xóa test đang fail để qua gate.

## Success criteria

- [x] Route `/admin/appointments` render đúng hierarchy ba vùng và sidebar active.
- [x] Ngày/Tuần/Tháng, date navigation và status filter hoạt động bằng local state.
- [x] List, calendar, detail và summary luôn nhất quán từ một appointment source.
- [x] Selection fallback và empty state không rò detail cũ.
- [x] Create/edit/cancel local hoạt động; time/conflict validation đúng.
- [x] Dashboard “Xem lịch” và sidebar chuyển SPA tới route mới.
- [x] HeroUI/Heroicons, accessibility và responsive contract đạt tại bốn viewport.
- [x] Unit tests, typecheck, lint, production build và browser verification đều pass.
- [x] Review cuối không còn finding mức Critical/Required.

## Verification record

- Người dùng duyệt spec và plan trước khi implement.
- `pnpm test`: 8 files, 28 tests pass.
- `pnpm exec next typegen`, `pnpm exec tsc --noEmit`, `pnpm run lint` và `pnpm run build`: pass.
- Browser QA: route, status/view controls, create/conflict/cancel, dashboard navigation và focus return đã kiểm tra.
- Responsive QA: 320×800, 768×1024, 1024×768 và 1440×900 không có page-level horizontal overflow.
- Console không có lỗi ứng dụng; hydration message quan sát được do extension trình duyệt chèn thuộc tính `bis_*` trước hydrate.
- Review năm trục: không còn finding Critical/Required.
