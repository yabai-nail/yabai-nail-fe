# Spec: YABAI Admin Dashboard

## Trạng thái

- Giai đoạn hiện tại: Đã triển khai và kiểm chứng ngày 2026-08-16
- Capability id: `admin-dashboard`
- URL đích: `/admin`
- Phạm vi: Một dashboard quản trị bằng dữ liệu mẫu, chưa kết nối backend

## Giả định cần duyệt

1. `(admin)` là route group để tổ chức source; URL người dùng truy cập vẫn là `/admin`.
2. Dashboard dùng tiếng Việt và định dạng tiền Việt Nam, dù ảnh tham chiếu dùng ký hiệu yen.
3. Dữ liệu lịch hẹn, doanh thu, thông báo và nhân viên là dữ liệu trình diễn tĩnh.
4. Chưa triển khai đăng nhập, phân quyền, API, biểu đồ tương tác hoặc các trang con của menu.
5. Giao diện admin ưu tiên light theme để bám sát ảnh; theme của website khách hàng không bị thay đổi.
6. HeroUI được dùng cho mọi UI primitive có sẵn. Tailwind CSS chỉ dùng cho bố cục, kích thước, responsive và các chi tiết trang trí.

## Objective

Tạo một dashboard quản trị riêng cho chủ tiệm YABAI tại `/admin`, tái hiện sát bố cục và cảm giác thị giác của ảnh tham chiếu:

- Sidebar cố định chứa thương hiệu, menu nghiệp vụ và nút đăng xuất.
- Header chứa lời chào, ngày hiện tại, thông báo và hồ sơ chủ tiệm.
- Bốn KPI chính: lịch hẹn, doanh thu, khách hàng và nhân viên đang làm.
- Khu vực lịch hẹn hôm nay, doanh thu nhanh, thao tác nhanh và thông báo.
- Khu vực hiệu suất nhân viên và tổng kết thu nhập tháng.

Dashboard phải có chất lượng production về cấu trúc, responsive, accessibility và không làm thay đổi giao diện public hiện tại.

## Acceptance flow

1. Người dùng mở `/admin` và thấy dashboard, không thấy `ShellNav` hoặc `ShellFooter` của website khách hàng.
2. Người dùng desktop nhìn thấy sidebar, header và toàn bộ các khối thông tin theo đúng thứ tự của ảnh.
3. Người dùng tablet/mobile vẫn đọc và thao tác được: sidebar chuyển thành menu thu gọn, các panel xếp lại mà không tràn ngang ngoài vùng được chủ động cho phép.
4. Các control tương tác có focus state, accessible label và vùng bấm tối thiểu 44px.
5. Các URL public hiện tại vẫn giữ nguyên: `/`, `/services`, `/designs`, `/branches`, `/booking/services`.

## Visual specification

### Layout

- Desktop từ `1280px`: sidebar rộng khoảng `208–224px`, header cao khoảng `72px`, content có padding `24–32px`.
- Nền dashboard là trắng ấm/xám hồng rất nhạt; panel trắng, viền mảnh, shadow nhẹ.
- KPI dùng lưới 4 cột.
- Nội dung chính dùng lưới 12 cột:
  - Lịch hẹn: 4 cột.
  - Doanh thu nhanh: 4 cột.
  - Thao tác nhanh và thông báo: 4 cột.
- Hàng dưới:
  - Nhân viên: 8 cột.
  - Thu nhập tháng: 4 cột.

### Brand and color

- Primary admin: hồng đậm gần `#f31260`.
- Primary soft: hồng rất nhạt gần `#fff0f5`.
- Success: xanh lá cho tăng trưởng và doanh thu tích cực.
- Info: xanh dương cho khách hàng.
- Staff: tím nhạt.
- Text chính: gần đen `#202124`; text phụ: xám trung tính.
- Admin tokens phải được scope trong `.admin-shell`, không thay đổi token public hiện tại.

### Typography

- Dùng Inter đã có trong project.
- Tiêu đề trang: `24–28px`, semibold.
- KPI value: `24–28px`, semibold.
- Section title: `15–17px`, semibold.
- Nội dung phụ: `12–14px`.

### HeroUI primitives

- `Card`: KPI, lịch hẹn, doanh thu, thông báo, nhân viên, tổng kết.
- `Button`: menu sidebar, quick actions, xem tất cả, thêm lịch hẹn, logout, mobile menu.
- `Chip`: trạng thái lịch hẹn và nhân viên.
- `Avatar`: chủ tiệm và nhân viên, có fallback initials.
- `Badge`: số thông báo và tin nhắn.
- `Dropdown`: menu hồ sơ chủ tiệm và bộ lọc ngày.
- `Divider`, `ScrollShadow`, `Tooltip`: phân tách, sidebar mobile/desktop và icon actions khi cần.
- Heroicons được dùng làm icon; không dùng emoji làm icon chức năng.

## Tech stack

- Next.js `16.3.1`, App Router và route groups.
- React `19.2.8`.
- TypeScript strict.
- HeroUI React `3.2.4` và HeroUI Styles `3.2.4`.
- Tailwind CSS `4`.
- Heroicons React `2.2.0`.
- Không thêm dependency mới trong phạm vi spec này.

## Commands

```powershell
# Development
pnpm dev

# Generate route-aware Next.js types after moving routes
pnpm exec next typegen

# Type checking
pnpm exec tsc --noEmit

# Lint
pnpm run lint

# Production build
pnpm run build

# Production runtime verification
pnpm start
```

Project hiện không có test runner riêng. Verification bắt buộc gồm typecheck, ESLint, production build, HTTP runtime checks và visual checks ở các viewport quy định.

## Project structure

```text
src/app/
├─ layout.tsx                         # Root fonts + providers, không chứa shell trực quan
├─ (site)/
│  ├─ layout.tsx                      # ShellNav + ShellFooter cho public site
│  ├─ page.tsx
│  ├─ services/page.tsx
│  ├─ designs/page.tsx
│  ├─ branches/page.tsx
│  └─ booking/services/page.tsx
└─ (admin)/
   └─ admin/
      ├─ layout.tsx                   # Metadata và AdminShell
      └─ page.tsx                     # AdminDashboard route

src/components/layouts/AdminShell/
├─ component.tsx                      # Pure presentation
└─ index.tsx                          # Connected/client interactions

src/components/pages/AdminDashboard/
├─ component.tsx                      # Dashboard composition
├─ data.ts                            # Typed fixture data
└─ index.tsx                          # Public component export
```

Route groups không xuất hiện trong URL. Top-level `app/layout.tsx` vẫn được giữ để navigation giữa public site và admin không tạo thêm một root-layout boundary.

## Component contract and code style

- Component names dùng PascalCase; fixture/constants dùng `UPPER_SNAKE_CASE` khi module-level.
- Presentation nhận dữ liệu qua typed props, không tự fetch.
- Không dùng `any`, inline style hoặc raw clickable `<div>`.
- Không tạo component trên 200 dòng; chia theo section nếu dashboard composition vượt ngưỡng.
- Dùng semantic regions: `aside`, `header`, `nav`, `main`, `section`, heading không bỏ cấp.

```tsx
type MetricCardProps = {
  readonly label: string;
  readonly value: string;
  readonly supportingText: string;
  readonly icon: ReactNode;
};

export const MetricCard = ({
  label,
  value,
  supportingText,
  icon,
}: MetricCardProps) => (
  <Card>
    <Card.Content>
      <div aria-hidden="true">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <p>{supportingText}</p>
    </Card.Content>
  </Card>
);
```

API composition cuối cùng sẽ được xác nhận lại theo type definitions của HeroUI `3.2.4` trước khi implement.

## Data model

- `AdminMetric`: id, label, value, supporting text, tone, icon.
- `Appointment`: id, time, customer, service, status.
- `RevenueLine`: id, label, amount, emphasis.
- `QuickAction`: id, label, icon, accessible label.
- `AdminNotification`: id, title, detail, time label, tone.
- `StaffSnapshot`: id, name, initials/avatar, status, revenue, expected payout.
- `MonthlySummary`: revenue, operating cost, commission, net income.

Tất cả fixture phải readonly và có stable id; không dùng array index làm React key.

## Responsive behavior

- `>=1280px`: bám sát screenshot desktop.
- `768–1279px`: sidebar thu gọn thành rail hoặc trigger menu; KPI 2 cột; main content 2 cột.
- `<768px`: header gọn; KPI 1 cột hoặc 2 cột khi đủ chỗ; content 1 cột; appointment list vẫn đọc được ở 320px.
- Không có horizontal page overflow tại `320px`, `768px`, `1024px`, `1440px`.

## Accessibility

- Một `h1` duy nhất cho dashboard.
- Mọi icon-only button có `aria-label` và tooltip khi phù hợp.
- Active sidebar item dùng `aria-current="page"`.
- Badge số lượng có text thay thế cho screen reader.
- Màu không phải tín hiệu duy nhất của appointment status; luôn có Chip label.
- Focus ring nhìn rõ trên nền trắng và hồng nhạt.
- Contrast mục tiêu WCAG 2.1 AA.

## Testing strategy

### Static verification

- `pnpm exec next typegen` sau khi tạo route groups.
- `pnpm exec tsc --noEmit` không có lỗi.
- `pnpm run lint` không có warning/error mới.
- `pnpm run build` tạo thành công `/admin` và giữ tất cả public routes.

### Runtime verification

- `GET /admin` trả `200`.
- `GET /`, `/services`, `/designs`, `/branches`, `/booking/services` đều trả `200`.
- HTML `/admin` có title/heading dashboard và không chứa public shell tagline/footer.

### Visual verification

- Kiểm tra `320×800`, `768×1024`, `1024×768`, `1440×900`.
- So sánh screenshot desktop với ảnh tham chiếu theo hierarchy, spacing, density, palette và alignment.
- Kiểm tra keyboard navigation qua sidebar, notification, profile dropdown và quick actions.
- Browser console không có error/hydration warning.

## Boundaries

### Always do

- Dùng HeroUI cho UI primitives và Heroicons cho icon.
- Giữ public URL và public UI hoạt động như hiện tại.
- Dùng typed fixture data và semantic HTML.
- Restart `next dev` và làm mới `.next/dev` sau khi chuyển route tree để tránh stale Turbopack HMR state.
- Chạy đầy đủ typecheck, lint, build và runtime verification.

### Ask first

- Thêm hoặc nâng cấp dependency.
- Kết nối backend, Apollo, SWR hoặc Axios.
- Thêm authentication/authorization thật.
- Tạo các route con như `/admin/appointments` hoặc `/admin/customers`.
- Thay đổi global theme tokens của public website.

### Never do

- Sửa backend trong task này.
- Dùng dữ liệu doanh thu mẫu như dữ liệu nghiệp vụ thật.
- Xóa hoặc ghi đè các thay đổi UI đang có của người dùng.
- Dùng raw clickable div, icon không label hoặc text contrast thấp.
- Copy ảnh/avatar có bản quyền từ screenshot vào source.

## Success criteria

- [ ] `/admin` tồn tại và không hiển thị public navigation/footer.
- [ ] Desktop dashboard có đủ sidebar, header, 4 KPI và 5 khu vực nội dung như ảnh.
- [ ] HeroUI được dùng cho toàn bộ primitive phù hợp; không có custom raw button.
- [ ] Responsive không overflow tại 4 viewport mục tiêu.
- [ ] Public routes và giao diện public không bị regression.
- [ ] Typecheck, lint và production build đều pass.
- [ ] Runtime checks đều trả `200` và không phát sinh Turbopack panic mới.
- [ ] Visual review không còn finding mức Critical/Required.

## Resolved decisions

1. Dashboard dùng VND thay cho ký hiệu yen trong ảnh.
2. Dữ liệu là fixture và các action chưa cần hoạt động nghiệp vụ.
3. Admin dùng light theme trong giai đoạn đầu.
4. Source dùng route group `(admin)`, URL thực là `/admin`.
