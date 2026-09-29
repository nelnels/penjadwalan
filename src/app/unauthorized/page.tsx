"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { currentUser, loginAsDemo } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-[#0c1222] to-slate-950 text-slate-100">
      <div className="max-w-md w-full text-center bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-6 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
          403 Forbidden Access
        </span>

        <h1 className="text-2xl font-black text-white mb-2">
          Akses Ditolak (Unauthorized)
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Anda sedang login sebagai{" "}
          <strong className="text-slate-200">{currentUser?.name || "Pengguna"}</strong> ({currentUser?.role || "USER"}).
          Halaman ini membutuhkan hak akses khusus <strong className="text-amber-400">ADMINISTRATOR</strong>.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard Saya</span>
          </Link>

          <button
            onClick={() => loginAsDemo("ADMIN")}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Beralih ke Demo Akun Admin (1-Click)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6">
          Jika Anda merasa ini kekeliruan, silakan hubungi tim Administrator JadwalKu.
        </p>
      </div>
    </div>
  );
}
