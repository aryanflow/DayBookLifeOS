import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const path = (window.location.pathname.replace(/\/$/, "") || "/").toLowerCase();

async function mount() {
  const root = createRoot(document.getElementById("root"));

  if (path === "/logs") {
    const { UserLogsPage } = await import("./components/admin/UserLogsPage.jsx");
    root.render(
      <StrictMode>
        <UserLogsPage />
      </StrictMode>
    );
    return;
  }

  if (path === "/admin") {
    const { AdminPage } = await import("./components/admin/AdminPage.jsx");
    root.render(
      <StrictMode>
        <AdminPage />
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
