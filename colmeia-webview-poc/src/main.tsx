import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyMode, initialMode } from "./lib/theme";
import { installNativeReceiver } from "./lib/bridge";

// Tema aplicado ANTES do primeiro render, para não piscar claro->escuro.
applyMode(initialMode());
installNativeReceiver();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
