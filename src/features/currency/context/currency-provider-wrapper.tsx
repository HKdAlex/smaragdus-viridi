"use client";

import { CurrencyProvider } from "./currency-context";
import { ReactNode } from "react";
import { useAuth } from "@/features/auth/context/auth-context";

interface CurrencyProviderWrapperProps {
  children: ReactNode;
}

export function CurrencyProviderWrapper({
  children,
}: CurrencyProviderWrapperProps) {
  const { user } = useAuth();

  return <CurrencyProvider userId={user?.id}>{children}</CurrencyProvider>;
}

