"use client";

import { useEffect, useState } from "react";

import { OrderDetailsPage } from "./order-details-page";
import { supabase } from "@/lib/supabase";

interface OrderDetailsWrapperProps {
  orderId: string;
  locale: string;
}

export function OrderDetailsWrapper({
  orderId,
  locale,
}: OrderDetailsWrapperProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Unauthorized");
        setIsLoading(false);
        return;
      }

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setIsAdmin(userProfile?.role === "admin");
      setIsLoading(false);
    } catch (error) {
      setError("Failed to check authentication");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <OrderDetailsPage orderId={orderId} locale={locale} isAdmin={isAdmin} />
  );
}
