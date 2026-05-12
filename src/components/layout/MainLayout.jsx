import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboardPage = location.pathname === "/dashboard";

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {sidebarOpen ? (
        <div className="sidebar-overlay" onClick={handleCloseSidebar} />
      ) : null}
      <Sidebar isOpen={sidebarOpen} onNavigate={handleCloseSidebar} />
      <div className="app-main">
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label="Abrir menu"
          >
            ☰ Menu
          </button>
          <div className="mobile-topbar-title">
            GranPlus Estoque
          </div>
        </div>
        <main className={`app-content${isDashboardPage ? " app-content--no-watermark" : ""}`}>
          <Outlet context={{ searchTerm, setSearchTerm }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
