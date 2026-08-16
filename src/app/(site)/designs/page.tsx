import type { Metadata } from "next";
import { SectionPage } from "@/components/pages/SectionPage";

export const metadata: Metadata = {
  title: "Bộ sưu tập | YABAI",
};

const DesignsRoute = () => (
  <SectionPage
    eyebrow="YABAI Collection"
    title="Bộ sưu tập mẫu nail"
    description="Không gian tuyển chọn những mẫu nail mới nhất để bạn tìm cảm hứng trước khi đặt lịch."
  />
);

export default DesignsRoute;
