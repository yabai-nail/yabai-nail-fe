import { Suspense } from "react";
import BookingConfirmRoute from "./booking-confirm-route";

export default function BookingPage() {
  // useSearchParams() inside the route needs a boundary or the static
  // prerender bails out at build time.
  return (
    <Suspense>
      <BookingConfirmRoute />
    </Suspense>
  );
}
