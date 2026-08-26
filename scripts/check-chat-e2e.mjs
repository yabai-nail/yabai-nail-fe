#!/usr/bin/env node

const API = process.env.YABAI_API_URL ?? "https://apiyabai.tedo.vn/api/v1";
const ADMIN_PHONE = process.env.YABAI_ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.YABAI_ADMIN_PASSWORD;
const CUSTOMER_PHONE = process.env.YABAI_CUSTOMER_PHONE;
const CUSTOMER_OTP = process.env.YABAI_CUSTOMER_OTP;

if (!ADMIN_PHONE || !ADMIN_PASSWORD || !CUSTOMER_PHONE || !CUSTOMER_OTP) {
  console.error("Missing staging admin or customer credentials.");
  process.exit(2);
}

function key(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

async function call(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["Idempotency-Key"] = key("staging-chat");
  }
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${payload?.error?.code ?? "INVALID_RESPONSE"}`);
  }
  return payload?.data;
}

async function main() {
  const challenge = await call("/auth/phone/challenges", {
    method: "POST",
    body: { phone: CUSTOMER_PHONE },
  });
  const customerSession = await call(`/auth/phone/challenges/${encodeURIComponent(challenge.challengeId)}/verify`, {
    method: "POST",
    body: { code: CUSTOMER_OTP },
  });
  const adminSession = await call("/admin/auth/sessions", {
    method: "POST",
    body: { phone: ADMIN_PHONE, password: ADMIN_PASSWORD },
  });

  const marker = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const customerText = `staging customer ${marker}`;
  const salonText = `staging salon ${marker}`;
  const sentByCustomer = await call("/me/conversation/messages", {
    method: "POST",
    token: customerSession.accessToken,
    body: { content: customerText },
  });
  const conversations = await call("/admin/conversations?limit=100", {
    token: adminSession.accessToken,
  });
  const conversation = conversations.items.find((item) => item.id === sentByCustomer.conversationId);
  if (!conversation) throw new Error("Admin cannot see the customer's salon-wide conversation.");

  await call(`/admin/conversations/${encodeURIComponent(conversation.id)}/messages`, {
    method: "POST",
    token: adminSession.accessToken,
    body: { content: salonText },
  });
  const customerThread = await call("/me/conversation/messages?limit=100", {
    token: customerSession.accessToken,
  });
  const contents = new Set(customerThread.items.map((item) => item.content));
  if (!contents.has(customerText) || !contents.has(salonText)) {
    throw new Error("Customer thread did not contain both E2E messages.");
  }

  console.log("ok customer sends a message");
  console.log("ok salon reads the shared conversation and replies");
  console.log("ok customer receives the salon reply");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
