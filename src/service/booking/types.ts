// Customer-facing booking types: create/confirm an appointment, look at
// availability, price it, and manage what you already booked from /me.

export interface AvailabilitySlot {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly staffId?: string;
  readonly status: "AVAILABLE" | "UNAVAILABLE" | "BLOCKED";
  readonly [field: string]: unknown;
}

export interface AvailabilityResponse {
  readonly branchId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly slots: ReadonlyArray<AvailabilitySlot>;
  readonly [field: string]: unknown;
}

export interface BookingQuoteInput {
  readonly branchId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly optionIds?: ReadonlyArray<string>;
  readonly couponCode?: string;
  readonly staffId?: string;
  readonly [field: string]: unknown;
}

export interface BookingQuote {
  readonly subtotal: number;
  readonly discount: number;
  readonly total: number;
  readonly durationMinutes: number;
  readonly lines: ReadonlyArray<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface CreateAppointmentInput {
  readonly branchId: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly optionIds?: ReadonlyArray<string>;
  readonly staffId?: string | null;
  readonly startsAt: string;
  readonly note?: string;
  readonly couponCode?: string;
  readonly customer?: Readonly<Record<string, unknown>>;
  readonly [field: string]: unknown;
}

export interface Appointment {
  readonly id: string;
  readonly customerId?: string;
  readonly branchId: string;
  readonly staffId?: string;
  readonly serviceIds: ReadonlyArray<string>;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total?: number;
  readonly version: number;
  readonly [field: string]: unknown;
}

export interface AppointmentBenefitIntent {
  readonly couponIds?: ReadonlyArray<string>;
  readonly pointsToRedeem?: number;
  readonly [field: string]: unknown;
}

export interface AppointmentConfirmationEmailInput {
  readonly email?: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentConfirmationInput {
  readonly channel?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentCancellationInput {
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentCancellationPreview {
  readonly refundTotal?: number;
  readonly penalty?: number;
  readonly note?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentRescheduleInput {
  readonly startsAt: string;
  readonly staffId?: string | null;
  readonly [field: string]: unknown;
}

export interface AppointmentRescheduleOption {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly staffId?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentRescheduleOptionsResponse {
  readonly appointmentId: string;
  readonly options: ReadonlyArray<AppointmentRescheduleOption>;
  readonly [field: string]: unknown;
}

export interface AppointmentReviewEligibility {
  readonly appointmentId: string;
  readonly eligible: boolean;
  readonly reason?: string;
  readonly [field: string]: unknown;
}

export interface AppointmentReviewInput {
  readonly rating: number;
  readonly content?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly [field: string]: unknown;
}

export interface AppointmentReview {
  readonly id: string;
  readonly appointmentId: string;
  readonly rating: number;
  readonly content?: string;
  readonly createdAt: string;
  readonly [field: string]: unknown;
}
