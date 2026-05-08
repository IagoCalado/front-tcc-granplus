/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { X } from "lucide-react";

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
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
          color: "#1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>
            {user ? "Editar Usuário" : "Novo Usuário"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={24} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Nome do Usuário
            </label>
            <input
              type="text"
              name="user_nome"
              value={formData.user_nome}
              onChange={handleChange}
              required
              placeholder="Ex: João Silva"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          
<div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {user ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
              </label>
              <input
                type="password"
                name="user_senha"
                value={formData.user_senha}
                onChange={handleChange}
                required={!user}
                placeholder={user ? "Digite a nova senha" : "Ex: 123456"}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Nível de Acesso
            </label>
            <select
              name="user_nivel_acesso"
              value={formData.user_nivel_acesso}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {user && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Status
              </label>
              <select
                name="user_ativo"
                value={formData.user_ativo}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#0284c7",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
