// Authentication Types - Import from shared types
import type { CurrencyCode, UserRole } from '@/shared/types';

// Re-export for convenience
export type { CurrencyCode, UserRole };

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  preferred_currency: CurrencyCode;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  preferred_currency?: CurrencyCode
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  preferred_currency: CurrencyCode
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
} 