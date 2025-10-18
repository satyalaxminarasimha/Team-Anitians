
"use client";
/**
 * @fileOverview This file defines the authentication context and provider for the application.
 * It provides a `useAuth` hook that components can use to access the current user's
 * authentication state and methods for login, registration, and logout.
 *
 * It persists the user's session in `localStorage`.
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUserAction, registerUserAction, verifyOtpAction } from '@/app/auth/actions';

/**
 * @interface User
 * @description Defines the structure of the user object.
 */
interface User {
  name: string;
  college: string;
  email: string;
  profilePicture?: string | null;
}

/**
 * @interface AuthContextType
 * @description Defines the shape of the authentication context.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password_DO_NOT_USE_IN_PROD: string) => Promise<{ success: boolean; message?: string }>;
  register: (newUser: { name: string, college: string, email: string }) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (data: { email: string, otp: string, password: any }) => Promise<{ success: boolean; message?: string; }>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @component AuthProvider
 * @description A provider component that wraps the application and provides
 * the authentication context to all child components.
 * @param {{ children: ReactNode }} props
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Sets the user state and persists it to localStorage.
   * @param {User | null} newUser - The new user object or null.
   */
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('loggedInUser');
      }
    }
  };

  // Effect to load the logged-in user from localStorage on initial render.
  useEffect(() => {
    const getLoggedInUser = (): User | null => {
      if (typeof window === 'undefined') return null;
      try {
        const userJson = localStorage.getItem('loggedInUser');
        if (userJson) {
          return JSON.parse(userJson);
        }
        return null;
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('loggedInUser');
        return null;
      }
    };

    const loggedInUser = getLoggedInUser();
    setUserState(loggedInUser);
    setLoading(false);
  }, []);

  /**
   * Logs in a user by calling the login server action.
   * @param {string} email - The user's email.
   * @param {string} password_DO_NOT_USE_IN_PROD - The user's password.
   * @returns {Promise<{success: boolean; message?: string}>}
   */
  const login = useCallback(async (email: string, password_DO_NOT_USE_IN_PROD: string): Promise<{success: boolean; message?: string}> => {
    setLoading(true);
    const result = await loginUserAction({ email, password: password_DO_NOT_USE_IN_PROD });
    if (result.success && result.user) {
      setUser(result.user);
    }
    setLoading(false);
    return { success: result.success, message: result.message };
  }, []);

  /**
   * Starts the registration process by calling the registration server action.
   * @param {object} newUser - The new user's details.
   * @returns {Promise<{success: boolean; message?: string}>}
   */
  const register = useCallback(async (newUser: { name: string, college: string, email: string }): Promise<{ success: boolean; message?: string }> => {
    const result = await registerUserAction(newUser);
    return { success: result.success, message: result.message };
  }, []);
  
  /**
   * Verifies the OTP to complete the registration.
   * @param {object} data - The verification data (email, otp, password).
   * @returns {Promise<{success: boolean; message?: string}>}
   */
  const verifyOtp = useCallback(async (data: { email: string, otp: string, password: any }): Promise<{ success: boolean; message?: string; }> => {
    const result = await verifyOtpAction(data);
    return { success: result.success, message: result.message };
  }, []);

  /**
   * Logs the user out by clearing the user state and redirecting to the login page.
   */
  const logout = useCallback(() => {
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = { user, loading, login, register, verifyOtp, logout, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @function useAuth
 * @description A custom hook to easily access the authentication context.
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
