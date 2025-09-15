"use client";

import { CartProvider } from "./cart-context";
import { ReactNode } from "react";
import { useAuth } from "@/features/auth/context/auth-context";

interface CartProviderWrapperProps {
  children: ReactNode;
}

export function CartProviderWrapper({ children }: CartProviderWrapperProps) {
  const { user } = useAuth();

  return <CartProvider userId={user?.id}>{children}</CartProvider>;
}
