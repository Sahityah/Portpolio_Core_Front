import axios, { AxiosError } from "axios"; // Import AxiosError for better type checking

// Base URL for your Spring Boot backend
// Ensure VITE_API_URL is correctly set in your .env files (e.g., .env.development, .env.production)
// and on your deployment platform (e.g., Render environment variables).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions, or if backend needs to read credentials from cross-origin
});

// Request Interceptor (Attach JWT token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Assuming JWT token is stored in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Log request errors (e.g., network issues before sending request)
    console.error("API Request Error:", error.message, error.config);
    return Promise.reject(error);
  }
);

// Response Interceptor (Handle common errors and global notifications)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => { // Type error as AxiosError for better introspection
    // Log the full error response from the server if available
    console.error("API Response Error:", error.response || error.message);

    // Handle Unauthorized (401)
    if (error.response?.status === 401) {
      console.warn("Unauthorized request. Redirecting to login...");
      // Optionally clear token and user data here
      localStorage.removeItem("token");
      // Redirect using window.location for full page refresh, or react-router's navigate if available globally
      window.location.href = "/login"; // Full refresh to clear React state and trigger auth flow
      // Prevent further processing of this error
      return new Promise(() => {}); // Return a never-resolving promise to stop propagation
    }

    // Handle Server Errors (5xx)
    if (error.response?.status && error.response.status >= 500) {
      console.error("Server error encountered:", error.response.status, error.response.data);
      // You might use a global toast notification system here if not handled by individual components
      // Example: showGlobalToast({ title: "Server Error", description: "Something went wrong on our side. Please try again later.", variant: "destructive" });
    }

    // Handle other client errors (4xx, etc.)
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        console.warn("Client error encountered:", error.response.status, error.response.data);
        // This could be for validation errors etc. Components usually handle these specifically.
    }

    // Re-throw the error so that individual components can catch and handle it
    return Promise.reject(error);
  }
);

export default api;

// --- API Modules for all pages ---
// These modules now call YOUR Spring Boot backend endpoints.

export const authApi = {
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: (data: { name: string; email: string; password: string }) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  // For logout, often a client-side action (clearing token) is sufficient.
  // A backend call is useful if you need to invalidate sessions/tokens server-side.
  logout: () => api.post("/auth/logout"),
};

export const portfolioApi = {
  getPortfolio: () => api.get("/portfolio"),
  getPositions: () => api.get("/portfolio/positions"), // This might be redundant if getPortfolio includes positions
  downloadReport: () => api.get("/portfolio/report", { responseType: "blob" }),
};

export const securitiesApi = {
  // Enhancement: Added 'segment' parameter, matching SecuritiesSearch component
  // The backend should handle filtering based on 'segment'.
  search: (query: string, segment: 'equity' | 'fno' | 'all') => api.get(`/securities/search`, { params: { q: query, segment } }),
  getTickerData: () => api.get("/securities/tickers"), // If this still fetches ticker data
};

export const marketApi = {
  getIndices: () => api.get("/market/indices"), // Fetches market indices from your backend
  // Backend should handle parsing 'symbol' and 'period' to query external APIs (like Finnhub)
  // or return pre-aggregated data.
  getChartData: (symbol: string, period: string) => api.get(`/market/chart`, { params: { symbol, period } }),
};