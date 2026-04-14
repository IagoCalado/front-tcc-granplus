import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Painel Principal", icon: "PP" },
  { path: "/produtos", label: "Produtos", icon: "PR" },
  { path: "/estoque", label: "Estoque", icon: "ES" },
  { path: "/entradas", label: "Entrada", icon: "EN" },
  { path: "/saidas", label: "Saida", icon: "SA" },
  { path: "/fornecedores", label: "Fornecedores", icon: "FN" },
  { path: "/auditoria", label: "Relatorios", icon: "AU" },
  { path: "/usuarios", label: "Usuario", icon: "US" },
];

const Sidebar = ({ isOpen, onNavigate }) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`.trim()}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">GP</div>
        <div className="sidebar-title">
          <strong>GranPlus</strong>
          <span>Gestao de Estoque</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`.trim()
            }
            onClick={() => {
              if (onNavigate) {
                onNavigate();
              }
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <h4>Operacao segura</h4>
        <p>Monitoramento em tempo real com auditoria integrada.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
