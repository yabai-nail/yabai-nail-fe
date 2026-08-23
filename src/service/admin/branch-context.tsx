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

import { useAuth } from "../auth";

interface AdminBranchContextValue {
  /** Currently selected branch id, or null if no branch is available yet. */
  readonly branchId: string | null;
  /** Branch ids the signed-in admin can operate on. */
  readonly branchIds: ReadonlyArray<string>;
  /** Switch the active branch. Silently no-ops when the id is not one this admin owns. */
  readonly setBranchId: (branchId: string) => void;
}

const AdminBranchContext = createContext<AdminBranchContextValue | null>(null);

// A single browser tab talks to one branch at a time. This lives outside
// component state so a page reload lands the admin on the same branch they
// left, and every admin hook can read it without prop-drilling.
export const ADMIN_BRANCH_STORAGE_KEY = "yabai.admin.branchId";
const STORAGE_KEY = ADMIN_BRANCH_STORAGE_KEY;

/**
 * Pure resolver — the only place branch selection logic lives.
 *
 * - No stored id + branches available → first accessible branch.
 * - Stored id no longer accessible → falls back to first accessible branch.
 * - Stored id still accessible → keep it.
 * - No branches at all → null.
 */
export function resolveActiveBranchId(
  storedId: string | null,
  branchIds: ReadonlyArray<string>,
): string | null {
  if (branchIds.length === 0) return null;
  if (storedId !== null && branchIds.includes(storedId)) return storedId;
  return branchIds[0];
}

function readStoredBranchId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage can throw when disabled (Safari private mode, quota, etc.);
    // fall back to the auth default rather than crashing the shell.
    return null;
  }
}

function writeStoredBranchId(branchId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (branchId === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, branchId);
  } catch {
    // Same reason as the read: never let persistence break navigation.
  }
}

export function AdminBranchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = useAuth();
  const branchIds = useMemo(() => user?.branchIds ?? [], [user]);
  // "userSelection" is what the admin explicitly picked (or what survived
  // reload via localStorage). The effective branchId is derived — that keeps
  // the reconciliation rule out of a useEffect that would have to setState
  // during render.
  const [userSelection, setUserSelection] = useState<string | null>(() =>
    readStoredBranchId(),
  );
  const branchId = useMemo(
    () => resolveActiveBranchId(userSelection, branchIds),
    [userSelection, branchIds],
  );

  // Storage follows the effective branchId — a fall-back due to lost access
  // gets persisted so the next reload doesn't try the stale id again.
  useEffect(() => {
    writeStoredBranchId(branchId);
  }, [branchId]);

  const setBranchId = useCallback(
    (next: string) => {
      if (!branchIds.includes(next)) return;
      setUserSelection(next);
    },
    [branchIds],
  );

  const value = useMemo(
    () => ({ branchId, branchIds, setBranchId }),
    [branchId, branchIds, setBranchId],
  );

  return (
    <AdminBranchContext.Provider value={value}>{children}</AdminBranchContext.Provider>
  );
}

export function useAdminBranch(): AdminBranchContextValue {
  const context = useContext(AdminBranchContext);
  if (!context) throw new Error("useAdminBranch must be used inside AdminBranchProvider");
  return context;
}
