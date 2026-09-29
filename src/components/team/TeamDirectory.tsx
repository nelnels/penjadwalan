"use client";

import React, { useState, useEffect } from "react";
import { UserDTO, EventDTO } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Filter,
} from "lucide-react";

export default function TeamDirectory() {
  const { users, switchUser, currentUser } = useAuth();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedDept, setSelectedDept] = useState("ALL");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filteredUsers = users.filter((u) => {
    if (selectedDept !== "ALL" && u.department !== selectedDept) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c121e] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Direktori Tim & Penanggung Jawab (PIC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar pengurus organisasi, penugasan agenda aktif, dan alokasi tanggung jawab divisi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="ALL">Semua Divisi</option>
            <option value="Biro Eksekutif & Pimpinan">Biro Eksekutif</option>
            <option value="Divisi Acara & Program">Divisi Acara</option>
            <option value="Divisi Logistik & IT Support">Divisi Logistik & IT</option>
            <option value="Divisi Humas, Publikasi & Dokumentasi">Divisi Humas</option>
            <option value="Divisi Sponsorship & Keuangan">Divisi Sponsorship</option>
            <option value="Divisi Konsumsi & Perlengkapan">Divisi Konsumsi</option>
          </select>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const userEvents = events.filter((e) =>
            e.assignees?.some((a) => a.userId === user.id)
          );
          const isCurrentActive = user.id === currentUser?.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#0c121e] border transition-all space-y-4 flex flex-col justify-between ${
                isCurrentActive
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg"
                  : "border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="space-y-3.5">
                {/* Avatar & Role Tag */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        user.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      }
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-sm"
                    />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {user.position}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : user.role === "MANAGER"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Division & Contact */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Events Count */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                      Agenda Aktif
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {userEvents.length} program
                    </span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {userEvents.slice(0, 2).map((ev) => (
                      <p
                        key={ev.id}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("open-event-detail", { detail: { eventId: ev.id } })
                          )
                        }
                        className="text-[11px] text-slate-600 dark:text-slate-400 truncate hover:text-blue-600 cursor-pointer"
                      >
                        • {ev.title}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Switch to this user for demo */}
              <button
                type="button"
                onClick={() => switchUser(user.id)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  isCurrentActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {isCurrentActive ? "✓ Sedang Aktif" : "Simulasi Login Sebagai User Ini"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
