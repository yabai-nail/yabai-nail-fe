import type { Metadata } from "next";
import { SectionPage } from "@/components/pages/SectionPage";

export const metadata: Metadata = {
  title: "Dịch vụ | YABAI",
};

const ServicesRoute = () => (
  <SectionPage
    eyebrow="YABAI Services"
    title="Dịch vụ nail"
    description="Khám phá các dịch vụ chăm sóc và thiết kế móng tại YABAI. Nội dung chi tiết sẽ được hoàn thiện ở bước tiếp theo."
  />
);

export default ServicesRoute;
