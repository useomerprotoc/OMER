import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/inter";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./index.css";

import { App } from "./App";
import { ProtocolProvider } from "./lib/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProtocolProvider>
        <App />
      </ProtocolProvider>
    </BrowserRouter>
  </StrictMode>,
);
