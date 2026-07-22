import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '@/services/authService';
import type { AuthUser } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Any; data?: Any }>;
  signOut: () => Promise<void>;
  adminSignIn: (username: string, password: string) => Promise<{ error: Any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = authService.getStoredUser();
      if (stored) {
        try {
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      return { error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Invalid email or password';
      // Preserve the backend's machine-readable code + HTTP status so the caller can
      // branch (e.g. route an unverified user to the verification page) without
      // fragile message string-matching.
      const err = new Error(message) as Error & { code?: string; status?: number };
      err.code = error.response?.data?.code;
      err.status = error.response?.status;
      return { error: err };
    }
  }, []);

  const adminSignIn = useCallback(async (username: string, password: string) => {
    try {
      const userData = await authService.adminLogin(username, password);
      setUser(userData);
      return { error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Invalid admin credentials';
      return { error: new Error(message) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const data = await authService.register(email, password, fullName);
      // NOTE: registration does NOT log the user in — they must verify their email first.
      return { error: null, data };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { error: new Error(message) };
    }
  }, []);

  // Re-read the current user from the server (used after email verification, which
  // sets the auth cookies).
  const refreshUser = useCallback(async () => {
    setUser(await authService.getCurrentUser());
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    adminSignIn,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
