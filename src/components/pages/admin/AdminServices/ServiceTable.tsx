import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";
import { formatVnd } from "@/lib/admin-format";
import { categoryLabels, type SalonService } from "./data";

export function ServiceTable({
  services,
  onEdit,
}: Readonly<{
  services: ReadonlyArray<SalonService>;
  /** Optional edit callback. When omitted the pencil button is hidden. */
  onEdit?: (service: SalonService) => void;
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <caption className="sr-only">Danh sách dịch vụ</caption>
        <thead className="border-b border-admin-border text-xs text-admin-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Dịch vụ</th>
            <th scope="col" className="px-3 py-3">Loại</th>
            <th scope="col" className="px-3 py-3">Giá</th>
            <th scope="col" className="px-3 py-3">Thời gian</th>
            <th scope="col" className="px-3 py-3">Trạng thái</th>
            <th scope="col" className="px-3 py-3">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {services.map((service, index) => (
            <tr key={service.id}>
              <td className="px-4 py-2">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={`size-11 shrink-0 rounded-lg border border-admin-border ${index % 2 ? "bg-gradient-to-br from-rose-100 to-amber-50" : "bg-gradient-to-br from-pink-100 to-fuchsia-50"}`} />
                  <strong>{service.name}</strong>
                </div>
              </td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={service.category === "primary" ? "accent" : service.category === "addon" ? "warning" : "default"}>
                  <Chip.Label>{categoryLabels[service.category]}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2 font-semibold">{formatVnd(service.price)}</td>
              <td className="px-3 py-2">{service.durationMinutes} phút</td>
              <td className="px-3 py-2">
                <Chip size="sm" variant="soft" color={service.isVisible ? "success" : "default"}>
                  <Chip.Label>{service.isVisible ? "Đang hiển thị" : "Đang ẩn"}</Chip.Label>
                </Chip>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Sửa ${service.name}`}
                    isDisabled={!onEdit || service.version === undefined}
                    onPress={onEdit ? () => onEdit(service) : undefined}
                  >
                    <PencilSquareIcon className="size-4" />
                  </Button>
                  {/* No delete button here: the admin API exposes no DELETE for a
                      service. A service is retired by turning its visibility off,
                      which the edit form already does. */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {services.length === 0 ? <p role="status" className="p-12 text-center text-sm text-admin-muted">Không tìm thấy dịch vụ phù hợp.</p> : null}
    </div>
  );
}
