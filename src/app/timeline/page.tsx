"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import TimelineGanttView from "@/components/timeline/TimelineGanttView";

export default function TimelinePage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <TimelineGanttView />
      </div>
    </DashboardShell>
  );
}
