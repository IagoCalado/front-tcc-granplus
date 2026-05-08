import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FaChartLine,
  FaBox,
  FaWarehouse,
  FaCartArrowDown,
  FaShoppingCart,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaUserCircle
} from "react-icons/fa";
import { useState } from "react";
import UserProfileModal from "../common/UserProfileModal";
import "./Sidebar.css";

/**
 * Array com os items da navegação do sidebar
 * Cada item contém: path, label, ícone (componente react-icon), e adminOnly (opcional)
 */
const navItems = [
  {
    path: "/dashboard",
    label: "Painel",
    Icon: FaChartLine,
  },
  {
    path: "/produtos",
    label: "Produtos",
    Icon: FaBox,
  },
  {
    path: "/estoque",
    label: "Estoque",
    Icon: FaWarehouse,
  },
  {
    path: "/entradas",
    label: "Entradas",
    Icon: FaCartArrowDown,
  },
  {
    path: "/saidas",
    label: "Saídas",
    Icon: FaShoppingCart,
  },
  {
    path: "/fornecedores",
    label: "Fornecedores",
    Icon: FaClipboardList,
  },
  {
    path: "/auditoria",
    label: "Relatórios",
    Icon: FaClipboardList,
    adminOnly: true,
  },
  {
    path: "/usuarios",
    label: "Usuários",
    Icon: FaUsers,
    adminOnly: true,
  },
];

/**
 * Componente Sidebar - Rail Sidebar minimalista e expansível
 * Estado Inicial: Estreita (70px) com apenas ícones
 * Ao passar hover: Expande para 240px e mostra os textos
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - (Legado) Controla se o sidebar está aberto
 * @param {Function} props.onNavigate - Callback executado ao clicar em um item
 */
const Sidebar = ({ onNavigate }) => {
  const { user, logout, token, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filtra os items baseado em permissões de admin
  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly) return Boolean(isAdmin);
    return true;
  });

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`.trim()
            }
            onClick={() => {
              if (onNavigate) {
                onNavigate();
              }
            }}
          >
            <span className="sidebar-icon">
              <item.Icon />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-item" onClick={toggleTheme} title="Mudar Tema">
          <span className="sidebar-icon" style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--ink)' }}>
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </span>
          <span className="sidebar-label">Tema {theme === "dark" ? "Claro" : "Escuro"}</span>
        </div>
        
        <div className="sidebar-item" title="Perfil" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }}>
          <span className="sidebar-icon" style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--ink)' }}>
            <FaUserCircle />
          </span>
          <span className="sidebar-label">{user?.user_nome || "Visitante"}</span>
        </div>

        {token && (
          <div className="sidebar-item" onClick={logout} title="Sair do sistema" style={{ marginTop: '4px' }}>
            <span className="sidebar-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <FaSignOutAlt />
            </span>
            <span className="sidebar-label">Sair</span>
          </div>
        )}
      </div>
      <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </aside>
  );
};

export default Sidebar;
