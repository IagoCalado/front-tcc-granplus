import Header from "./Header";
import Sidebar from "./Sidebar";
import AuthPanel from "../auth/AuthPanel";
import { useAuth } from "../../contexts/AuthContext";

const MainLayout = ({
  activePage,
  setActivePage,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  children,
}) => {
  const { token } = useAuth();

  return (
    <div className="app-shell">
      {sidebarOpen ? (
        <div className="sidebar-overlay" onClick={onCloseSidebar} />
      ) : null}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        onNavigate={onCloseSidebar}
      />
      <div className="app-main">
        <Header onToggleSidebar={onToggleSidebar} />
        {!token ? <AuthPanel /> : null}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
