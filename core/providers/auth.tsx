"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  SessionProvider,
  useSession,
  type SessionUser,
} from "@neup/core/providers/session";

type AppUser = SessionUser & {
  uid: string;
  photoURL: string | null;
};

type AuthActions = {
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

function useAppUser() {
  const { loading, user } = useSession();

  const appUser = useMemo<AppUser | null>(() => {
    const id = user?.accountId ?? user?.neupId;
    if (!user || !id) return null;

    return {
      ...user,
      uid: id,
      photoURL: user.displayImage ?? null,
    };
  }, [user]);

  return { user: appUser, isUserLoading: loading };
}

function AuthActionsProvider({ children }: { children: ReactNode }) {
  const { refetch, setUser } = useSession();

  const signInAnonymous = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const signOut = useCallback(async () => {
    setUser(null);
    try {
      await fetch("/bridge/api.v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Clear the local session even if the remote logout endpoint is unavailable.
    }
    await fetch('/bridge/api.v1/session/logout', { method: 'POST', credentials: 'include' });
  }, [setUser]);

  const actions = useMemo(() => ({ signInAnonymous, signOut }), [signInAnonymous, signOut]);

  return (
    <AuthActionsContext.Provider value={actions}>
      {children}
    </AuthActionsContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthActionsProvider>{children}</AuthActionsProvider>
    </SessionProvider>
  );
}

export function useUser() {
  return useAppUser();
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}
