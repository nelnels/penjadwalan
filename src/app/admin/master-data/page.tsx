"use client";

import React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import MasterDataView from "@/components/admin/MasterDataView";

export default function AdminMasterDataPage() {
  return (
    <DashboardShell>
      <MasterDataView />
    </DashboardShell>
  );
}
