"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import EventFormModal from "@/components/events/EventFormModal";
import EventDetailModal from "@/components/events/EventDetailModal";
import ExportReportModal from "@/components/export/ExportReportModal";
import { EventDTO } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventDTO | null>(null);
  const [conflictsCount, setConflictsCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const fetchConflictsCount = async () => {
    try {
      const res = await fetch("/api/conflicts");
      if (res.ok) {
        const data = await res.json();
        setConflictsCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchConflictsCount();
    // Listen for custom events to open modals from any sub-view
    const handleOpenDetail = (e: any) => {
      setSelectedEventId(e.detail?.eventId);
    };
    const handleOpenCreate = () => {
      setEditingEvent(null);
      setIsCreateModalOpen(true);
    };
    const handleOpenExport = () => {
      setIsExportModalOpen(true);
    };
    const handleOpenEdit = (e: any) => {
      setEditingEvent(e.detail?.event);
      setIsCreateModalOpen(true);
    };

    window.addEventListener("open-event-detail", handleOpenDetail);
    window.addEventListener("open-create-event", handleOpenCreate);
    window.addEventListener("open-export-report", handleOpenExport);
    window.addEventListener("open-edit-event", handleOpenEdit);

    return () => {
      window.removeEventListener("open-event-detail", handleOpenDetail);
      window.removeEventListener("open-create-event", handleOpenCreate);
      window.removeEventListener("open-export-report", handleOpenExport);
      window.removeEventListener("open-edit-event", handleOpenEdit);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conflictsCount={conflictsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          onOpenCreateModal={() => {
            setEditingEvent(null);
            setIsCreateModalOpen(true);
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
        }}
        initialData={editingEvent}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
          fetchConflictsCount();
          window.dispatchEvent(new CustomEvent("refresh-events"));
        }}
      />

      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onEdit={(event) => {
            setSelectedEventId(null);
            setEditingEvent(event);
            setIsCreateModalOpen(true);
          }}
          onDeleted={() => {
            setSelectedEventId(null);
            fetchConflictsCount();
            window.dispatchEvent(new CustomEvent("refresh-events"));
          }}
        />
      )}

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
