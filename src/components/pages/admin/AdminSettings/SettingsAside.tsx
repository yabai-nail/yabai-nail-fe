import { Card } from "@heroui/react";

// The "lịch sử thay đổi tỷ lệ" card that used to sit under these notes ran on a
// fixture: no operation in the registry returns a history of commission-rate
// changes, so it was removed rather than shown with invented rows.
export function SettingsAside() {
  return (
    <div className="space-y-4">
      <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4"><h2 className="font-bold">Ghi chú</h2></Card.Header>
        <Card.Content className="p-4 text-xs leading-5 text-admin-muted">
          <ul className="list-disc space-y-2 pl-4">
            <li>Tỷ lệ hoa hồng có thể thay đổi theo năng lực và thỏa thuận.</li>
            <li>Sửa tỷ lệ của từng nhân viên ở màn Nhân viên, mục “Cấu hình hoa hồng”.</li>
            <li>Doanh thu và hoa hồng trong bảng là số liệu của kỳ đang chọn.</li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
