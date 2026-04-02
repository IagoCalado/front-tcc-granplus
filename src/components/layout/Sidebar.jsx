const navItems = [
  { key: "dashboard", label: "Painel Principal", icon: "PP" },
  { key: "products", label: "Produtos", icon: "PR" },
  { key: "stock", label: "Estoque", icon: "ES" },
  { key: "inputs", label: "Entrada", icon: "EN" },
  { key: "outputs", label: "Saída", icon: "SA" },
  { key: "suppliers", label: "Fornecedores", icon: "FN" },
  { key: "audit", label: "Relatórios", icon: "AU" },
  { key: "users", label: "Usuário", icon: "US" },
];

const Sidebar = ({ activePage, setActivePage, isOpen, onNavigate }) => {
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
          <button
            type="button"
            key={item.key}
            className={`nav-item ${
              activePage === item.key ? "active" : ""
            }`.trim()}
            onClick={() => {
              setActivePage(item.key);
              if (onNavigate) {
                onNavigate();
              }
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
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
