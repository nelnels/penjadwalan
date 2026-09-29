"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import UserManagementView from "@/components/users/UserManagementView";

export default function AdminUsersPage() {
  return (
    <DashboardShell>
      <UserManagementView />
    </DashboardShell>
  );
}
