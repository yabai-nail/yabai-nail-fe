export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiAudience = "app" | "provider" | "internal";

export interface ApiOperation {
  readonly id: ApiOperationId;
  readonly method: ApiMethod;
  readonly path: string;
  readonly audience: ApiAudience;
  readonly stability: "canonical" | "legacy";
}

const operationSource = `
GET /api/v1/admin/accounts
POST /api/v1/admin/accounts
PATCH /api/v1/admin/accounts/{accountId}
POST /api/v1/admin/accounts/{accountId}/password-resets
POST /api/v1/admin/audiences/previews
GET /api/v1/admin/audit-logs
GET /api/v1/admin/audit-logs/{logId}
POST /api/v1/admin/auth/password-changes
POST /api/v1/admin/auth/password-reset-requests
POST /api/v1/admin/auth/password-resets
POST /api/v1/admin/auth/sessions
POST /api/v1/admin/auth/sessions/{sessionId}/branch
GET /api/v1/admin/branches
POST /api/v1/admin/branches
GET /api/v1/admin/branches/{branchId}
PATCH /api/v1/admin/branches/{branchId}
GET /api/v1/admin/branches/{branchId}/appointments
POST /api/v1/admin/branches/{branchId}/appointments
GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}
PUT /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/actual-services
GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/allocation-candidates
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/assignment
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/cancellation
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/check-in
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/no-show
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payment-quotes
GET /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/payments
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/photos
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/reschedule
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-completion
POST /api/v1/admin/branches/{branchId}/appointments/{appointmentId}/service-start
GET /api/v1/admin/branches/{branchId}/calendar
POST /api/v1/admin/branches/{branchId}/check-in-resolutions
GET /api/v1/admin/branches/{branchId}/customers
POST /api/v1/admin/branches/{branchId}/customers
GET /api/v1/admin/branches/{branchId}/customers/{customerId}
PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}
GET /api/v1/admin/branches/{branchId}/customers/{customerId}/benefits
POST /api/v1/admin/branches/{branchId}/customers/{customerId}/coupon-issuances
GET /api/v1/admin/branches/{branchId}/customers/{customerId}/nail-history
GET /api/v1/admin/branches/{branchId}/customers/{customerId}/notes
POST /api/v1/admin/branches/{branchId}/customers/{customerId}/notes
PATCH /api/v1/admin/branches/{branchId}/customers/{customerId}/notes/{noteId}
POST /api/v1/admin/branches/{branchId}/customers/{customerId}/point-adjustments
GET /api/v1/admin/branches/{branchId}/customers/lookup
GET /api/v1/admin/branches/{branchId}/dashboard
POST /api/v1/admin/branches/{branchId}/leave-requests
POST /api/v1/admin/branches/{branchId}/leave-requests/{requestId}/decision
POST /api/v1/admin/branches/{branchId}/membership-card-resolutions
POST /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds
GET /api/v1/admin/branches/{branchId}/payments/{paymentId}/refunds/{refundId}
GET /api/v1/admin/branches/{branchId}/reviews
PATCH /api/v1/admin/branches/{branchId}/reviews/{reviewId}/handling
POST /api/v1/admin/branches/{branchId}/reviews/{reviewId}/replies
GET /api/v1/admin/branches/{branchId}/shifts
POST /api/v1/admin/branches/{branchId}/shifts
GET /api/v1/admin/loyalty-config
PUT /api/v1/admin/loyalty-config
POST /api/v1/admin/nail-design-proposals/{proposalId}/decision
GET /api/v1/admin/nail-designs
POST /api/v1/admin/nail-designs
PATCH /api/v1/admin/nail-designs/{designId}
POST /api/v1/admin/notification-campaigns
POST /api/v1/admin/notification-campaigns/{campaignId}/cancellation
GET /api/v1/admin/notification-campaigns/{campaignId}/metrics
POST /api/v1/admin/notification-campaigns/audience-previews
GET /api/v1/admin/promotions
POST /api/v1/admin/promotions
PATCH /api/v1/admin/promotions/{promotionId}
POST /api/v1/admin/promotions/{promotionId}/issuances
POST /api/v1/admin/report-exports
GET /api/v1/admin/report-exports/{exportId}
POST /api/v1/admin/report-exports/{exportId}/download-url
GET /api/v1/admin/reports/branches
GET /api/v1/admin/reports/customers
GET /api/v1/admin/reports/revenue-summary
GET /api/v1/admin/reports/staff-performance
GET /api/v1/admin/service-categories
POST /api/v1/admin/service-categories
PATCH /api/v1/admin/service-categories/{categoryId}
POST /api/v1/admin/service-categories/reorder
GET /api/v1/admin/services
POST /api/v1/admin/services
PATCH /api/v1/admin/services/{serviceId}
GET /api/v1/admin/staff
POST /api/v1/admin/staff
GET /api/v1/admin/staff/{staffId}
PATCH /api/v1/admin/staff/{staffId}
GET /api/v1/admin/staff/{staffId}/compensation
PUT /api/v1/admin/staff/{staffId}/compensation
GET /api/v1/admin/staff/{staffId}/skills
PUT /api/v1/admin/staff/{staffId}/skills
GET /api/v1/admin/surcharges
POST /api/v1/admin/surcharges
PATCH /api/v1/admin/surcharges/{surchargeId}
GET /api/v1/admin/system-config
PATCH /api/v1/admin/system-config
GET /api/v1/app-bootstrap
POST /api/v1/appointments
PUT /api/v1/appointments/{appointmentId}/benefit-intent
POST /api/v1/appointments/{appointmentId}/confirmation
POST /api/v1/appointments/{appointmentId}/confirmation-emails
POST /api/v1/auth/account-merges
POST /api/v1/auth/phone/challenges
POST /api/v1/auth/phone/challenges/{challengeId}/verify
POST /api/v1/auth/recovery/phone/challenges
POST /api/v1/auth/recovery/phone/challenges/{challengeId}/verify
DELETE /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/current
POST /api/v1/auth/sessions/refresh
POST /api/v1/auth/social/{provider}/authorization
POST /api/v1/auth/social/{provider}/callback
GET /api/v1/availability
GET /api/v1/branches
GET /api/v1/branches/{branchId}
GET /api/v1/branches/{branchId}/eligible-staff
GET /api/v1/branches/{branchId}/service-categories
GET /api/v1/branches/{branchId}/services
GET /api/v1/branches/{branchId}/services/{serviceId}
GET /api/v1/customer-home
POST /api/v1/integrations/email/{provider}/webhooks
GET /api/v1/localization/languages
GET /api/v1/me
PATCH /api/v1/me
POST /api/v1/me/account-deletion-requests
GET /api/v1/me/appointments
GET /api/v1/me/appointments/{appointmentId}
POST /api/v1/me/appointments/{appointmentId}/cancellation
GET /api/v1/me/appointments/{appointmentId}/cancellation-preview
POST /api/v1/me/appointments/{appointmentId}/reschedule
GET /api/v1/me/appointments/{appointmentId}/reschedule-options
GET /api/v1/me/appointments/{appointmentId}/review-eligibility
POST /api/v1/me/appointments/{appointmentId}/reviews
GET /api/v1/me/coupons
POST /api/v1/me/coupons/{couponId}/claims
DELETE /api/v1/me/devices/{installationId}
PUT /api/v1/me/devices/{installationId}
GET /api/v1/me/favorite-designs
DELETE /api/v1/me/favorite-designs/{designId}
PUT /api/v1/me/favorite-designs/{designId}
GET /api/v1/me/membership-card
GET /api/v1/me/membership-progress
GET /api/v1/me/notifications
PATCH /api/v1/me/notifications/{notificationId}
POST /api/v1/me/notifications/read-all
GET /api/v1/me/point-transactions
PATCH /api/v1/me/preferences/default-branch
PATCH /api/v1/me/preferences/language
DELETE /api/v1/media/{mediaId}
GET /api/v1/media/{mediaId}/access-url
POST /api/v1/media/uploads
DELETE /api/v1/media/uploads/{mediaId}
POST /api/v1/media/uploads/{mediaId}/complete
GET /api/v1/nail-designs
GET /api/v1/nail-designs/{designId}
POST /api/v1/pricing/quotes
GET /api/v1/promotions
POST /api/v1/public/appointments/{opaqueAppointmentId}/confirmation
GET /api/v1/reviews
POST /internal/v1/integrations/push/messages
POST /internal/v1/integrations/sms/otp-messages
POST /internal/v1/integrations/sms/webhooks/{provider}
POST /internal/v1/jobs/membership-evaluation/runs
`;

// Concrete NestJS controller routes present in runtime Swagger but absent from
// the canonical 164-operation SRS registry. New FE work should prefer a
// canonical operation when both contracts cover the same use case.
const compatibilityOperationSource = `
GET /api/v1/admin/reviews
GET /api/v1/appointments/{id}
GET /api/v1/appointments/me
GET /api/v1/auth/session
GET /api/v1/branches/{branchId}/availability
GET /api/v1/branches/{branchId}/staff
GET /api/v1/home
GET /api/v1/services
GET /api/v1/services/{serviceId}
POST /api/v1/admin/appointments/{id}/payments
POST /api/v1/admin/appointments/{id}/transitions
POST /api/v1/appointments/{id}/confirm
POST /api/v1/appointments/{id}/review
POST /api/v1/auth/otp/request
POST /api/v1/auth/otp/verify
POST /internal/v1/integrations/{channel}/webhooks/{provider}
POST /internal/v1/jobs/appointment-expiry/runs
POST /internal/v1/jobs/appointment-reminders/runs
POST /internal/v1/jobs/outbox-dispatch/runs
`;

export type ApiOperationId = `${ApiMethod} ${string}`;

function audienceFor(path: string): ApiAudience {
  if (path.startsWith("/internal/")) return "internal";
  if (path.includes("/webhooks")) return "provider";
  return "app";
}

function parseOperations(
  source: string,
  stability: ApiOperation["stability"],
): ReadonlyArray<ApiOperation> {
  return source.trim().split("\n").map((line) => {
    const separator = line.indexOf(" ");
    const method = line.slice(0, separator) as ApiMethod;
    const path = line.slice(separator + 1);
    return {
      id: line as ApiOperationId,
      method,
      path,
      audience: audienceFor(path),
      stability,
    };
  });
}

export const apiOperations = parseOperations(operationSource, "canonical");
export const compatibilityApiOperations = parseOperations(
  compatibilityOperationSource,
  "legacy",
);
export const runtimeApiOperations: ReadonlyArray<ApiOperation> = [
  ...apiOperations,
  ...compatibilityApiOperations,
];

const operationsById = new Map(
  runtimeApiOperations.map((operation) => [operation.id, operation]),
);

export function getApiOperation(id: ApiOperationId): ApiOperation {
  const operation = operationsById.get(id);
  if (!operation) throw new Error(`Unknown backend API operation: ${id}`);
  return operation;
}

export type ApiPathParams = Readonly<Record<string, string | number>>;

export function buildOperationPath(
  operation: ApiOperation,
  params: ApiPathParams = {},
): string {
  if (operation.audience !== "app") {
    throw new Error(`Cannot call ${operation.audience} server-only API from the browser.`);
  }

  const expected = [...operation.path.matchAll(/\{([^}]+)\}/g)].map(
    (match) => match[1],
  );
  const unknown = Object.keys(params).filter((name) => !expected.includes(name));
  if (unknown.length) {
    throw new Error(`Unknown path parameter(s): ${unknown.join(", ")}`);
  }

  const resolved = operation.path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    return encodeURIComponent(String(value));
  });

  return resolved.replace(/^\/api\/v1/, "");
}
