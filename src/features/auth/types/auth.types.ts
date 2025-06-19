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

export type UserRole = 'admin' | 'regular_customer' | 'premium_customer' | 'guest';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'CHF' | 'JPY';

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