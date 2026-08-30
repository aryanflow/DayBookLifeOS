import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const path = (window.location.pathname.replace(/\/$/, "") || "/").toLowerCase();

async function mount() {
  const root = createRoot(document.getElementById("root"));

  if (path === "/logs") {
    const { LogsAdminPage } = await import("./components/admin/LogsAdminPage.jsx");
    root.render(
      <StrictMode>
        <LogsAdminPage />
      </StrictMode>
    );
    return;
  }

  if (path === "/version") {
    const { VersionInfoPage } = await import("./components/admin/LogsAdminPage.jsx");
    root.render(
      <StrictMode>
        <VersionInfoPage />
      </StrictMode>
    );
    return;
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

mount();
