import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api"; // Assuming this is your Axios instance or similar
import { jwtDecode } from "jwt-decode"; // Unused in provided snippet, but kept for context
import { AxiosError } from "axios";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider?: "email" | "google";
};

const AUTH_TOKEN_KEY = "token";

interface AuthState {
  user: User | null;
  token: string | null;
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
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // ✅ Mock Login
          if (email === "test@example.com" && password === "123456") {
            const mockToken = "mock-token";
            localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
            set({
              user: {
                id: "1",
                name: "Demo User",
                email,
                avatar: null,
                provider: "email",
              },
              token: mockToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // ✅ Actual API login
          const { data } = await api.post("/api/auth/login", { email, password });
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          // Properly check error type before accessing properties
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            "Login failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      loginWithGoogle: async (credential) => {
        set({ isLoading: true });
        try {
          if (credential === "mock-google-credential") {
            const mockToken = "mock-google-token";
            localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
            set({
              user: {
                id: "2",
                name: "Google User",
                email: "googleuser@example.com",
                avatar: null,
                provider: "google",
              },
              token: mockToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          const { data } = await api.post("/api/auth/google-login", { credential });
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          // Properly check error type before accessing properties
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            "Google login failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/api/auth/register", { name, email, password });
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          // Properly check error type before accessing properties
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            "Registration failed";
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem("auth-store"); // Also clear the persist store
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          // ✅ Mock update
          if (userData.email === "mock-update@example.com") {
              set((state) => ({
                  user: state.user ? { ...state.user, ...userData } : state.user,
                  isLoading: false,
              }));
              return;
          }

          const { data } = await api.put("/api/auth/profile", userData);
          set({ user: data, isLoading: false });
        } catch (error: unknown) {
          // Properly check error type before accessing properties
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            "Failed to update profile";
          set({ isLoading: false });
          throw new Error(message);
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
