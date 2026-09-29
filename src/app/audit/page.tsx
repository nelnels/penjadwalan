"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import AuditLogView from "@/components/audit/AuditLogView";

export default function AuditPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <AuditLogView />
      </div>
    </DashboardShell>
  );
}
