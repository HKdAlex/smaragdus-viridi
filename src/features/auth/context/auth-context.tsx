"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { DatabaseUserProfile } from "@/shared/types";
import { User } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  profile: DatabaseUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DatabaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await auth.getUserProfile(user.id);
      setProfile(userProfile);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session from server API (syncs with SSR cookies)
    const getInitialSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setProfile(data.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Poll session state periodically to sync with server
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setProfile(data.profile);
        } else {
          // Only clear state if we currently think we're logged in
          if (user) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        // Silently handle polling errors
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, []); // Remove user.id dependency to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      // Update local state
      setUser(result.user);
      setProfile(result.profile);

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const result = await auth.signUp(email, password, name);

      // After successful signup, the user will need to confirm email
      // Profile will be created when they sign in after confirmation
      console.log(
        "Signup successful, please check your email for confirmation"
      );

      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local state regardless of API response
      setUser(null);
      setProfile(null);

      if (!response.ok) {
        console.warn("Logout API call failed, but local state cleared");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local state even if API call fails
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
