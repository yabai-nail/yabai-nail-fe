"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { setCustomerAccessToken } from "../api";
import {
  readCustomerSession,
  writeCustomerSession,
} from "./customer-session-store";
import { authService } from "./service";
import type {
  AuthenticatedCustomer,
  CustomerSession,
  PhoneChallenge,
} from "./types";

/**
 * Deliberately NOT the admin `AuthProvider`. The two roles keep separate
 * bearer slots (`api/auth-token.ts`) and separate storage keys, so a customer
 * signing in on a shop tablet cannot evict the admin session behind it.
 *
 * `restoring` only exists on the very first client render, while the stored
 * refresh token is being exchanged — the nav must wait it out or it flashes
 * "Đăng nhập" at a customer who is in fact signed in.
 */
export type CustomerAuthStatus = "restoring" | "authenticated" | "anonymous";

interface CustomerAuthContextValue {
  readonly customer: AuthenticatedCustomer | null;
  readonly sessionId: string | null;
  readonly status: CustomerAuthStatus;
  readonly isAuthenticated: boolean;
  /** Sends an OTP to `phone`. Throws `ApiClientError` on PHONE_INVALID etc. */
  readonly requestOtp: (phone: string) => Promise<PhoneChallenge>;
  /** Exchanges the OTP for a session and adopts it. */
  readonly verifyOtp: (challengeId: string, code: string) => Promise<CustomerSession>;
  readonly logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [customer, setCustomer] = useState<AuthenticatedCustomer | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<CustomerAuthStatus>("restoring");

  const clearSession = useCallback(() => {
    setCustomerAccessToken(null);
    writeCustomerSession(null);
    setCustomer(null);
    setSessionId(null);
    setStatus("anonymous");
  }, []);

  // Both verify and refresh return a fresh `sessionId` + `refreshToken` pair.
  // The refresh token rotates on EVERY call, so this must persist the new one
  // unconditionally — writing the old one back kills the session on next boot.
  const adoptSession = useCallback((session: CustomerSession) => {
    writeCustomerSession({
      sessionId: session.sessionId,
      refreshToken: session.refreshToken,
    });
    setCustomer(session.user ?? null);
    setSessionId(session.sessionId);
    setStatus("authenticated");
  }, []);

  const requestOtp = useCallback(
    (phone: string) => authService.startPhoneChallenge({ phone, locale: "vi" }),
    [],
  );

  const verifyOtp = useCallback(
    async (challengeId: string, code: string) => {
      const session = await authService.verifyPhoneChallenge(challengeId, { code });
      adoptSession(session);
      return session;
    },
    [adoptSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.revokeCurrentSession();
    } catch {
      // A revoke that fails (offline, already-expired token) must still sign
      // the customer out locally — the stored token is useless either way.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Exchange the stored refresh token for a live access token on boot. A
  // failure here means the token was revoked, rotated behind our back, or
  // simply expired — all of which mean "sign in again".
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = readCustomerSession();
      if (!stored) {
        if (!cancelled) clearSession();
        return;
      }
      try {
        const session = await authService.refreshSession({
          refreshToken: stored.refreshToken,
        });
        if (cancelled) return;
        adoptSession(session);
      } catch {
        if (!cancelled) clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adoptSession, clearSession]);

  const value = useMemo(
    () => ({
      customer,
      sessionId,
      status,
      isAuthenticated: status === "authenticated",
      requestOtp,
      verifyOtp,
      logout,
    }),
    [customer, logout, requestOtp, sessionId, status, verifyOtp],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  }
  return context;
}
