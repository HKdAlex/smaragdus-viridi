"use client";

import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { AdminProvider } from "@/features/admin/context/admin-context";

export default function AdminDashboardPage() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
