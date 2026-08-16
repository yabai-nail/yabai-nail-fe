# Spec: Admin Foundation

## Trạng thái

- Capability id: `admin-foundation`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16
- Phạm vi: Nền tảng giao diện dùng chung cho toàn bộ route `/admin/*`

## Giả định cần duyệt

1. Header của dashboard `/admin` tiếp tục dùng lời chào; các trang con hiển thị tiêu đề và mô tả theo route như ảnh tham chiếu.
2. Sidebar dùng `usePathname()` để xác định mục hiện tại và dùng `next/link` để chuyển trang không reload.
3. Các route chưa nằm trong đợt này vẫn hiển thị ở sidebar nhưng ở trạng thái chưa khả dụng; không tạo màn rỗng cho Thanh toán và Báo cáo.
4. UI dùng dữ liệu fixture và local state cho tab, lựa chọn dòng, tìm kiếm và panel; không gọi API.
5. Desktop ưu tiên bám sát ảnh ở 1440px; tablet/mobile chuyển bảng thành vùng cuộn ngang có nhãn và chuyển detail panel xuống dưới nội dung.

## Objective

Tạo lớp giao diện quản trị thống nhất để năm module nghiệp vụ có thể dùng chung cấu trúc trang, navigation, header, toolbar, table, trạng thái và detail panel mà không sao chép markup hoặc style.

Foundation phải giữ nguyên dashboard hiện tại, cho phép chuyển route bằng Next.js client navigation và tạo một contract rõ ràng cho mỗi màn nghiệp vụ.

## Tech stack

- Next.js `16.3.1`, App Router.
- React `19.2.8`, TypeScript strict.
- HeroUI React `3.2.4` và HeroUI Styles `3.2.4`.
- Tailwind CSS `4` cho layout và responsive.
- Heroicons React `2.2.0`.
- Không thêm dependency mới.

## Commands

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm dev
```

Project dùng Vitest cho pure/domain regression tests. Verification bắt buộc gồm test, typecheck, lint, production build, kiểm tra HTTP và kiểm tra trình duyệt ở các viewport mục tiêu.

## Project structure

```text
src/app/(admin)/admin/
├── layout.tsx
├── page.tsx
├── customers/page.tsx
├── messages/page.tsx
├── staff/page.tsx
├── services/page.tsx
└── settings/page.tsx

src/components/layouts/AdminShell/
├── component.tsx        # Shell, header, owner menu, mobile drawer
├── navigation.tsx       # Route config và sidebar route-aware
├── page-context.tsx     # Contract tiêu đề/mô tả theo route nếu cần client context
└── index.tsx

src/components/blocks/admin/
├── AdminPageHeader/
├── AdminToolbar/
├── AdminDataTable/
├── AdminDetailPanel/
├── AdminStatusBadge/
└── AdminMetricCard/

src/components/pages/
├── AdminCustomers/
├── AdminMessages/
├── AdminStaff/
├── AdminServices/
└── AdminSettings/
```

Chỉ trích xuất block khi ít nhất hai màn dùng cùng contract. Component đặc thù nghiệp vụ được colocate trong thư mục page tương ứng.

## Component contracts and code style

- Component và type dùng PascalCase; fixture/module constant dùng camelCase hoặc `UPPER_SNAKE_CASE` khi thật sự là constant toàn cục.
- Presentation component nhận typed props; dữ liệu fixture đặt trong `data.ts`.
- Stable id làm React key; không dùng array index.
- Không dùng `any`, inline style, raw clickable `div` hoặc component trên 200 dòng.
- Ưu tiên composition thay vì component có quá nhiều boolean props.
- Dùng semantic `main`, `section`, `aside`, `nav`, `table`, `th scope="col"` và một `h1` cho mỗi route.

```tsx
type AdminPageHeadingProps = {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
};

export function AdminPageHeading({
  title,
  description,
  actions,
}: AdminPageHeadingProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
```

## Shared behavior

### Navigation

- Route khả dụng: Tổng quan, Khách hàng, Tin nhắn, Nhân viên, Dịch vụ, Cài đặt.
- Active item dựa trên pathname và có `aria-current="page"`.
- Dùng `Link`, không dùng anchor nội bộ hoặc `window.location`, nên chuyển trang giữ SPA navigation.
- Mobile drawer đóng sau khi chọn route.

### Page header

- Dashboard: lời chào và ngày hiện tại.
- Trang con: tiêu đề và mô tả nghiệp vụ tương ứng ảnh tham chiếu.
- Bell và owner menu luôn canh phải, không tràn hoặc lệch khỏi viewport.

### Shared surface

- Panel nền trắng, viền `admin-border`, không lạm dụng shadow.
- Bán kính chuẩn `rounded-lg`; button không bo tròn dạng pill trừ badge/chip.
- Toolbar hỗ trợ tabs, search, filter và primary action qua composition.
- Table giữ header rõ ràng, hàng chọn có nền `admin-soft`, hỗ trợ overflow có chủ đích trên màn nhỏ.
- Detail panel là `aside` trên desktop; trên mobile nằm sau nội dung chính hoặc dùng HeroUI Drawer khi interaction cần overlay.

## Accessibility

- Có skip link hoạt động và `main#main-content` duy nhất.
- Mỗi route có một `h1`; heading không bỏ cấp.
- Icon-only button có accessible name.
- Input search có label hoặc `aria-label` mô tả phạm vi tìm kiếm.
- Table có caption ẩn, header `scope` và row action có tên chứa đối tượng.
- Trạng thái không chỉ truyền đạt bằng màu; luôn có text hoặc icon kèm nhãn.
- Focus ring nhìn rõ; target tương tác tối thiểu 44×44px trên mobile.
- Không tạo keyboard trap; Drawer/Dropdown dùng focus management của HeroUI.

## Responsive behavior

- `1440px`: sidebar 224px; header và content bám mật độ của ảnh; list/table cùng detail panel hiển thị song song.
- `1024px`: sidebar chuyển sang drawer; content giữ table và detail panel theo không gian thực tế.
- `768px`: toolbar được wrap; detail panel xuống hàng; table có overflow rõ ràng.
- `320px`: một cột, không có page-level horizontal overflow; chỉ vùng table được phép cuộn ngang.

## Testing strategy

### Static

- `pnpm exec next typegen` nhận đủ route mới.
- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build` đều pass.
- Không có import vòng giữa foundation và page modules.

### Runtime

- Mỗi route mới trả HTTP `200` và hiển thị đúng `h1`.
- Sidebar active đúng sau client-side navigation; không full-page reload.
- Dashboard `/admin` không regression.
- Console không có error, hydration warning hoặc accessibility warning do component mới.

### Visual and interaction

- Kiểm tra `320×800`, `768×1024`, `1024×768`, `1440×900`.
- Tab qua sidebar, header, toolbar, table actions và detail panel theo thứ tự logic.
- So sánh hierarchy, spacing, alignment, màu sắc và density với ảnh tham chiếu.

## Boundaries

### Always do

- Dùng HeroUI/Heroicons và admin design tokens hiện tại.
- Dùng `next/link` cho navigation nội bộ.
- Giữ fixture typed, component nhỏ và semantic HTML.
- Chạy typecheck, lint, build và browser verification trước khi commit.

### Ask first

- Thêm dependency hoặc test framework.
- Kết nối API, authentication hoặc persistence.
- Thay đổi URL đã duyệt hoặc theme public.
- Biến detail panel thành modal/drawer trên desktop.

### Never do

- Copy avatar/hình dịch vụ từ screenshot vào source.
- Hard-code credential, secret hoặc dữ liệu khách hàng thật.
- Dùng `window.location` cho điều hướng nội bộ.
- Tạo một component admin khổng lồ chứa logic của nhiều module.

## Success criteria

- [x] Sidebar điều hướng SPA tới đủ năm route mới và active state luôn đúng.
- [x] Header hiển thị đúng title/description theo trang, bell và owner menu luôn thẳng hàng.
- [x] Dashboard hiện tại không bị regression.
- [x] Shared blocks chỉ chứa contract thật sự tái sử dụng và không phụ thuộc dữ liệu nghiệp vụ cụ thể.
- [x] UI giữ palette, radius, spacing và typography thống nhất với admin hiện tại.
- [x] Không overflow ngoài ý muốn tại bốn viewport mục tiêu.
- [x] Test, typecheck, lint, build, runtime và keyboard checks đều pass.

## Open questions

- Không còn câu hỏi mở nếu năm giả định đầu spec được duyệt.
