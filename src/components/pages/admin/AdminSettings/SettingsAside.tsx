import { Card } from "@heroui/react";
import { commissionHistory } from "./data";

export function SettingsAside() {
  return (
    <div className="space-y-4">
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">Ghi chú</h2></Card.Header>
        <Card.Content className="p-4 text-xs leading-5 text-admin-muted">
          <ul className="list-disc space-y-2 pl-4">
            <li>Tỷ lệ hoa hồng có thể thay đổi theo năng lực và thỏa thuận.</li>
            <li>Chỉ áp dụng cho các đơn tạo từ ngày “Áp dụng từ ngày”.</li>
            <li>Đơn hàng trước ngày áp dụng giữ tỷ lệ cũ.</li>
          </ul>
        </Card.Content>
      </Card>
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">Lịch sử thay đổi tỷ lệ</h2></Card.Header>
        <Card.Content className="p-4">
          <ul className="space-y-3 text-xs">
            {commissionHistory.map((item) => (
              <li key={item.id} className="grid grid-cols-[1fr_auto] gap-2 border-b border-admin-border pb-3 last:border-0">
                <span><strong className="block">{item.name}</strong><span className="text-admin-muted">Từ {item.from}% → <span className="text-admin-success">{item.to}%</span></span></span>
                <time className="text-admin-muted">{item.date}</time>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center font-semibold text-admin-accent">Xem tất cả lịch sử</p>
        </Card.Content>
      </Card>
    </div>
  );
}
