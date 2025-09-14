"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import type { DatabaseUserProfile } from "@/shared/types";
import { User } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { useTranslations } from "next-intl";

// Simple logger for now - will be replaced with proper logger later
const adminLogger = {
  info: (message: string, data?: any) =>
    console.log(`[ADMIN INFO] ${message}`, data),
  error: (message: string, error?: any) =>
    console.error(`[ADMIN ERROR] ${message}`, error),
  warn: (message: string, data?: any) =>
    console.warn(`[ADMIN WARN] ${message}`, data),
};

interface AdminContextType {
  // Authentication state
  user: User | null;
  profile: DatabaseUserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;

  // Admin actions
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  createAdminUser: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;

  // User management
  getAllUsers: () => Promise<DatabaseUserProfile[]>;
  updateUserRole: (
    userId: string,
    newRole: DatabaseUserProfile["role"]
  ) => Promise<boolean>;
  promoteToAdmin: (userId: string) => Promise<boolean>;
  demoteFromAdmin: (userId: string) => Promise<boolean>;
  getAdminUsers: () => Promise<DatabaseUserProfile[]>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("errors.admin");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DatabaseUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize admin context
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const userProfile = await auth.getUserProfile(currentUser.id);

          if (userProfile) {
            setProfile(userProfile);
            const adminStatus = await auth.isAdmin(currentUser.id);
            setIsAdmin(adminStatus);

            if (adminStatus) {
              adminLogger.info("Admin user authenticated", {
                userId: currentUser.id,
                email: currentUser.email,
              });
            } else {
              adminLogger.warn(
                "Non-admin user attempted to access admin context",
                {
                  userId: currentUser.id,
                  role: userProfile.role,
                }
              );
            }
          }
        }
      } catch (error) {
        adminLogger.error("Failed to initialize admin context", error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdmin();
  }, []);

  // Admin authentication methods
  const signIn = async (email: string, password: string) => {
    try {
      const result = await auth.signIn(email, password);
      if (result.user) {
        setUser(result.user);
        const userProfile = await auth.getUserProfile(result.user.id);

        if (userProfile) {
          setProfile(userProfile);
          const adminStatus = await auth.isAdmin(result.user.id);
          setIsAdmin(adminStatus);

          if (adminStatus) {
            adminLogger.info("Admin sign in successful", {
              userId: result.user.id,
              email: result.user.email,
            });
            return { success: true };
          } else {
            adminLogger.warn("Non-admin user attempted admin sign in", {
              userId: result.user.id,
              role: userProfile.role,
            });
            // Sign out non-admin user
            await auth.signOut();
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            return {
              success: false,
              error: "Access denied. Admin privileges required.",
            };
          }
        }
      }
      return { success: false, error: "Sign in failed" };
    } catch (error) {
      adminLogger.error("Admin sign in failed", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      adminLogger.info("Admin sign out successful");
    } catch (error) {
      adminLogger.error("Admin sign out failed", error as Error);
      throw error;
    }
  };

  const createAdminUser = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      // Only allow current admin to create new admin users
      if (!isAdmin) {
        return { success: false, error: "Insufficient permissions" };
      }

      const result = await auth.createAdminUser(email, password, name);

      if (result.success) {
        adminLogger.info("New admin user created", {
          createdBy: user?.id,
          newAdminEmail: email,
          newAdminName: name,
        });
      }

      return result;
    } catch (error) {
      adminLogger.error("Failed to create admin user", error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Creation failed",
      };
    }
  };

  // User management methods
  const getAllUsers = async () => {
    if (!isAdmin) return [];
    try {
      return await auth.getAllUsers();
    } catch (error) {
      adminLogger.error(t("fetchUsersFailed"), error as Error);
      return [];
    }
  };

  const updateUserRole = async (
    userId: string,
    newRole: DatabaseUserProfile["role"]
  ) => {
    if (!isAdmin || !newRole) return false;
    try {
      const success = await auth.updateUserRole(userId, newRole);
      if (success) {
        adminLogger.info("User role updated", {
          updatedBy: user?.id,
          targetUserId: userId,
          newRole,
        });
      }
      return success;
    } catch (error) {
      adminLogger.error("Failed to update user role", error as Error);
      return false;
    }
  };

  const promoteToAdmin = async (userId: string) => {
    if (!isAdmin) return false;
    try {
      const success = await auth.promoteToAdmin(userId);
      if (success) {
        adminLogger.info("User promoted to admin", {
          promotedBy: user?.id,
          targetUserId: userId,
        });
      }
      return success;
    } catch (error) {
      adminLogger.error("Failed to promote user to admin", error as Error);
      return false;
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    if (!isAdmin) return false;
    try {
      const success = await auth.demoteFromAdmin(userId);
      if (success) {
        adminLogger.info("Admin demoted to regular user", {
          demotedBy: user?.id,
          targetUserId: userId,
        });
      }
      return success;
    } catch (error) {
      adminLogger.error("Failed to demote admin", error as Error);
      return false;
    }
  };

  const getAdminUsers = async () => {
    if (!isAdmin) return [];
    try {
      return await auth.getAdminUsers();
    } catch (error) {
      adminLogger.error(t("fetchAdminUsersFailed"), error as Error);
      return [];
    }
  };

  const contextValue: AdminContextType = {
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    createAdminUser,
    getAllUsers,
    updateUserRole,
    promoteToAdmin,
    demoteFromAdmin,
    getAdminUsers,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

// Hook for checking admin status without full context
export function useAdminStatus(): { isAdmin: boolean; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await auth.getCurrentUser();
        if (user) {
          const adminStatus = await auth.isAdmin(user.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        adminLogger.error("Failed to check admin status", error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
}
