# Spec: Admin Payments

## Trạng thái

- Capability id: `admin-payments`
- Trạng thái: Đã implement và kiểm chứng ngày 2026-08-16
- URL: `/admin/payments`
- Phụ thuộc: `admin-foundation`, `admin-appointments`, `admin-services`, `admin-settings`
- Ảnh tham chiếu: màn “Thanh toán tại quán” do người dùng cung cấp ngày 2026-08-16

## Giả định đã duyệt

1. Dùng route `/admin/payments` đã có trong `AdminShell`; chưa tạo route động theo appointment hoặc invoice id.
2. Đây là fixture prototype: mọi thay đổi dịch vụ, giảm giá, tỷ lệ chia và trạng thái thanh toán chỉ nằm trong local state, mất sau khi reload.
3. “Xác nhận thanh toán” không gọi cổng thanh toán, không lưu giao dịch thật và không thu thập dữ liệu thẻ/tài khoản.
4. Người dùng có thể đổi dịch vụ chính, thêm/sửa/xóa dịch vụ phát sinh và nhập một khoản tùy chỉnh.
5. Giảm giá trong capability đầu tiên là số tiền VND, không phải phần trăm; giá trị phải từ `0` đến tổng tạm tính.
6. Tỷ lệ chia mặc định là nhân viên `60%`, quán `40%`; chỉnh tỷ lệ chỉ tác động hóa đơn local hiện tại.
7. Sau khi xác nhận, hóa đơn chuyển sang `paid` và khóa các control thay đổi tiền; reload khôi phục trạng thái fixture chưa thanh toán.
8. “In hóa đơn” mở bản xem trước có semantic rõ ràng và gọi hộp thoại in của trình duyệt khi người dùng xác nhận; chưa tạo PDF hoặc lưu invoice backend.

## Objective

Dựng màn thanh toán tại quán để nhân viên kiểm tra khách hàng và lịch hẹn, điều chỉnh dịch vụ thực tế, thêm chi phí phát sinh, chọn phương thức thanh toán, xác nhận số tiền và xem phần doanh thu của nhân viên/quán. UI phải bám ảnh tham chiếu nhưng dùng design system admin hiện tại: nền sáng, màu chủ đạo `#d8145b`, viền nhẹ, radius `0.5rem`, HeroUI và Heroicons.

Màn hình có ba vùng nghiệp vụ:

1. Thông tin khách hàng và lịch hẹn.
2. Cấu thành hóa đơn và phương thức thanh toán.
3. Tổng tiền, chia doanh thu, ghi chú và trạng thái thanh toán.

## Acceptance flow

1. Mở `/admin/payments`; sidebar active “Thanh toán”, header hiển thị “Thanh toán tại quán” và route trả `200`.
2. Fixture mặc định hiển thị khách Nguyễn Thu Hương, lịch ngày `16/08/2026` lúc `14:00`, nhân viên Mai Linh và dịch vụ đã đặt.
3. Đổi dịch vụ chính cập nhật service snapshot, chênh lệch giá, tổng tiền và chia doanh thu từ cùng một state source.
4. Thêm, sửa hoặc xóa dịch vụ phát sinh cập nhật subtotal ngay lập tức; custom item phải có tên và giá VND hợp lệ.
5. Giảm giá hợp lệ cập nhật số khách cần thanh toán; giảm giá âm hoặc lớn hơn subtotal bị chặn với error liên kết field.
6. Chọn một trong các phương thức `cash`, `card`, `paypay`, `bank_transfer`, `other`; text luôn hiện cùng icon.
7. Chỉnh tỷ lệ nhân viên/quán bảo đảm tổng luôn bằng `100%` và hai phần tiền cộng lại đúng grand total.
8. “Xác nhận thanh toán” mở AlertDialog tóm tắt số tiền/phương thức; xác nhận đổi invoice sang `paid`, không xóa dữ liệu.
9. Khi đã thanh toán, các action thay đổi tiền bị khóa; nút “Đã thanh toán” và “In hóa đơn” vẫn có trạng thái/accessible name rõ ràng.
10. “In hóa đơn” mở invoice preview chứa customer, line items, discount, total, payment method và revenue split.
11. Các action đổi nhân viên, đổi ngày giờ và hủy lịch dùng HeroUI dialog/local state; không điều hướng reload trang.
12. Dashboard quick action “Thanh toán” và sidebar dùng SPA navigation tới route mới sau khi page đã tồn tại.

## Functional scope

### Customer and appointment context

- Hiển thị initials avatar, tên, segment, điện thoại, ngày sinh, số lần đến và tổng chi tiêu.
- Hiển thị ngày/giờ hẹn, nhân viên, ghi chú và appointment status.
- Action đổi nhân viên, đổi ngày giờ, hủy lịch dùng Modal/AlertDialog và cập nhật snapshot local.
- Không import fixture trực tiếp từ page Appointments/Customers; payment domain sở hữu snapshot fixture riêng.

### Primary service selection

- Hiển thị dịch vụ đã đặt và dịch vụ hiện tại cạnh nhau.
- Nếu hai dịch vụ khác nhau, hiển thị trạng thái “Đã đổi” bằng text/chip.
- Modal chọn dịch vụ lấy dữ liệu từ payment fixture typed và chỉ cho chọn một dịch vụ chính.
- Giá dịch vụ hiện tại, không phải giá đã đặt, được dùng trong phép tính hóa đơn.

### Additional services

- Mỗi line item có id ổn định, tên, giá, ghi chú và nguồn `catalog | custom`.
- Cho phép thêm từ danh mục, sửa ghi chú/giá custom và xóa item trước khi thanh toán.
- Custom item bắt buộc có tên không rỗng và `unitPrice >= 0`; tiền lưu dưới dạng integer VND.
- Không cho trùng cùng service catalog nhiều lần trong bản đầu; chọn lại service đã có phải báo lỗi.

### Totals and discount

- `subtotal = currentService.price + sum(additionalItems.unitPrice)`.
- `grandTotal = max(0, subtotal - discountAmount)`.
- `staffShare = round(grandTotal * staffPercent / 100)`.
- `salonShare = grandTotal - staffShare` để tránh sai số làm lệch tổng.
- Summary bên phải và phần xác nhận ở giữa đều dùng cùng selector; không hard-code hai nguồn số liệu.

### Payment confirmation

- Payment method là required field.
- Trước confirm, AlertDialog hiển thị khách, số tiền và phương thức.
- Confirm đổi status từ `draft` sang `paid` và tạo `paidAt` fixture timestamp ổn định trong local state.
- Không xử lý số thẻ, QR, token, OTP, refund hoặc partial payment.

### Invoice notes and printing

- Ghi chú đơn hàng là plain text, giới hạn 500 ký tự và không render HTML.
- Invoice preview dùng Modal hoặc vùng printable semantic; số tiền format VND nhất quán.
- Chỉ gọi `window.print()` từ thao tác rõ ràng của người dùng sau khi preview mở.

## Data contracts

```ts
type PaymentMethod =
  | "cash"
  | "card"
  | "paypay"
  | "bank_transfer"
  | "other";

type InvoiceStatus = "draft" | "paid";

type PaymentLineItem = {
  readonly id: string;
  readonly source: "catalog" | "custom";
  readonly serviceId?: string;
  readonly name: string;
  readonly unitPrice: number;
  readonly note: string;
};

type CheckoutInvoice = {
  readonly id: string;
  readonly appointment: PaymentAppointmentSnapshot;
  readonly customer: PaymentCustomerSnapshot;
  readonly bookedService: PaymentServiceSnapshot;
  readonly currentService: PaymentServiceSnapshot;
  readonly additionalItems: ReadonlyArray<PaymentLineItem>;
  readonly discountAmount: number;
  readonly paymentMethod: PaymentMethod | null;
  readonly staffPercent: number;
  readonly orderNote: string;
  readonly status: InvoiceStatus;
  readonly paidAt: string | null;
};
```

### Invariants

- Tất cả tiền là integer VND; không dùng floating point currency.
- `0 <= discountAmount <= subtotal`.
- `0 <= staffPercent <= 100`; `salonPercent = 100 - staffPercent`.
- `staffShare + salonShare === grandTotal` trong mọi trường hợp.
- Invoice `paid` không được mutation các trường ảnh hưởng tiền.
- Pure helpers nhận readonly input và không mutate fixture.

## Tech stack and commands

- Kế thừa Next.js 16, React 19, TypeScript, HeroUI 3, Heroicons và Tailwind từ `SPEC-admin-foundation.md`.
- Vitest kiểm thử calculation, validation và immutable state transitions.
- Không thêm dependency thanh toán, form, tiền tệ hoặc PDF.

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/payments/page.tsx
src/components/pages/admin/AdminPayments/
├── component.tsx
├── data.ts
├── payment-state.ts
├── payment-state.test.ts
├── CustomerAppointmentPanel.tsx
├── ServiceCheckoutPanel.tsx
├── PaymentSummaryPanel.tsx
├── PaymentMethodPicker.tsx
├── ServiceSelectionModal.tsx
├── LineItemModal.tsx
├── PaymentConfirmationDialog.tsx
├── InvoicePreviewModal.tsx
└── index.tsx
```

- `component.tsx` sở hữu invoice local state và orchestration.
- `data.ts` chỉ chứa contracts/fixtures của payment domain.
- `payment-state.ts` chứa pure selectors, validation và immutable transitions.
- Presentation components nhận typed props; không tự import fixture hoặc tự tính tổng riêng.
- Nếu một modal vượt khoảng 200 dòng, tách form fields khỏi overlay nhưng không tạo generic form framework.

## Code style

```tsx
const totals = calculatePaymentTotals(invoice);

<PaymentSummaryPanel
  invoice={invoice}
  totals={totals}
  onDiscountChange={updateDiscount}
  onConfirm={openConfirmation}
/>
```

- Dùng `readonly` contracts, stable ids và discriminated unions.
- Không dùng `any`, nested ternary khó đọc, raw clickable `div` hoặc inline style cho layout tĩnh.
- Dùng `formatVnd` hiện có; calculation helper trả số, presentation mới format.
- Dùng Next router/Link cho navigation nội bộ; không dùng `window.location`.

## Responsive behavior

- `1440px`: ba vùng song song gần ảnh tham chiếu; checkout ở giữa rộng nhất.
- `1024px`: customer panel và checkout giữ hai cột; payment summary xuống hàng và chiếm toàn chiều rộng.
- `768px`: ba vùng xếp dọc; summary tiền xuất hiện sau checkout, không dùng fixed/sticky che nội dung.
- `320px`: một cột; bảng line item chuyển thành card rows hoặc cuộn trong vùng riêng, không làm page-level overflow.
- Không có page-level horizontal overflow ở 320×800, 768×1024, 1024×768 và 1440×900.

## Accessibility

- Một `h1` do `AdminShell` sở hữu và một `main#main-content`.
- Các bước checkout dùng heading có thứ tự; không dùng số bước chỉ bằng màu.
- Payment method là radio group có label; keyboard arrow/Tab hoạt động.
- Icon-only edit/delete buttons có accessible name chứa line item.
- Form errors dùng `aria-invalid`, `aria-describedby` và live region phù hợp.
- Modal/AlertDialog quản lý focus, đóng bằng Escape khi an toàn và trả focus về trigger.
- Trạng thái paid/draft, service changed và validation luôn có text, không chỉ dùng màu/icon.

## Testing strategy

### Unit tests

- Subtotal/grand total với service chính, add-ons, custom item và discount boundaries.
- Revenue split tại `0`, `60`, `100` phần trăm và số tiền lẻ không làm sai tổng.
- Add/edit/remove line item không mutate invoice và chặn duplicate catalog service.
- Đổi dịch vụ chính giữ booked snapshot nhưng cập nhật current snapshot.
- Confirm chỉ thành công khi method/totals hợp lệ; invoice paid từ chối money mutation.

### Runtime and browser

- Route `/admin/payments` trả `200`; sidebar active và navigation SPA.
- Kiểm tra chọn dịch vụ, add/edit/delete item, custom item và discount validation.
- Kiểm tra payment method keyboard, revenue split, confirmation và paid locked state.
- Kiểm tra invoice preview/print trigger, focus return và console sạch.
- Kiểm tra bốn viewport mục tiêu và page-level overflow.

## Boundaries

### Always do

- Dùng HeroUI/Heroicons, admin tokens và `formatVnd` hiện có.
- Derive mọi tổng tiền và chia doanh thu từ một invoice source.
- Validate dữ liệu trước mọi local transition và test pure calculation trước UI.
- Giữ action tài chính là local prototype, ghi rõ không phải giao dịch thật.

### Ask first

- Kết nối API/backend, payment gateway, database hoặc authentication/authorization.
- Lưu/thao tác dữ liệu thẻ, QR, OTP, token hoặc thông tin ngân hàng.
- Hỗ trợ refund, partial payment, split payment, tip, tax, voucher phần trăm hoặc loyalty points.
- Tạo PDF, gửi hóa đơn qua email/tin nhắn hoặc thay đổi settings hoa hồng toàn hệ thống.
- Thêm dependency mới hoặc route động `/admin/payments/[id]`.

### Never do

- Thu thập hoặc hard-code dữ liệu thanh toán thật.
- Log payment payload, thông tin cá nhân nhạy cảm hoặc dữ liệu thẻ.
- Dùng số floating point làm currency, hard-code totals ở nhiều component hoặc cho paid invoice tiếp tục sửa tiền.
- Copy ảnh/avatar từ screenshot, dùng `window.location`, clickable `div`, `any` hoặc xóa test fail để qua gate.

## Success criteria

- [x] `/admin/payments` bám hierarchy ba vùng của ảnh và sidebar active.
- [x] Dịch vụ chính, add-ons, custom item và discount cập nhật một totals source chính xác.
- [x] Payment method, revenue split và confirmation flow hoạt động bằng local state.
- [x] Invoice paid bị khóa mutation; preview/in hóa đơn có nội dung đúng.
- [x] Appointment context actions hoạt động bằng HeroUI overlay và không reload.
- [x] Dashboard/sidebar entry points chuyển SPA tới route sau khi page tồn tại.
- [x] Accessibility và responsive contract đạt tại bốn viewport.
- [x] Unit tests, typecheck, lint, production build và browser QA pass.
- [x] Review cuối không còn finding Critical/Required.

## Open questions

- Không còn câu hỏi chặn implementation; route đơn `/admin/payments`, discount VND và phạm vi local-only đã được duyệt.
