import { apiRequest, apiRoutes, setAccessToken } from "../api";
import type { AdminLoginInput, AdminSession } from "./types";

export const authService = {
  async loginAdmin(input: AdminLoginInput): Promise<AdminSession> {
    const session = await apiRequest<AdminSession>({
      method: "POST",
      url: apiRoutes.auth.adminSession,
      headers: { "Idempotency-Key": crypto.randomUUID() },
      data: {
        phone: input.phone.replace(/\s/g, ""),
        password: input.password,
      },
    });

    setAccessToken(session.accessToken);
    return session;
  },
};
