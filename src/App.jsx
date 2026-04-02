import { useState } from "react";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import StockPage from "./pages/StockPage";
import UsersPage from "./pages/UsersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ProductInputsPage from "./pages/ProductInputsPage";
import ProductOutputsPage from "./pages/ProductOutputsPage";
import AuditReportsPage from "./pages/AuditReportsPage";
import "./App.css";

const pageMap = {
  dashboard: DashboardPage,
  products: ProductsPage,
  stock: StockPage,
  users: UsersPage,
  suppliers: SuppliersPage,
  inputs: ProductInputsPage,
  outputs: ProductOutputsPage,
  audit: AuditReportsPage,
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PageComponent = pageMap[activePage] || DashboardPage;

  return (
    <MainLayout
      activePage={activePage}
      setActivePage={setActivePage}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      <PageComponent />
    </MainLayout>
  );
}

export default App;
