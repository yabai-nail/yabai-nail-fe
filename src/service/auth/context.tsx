"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { setAdminAccessToken } from "../api";
import { authService } from "./service";
import type {
  AdminLoginInput,
  AdminSession,
  AuthenticatedAdmin,
} from "./types";

interface AuthContextValue {
  readonly user: AuthenticatedAdmin | null;
  readonly isAuthenticated: boolean;
  readonly login: (input: AdminLoginInput) => Promise<AdminSession>;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthenticatedAdmin | null>(null);

  const login = useCallback(async (input: AdminLoginInput) => {
    const session = await authService.loginAdmin(input);
    setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(() => {
    setAdminAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
