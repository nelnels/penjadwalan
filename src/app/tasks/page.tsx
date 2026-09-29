"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function TasksPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <KanbanBoard />
      </div>
    </DashboardShell>
  );
}
