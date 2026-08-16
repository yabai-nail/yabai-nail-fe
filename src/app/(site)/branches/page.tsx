import type { Metadata } from "next";
import { SectionPage } from "@/components/pages/client/SectionPage";

export const metadata: Metadata = {
  title: "Chi nhánh | YABAI",
};

const BranchesRoute = () => (
  <SectionPage
    eyebrow="YABAI Locations"
    title="Chọn chi nhánh"
    description="Tìm chi nhánh YABAI thuận tiện nhất cho lịch hẹn của bạn. Danh sách chi nhánh sẽ được kết nối với dữ liệu hệ thống."
  />
);

export default BranchesRoute;
