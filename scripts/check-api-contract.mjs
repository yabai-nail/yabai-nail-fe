#!/usr/bin/env node
/**
 * Checks that the fields this frontend reads are the fields the backend sends.
 *
 * Almost every defect found while driving the admin console came from the same
 * place: a hand-written type in src/service/admin/types.ts named a field the API
 * does not have. TypeScript happily verified the code against that invented
 * contract, lint passed, the unit tests passed, and the screen still failed on
 * the first click — a save rejected, a column permanently blank, or a page that
 * crashed as soon as real data arrived.
 *
 * Generating types from the backend's OpenAPI document would be the stronger
 * fix, but it is not available here: every operation declares its response as
 * ApiSuccessEnvelope, whose `data` carries no properties, so generation would
 * produce `unknown` for all 168 endpoints. Until the backend describes real
 * schemas, this script is the substitute: it calls the live API and asserts the
 * field names are there.
 *
 * It is deliberately NOT part of `pnpm test`: it needs the network and an admin
 * credential, and a unit suite that needs either is a unit suite people learn to
 * skip.
 *
 *   YABAI_API_URL=https://apiyabai.tedo.vn/api/v1 \
 *   YABAI_ADMIN_PHONE=09xxxxxxxx \
 *   YABAI_ADMIN_PASSWORD=... \
 *   node ./scripts/check-api-contract.mjs
 *
 * Exit code 0 when every expected field is present, 1 otherwise, so CI can gate
 * on it. It only ever reads: no request here creates, updates or deletes.
 *
 * What it catches: the frontend reading a field the API does not send. That was
 * the shape of most defects found — skills read serviceId where the API sends
 * skillId, nail history read serviceNames where it sends services, allocation
 * candidates read staffId where it sends id.
 *
 * What it does NOT catch, so do not read a green run as proof of correctness:
 *   - the frontend WRITING a field the API ignores. Branch settings saved
 *     booking.windowDays for weeks; the key sat in the record unread, so a check
 *     of "is the field present" would have passed while the setting did nothing.
 *   - anything about a field's meaning, only that the name exists.
 *   - endpoints with no rows yet — an empty collection cannot confirm the shape
 *     of its elements, and those are reported as EMPTY rather than ok.
 */

const API = process.env.YABAI_API_URL ?? "https://apiyabai.tedo.vn/api/v1";
const PHONE = process.env.YABAI_ADMIN_PHONE;
const PASSWORD = process.env.YABAI_ADMIN_PASSWORD;

if (!PHONE || !PASSWORD) {
  console.error("Missing YABAI_ADMIN_PHONE / YABAI_ADMIN_PASSWORD.");
  console.error("This check signs in as an admin and reads live data; it cannot run without them.");
  process.exit(2);
}

let token = "";

async function call(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    // Every mutating call needs one; sign-in is the only mutation here.
    headers["Idempotency-Key"] = `contract-check-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${method} ${path} -> ${response.status}, response was not JSON`);
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${parsed?.error?.code ?? ""}`);
  }
  return parsed.data;
}

/**
 * Reads a dotted path, treating `[]` as "every element must have the rest".
 * Returns a list of human-readable problems, empty when the shape holds.
 */
function missing(value, expression) {
  const [head, ...rest] = expression.split(".");
  if (head === "[]") {
    if (!Array.isArray(value)) return [`expected an array at this level`];
    // An empty collection cannot contradict the contract, only fail to confirm it.
    return value.flatMap((item) => missing(item, rest.join(".")));
  }
  if (value === null || typeof value !== "object") return [`expected an object holding "${head}"`];
  if (!(head in value)) return [`missing "${head}"`];
  if (rest.length === 0) return [];
  return missing(value[head], rest.join("."));
}

/** Endpoints, and the fields the FE actually reads from each. */
function contracts(ids) {
  const { branchId, customerId, appointmentId, staffId } = ids;
  return [
    ["GET /branches", "/branches", ["[].id", "[].name", "[].address", "[].timezone", "[].active"]],
    ["GET /admin/services", "/admin/services", ["items.[].id", "items.[].name", "items.[].priceVnd", "items.[].durationMinutes", "items.[].version"]],
    ["GET /admin/service-categories", "/admin/service-categories", ["items.[].id", "items.[].code", "items.[].version"]],
    ["GET /admin/surcharges", "/admin/surcharges", ["items.[].id", "items.[].code", "items.[].name", "items.[].type", "items.[].status", "items.[].version"]],
    ["GET /admin/accounts", "/admin/accounts", ["[].id", "[].displayName", "[].role", "[].accountStatus"]],
    ["GET /admin/nail-designs", "/admin/nail-designs", ["items.[].id", "items.[].title", "items.[].status", "items.[].version"]],
    ["GET /admin/promotions", "/admin/promotions", ["items.[].id", "items.[].code", "items.[].title", "items.[].type", "items.[].value", "items.[].status", "items.[].version"]],
    ["GET /admin/audit-logs", "/admin/audit-logs", ["[].action", "[].actorId", "[].resourceType", "[].resourceId"]],
    ["GET /admin/loyalty-config", "/admin/loyalty-config", ["pointRate.points", "pointRate.spendVnd", "redemptionCapPercent", "redemptionIncrement", "version"]],
    ["GET /admin/staff", "/admin/staff", ["items.[].id", "items.[].displayName", "items.[].version"]],
    ["GET /admin/staff/{id}/skills", `/admin/staff/${staffId}/skills`, ["staffId", "version", "skills.[].skillId"]],
    ["GET /admin/staff/{id}/compensation", `/admin/staff/${staffId}/compensation`, ["commissionRate", "status", "version"]],
    ["GET /admin/branches/{b}/settings", `/admin/branches/${branchId}/settings`, ["booking.bookingWindowDays", "booking.cancellationCutoffMinutes", "booking.slotIntervalMinutes"]],
    ["GET /admin/branches/{b}/shifts", `/admin/branches/${branchId}/shifts`, ["[].id", "[].staffId", "[].localDate", "[].startLocalTime", "[].endLocalTime", "[].approvalStatus"]],
    ["GET /admin/branches/{b}/customers", `/admin/branches/${branchId}/customers`, ["items.[].id", "items.[].displayName", "items.[].version"]],
    ["GET /admin/branches/{b}/dashboard", `/admin/branches/${branchId}/dashboard`, ["kpi.total", "kpi.revenueVnd", "kpi.workingStaffCount", "upcoming", "generatedAt"]],
    ["GET /admin/branches/{b}/staff-performance", `/admin/branches/${branchId}/staff-performance?period=${new Date().toISOString().slice(0, 7)}`, ["kpi.revenueVnd", "rows.[].staff.id", "rows.[].commissionRate", "rows.[].commissionAmountVnd"]],
    ["GET /admin/branches/{b}/appointments", `/admin/branches/${branchId}/appointments`, ["items.[].id", "items.[].customerId", "items.[].staffId", "items.[].serviceIds", "items.[].startsAt", "items.[].endsAt", "items.[].status", "items.[].version"]],
    ...(customerId
      ? [["GET /admin/.../customers/{c}/nail-history", `/admin/branches/${branchId}/customers/${customerId}/nail-history`, ["items.[].appointmentId", "items.[].startsAt", "items.[].services.[].serviceName", "items.[].services.[].unitPriceVnd"]]]
      : []),
    ...(appointmentId
      ? [["GET /admin/.../appointments/{a}/allocation-candidates", `/admin/branches/${branchId}/appointments/${appointmentId}/allocation-candidates`, ["items.[].id", "items.[].displayName"]]]
      : []),
  ];
}

async function main() {
  const session = await call("/admin/auth/sessions", { method: "POST", body: { phone: PHONE, password: PASSWORD } });
  token = session.accessToken;

  const branches = await call("/branches");
  if (!branches?.length) {
    console.error("No branch to check against — seed one first.");
    process.exit(2);
  }
  // Prefer a branch that actually holds rows: checking element shapes against an
  // empty branch reports "unverified" for everything and proves nothing.
  let branchId = branches[0].id;
  let customers = { items: [] };
  let appointments = { items: [] };
  for (const branch of branches) {
    const [theseCustomers, theseAppointments] = await Promise.all([
      call(`/admin/branches/${branch.id}/customers`),
      call(`/admin/branches/${branch.id}/appointments`),
    ]);
    if (theseAppointments?.items?.length || theseCustomers?.items?.length) {
      branchId = branch.id;
      customers = theseCustomers;
      appointments = theseAppointments;
      break;
    }
  }
  const staff = await call("/admin/staff");
  const ids = {
    branchId,
    customerId: customers?.items?.[0]?.id,
    appointmentId: appointments?.items?.[0]?.id,
    staffId: staff?.items?.[0]?.id,
  };

  let failures = 0;
  let skipped = 0;
  for (const [label, path, expectations] of contracts(ids)) {
    let data;
    try {
      data = await call(path);
    } catch (error) {
      console.log(`FAIL  ${label}\n        ${error.message}`);
      failures += 1;
      continue;
    }
    const problems = expectations.flatMap((expression) => {
      const found = missing(data, expression);
      return found.length ? [`${expression}: ${found[0]}`] : [];
    });
    // An endpoint with no rows yet cannot prove its element shape either way.
    const emptyCollection =
      (Array.isArray(data) && data.length === 0) ||
      (Array.isArray(data?.items) && data.items.length === 0);
    if (problems.length === 0 && emptyCollection) {
      console.log(`EMPTY ${label} — no rows, element shape unverified`);
      skipped += 1;
      continue;
    }
    if (problems.length) {
      console.log(`FAIL  ${label}`);
      for (const problem of problems) console.log(`        ${problem}`);
      failures += 1;
      continue;
    }
    console.log(`ok    ${label}`);
  }

  console.log(`\n${failures} mismatched, ${skipped} unverified (no rows).`);
  if (failures) {
    console.log("A mismatch means the frontend reads a field this API does not send.");
    console.log("Fix the reader, or the type in src/service/admin/types.ts that describes it.");
  }
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(2);
});
