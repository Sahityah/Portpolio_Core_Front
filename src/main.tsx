  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import { RouterProvider } from "react-router-dom";
  import { GoogleOAuthProvider } from "@react-oauth/google";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import { Toaster } from "@/components/ui/toaster";
  import "./index.css";
  import { router } from "./router";

  const GOOGLE_CLIENT_ID = "58723178545-2jsien8ibcfqim7g10erp8emepqv21mc.apps.googleusercontent.com";

  /*createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  )*/

  createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  </GoogleOAuthProvider>
);

