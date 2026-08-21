export type AdminRole = "STAFF" | "MANAGER" | "OWNER";

export interface AdminLoginInput {
  readonly phone: string;
  readonly password: string;
}

export interface AuthenticatedAdmin {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string;
  readonly role: AdminRole;
  readonly locale: string;
  readonly branchIds: string[];
}

export interface AdminSession {
  readonly sessionId: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly user: AuthenticatedAdmin;
}
