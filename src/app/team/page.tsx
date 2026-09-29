"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import TeamDirectory from "@/components/team/TeamDirectory";

export default function TeamPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <TeamDirectory />
      </div>
    </DashboardShell>
  );
}
