"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserDTO } from "@/lib/types";

export const DEMO_PROFILES: UserDTO[] = [
  {
    id: "admin-demo",
    name: "Administrator Utama",
    email: "admin@jadwalku.com",
    role: "ADMIN",
    department: "Biro Eksekutif & Pimpinan",
    position: "Super Administrator",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+62 811-2233-4455",
    isActive: true,
  },
  {
    id: "user-demo",
    name: "Budi Pratama (Standard User)",
    email: "user@jadwalku.com",
    role: "USER",
    department: "Divisi Acara & Program",
    position: "Staff Pelaksana",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "+62 812-9988-7766",
    isActive: true,
  },
];

interface AuthContextType {
  currentUser: UserDTO | null;
  users: UserDTO[];
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  canManageMasterData: boolean;
  canEditEvent: (event: any) => boolean;
  canDeleteEvent: (event: any) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  loginAsDemo: (role: "ADMIN" | "USER") => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(DEMO_PROFILES[0]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("jadwalku_user", JSON.stringify(data.user));
          return;
        }
      }
      // Check localStorage cached user fallback
      const cached = localStorage.getItem("jadwalku_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCurrentUser(parsed);
        } catch {
          setCurrentUser(DEMO_PROFILES[0]);
        }
      } else {
        setCurrentUser(DEMO_PROFILES[0]);
      }
    } catch {
      // Offline / fallback
      const cached = localStorage.getItem("jadwalku_user");
      if (cached) {
        try {
          setCurrentUser(JSON.parse(cached));
        } catch {
          setCurrentUser(DEMO_PROFILES[0]);
        }
      } else {
        setCurrentUser(DEMO_PROFILES[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
    fetchUsers();
  }, [refreshCurrentUser, fetchUsers]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Gagal masuk. Periksa email & password." };
      }

      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("jadwalku_user", JSON.stringify(data.user));
        if (data.accessToken) {
          localStorage.setItem("jadwalku_token", data.accessToken);
        }
      }
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Terjadi gangguan koneksi ke server." };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Gagal mendaftar akun." };
      }

      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("jadwalku_user", JSON.stringify(data.user));
        if (data.accessToken) {
          localStorage.setItem("jadwalku_token", data.accessToken);
        }
      }
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Terjadi gangguan koneksi ke server." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("jadwalku_user");
    localStorage.removeItem("jadwalku_token");
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem("jadwalku_user", JSON.stringify(target));
    }
  };

  const loginAsDemo = async (role: "ADMIN" | "USER") => {
    const targetEmail = role === "ADMIN" ? "admin@jadwalku.com" : "user@jadwalku.com";
    const result = await login(targetEmail, "password123");
    if (!result.success) {
      // In case database hasn't seeded that specific user, match from loaded users list
      const matched = users.find((u) => (role === "ADMIN" ? u.role === "ADMIN" : u.role !== "ADMIN"));
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem("jadwalku_user", JSON.stringify(matched));
      } else {
        const fallback = role === "ADMIN" ? DEMO_PROFILES[0] : DEMO_PROFILES[1];
        setCurrentUser(fallback);
        localStorage.setItem("jadwalku_user", JSON.stringify(fallback));
      }
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const isUser = !isAdmin;
  const canManageUsers = isAdmin;
  const canManageMasterData = isAdmin;

  const canEditEvent = (event: any) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (event.createdById === currentUser.id) return true;
    if (event.assignees?.some((a: any) => a.userId === currentUser.id)) return true;
    return false;
  };

  const canDeleteEvent = (event: any) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (event.createdById === currentUser.id) return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        isAuthenticated: !!currentUser,
        isAdmin,
        isUser,
        isManager: isAdmin,
        canManageUsers,
        canManageMasterData,
        canEditEvent,
        canDeleteEvent,
        login,
        register,
        logout,
        switchUser,
        loginAsDemo,
        refreshCurrentUser,
        fetchUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
