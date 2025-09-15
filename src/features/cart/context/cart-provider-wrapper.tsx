"use client";

import { useAuth } from "@/features/auth/context/auth-context";
import { ReactNode } from "react";
import { CartProvider } from "./cart-context";

interface CartProviderWrapperProps {
  children: ReactNode;
}

export function CartProviderWrapper({ children }: CartProviderWrapperProps) {
  const { user } = useAuth();

  return <CartProvider userId={user?.id}>{children}</CartProvider>;
}
