"use client";

import { AdminLogin } from "@/features/admin/components/admin-login";
import { AdminProvider } from "@/features/admin/context/admin-context";

export default function AdminLoginPage() {
  return (
    <AdminProvider>
      <AdminLogin />
    </AdminProvider>
  );
}
