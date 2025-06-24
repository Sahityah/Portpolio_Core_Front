import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";
import { router } from "./router";

// Access the environment variable using import.meta.env
// Vite automatically provides type definitions for import.meta.env if configured correctly.
// You might need to add a d.ts file for custom env vars if not already done by Vite.
// Example: in src/vite-env.d.ts or types/env.d.ts
// interface ImportMetaEnv {
//   readonly VITE_GOOGLE_CLIENT_ID: string;
// }
// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// --- Enhancement: Basic Check for Missing Client ID ---
// It's good practice to ensure critical environment variables are present,
// especially for production. This prevents runtime errors if the variable is not set.
if (!GOOGLE_CLIENT_ID) {
  console.error("Error: VITE_GOOGLE_CLIENT_ID is not defined. Please check your .env file.");
  // In a real application, you might want to:
  // - Display a user-friendly error message
  // - Prevent the app from rendering
  // - Use a fallback value if appropriate (though not for client IDs)
  // For now, we'll proceed, but the console error is important for debugging.
}

createRoot(document.getElementById("root")!).render(
  // --- Enhancement: Re-enable StrictMode ---
  // StrictMode is a development-only tool that helps highlight potential problems.
  // It runs extra checks and warnings for its descendants. It does NOT affect
  // production performance. It's highly recommended to keep it enabled during development.
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);