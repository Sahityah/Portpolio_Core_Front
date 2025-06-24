import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { authApi } from "@/lib/api"; // ✅ real backend API module

// Type definition
type User = {
  id: string;
  name: string;
  email: string;
  token: string;
  avatar?: string | null;
};

// Mock user data
const MOCK_USER: User = {
  id: "mockuser123",
  name: "Mock User",
  email: "test@example.com",
  token: "mock-jwt-token",
  avatar: "https://github.com/shadcn.png",
};

const MOCK_GOOGLE_USER: User = {
  id: "mockgoogleuser456",
  name: "Google User",
  email: "google@example.com",
  token: "mock-google-jwt-token",
  avatar: "https://lh3.googleusercontent.com/a/default-photo=s96-c",
};

// Toggle mock vs real backend mode (optionally via .env)
const USE_MOCK_AUTH = false;

// This is a singleton-like pattern for a simple global store
const useAuthStore = (() => {
  let _user: User | null = null;
  let _isAuthenticated = false;
  const _listeners = new Set<() => void>();

  // Returns the current state snapshot
  const getSnapshot = () => ({
    user: _user,
    isAuthenticated: _isAuthenticated,
  });

  // Allows React components to subscribe to state changes
  const subscribe = (listener: () => void) => {
    _listeners.add(listener);
    // The cleanup function for useEffect must return void.
    // _listeners.delete(listener) returns a boolean, so we ensure void.
    return () => {
      _listeners.delete(listener);
    };
  };

  // Notifies all subscribed components of a state change
  const publish = () => {
    _listeners.forEach(listener => listener());
  };

  // Updates the internal state and notifies subscribers
  const setUserState = (user: User | null) => {
    _user = user;
    _isAuthenticated = !!user; // isAuthenticated is true if user is not null
    if (user) {
      localStorage.setItem("authToken", user.token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
    publish();
  };

  // Handles user login via email and password
  const login = async (email: string, password: string): Promise<void> => {
    if (USE_MOCK_AUTH) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (email === MOCK_USER.email && password === "password123") {
            setUserState(MOCK_USER);
            resolve();
          } else {
            reject(
              new AxiosError("Invalid credentials", "401", undefined, undefined, {
                status: 401,
                data: { message: "Invalid email or password." },
              } as any)
            );
          }
        }, 1000);
      });
    } else {
      // Calls the real backend API for login
      const response = await authApi.login({ email, password });
      const { token, user: userData } = response.data;

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token,
        avatar: userData.avatar || null,
      };

      setUserState(user);
    }
  };

  // Handles Google login with a credential
  const loginWithGoogle = async (credential: string): Promise<void> => {
    if (USE_MOCK_AUTH) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (credential) {
            setUserState(MOCK_GOOGLE_USER);
            resolve();
          } else {
            reject(new Error("Google login failed."));
          }
        }, 1000);
      });
    } else {
      // This line was causing the previous error as authApi.googleLogin didn't exist.
      // Assuming you've added it to authApi or adjusted your call as per previous instructions.
      const response = await authApi.googleLogin(credential);
      const { token, user: userData } = response.data;

      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token,
        avatar: userData.avatar || null,
      };

      setUserState(user);
    }
  };

  // Logs out the user by clearing state and local storage
  const logout = () => {
    setUserState(null);
  };

  // Initializes the auth state from local storage on load
  const init = () => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        _user = JSON.parse(storedUser);
        _isAuthenticated = true;
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        logout(); // Clear corrupted data
      }
    }
  };

  // Initialize the store only once when the module is loaded (server-side check)
  if (!_user && typeof window !== "undefined") {
    init();
  }

  // The React Hook part of the custom store
  return () => {
    const [state, setState] = useState(getSnapshot());

    // Subscribes to store changes and updates component state
    useEffect(() => {
      const listener = () => setState(getSnapshot());
      const unsubscribe = subscribe(listener); // Get the cleanup function
      return unsubscribe; // Return the cleanup function
    }, []); // Empty dependency array ensures this runs once on mount

    // Returns the current state and actions to components
    return { ...state, login, loginWithGoogle, logout };
  };
})(); // IIFE to create the singleton instance

export default useAuthStore;
