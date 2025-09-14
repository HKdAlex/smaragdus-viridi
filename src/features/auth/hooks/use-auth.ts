"use client";

import { supabase } from "@/lib/supabase";
import { Database } from "@/shared/types/database";
import { useCallback, useEffect, useState } from "react";
import {
  UserProfile,
  UserRole,
  getUserDisplayInfo,
  hasPermission,
  isAdmin,
  isAuthenticated,
  isPremium,
  validateProfileCompleteness,
  type ProfileValidation,
} from "../utils/auth-utils";

type User = Database["public"]["Tables"]["user_profiles"]["Row"] & {
  email?: string;
  email_confirmed_at?: string;
};

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  error: string | null;
}

interface AuthActions {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (
    permission: keyof typeof import("../utils/auth-utils").PERMISSIONS
  ) => boolean;
  isAdmin: () => boolean;
  isPremium: () => boolean;
  getUserInfo: () => ReturnType<typeof getUserDisplayInfo>;
  validateProfile: () => ProfileValidation;
}

type UseAuthReturn = AuthState & AuthActions;

/**
 * Custom hook for authentication state management
 *
 * Provides:
 * - Current user and profile information
 * - Authentication status and loading states
 * - Permission checking utilities
 * - Profile validation
 * - Authentication actions (sign out, refresh)
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, hasPermission, isAdmin } = useAuth()
 *
 * if (!isAuthenticated) {
 *   return <LoginPrompt />
 * }
 *
 * if (hasPermission('ADMIN_DASHBOARD')) {
 *   return <AdminPanel />
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    role: null,
    error: null,
  });

  // Supabase client is already imported

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          if (mounted) {
            setState((prev) => ({
              ...prev,
              error: sessionError.message,
              isLoading: false,
            }));
          }
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email);
        } else {
          if (mounted) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error:
              error instanceof Error ? error.message : "Authentication error",
            isLoading: false,
          }));
        }
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          role: null,
          error: null,
        });
      } else if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from database
  const loadUserProfile = async (userId: string, email?: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // Not found error
        console.error("Profile loading error:", profileError);
        setState((prev) => ({
          ...prev,
          error: "Failed to load user profile",
          isLoading: false,
        }));
        return;
      }

      const userWithProfile: User = profile
        ? {
            ...profile,
            email,
          }
        : {
            id: "",
            user_id: userId,
            name: "",
            phone: null,
            role: "guest",
            discount_percentage: null,
            preferred_currency: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email,
          };

      setState((prev) => ({
        ...prev,
        user: userWithProfile,
        profile: profile || null,
        isLoading: false,
        isAuthenticated: profile ? isAuthenticated(profile.role) : false,
        role: profile?.role || "guest",
        error: null,
      }));
    } catch (error) {
      console.error("Profile loading error:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to load profile",
        isLoading: false,
      }));
    }
  };

  // Sign out user
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
      // Auth state change listener will handle the rest
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
        isLoading: false,
      }));
    }
  }, [supabase.auth]);

  // Refresh user profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!state.user?.user_id) return;

    await loadUserProfile(state.user.user_id, state.user.email);
  }, [state.user?.user_id, state.user?.email]);

  // Permission checking
  const checkPermission = useCallback(
    (
      permission: keyof typeof import("../utils/auth-utils").PERMISSIONS
    ): boolean => {
      return hasPermission(state.role, permission);
    },
    [state.role]
  );

  // Role checking utilities
  const checkIsAdmin = useCallback((): boolean => {
    return isAdmin(state.role);
  }, [state.role]);

  const checkIsPremium = useCallback((): boolean => {
    return isPremium(state.role);
  }, [state.role]);

  // Get user display information
  const getUserInfo = useCallback(() => {
    return getUserDisplayInfo(state.profile);
  }, [state.profile]);

  // Validate profile completeness
  const validateProfile = useCallback((): ProfileValidation => {
    return validateProfileCompleteness(state.profile);
  }, [state.profile]);

  return {
    // State
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    error: state.error,

    // Actions
    signOut,
    refreshProfile,
    hasPermission: checkPermission,
    isAdmin: checkIsAdmin,
    isPremium: checkIsPremium,
    getUserInfo,
    validateProfile,
  };
}

/**
 * Hook for checking specific permissions
 * Useful for conditional rendering based on permissions
 *
 * Usage:
 * ```tsx
 * const canManageInventory = usePermission('MANAGE_INVENTORY')
 * const canViewAnalytics = usePermission('VIEW_ANALYTICS')
 * ```
 */
export function usePermission(
  permission: keyof typeof import("../utils/auth-utils").PERMISSIONS
): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook for role-based conditional rendering
 *
 * Usage:
 * ```tsx
 * const { isAdmin, isPremium, isAuthenticated } = useRole()
 * ```
 */
export function useRole() {
  const { isAdmin, isPremium, isAuthenticated, role } = useAuth();

  return {
    isAdmin: isAdmin(),
    isPremium: isPremium(),
    isAuthenticated,
    role,
  };
}

/**
 * Hook for user profile information and validation
 *
 * Usage:
 * ```tsx
 * const { displayName, roleLabel, profileValidation } = useUserProfile()
 * ```
 */
export function useUserProfile() {
  const { getUserInfo, validateProfile, profile } = useAuth();

  const userInfo = getUserInfo();
  const validation = validateProfile();

  return {
    ...userInfo,
    profile,
    profileValidation: validation,
  };
}
