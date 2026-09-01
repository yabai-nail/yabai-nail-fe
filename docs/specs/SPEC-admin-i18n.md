# SPEC — Đa ngôn ngữ cho console admin

Ngày: 2026-09-01 · Trạng thái: chờ duyệt · Phạm vi: `yabai-nail-fe`

## 1. Vì sao

`next-intl@4.13.6` đã được cài và `NextIntlClientProvider` đã mount trong
`src/app/providers.tsx`. Nhưng `src/app/layout.tsx` hardcode
`DEFAULT_LOCALE = "vi"` và `DEFAULT_MESSAGES = {}` — một object rỗng. Ba thư mục
`messages/`, `src/i18n/`, `src/messages/` đều không có file nào.

Nghĩa là khung i18n đã dựng nhưng chưa bao giờ được nối vào. Toàn bộ chữ trong
console nằm cứng trong component.

Đo được tại `7a869a8`:

| | |
|---|---|
| Chuỗi tiếng Việt hardcode | 1.164 |
| File phải sửa | 147 (117 `.tsx`, 55 trong đó là `"use client"`) |
| `export const metadata` hardcode | 16 (mỗi cái `title` + `description`) |

## 2. Quyết định đã chốt

| Quyết định | Chọn | Vì sao |
|---|---|---|
| Ngôn ngữ | **VI + JA + EN** | Yêu cầu của chủ dự án |
| Ai dịch JA/EN | **Agent dịch máy** | Chủ dự án chọn sau khi đã được nêu rủi ro (mục 8) |
| Chọn locale | **Tài khoản + cookie + nút đổi** | Không phải tái cấu trúc route |
| Cách rút chuỗi | **Script quét/sinh, người thay code** | Codemod JSX tự sửa là nơi sinh lỗi im lặng |

### Vì sao không dùng cách của Next docs

`node_modules/next/dist/docs/01-app/02-guides/internationalization.md` khuyến
nghị dictionary phía server đọc qua `next/root-params`. Tài liệu
`next/root-params` ghi rõ nó **không dùng được trong Client Component**.

55/117 component admin là client component. Nên đường đó không áp dụng được cho
console này, và đó chính là lý do `next-intl` đã có mặt sẵn trong `package.json`.

### Vì sao không đưa locale lên URL

Đưa locale lên URL đòi chuyển toàn bộ `src/app/` vào `[lang]/`, viết `proxy.ts`
(Next 16 đã đổi tên từ `middleware.js`) và sửa mọi link nội bộ — kể cả phần
`(site)` vốn ngoài phạm vi. Console nội bộ không cần chia sẻ link theo ngôn ngữ.

## 3. Phạm vi

**Trong phạm vi**

- `src/components/pages/admin/**`, `src/components/blocks/admin/**`
- `src/components/layouts/**` (AdminShell, ShellNav, AdminAuthGate)
- 16 `export const metadata` trong `src/app/(admin)/admin/**`
- Hạ tầng: `src/app/layout.tsx`, `src/app/providers.tsx`, `src/i18n/`, `messages/`
- Nút đổi ngôn ngữ trong AdminShell

**Ngoài phạm vi**

- `src/app/(site)/**` và component khách hàng — giữ nguyên tiếng Việt cứng
- Thông báo lỗi từ backend: BE trả tiếng Việt (`"Khong tim thay tai khoan."`).
  FE không dịch lại chúng ở đợt này; xem mục 8.
- Định dạng tiền/ngày: `formatMoney` và `salon-date` giữ nguyên hành vi hiện tại

## 4. Kiến trúc

### Nguồn locale, theo thứ tự ưu tiên

1. Cookie `NEXT_LOCALE` — do nút đổi ghi
2. `AdminSession.locale` — BE đã trả trong response đăng nhập (`service/auth/types.ts:13`)
3. Mặc định `vi`

Cookie đứng trước để server render đúng ngôn ngữ ngay ở HTML đầu tiên, không
nháy sau hydrate.

### Luồng

```
src/app/layout.tsx  (async, đọc cookies() từ next/headers)
   └─ resolveLocale()            src/i18n/locale.ts
   └─ getMessages(locale)        src/i18n/messages.ts
        └─ import messages/<locale>.json
   └─ <AppProviders locale messages>
        └─ NextIntlClientProvider
             ├─ client component  →  useTranslations("admin.payments")
             └─ server component  →  getTranslations() từ next-intl/server
```

`RootLayout` hiện là hàm đồng bộ; đọc cookie đòi `await cookies()` nên nó phải
trở thành `async`. Đây là thay đổi duy nhất chạm vào phần dùng chung với `(site)`.

### 16 metadata

`export const metadata` là hằng, không đọc được locale. Mỗi trang admin chuyển
sang `generateMetadata()` bất đồng bộ dùng `getTranslations`. Không đổi URL,
không đổi hành vi render.

### Nút đổi ngôn ngữ

Đặt trong `AdminShell`. Ghi cookie `NEXT_LOCALE` rồi gọi `router.refresh()` để
server dựng lại với catalog mới.

**Giới hạn đã biết:** lựa chọn chỉ sống trong cookie của trình duyệt đó. Đồng bộ
về tài khoản cần một endpoint BE chưa tồn tại — `PATCH /me/preferences/language`
là cửa của khách hàng, không phải admin. Ghi vào `docs/backend-api-gaps.md` chứ
không tự chế endpoint.

## 5. Quy ước khóa

Theo đúng kiểu mobile đã dùng (`auth.register.heading`), lồng theo màn:

```
admin.<màn>.<khu vực>.<khóa>
admin.payments.methodPicker.cash
admin.appointments.table.emptyState
admin.common.actions.save
```

- `admin.common.*` chỉ dành cho chuỗi **thực sự** dùng ở từ 3 màn trở lên.
  Gom sớm sẽ tạo ra một túi rác chung.
- Một khóa một chuỗi. Không ghép chuỗi ở chỗ gọi.

### 42 chuỗi có nội suy

Chuyển sang ICU placeholder, không ghép thủ công:

```json
{ "serviceCount": "{count} dịch vụ" }
```
```tsx
t("serviceCount", { count: services.length })
```

## 6. Cổng kiểm tra

`scripts/check-i18n.mjs`, theo đúng kiểu `check-ui-invariants.mjs` repo đã có
(exit 0 sạch, exit 1 khi phát hiện, cho phép miễn trừ bằng comment kèm lý do):

1. **Chuỗi sót** — còn literal tiếng Việt trong vùng thuộc phạm vi → fail.
   Đây là thứ chặn chuỗi cứng mới lọt vào sau này.

   Phát hiện bằng cách dò **dấu thanh và ký tự riêng của tiếng Việt**
   (`àáảãạ…đ`). Điểm mù phải nói rõ: chuỗi tiếng Việt không dấu — `"Xoa"`,
   `"Ban"`, `"OK"` — sẽ lọt qua, và không có cách tự động nào phân biệt chúng
   với tiếng Anh. Nên số 1.164 đo được là **sàn**, không phải trần; lát rút
   chuỗi của mỗi màn vẫn phải đọc bằng mắt, cổng này chỉ chặn tái phát.
2. **Khóa lệch** — tập khóa của `ja.json` / `en.json` khác `vi.json` → fail.
3. **Khóa nhạy cảm** — liệt kê (không fail) mọi khóa chứa từ về tiền, hoàn tiền,
   hủy, không đến, xóa, để ưu tiên soát bản dịch.

Thêm vào `package.json` là `"i18n:check"`, chạy cùng `lint` và `test`.

## 7. Thứ tự triển khai

| Lát | Nội dung |
|---|---|
| 0 | Spec này |
| 1 | Hạ tầng: `src/i18n/`, `layout.tsx` async, `getMessages`, `vi.json` rỗng, `check-i18n.mjs` (chưa bật cổng chặn) |
| 2 | Nút đổi ngôn ngữ trong AdminShell |
| 3 | `layouts/` + `blocks/admin/` (dùng chung, phải xong trước các màn) |
| 4–19 | 16 màn admin, mỗi màn một lát, kèm `metadata` của nó |
| 20 | Sinh `en.json` |
| 21 | Sinh `ja.json` |
| 22 | Bật cổng chặn trong `check-i18n.mjs`, nối vào CI |

Mỗi lát: `pnpm lint` + `pnpm test` + `pnpm build` + `pnpm ui:check` rồi commit.
Dừng được ở bất kỳ lát nào mà console vẫn chạy — các màn chưa rút vẫn hiển thị
tiếng Việt cứng như cũ.

## 8. Rủi ro đã biết

**Bản dịch JA/EN chưa qua soát người bản ngữ.** Đây là console vận hành có tiền:
dịch sai "Hoàn tiền", "Không đến", "Hủy bởi tiệm" gây hậu quả thật. Chủ dự án đã
được nêu rủi ro này và chọn tiếp tục. Bản dịch agent sinh ra phải được xem là
**nháp**; mục 6.3 tồn tại để chỉ ra chỗ cần soát trước.

**Console sẽ trộn ngôn ngữ khi chọn JA/EN.** Thông báo lỗi vẫn do BE trả bằng
tiếng Việt. Dịch chúng cần error-code registry ở phía FE, là việc riêng.

**`RootLayout` thành `async`** chạm vào cả `(site)`. Không đổi hành vi, nhưng
đây là file dùng chung duy nhất trong đợt này.

## 9. Nghiệm thu

- [ ] `pnpm i18n:check` sạch cả ba mục
- [ ] `messages/{vi,ja,en}.json` cùng tập khóa
- [ ] `pnpm build` xanh; console chạy được ở cả ba ngôn ngữ
- [ ] Đổi ngôn ngữ rồi tải lại trang giữ nguyên lựa chọn, không nháy
- [ ] `docs/backend-api-gaps.md` có mục về endpoint lưu locale cho admin
