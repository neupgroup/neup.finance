'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LocalUser = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

type UserContextState = {
  user: LocalUser | null;
  isUserLoading: boolean;
  userError: Error | null;
  signInAnonymous: () => void;
  signOut: () => void;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('local_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUserError(e as Error);
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  const signInAnonymous = () => {
    const uid = crypto.randomUUID();
    const newUser: LocalUser = { uid, displayName: null, email: null, photoURL: null };
    localStorage.setItem('local_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const signOut = () => {
    localStorage.removeItem('local_user');
    setUser(null);
    document.cookie = 'accountId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const value = useMemo(
    () => ({
      user,
      isUserLoading,
      userError,
      signInAnonymous,
      signOut,
    }),
    [user, isUserLoading, userError]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within AuthProvider');
  const { user, isUserLoading, userError } = ctx;
  return { user, isUserLoading, userError };
}

export function useAuthActions() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useAuthActions must be used within AuthProvider');
  return { signInAnonymous: ctx.signInAnonymous, signOut: ctx.signOut };
}

