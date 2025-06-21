import {
  createBrowserRouter,
  RouteObject,
} from "react-router-dom";


import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";  
import PositionsPage from "@/pages/PositionsPage";
import ProfilePage from "@/pages/ProfilePage";
import ChartPage from "@/pages/ChartPage";

// Placeholder Pages
const TradesPage = () => <DashboardPage />;
const AnalyticsPage = () => <DashboardPage />;
const SettingsPage = () => <ProfilePage />;

const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/positions", element: <PositionsPage /> },
  { path: "/trades", element: <TradesPage /> },
  { path: "/analytics", element: <AnalyticsPage /> },
  { path: "/charts", element: <ChartPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes/*, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
}*/);
