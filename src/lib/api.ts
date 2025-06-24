import axios, { AxiosError } from "axios";

// Base URL for your Spring Boot backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important if your backend uses cookies/sessions
});

// Request Interceptor (Attach JWT token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("API Request Error:", error.message, error.config);
    return Promise.reject(error);
  }
);

// Response Interceptor (Handle errors globally)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error("API Response Error:", error.response || error.message);

    if (error.response?.status === 401) {
      console.warn("Unauthorized. Redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login";
      return new Promise(() => {});
    }

    if (error.response?.status && error.response.status >= 500) {
      console.error("Server Error:", error.response.status, error.response.data);
    }

    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      console.warn("Client Error:", error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

// --- API Modules ---

// Authentication API
export const authApi = {
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: (data: { name: string; email: string; password: string }) => api.post("/auth/register", data),
  googleLogin: (credential: string) => api.post("/auth/google-login", { credential }),
  getProfile: () => api.get("/auth/profile"),
  logout: () => api.post("/auth/logout"),
};

// Portfolio API
export const portfolioApi = {
  getPortfolio: () => api.get("/portfolio"),
  getPositions: () => api.get("/portfolio/positions"),
  downloadReport: () => api.get("/portfolio/report", { responseType: "blob" }),
  getPnlChartData: (period: string) =>
    api.get("/portfolio/pnl-chart-data", { params: { period } }),
};

// Securities API
export const securitiesApi = {
  search: (query: string, segment: "equity" | "fno" | "all") =>
    api.get("/securities/search", { params: { q: query, segment } }),
  getTickerData: () => api.get("/securities/tickers"),
};

// Market API
export const marketApi = {
  getIndices: () => api.get("/market/indices"),
  getChartData: (symbol: string, period: string) =>
    api.get("/market/chart", { params: { symbol, period } }),
};

// User Profile API
export const userApi = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.patch("/user/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/user/change-password", data),
};

