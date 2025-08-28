"use client";

import type { CurrencyCode, UserPreferences } from "@/shared/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { PreferencesService } from "../services/preferences-service";

interface PreferencesContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  updateTheme: (theme: "light" | "dark" | "system") => Promise<boolean>;
  updateCurrency: (currency: CurrencyCode) => Promise<boolean>;
  updateNotifications: (notifications: {
    email_notifications?: boolean;
    cart_updates?: boolean;
    order_updates?: boolean;
    marketing_emails?: boolean;
  }) => Promise<boolean>;
  updatePrivacy: (privacy: {
    profile_visibility?: "public" | "private";
    data_sharing?: boolean;
  }) => Promise<boolean>;

  // Utilities
  refreshPreferences: () => Promise<void>;
  clearError: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

interface PreferencesProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function PreferencesProvider({
  children,
  userId,
}: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preferencesService = new PreferencesService();

  // Load preferences when userId changes
  useEffect(() => {
    if (userId) {
      loadPreferences();
    } else {
      setPreferences(null);
    }
  }, [userId]);

  // Initialize theme on mount
  useEffect(() => {
    preferencesService.initializeTheme();
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const prefs = await preferencesService.getUserPreferences(userId);
      setPreferences(prefs);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load preferences";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, preferencesService]);

  const updateTheme = useCallback(
    async (theme: "light" | "dark" | "system"): Promise<boolean> => {
      if (!userId) {
        setError("User not authenticated");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await preferencesService.updateTheme(userId, theme);
        if (success) {
          // Update local state
          setPreferences((prev) => (prev ? { ...prev, theme } : null));
        } else {
          setError("Failed to update theme");
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update theme";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, preferencesService]
  );

  const updateCurrency = useCallback(
    async (currency: CurrencyCode): Promise<boolean> => {
      if (!userId) {
        setError("User not authenticated");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await preferencesService.updateCurrency(
          userId,
          currency
        );
        if (success) {
          // Update local state
          setPreferences((prev) =>
            prev ? { ...prev, preferred_currency: currency } : null
          );
        } else {
          setError("Failed to update currency");
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update currency";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, preferencesService]
  );

  const updateNotifications = useCallback(
    async (notifications: {
      email_notifications?: boolean;
      cart_updates?: boolean;
      order_updates?: boolean;
      marketing_emails?: boolean;
    }): Promise<boolean> => {
      if (!userId) {
        setError("User not authenticated");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await preferencesService.updateNotifications(
          userId,
          notifications
        );
        if (success) {
          // Update local state
          setPreferences((prev) =>
            prev ? { ...prev, ...notifications } : null
          );
        } else {
          setError("Failed to update notifications");
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update notifications";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, preferencesService]
  );

  const updatePrivacy = useCallback(
    async (privacy: {
      profile_visibility?: "public" | "private";
      data_sharing?: boolean;
    }): Promise<boolean> => {
      if (!userId) {
        setError("User not authenticated");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await preferencesService.updatePrivacy(userId, privacy);
        if (success) {
          // Update local state
          setPreferences((prev) => (prev ? { ...prev, ...privacy } : null));
        } else {
          setError("Failed to update privacy settings");
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update privacy settings";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, preferencesService]
  );

  const refreshPreferences = useCallback(async (): Promise<void> => {
    await loadPreferences();
  }, [loadPreferences]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: PreferencesContextType = {
    preferences,
    isLoading,
    error,
    updateTheme,
    updateCurrency,
    updateNotifications,
    updatePrivacy,
    refreshPreferences,
    clearError,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
