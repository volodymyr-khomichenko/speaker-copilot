import { StrictMode } from "react";
import { inject } from "@vercel/analytics";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/archivo";
import "./index.css";
import App from "./App.tsx";

// Privacy-friendly, cookieless page analytics (views only).
// Talks and all user data stay in LocalStorage and never leave the device.
inject();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
