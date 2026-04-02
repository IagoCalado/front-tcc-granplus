import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AuthPanel = () => {
  const { login, status, error } = useAuth();
  const [form, setForm] = useState({
    user_nome: "igor",
    user_senha: "iago123",
    user_email: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(form);
  };

  return (
    <section className="card auth-panel">
      <div>
        <h3>Conectar API</h3>
        <p>
          Informe suas credenciais para carregar os dados da API em tempo real.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="input-field">
          <label htmlFor="user_nome">Usuário</label>
          <input
            id="user_nome"
            name="user_nome"
            value={form.user_nome}
            onChange={handleChange}
            placeholder="Digite seu usuário"
            required
          />
        </div>
        <div className="input-field">
          <label htmlFor="user_senha">Senha</label>
          <input
            id="user_senha"
            name="user_senha"
            type="password"
            value={form.user_senha}
            onChange={handleChange}
            placeholder="Digite sua senha"
            required
          />
        </div>
        <div className="input-field">
          <label htmlFor="user_email">Email (opcional)</label>
          <input
            id="user_email"
            name="user_email"
            value={form.user_email}
            onChange={handleChange}
            placeholder="seu.email@empresa.com"
          />
        </div>
        {error ? <p style={{ color: "#b45309" }}>{error}</p> : null}
        <button className="btn btn-primary" type="submit">
          {status === "loading" ? "Conectando..." : "Entrar"}
        </button>
      </form>
      <p style={{ fontSize: "13px" }}>
        Base URL: {import.meta.env.VITE_API_URL || "http://localhost:3333"}
      </p>
    </section>
  );
};

export default AuthPanel;
