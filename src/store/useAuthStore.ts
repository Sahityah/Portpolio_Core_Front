import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';
import jwtDecode from 'jwt-decode';

// --- User type ---
export type User = {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  provider?: 'EMAIL' | 'GOOGLE';
};

// --- Decoded token type ---
type DecodedToken = {
  exp: number;
  iat: number;
  sub: string;
};

// --- Constants ---
const AUTH_TOKEN_KEY = 'jwtToken';
const API_BASE_URL = 'https://personal-portfolio-29nl.onrender.com/api/auth';

// --- Zustand Store State and Actions ---
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  logout: () => void;

  setAuthenticated: (status: boolean) => void;
  setToken: (newToken: string | null) => void;
  setUser: (newUser: User | null) => void;
}

// --- Zustand Auth Store ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // --- Login API Call (with Mock Login) ---
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // ✅ MOCK LOGIN CUSTOM DETAIL
          if (email === "mock@example.com" && password === "mockpassword") {
            console.log("Performing mock login for custom user.");
            const mockToken = "mock-jwt-token-for-test-user-123";
            const mockUser: User = {
              id: "mock-user-1",
              email: "mock@example.com",
              username: "Mock User",
              avatar: null,
              provider: 'EMAIL'
            };

            localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
            localStorage.setItem('user', JSON.stringify(mockUser));

            set({
              isAuthenticated: true,
              token: mockToken,
              user: mockUser,
              isLoading: false,
            });
            return; // Exit after mock login
          }

          // ✅ Actual API login (only if not mock)
          const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
          const { token, user } = response.data;

          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            isAuthenticated: true,
            token,
            user,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            'Login failed';
          console.error('Login API error:', message, error);
          get().logout(); // Logout on error
          throw new Error(message);
        }
      },

      // --- Register API Call ---
      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const response = await axios.post(`${API_BASE_URL}/register`, {
            username: name,
            email,
            password,
          });
          const { token, user } = response.data;

          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            isAuthenticated: true,
            token,
            user,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            'Registration failed';
          console.error('Register API error:', message, error);
          get().logout();
          throw new Error(message);
        }
      },

      // --- Update Profile API Call ---
      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.put(`${API_BASE_URL}/profile`, userData, {
            headers: getAuthHeaders(),
          });
          localStorage.setItem('user', JSON.stringify(data));
          set({ user: data, isLoading: false });
        } catch (error: unknown) {
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            'Failed to update profile';
          console.error('Update profile API error:', message, error);
          set({ isLoading: false });
          throw new Error(message);
        }
      },

      // --- Logout ---
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('user');
        localStorage.removeItem('auth-store'); // Clear the persist store's internal storage
      },

      // --- State Setters ---
      setAuthenticated: (status: boolean) => set({ isAuthenticated: status }),

      setToken: (newToken: string | null) => {
        set({ token: newToken });
        if (newToken) {
          localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      },

      setUser: (newUser: User | null) => {
        set({ user: newUser });
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          try {
            const decoded: DecodedToken = jwtDecode(state.token);
            const now = Date.now() / 1000;
            if (decoded.exp < now) {
              console.warn('Token expired, logging out.');
              state.logout();
            } else {
              state.setAuthenticated(true);
            }
          } catch (err) {
            console.error('Invalid token detected during rehydration:', err);
            state.logout();
          }
        }
      },
    }
  )
);

// --- Auth headers helper ---
const getAuthHeaders = () => ({
  Authorization: `Bearer ${useAuthStore.getState().token}`,
});
