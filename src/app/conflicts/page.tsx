"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import ConflictCenter from "@/components/conflicts/ConflictCenter";

export default function ConflictsPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <ConflictCenter />
      </div>
    </DashboardShell>
  );
}
