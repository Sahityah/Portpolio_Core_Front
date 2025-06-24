import {
  createBrowserRouter,
  RouteObject,
  redirect, // Import `redirect` from react-router-dom for loaders
} from "react-router-dom";

// --- Import Layout Components ---
// This is your main layout component for authenticated users.
// You'll need to create this file: src/components/layout/DashboardLayout.tsx
import DashboardLayout from "@/components/layout/DashboardLayout";

// --- Import Page Components ---
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import PositionsPage from "@/pages/PositionsPage";
import ProfilePage from "@/pages/ProfilePage";
import ChartPage from "@/pages/ChartPage";

// --- Placeholder Pages ---
// These are simple components that currently render other pages.
// You can replace them with dedicated components as development progresses.
const TradesPage = () => <DashboardPage />;
const AnalyticsPage = () => <DashboardPage />;
const SettingsPage = () => <ProfilePage />;

// --- Authentication Loader Function ---
// This function will be executed by react-router-dom before attempting to render
// any route that has this loader attached.
const authLoader = async () => {
  // IMPORTANT: Replace this with your actual authentication logic.
  // This typically involves:
  // 1. Checking for an authentication token (e.g., JWT) in localStorage or cookies.
  // 2. Optionally, making an API call to your backend to validate the token's freshness/validity.
  const authToken = localStorage.getItem("authToken"); // Example: Check for a token

  if (!authToken) {
    console.warn("Authentication token not found. Redirecting to login.");
    // If no token is found, redirect the user to the login page.
    // `throw redirect()` is the standard way to initiate a redirect from a loader.
    throw redirect("/login");
  }

  // If a token is found and/or validated, allow the navigation to proceed.
  // You can also return user data here if needed by components down the tree.
  return null;
};

// --- Define Application Routes ---
const routes: RouteObject[] = [
  // --- 1. Public Routes ---
  // These routes are accessible to anyone, regardless of authentication status.
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // --- 2. Protected Routes with Shared Layout ---
  // This parent route uses DashboardLayout and applies the authentication loader.
  // All routes defined within its 'children' array will:
  //   a) Be rendered inside the <Outlet /> of the DashboardLayout.
  //   b) Be protected by the `authLoader`. If the loader redirects, these pages won't be shown.
  {
    path: "/", // Using "/" as the base path here means routes like "/dashboard" will work directly.
               // You could also use "/app" if you wanted all authenticated routes to start with "/app/dashboard", etc.
    element: <DashboardLayout />, // The shared layout component
    loader: authLoader, // Apply authentication check to all child routes
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "positions", element: <PositionsPage /> },
      { path: "trades", element: <TradesPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "charts", element: <ChartPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      // Optional: Add an index route if "/" (when authenticated) should lead to the dashboard.
      // { index: true, element: <DashboardPage /> },
    ],
  },

  // --- 3. Catch-all Route for Not Found Pages ---
  // This should always be the last route in your array.
  {
    path: "*", // Matches any path not matched by previous routes
    element: <NotFoundPage />,
  },
];

// --- Create the BrowserRouter Instance ---
export const router = createBrowserRouter(routes /*, {
  // You can re-enable future flags when you are ready to migrate to React Router v7
  // future: {
  //   v7_startTransition: true,
  //   v7_relativeSplatPath: true,
  // },
}*/);