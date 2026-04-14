import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useState } from "react";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((open) => !open);
  };

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
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
