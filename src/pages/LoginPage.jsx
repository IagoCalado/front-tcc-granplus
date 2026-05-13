import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useLoginForm from "../hooks/useLoginForm";
import NeonParticles from "../components/common/NeonParticles";
import logoMark from "../assets/granPlus.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, token, status, error } = useAuth();
  const [friendlyError, setFriendlyError] = useState("");
  const [phase, setPhase] = useState("splash");
  const [cardVisible, setCardVisible] = useState(false);
  const { form, fieldErrors, isValid, handleChange, validate } = useLoginForm();

  const redirectTarget = useMemo(
    () => location.state?.from?.pathname || "/dashboard",
    [location.state]
  );

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      setPhase("split");
    }, 1500);

    return () => window.clearTimeout(revealTimer);
  }, []);

  useEffect(() => {
    if (phase !== "split") {
      setCardVisible(false);
      return undefined;
    }

    const cardTimer = window.setTimeout(() => {
      setCardVisible(true);
    }, 140);

    return () => window.clearTimeout(cardTimer);
  }, [phase]);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFriendlyError("");

    if (!validate()) {
      setFriendlyError("Preencha usuario e senha para continuar.");
      return;
    }

    const result = await login({
      usuario: form.usuario.trim(),
      password: form.password,
    });

    if (result?.ok) {
      navigate(redirectTarget, { replace: true });
      return;
    }

    setFriendlyError(
      result?.message ||
        "Nao foi possivel autenticar. Verifique suas credenciais e tente novamente."
    );
  };

  return (
    <main className="login-page">
      <NeonParticles />

      <div className={`login-stage ${phase === "split" ? "is-split" : "is-splash"}`}>
        <div className="login-brand-panel" aria-hidden="true">
          <img
            src={logoMark}
            alt="GranPlus"
            className="login-brand-logo"
            draggable="false"
          />
        </div>

        {phase !== "splash" ? (
          <section
            className={`login-card-panel ${cardVisible ? "is-visible" : ""}`.trim()}
            aria-label="Acesso ao sistema"
          >
            <div className="login-card">
              <div className="login-card-header">
                <span className="login-kicker">Acesso restrito</span>
                <h1>Entre no GranPlus</h1>
                <p>Use suas credenciais para acessar o painel de estoque.</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className="login-field">
                  <label htmlFor="usuario">Usuário</label>
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    value={form.usuario}
                    onChange={handleChange}
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                    aria-invalid={fieldErrors.usuario ? "true" : "false"}
                  />
                  {fieldErrors.usuario ? (
                    <p className="login-field-error">{fieldErrors.usuario}</p>
                  ) : null}
                </div>

                <div className="login-field">
                  <label htmlFor="password">Senha</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    aria-invalid={fieldErrors.password ? "true" : "false"}
                  />
                  {fieldErrors.password ? (
                    <p className="login-field-error">{fieldErrors.password}</p>
                  ) : null}
                </div>

                {friendlyError || error ? (
                  <p className="login-form-error" role="alert">
                    {friendlyError || error || "Credenciais inválidas."}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={!isValid || status === "loading"}
                >
                  {status === "loading" ? "Entrando..." : "Entrar"}
                </button>

                <Link to="/recuperar-senha" className="login-link">
                  Esqueci minha senha
                </Link>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default LoginPage;
