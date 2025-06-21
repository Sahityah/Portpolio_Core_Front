import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor (Attach JWT token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Handle common errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized, redirecting to login...");
      window.location.href = "/login";
    }

    if (error.response?.status >= 500) {
      console.error("Server error:", error.response);
    }

    return Promise.reject(error);
  }
);

export default api;

// Example API modules for all pages

export const authApi = {
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  register: (data: { name: string; email: string; password: string }) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  logout: () => api.post("/auth/logout"),
};

export const portfolioApi = {
  getPortfolio: () => api.get("/portfolio"),
  getPositions: () => api.get("/portfolio/positions"),
  downloadReport: () => api.get("/portfolio/report", { responseType: "blob" }),
};

export const securitiesApi = {
  search: (query: string) => api.get(`/securities/search?q=${query}`),
  getTickerData: () => api.get("/securities/tickers"),
};

export const marketApi = {
  getIndices: () => api.get("/market/indices"),
  getChartData: (symbol: string, period: string) => api.get(`/market/chart?symbol=${symbol}&period=${period}`),
};