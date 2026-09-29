import { create } from "zustand";
import { UserDTO } from "../lib/types";
import axios from "axios";

export const DEMO_USERS: UserDTO[] = [
  {
    id: "user-admin",
    name: "Dr. Hendra Wijaya, M.Kom",
    email: "hendra@jadwalku.org",
    role: "ADMIN",
    department: "Biro Eksekutif & Pimpinan",
    position: "Ketua Dewan Eksekutif",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+62 812-3456-7890",
  },
  {
    id: "user-manager-1",
    name: "Clarissa Putri, S.I.Kom",
    email: "clarissa@jadwalku.org",
    role: "MANAGER",
    department: "Divisi Acara & Program",
    position: "Koordinator Utama Acara",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    phone: "+62 813-9876-5432",
  },
  {
    id: "user-manager-2",
    name: "Rizky Fauzan Pratama",
    email: "rizky@jadwalku.org",
    role: "MANAGER",
    department: "Divisi Logistik & IT Support",
    position: "Koordinator IT & Infrastruktur",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "+62 856-1122-3344",
  },
  {
    id: "user-member-1",
    name: "Anisa Rahmawati",
    email: "anisa@jadwalku.org",
    role: "MEMBER",
    department: "Divisi Humas, Publikasi & Dokumentasi",
    position: "Staff Media & Desain Kreatif",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    phone: "+62 878-5544-3322",
  },
  {
    id: "user-member-2",
    name: "Dimas Anggara",
    email: "dimas@jadwalku.org",
    role: "MEMBER",
    department: "Divisi Sponsorship & Keuangan",
    position: "Staff Partnership & Sponsorship",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "+62 821-6677-8899",
  },
];

interface AuthState {
  currentUser: UserDTO;
  token: string | null;
  users: UserDTO[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canManageEvents: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: DEMO_USERS[0],
  token: localStorage.getItem("jadwalku_jwt_token") || null,
  users: DEMO_USERS,
  isAuthenticated: !!localStorage.getItem("jadwalku_jwt_token"),
  isAdmin: true,
  isManager: true,
  canManageEvents: true,

  fetchUsers: async () => {
    try {
      const res = await axios.get("/api/users");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ users: res.data });
        const savedUserId = localStorage.getItem("jadwalku_user_id");
        const matched = res.data.find((u: UserDTO) => u.id === savedUserId);
        if (matched) {
          const isAdmin = matched.role === "ADMIN";
          const isManager = matched.role === "MANAGER" || isAdmin;
          set({ currentUser: matched, isAdmin, isManager, canManageEvents: isManager });
        }
      }
    } catch {
      // ignore
    }
  },

  login: async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem("jadwalku_jwt_token", token);
      localStorage.setItem("jadwalku_user_id", user.id);
      const isAdmin = user.role === "ADMIN";
      const isManager = user.role === "MANAGER" || isAdmin;
      set({
        token,
        currentUser: user,
        isAuthenticated: true,
        isAdmin,
        isManager,
        canManageEvents: isManager,
      });
      return true;
    } catch {
      return false;
    }
  },

  switchUser: async (userId: string) => {
    try {
      const res = await axios.post("/api/auth/switch-demo", { userId });
      const { token, user } = res.data;
      localStorage.setItem("jadwalku_jwt_token", token);
      localStorage.setItem("jadwalku_user_id", user.id);
      const isAdmin = user.role === "ADMIN";
      const isManager = user.role === "MANAGER" || isAdmin;
      set({
        token,
        currentUser: user,
        isAuthenticated: true,
        isAdmin,
        isManager,
        canManageEvents: isManager,
      });
    } catch {
      const target = get().users.find((u) => u.id === userId);
      if (target) {
        localStorage.setItem("jadwalku_user_id", target.id);
        const isAdmin = target.role === "ADMIN";
        const isManager = target.role === "MANAGER" || isAdmin;
        set({
          currentUser: target,
          isAdmin,
          isManager,
          canManageEvents: isManager,
        });
      }
    }
  },

  logout: () => {
    localStorage.removeItem("jadwalku_jwt_token");
    localStorage.removeItem("jadwalku_user_id");
    set({
      token: null,
      currentUser: DEMO_USERS[0],
      isAuthenticated: false,
      isAdmin: true,
      isManager: true,
      canManageEvents: true,
    });
  },
}));
