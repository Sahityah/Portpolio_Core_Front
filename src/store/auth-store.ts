import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider?: "email" | "google";
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Dev mock login
          if (email === "test@example.com" && password === "123456") {
            set({
              user: { id: "1", name: "Demo User", email, avatar: null },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // API login
          const { data } = await api.post("/api/auth/login", { email, password });
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = (error as any).response?.data?.message || error.message || "Login failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      loginWithGoogle: async (credential) => {
        set({ isLoading: true });
        try {
          // Dev mock login
          if (credential === "mock-google-credential") {
            set({
              user: { id: "1", name: "Google User", email: "googleuser@example.com", avatar: null },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // API login
          const { data } = await api.post("/api/auth/google-login", { credential });
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = (error as any).response?.data?.message || error.message || "Google login failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/api/auth/register", { name, email, password });
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = (error as any).response?.data?.message || error.message || "Registration failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.put("/api/auth/profile", userData);
          set({ user: data, isLoading: false });
        } catch (error) {
          const message = (error as any).response?.data?.message || error.message || "Failed to update profile";
          set({ isLoading: false });
          throw new Error(message);
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
