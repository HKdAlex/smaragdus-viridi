"use client";

import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { getUserProfile } from "@/features/auth/actions/auth-actions";
import { supabase } from "@/lib/supabase";
import type { DatabaseUserProfile } from "@/shared/types";

interface AuthContextType {
  user: User | null;
  profile: DatabaseUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    name: string,
    locale?: string
  ) => Promise<any>;
  verifyOtp: (code: string, email?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DatabaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializeAttempted = useRef(false);

  const refreshProfile = async () => {
    if (user) {
      const { profile } = await getUserProfile();
      setProfile(profile);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Prevent double initialization in development mode
    if (initializeAttempted.current) return;
    initializeAttempted.current = true;

    // Get initial session with proper SSR synchronization
    const getInitialSession = async () => {
      try {
        console.log("[AUTH PROVIDER] Getting initial session...");

        // CRITICAL: Use a small delay to ensure cookies are properly synced
        // This fixes the SSR hydration mismatch issue
        await new Promise((resolve) => setTimeout(resolve, 100));

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("[AUTH PROVIDER] Initial session result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          sessionError: sessionError?.message,
          userEmail: session?.user?.email,
        });

        if (session?.user) {
          console.log("[AUTH PROVIDER] Setting user and fetching profile...");
          setUser(session.user);
          // Fetch profile using server action
          const { profile } = await getUserProfile();
          setProfile(profile);
          console.log("[AUTH PROVIDER] Profile loaded, hasProfile:", !!profile);
        } else {
          console.log("[AUTH PROVIDER] No session found, setting user to null");
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[AUTH PROVIDER] Error getting initial session:", error);
        setUser(null);
        setProfile(null);
      } finally {
        console.log("[AUTH PROVIDER] Initial session loading complete");
        setLoading(false);
      }
    };

    getInitialSession();

    // REAL-TIME: Instant auth state changes with direct Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("[AUTH PROVIDER] Auth state changed:", {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
        });

        if (event === "SIGNED_IN" && session) {
          console.log("[AUTH PROVIDER] User signed in, updating state...");
          setUser(session.user);

          // Fetch profile using server action
          try {
            const { profile } = await getUserProfile();
            setProfile(profile);
            console.log("[AUTH PROVIDER] Profile updated on sign in");
          } catch (error) {
            console.error(
              "[AUTH PROVIDER] Error fetching profile on sign in:",
              error
            );
          }
        } else if (event === "SIGNED_OUT") {
          console.log("[AUTH PROVIDER] User signed out, clearing state...");
          setUser(null);
          setProfile(null);
          console.log("[AUTH PROVIDER] State cleared after sign out");
        } else if (event === "TOKEN_REFRESHED" && session) {
          console.log("[AUTH PROVIDER] Token refreshed, updating user...");
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // onAuthStateChange will handle the rest automatically
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    locale: string = "en"
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            locale: locale,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?locale=${locale}&next=/profile`,
        },
      });

      if (error) {
        throw error;
      }

      // After successful signup, the user will need to confirm email
      // Profile will be created when they sign in after confirmation
      console.log(
        "Signup successful, please check your email for confirmation"
      );

      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const verifyOtp = async (code: string, email?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        token: code,
        type: "email",
        email: email || "",
      });

      if (error) {
        throw error;
      }

      console.log("Email verification successful");
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("[AUTH PROVIDER] Sign out error:", error);
        throw error;
      }

      // Clear state immediately as fallback in case onAuthStateChange doesn't trigger
      setUser(null);
      setProfile(null);

      // onAuthStateChange will also handle state cleanup, but this ensures immediate response
    } catch (error) {
      console.error("[AUTH PROVIDER] Sign out error:", error);
      // Still clear local state even if signOut fails
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
