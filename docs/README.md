# Tài liệu dự án YABAI Nail FE

Thư mục `docs` là nơi lưu tài liệu kỹ thuật và tài liệu triển khai của source code. Không đặt spec hoặc plan mới ở thư mục gốc của repository.

## Cấu trúc

```text
docs/
├── specs/   # Yêu cầu, capability map và tiêu chí nghiệm thu
└── plans/   # Kế hoạch triển khai, task list và bằng chứng kiểm chứng
```

Khi dự án cần thêm tài liệu, có thể mở rộng bằng `architecture/`, `api/`, `guides/` hoặc `decisions/` mà không trộn chúng vào `specs/` và `plans/`.

## Specs

- [FE-BE API map capability](./specs/CAPABILITY-MAP-fe-be-api-map.md)
- [FE-BE API map](./specs/SPEC-fe-be-api-map.md)
- [Admin operations capability map](./specs/CAPABILITY-MAP-admin-operations.md)
- [Admin dashboard](./specs/SPEC-admin-dashboard.md)
- [Admin foundation](./specs/SPEC-admin-foundation.md)
- [Admin appointments](./specs/SPEC-admin-appointments.md)
- [Admin customers](./specs/SPEC-admin-customers.md)
- [Admin messages](./specs/SPEC-admin-messages.md)
- [Admin payments](./specs/SPEC-admin-payments.md)
- [Admin staff](./specs/SPEC-admin-staff.md)
- [Admin services](./specs/SPEC-admin-services.md)
- [Admin settings](./specs/SPEC-admin-settings.md)

## Plans

- [FE-BE API map plan](./plans/fe-be-api-map-plan.md)
- [FE-BE API map tasks](./plans/fe-be-api-map-todo.md)
- [Admin dashboard plan](./plans/admin-dashboard-plan.md)
- [Admin dashboard tasks](./plans/admin-dashboard-todo.md)
- [Admin foundation plan](./plans/admin-foundation-plan.md)
- [Admin foundation tasks](./plans/admin-foundation-todo.md)
- [Admin appointments plan](./plans/admin-appointments-plan.md)
- [Admin appointments tasks](./plans/admin-appointments-todo.md)
- [Admin payments plan](./plans/admin-payments-plan.md)
- [Admin payments tasks](./plans/admin-payments-todo.md)
- [Admin operations plan](./plans/admin-operations-plan.md)
- [Admin operations tasks](./plans/admin-operations-todo.md)

## Quy ước

- Tên spec: `SPEC-<module>.md`.
- Tên plan: `<module>-plan.md`.
- Tên task list: `<module>-todo.md`.
- Cập nhật trạng thái, checklist và verification record cùng lúc với thay đổi source tương ứng.
- Khi một quyết định kiến trúc quan trọng thay đổi, lưu ADR mới trong `docs/decisions/` thay vì xóa lịch sử quyết định cũ.
