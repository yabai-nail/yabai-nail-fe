export type CustomerSegment = "loyal" | "new" | "regular";

const customerSegmentLabels: Record<CustomerSegment, string> = {
  loyal: "Khách thân thiết",
  new: "Khách mới",
  regular: "Khách lâu năm",
};

export function getCustomerSegmentLabel(segment: CustomerSegment) {
  return customerSegmentLabels[segment];
}
