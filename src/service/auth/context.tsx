"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { setAdminAccessToken, setAdminTokenRefresher } from "../api";
import { readAdminSession, writeAdminSession } from "./admin-session-store";
import { authService } from "./service";
import type {
  AdminLoginInput,
  AdminSession,
  AuthenticatedAdmin,
} from "./types";

/**
 * `restoring` only exists on the very first client render, while the stored
 * refresh token is being exchanged. The admin shell must wait it out or it
 * flashes the sign-in form at an admin who is in fact signed in.
 */
export type AuthStatus = "restoring" | "authenticated" | "anonymous";

interface AuthContextValue {
  readonly user: AuthenticatedAdmin | null;
  readonly sessionId: string | null;
  /** Branch the backend has pinned to this session, if it told us one. */
  readonly activeBranchId: string | null;
  readonly status: AuthStatus;
  readonly isAuthenticated: boolean;
  readonly permissions: ReadonlyArray<string> | null;
  readonly capabilities: ReadonlyArray<string> | null;
  readonly login: (input: AdminLoginInput) => Promise<AdminSession>;
  readonly logout: () => Promise<void>;
  /** Merge a self-service profile edit (name/avatar) into the cached user so the shell updates now. */
  readonly applyProfileUpdate: (patch: Partial<AuthenticatedAdmin>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The in-flight boot refresh, shared across every mount of the provider.
 *
 * Refresh tokens rotate, and the backend treats a second use of a spent token
 * as theft: it revokes the whole token family. React StrictMode mounts effects
 * twice in development, and a remount can happen in production too, so two
 * mounts reading the same stored token would each POST it — the second call
 * killing the session the first had just established. A module-level promise
 * makes the exchange happen once and lets every caller await the same result;
 * a mount-scoped ref cannot, because each mount gets its own ref.
 */
let bootRefresh: Promise<AdminSession> | null = null;

function refreshOnce(refreshToken: string): Promise<AdminSession> {
  bootRefresh ??= authService.refreshAdminSession(refreshToken).finally(() => {
    bootRefresh = null;
  });
  return bootRefresh;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthenticatedAdmin | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [permissions, setPermissions] = useState<ReadonlyArray<string> | null>(null);
  const [capabilities, setCapabilities] = useState<ReadonlyArray<string> | null>(null);
  // The refresher is called from an axios interceptor, outside React's render
  // cycle, so it reads the live session id from a ref rather than from state.
  const refreshTokenRef = useRef<string | null>(null);

  const clearSession = useCallback(() => {
    setAdminAccessToken(null);
    writeAdminSession(null);
    refreshTokenRef.current = null;
    setUser(null);
    setSessionId(null);
    setActiveBranchId(null);
    setStatus("anonymous");
    setPermissions(null);
    setCapabilities(null);
  }, []);

  const adoptSession = useCallback((session: AdminSession) => {
    refreshTokenRef.current = session.refreshToken;
    writeAdminSession({
      sessionId: session.sessionId,
      refreshToken: session.refreshToken,
    });
    setUser(session.user);
    setSessionId(session.sessionId);
    setStatus("authenticated");
    setPermissions(null);
    setCapabilities(null);
  }, []);

  const login = useCallback(
    async (input: AdminLoginInput) => {
      const session = await authService.loginAdmin(input);
      adoptSession(session);
      // Ask the backend which branch this session is pinned to instead of
      // guessing from branchIds; a manager may be scoped to one of several.
      try {
        const summary = await authService.adminSession();
        setActiveBranchId(summary.session.activeBranchId);
        setPermissions(summary.user.permissions);
        setCapabilities(summary.user.capabilities);
      } catch {
        setActiveBranchId(null);
        setPermissions([]);
        setCapabilities([]);
      }
      return session;
    },
    [adoptSession],
  );

  const applyProfileUpdate = useCallback((patch: Partial<AuthenticatedAdmin>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.revokeCurrentSession();
    } finally {
      // Local cleanup must still happen when the session has already expired
      // or the network is unavailable. The server call runs first so the
      // bearer token is still present while revocation is attempted.
      clearSession();
    }
  }, [clearSession]);

  // Exchange the stored refresh token for a live access token on boot. Runs
  // once; a failure here means the token was revoked, rotated behind our back,
  // or simply expired — all of which mean "sign in again".
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = readAdminSession();
        if (!stored) throw new Error("NO_STORED_SESSION");
        const session = await refreshOnce(stored.refreshToken);
        if (cancelled) return;
        adoptSession(session);
        const summary = await authService.adminSession();
        if (!cancelled) {
          setActiveBranchId(summary.session.activeBranchId);
          setPermissions(summary.user.permissions);
          setCapabilities(summary.user.capabilities);
        }
      } catch {
        if (!cancelled) clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adoptSession, clearSession]);

  // Hand the axios layer a way to renew an expired access token mid-session.
  useEffect(() => {
    setAdminTokenRefresher(async () => {
      const token = refreshTokenRef.current;
      if (!token) return null;
      try {
        // Same single-flight guard as boot: a page with several panels can
        // have three requests 401 at once, and three refreshes of one token
        // is exactly the reuse pattern the backend punishes by revoking.
        const session = await refreshOnce(token);
        adoptSession(session);
        return session.accessToken;
      } catch {
        clearSession();
        return null;
      }
    });
    return () => setAdminTokenRefresher(null);
  }, [adoptSession, clearSession]);

  const value = useMemo(
    () => ({
      user,
      sessionId,
      activeBranchId,
      status,
      isAuthenticated: status === "authenticated",
      permissions,
      capabilities,
      login,
      logout,
      applyProfileUpdate,
    }),
    [activeBranchId, applyProfileUpdate, capabilities, login, logout, permissions, sessionId, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function useAdminPermission(...requiredAny: ReadonlyArray<string>): boolean {
  const { permissions } = useAuth();
  return permissions !== null && requiredAny.some((permission) => permissions.includes(permission));
}
