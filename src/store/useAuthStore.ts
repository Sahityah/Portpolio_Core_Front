import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- User type ---
export type User = {
  id: string;
  email: string;
  username: string; // Changed from 'name' to 'username' for consistency with Spring Boot User entity
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  provider?: 'EMAIL' | 'GOOGLE'; // Consistent with backend enum
};

// --- Decoded token type ---
type DecodedToken = {
  exp: number;
  iat: number;
  sub: string;
};

// --- Constants ---
const AUTH_TOKEN_KEY = 'jwtToken'; // Using 'jwtToken' for consistency with localStorage.setItem
const API_BASE_URL = 'https://personal-portfolio-29nl.onrender.com/api/auth'; // Your backend API base URL

// --- Zustand Store State and Actions ---
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>; // Re-introduced for client-side ID token flow
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

      // --- Login API Call (with Custom Mock Login) ---
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // ✅ MOCK LOGIN CUSTOM DETAIL: For development/testing purposes
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

          // ✅ Actual API login: Only if not a mock user
          const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
          // Assuming your backend's /api/auth/login returns { token: string, user: User }
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
          // Assuming your backend's /api/auth/register returns { token: string, user: User }
          const response = await axios.post(`${API_BASE_URL}/register`, {
            username: name, // Assuming backend expects 'username' field
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

      // --- Google Login (Client-Side ID Token Submission) ---
      // This action is for when the frontend obtains an ID token from Google's SDK
      // (e.g., using `@react-oauth/google`) and sends it directly to your backend.
      // This is distinct from the Spring Security server-side redirect flow.
      loginWithGoogle: async (credential) => {
        set({ isLoading: true });
        try {
          // ✅ MOCK GOOGLE LOGIN: For development/testing purposes
          if (credential === "mock-google-credential") {
            console.log("Performing mock Google login.");
            const mockToken = "mock-google-jwt-token-456";
            const mockUser: User = {
              id: "mock-user-2",
              email: "mock.google@example.com",
              username: "Mock Google User",
              avatar: null,
              provider: 'GOOGLE'
            };
            localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
            localStorage.setItem('user', JSON.stringify(mockUser));
            set({
              isAuthenticated: true,
              token: mockToken,
              user: mockUser,
              isLoading: false,
            });
            return; // Exit after mock Google login
          }

          // ✅ Actual API Google Login: Only if not mock
          // Assuming your backend's /api/auth/google-login expects a 'credential' field
          // and returns { token: string, user: User }
          const response = await axios.post(`${API_BASE_URL}/google-login`, { credential });
          const { token, user } = response.data;

          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            isAuthenticated: true,
            token: token,
            user: user,
            isLoading: false,
          });
        } catch (error: unknown) {
          const message =
            (error instanceof AxiosError && error.response?.data?.message) ||
            (error instanceof Error && error.message) ||
            "Google login failed";
          console.error("Google login API error:", message, error);
          get().logout();
          throw new Error(message);
        }
      },

      // --- Update Profile API Call ---
      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          // Assuming your backend's /api/auth/profile returns the updated User object
          const { data } = await axios.put(`${API_BASE_URL}/profile`, userData, {
            headers: getAuthHeaders(), // Use helper to get current token
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

      // --- State Setters (used by LoginPage and other components) ---
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
      name: 'auth-store', // Name for localStorage item
      // Specify which parts of the state to persist
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Logic to run when the store is rehydrated from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          try {
            const decoded: DecodedToken = jwtDecode(state.token);
            const now = Date.now() / 1000;
            if (decoded.exp < now) {
              console.warn('Token expired during rehydration. Logging out.');
              state.logout(); // Token expired, log out
            } else {
              // Token is valid, set authenticated
              state.setAuthenticated(true);
            }
          } catch (err) {
            console.error('Invalid token detected during rehydration:', err);
            state.logout(); // Invalid token, log out
          }
        }
      },
    }
  )
);

// --- Auth Headers Helper ---
// This helper is outside the store so it can access the store's current state via getState()
const getAuthHeaders = () => ({
  Authorization: `Bearer ${useAuthStore.getState().token}`,
});
