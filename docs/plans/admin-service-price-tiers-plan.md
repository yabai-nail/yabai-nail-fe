# Admin: gắn Mức giá vào dịch vụ

Spec: `docs/specs/SPEC-admin-services.md` → "Mức giá cho dịch vụ". API song song ở `yabai-nail-platform` (priceTierId trên dịch vụ, `serviceCount` trên mức giá).

| Bước | File | Kiểm chứng |
|---|---|---|
| 1. Kiểu dữ liệu | `src/service/admin/types.ts` (`priceTierId` trên service item/draft/patch, `serviceCount` trên tier) | `tsc` |
| 2. Payload thuần | `AdminServices/service-price.ts` | `service-price.test.ts` |
| 3. Ô giá dùng chung | `AdminServices/ServicePriceFields.tsx`, `useServicePriceDraft.ts`; nối vào `ServiceCreateModal`, `ServiceEditModal` | `service-price-tiers.test.ts` |
| 4. Tab Mức giá + nhãn trong bảng | `AdminServices/component.tsx`, `ServiceTable.tsx`, `AddonTable.tsx`, `ServiceTableCells.tsx` | test nguồn + chạy tay |
| 5. Đếm dịch vụ, tác động khi xoá, làm mới chéo màn | `AdminNailDesigns/PriceTierPanel.tsx`, `useRevalidatePriceTierDependents` trong `src/service/admin/hooks.ts` | `service-price-tiers.test.ts` |
| 6. Copy | `messages/{vi,ja,en}.json` (chèn bằng text) | `node ./scripts/check-i18n.mjs` |

Gate: `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, `node ./scripts/check-i18n.mjs`, `node ./scripts/check-ui-invariants.mjs`.
