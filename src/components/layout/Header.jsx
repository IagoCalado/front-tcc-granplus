import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useState } from "react";
import UserProfileModal from "../common/UserProfileModal";

const Header = ({ searchTerm, onSearchTermChange }) => {
  const { user, logout, token, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const initials = user?.user_nome
    ? user.user_nome
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GP";

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">
          <h1>Dashboard de Estoque</h1>
          <span>Visao central de operacoes e alertas</span>
        </div>
      </div>
      <div className="header-actions">
        <label className="search-field">
          <span>Busca</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Produto, usuário ou local"
          />
        </label>
        
        <button 
          className="btn btn-outline" 
          onClick={toggleTheme}
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'grid', placeItems: 'center' }}
          title={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div className="user-chip" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">{initials}</div>
          <div>
            <strong>{user?.user_nome || "Visitante"}</strong>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {token ? (isAdmin ? "Admin" : "Usuário") : "Sem acesso"}
            </div>
          </div>
        </div>
        {token ? (
          <>
            <button className="btn btn-outline" onClick={() => setIsProfileOpen(true)}>
              Meu perfil
            </button>
            <button className="btn btn-ghost" onClick={logout}>
              Sair
            </button>
          </>
        ) : null}
        <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </div>
    </header>
  );
};

export default Header;
