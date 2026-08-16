import type { Metadata } from "next";
import { SectionPage } from "@/components/pages/SectionPage";

export const metadata: Metadata = {
  title: "Đặt lịch | YABAI",
};

const BookingServicesRoute = () => (
  <SectionPage
    eyebrow="YABAI Booking"
    title="Chọn dịch vụ để đặt lịch"
    description="Luồng đặt lịch bắt đầu tại đây. Bạn sẽ có thể chọn dịch vụ, chi nhánh, kỹ thuật viên và thời gian phù hợp."
  />
);

export default BookingServicesRoute;
