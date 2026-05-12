/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";

export default function UserModal({ isOpen, onClose, onSave, user }) {
  const [formData, setFormData] = useState({
    user_nome: "",
    user_senha: "",
    user_nivel_acesso: "user",
    user_ativo: 1,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        user_nome: user.user_nome || "",
        user_senha: "", // Não preenche a senha na edição
        user_nivel_acesso: user.user_nivel_acesso || "user",
        user_ativo: user.user_ativo ?? 1,
      });
    } else {
      setFormData({
        user_nome: "",
        user_senha: "",
        user_nivel_acesso: "user",
        user_ativo: 1,
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "user_ativo" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, user?.user_id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <div className="modal-header">
          <h3 style={{ margin: 0 }}>
            {user ? "Editar Usuário" : "Novo Usuário"}
          </h3>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Nome do Usuário</label>
            <input
              type="text"
              name="user_nome"
              value={formData.user_nome}
              onChange={handleChange}
              required
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="input-field">
            <label>Senha</label>
            <input
              type="password"
              name="user_senha"
              value={formData.user_senha}
              onChange={handleChange}
              placeholder={user ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
              required={!user}
            />
          </div>

          <div className="input-field">
            <label>Nível de Acesso</label>
            <select
              name="user_nivel_acesso"
              value={formData.user_nivel_acesso}
              onChange={handleChange}
            >
              <option value="admin">Admin</option>
              <option value="user">Usuário</option>
            </select>
          </div>

          <div className="input-field">
            <label>Status</label>
            <select
              name="user_ativo"
              value={formData.user_ativo}
              onChange={handleChange}
            >
              <option value={1}>Ativo</option>
              <option value={0}>Inativo</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {user ? "Atualizar" : "Criar"} Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
