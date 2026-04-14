import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PrivateRoute from "./components/auth/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import StockPage from "./pages/StockPage";
import UsersPage from "./pages/UsersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ProductInputsPage from "./pages/ProductInputsPage";
import ProductOutputsPage from "./pages/ProductOutputsPage";
import AuditReportsPage from "./pages/AuditReportsPage";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/estoque" element={<StockPage />} />
          <Route path="/entradas" element={<ProductInputsPage />} />
          <Route path="/saidas" element={<ProductOutputsPage />} />
          <Route path="/fornecedores" element={<SuppliersPage />} />
          <Route path="/auditoria" element={<AuditReportsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
