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
- Hạ tầng: `src/app/(admin)/admin/layout.tsx`, `src/i18n/`, `messages/`, `scripts/check-i18n.mjs`
- Nút đổi ngôn ngữ: tab **Ngôn ngữ** trong `/admin/settings`

**Ngoài phạm vi**

- `src/app/(site)/**` và component khách hàng — giữ nguyên tiếng Việt cứng
- `src/app/layout.tsx` và `src/app/providers.tsx` — **không đổi**, xem mục 4
- Thông báo lỗi từ backend: BE trả tiếng Việt (`"Khong tim thay tai khoan."`).
  FE không dịch lại chúng ở đợt này; xem mục 8.
- Định dạng tiền/ngày: `formatMoney` và `salon-date` giữ nguyên hành vi hiện tại

## 4. Kiến trúc

### Nguồn locale

**Server chỉ đọc được cookie `NEXT_LOCALE`.** Không có cookie hợp lệ thì dùng
`vi`. Chấm hết — server không có nguồn nào khác.

Phiên admin nằm trong `localStorage` chứ không phải cookie
(`admin-session-store.ts:6-7`: *"localStorage, not an httpOnly cookie. The
backend hands tokens back in the JSON body and sets no cookie"*), nên
`AdminSession.locale` **không đọc được từ server**. Nó không phải một bậc trong
chuỗi ưu tiên khi render.

Vai trò của nó là **đồng bộ một lần phía client**: ngay sau khi đăng nhập, nếu
cookie chưa có, client ghi `AdminSession.locale` vào cookie. Từ lần render sau
trở đi server đọc đúng ngôn ngữ và không còn nháy.

Hệ quả phải chấp nhận: **lần render đầu tiên ngay sau khi đăng nhập trên một
trình duyệt mới sẽ là tiếng Việt**, kể cả khi tài khoản đặt `ja`. Đăng nhập vốn
đã là một chuyển trang phía client nên chỗ nháy này nằm trong một lần điều
hướng, không phải mỗi lần tải trang.

### Luồng — locale đọc ở admin layout, không phải root layout

`cookies()` đẩy route sang dynamic rendering. Đo tại `7a869a8`: **22/23 route
đang là static**, chỉ `/admin/appointments` là dynamic. Đặt `cookies()` ở root
layout sẽ lật cả 5 trang công khai (`/`, `/booking`, `/branches`, `/designs`,
`/services`) sang dynamic — trả giá ở phần khách hàng cho thứ chỉ admin dùng.

Nên locale được đọc ở `src/app/(admin)/admin/layout.tsx`. Root layout và
`providers.tsx` **không đổi**; `NextIntlClientProvider` ở root hiện phục vụ một
object rỗng và sẽ tiếp tục như vậy cho `(site)`. Provider của admin lồng bên
trong và ghi đè cho nhánh của nó.

```
src/app/layout.tsx                    (giữ nguyên, sync, static)
  └─ AppProviders  locale="vi" messages={{}}
       └─ src/app/(admin)/admin/layout.tsx      (async)
            └─ resolveLocale()   src/i18n/locale.ts
            └─ getMessages()     src/i18n/messages.ts
            └─ <AdminIntlProvider locale messages>    ("use client")
                 ├─ NextIntlClientProvider
                 └─ I18nProvider (HeroUI, cho định dạng ngày/số)
                      └─ AdminAuthGate → AdminBranchProvider → AdminShell
```

`AdminIntlProvider` là client component riêng vì `NextIntlClientProvider` và
`I18nProvider` đều là client component; bọc chúng trong một file có `"use client"`
tránh phải phụ thuộc vào việc package có khai directive hay không.

Chi phí: 17 route admin chuyển từ static sang dynamic. Chấp nhận được — chúng là
vỏ `"use client"` nằm sau `AdminAuthGate`, dữ liệu vốn đã fetch phía client, nên
prerender chỉ tiết kiệm được phần vỏ.

**`<html lang>` giữ nguyên `vi`.** Sửa nó đúng theo locale đòi `cookies()` ở root,
tức đánh đổi toàn bộ trang static. Thay vào đó `AdminIntlProvider` đặt
`lang={locale}` trên phần tử bọc của nó — `lang` hợp lệ trên mọi phần tử và trình
đọc màn hình tôn trọng phạm vi gần nhất.

### 16 metadata

`export const metadata` là hằng, không đọc được locale. Mỗi trang admin chuyển
sang `generateMetadata()` bất đồng bộ dùng `getTranslations`. Không đổi URL,
không đổi hành vi render.

### Nút đổi ngôn ngữ

Tab thứ chín — **Ngôn ngữ** — trong `/admin/settings`, không phải trên header.
Chủ dự án tìm nó ở màn Cài đặt trước khi có ai chỉ chỗ, nên đó là nơi nó thuộc về.

Ghi cookie `NEXT_LOCALE` rồi gọi `router.refresh()` để server dựng lại admin
layout với catalog mới. Tên ngôn ngữ dùng endonym (`Tiếng Việt` · `日本語` ·
`English`) nên không cần dịch, và người đang mắc kẹt ở ngôn ngữ không đọc được
vẫn tìm được đường ra.

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
