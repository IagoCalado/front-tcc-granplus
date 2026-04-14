import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import Card from "../components/auth/Card";
import Input from "../components/auth/Input";
import Button from "../components/auth/Button";
import { useAuth } from "../contexts/AuthContext";
import useLoginForm from "../hooks/useLoginForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, token, status, error } = useAuth();
  const [friendlyError, setFriendlyError] = useState("");
  const { form, fieldErrors, isValid, handleChange, validate } = useLoginForm();

  const redirectTarget = useMemo(
    () => location.state?.from?.pathname || "/dashboard",
    [location.state]
  );

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
      <div className="login-aurora" aria-hidden="true" />

      <Card
        title="Acesso ao GranPlus"
        subtitle="Entre com suas credenciais para acessar o painel de estoque"
      >
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="usuario"
            name="usuario"
            label="Usuario"
            value={form.usuario}
            onChange={handleChange}
            placeholder="Seu usuario"
            autoComplete="username"
            icon={<UserRound size={18} />}
            error={fieldErrors.usuario}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Senha"
            value={form.password}
            onChange={handleChange}
            placeholder="Sua senha"
            autoComplete="current-password"
            icon={<KeyRound size={18} />}
            error={fieldErrors.password}
          />

          {friendlyError || error ? (
            <p className="auth-error-box" role="alert">
              {friendlyError || error || "Credenciais invalidas."}
            </p>
          ) : null}

          <Button type="submit" loading={status === "loading"} disabled={!isValid}>
            Entrar
          </Button>

          <div className="auth-actions-row">
            <Link to="/recuperar-senha" className="forgot-link">
              Esqueci minha senha
            </Link>
          </div>
        </form>

        <div className="auth-footer-tip">
          <ShieldCheck size={16} />
          <span>Seu acesso protegido com a melhor tecnologia.</span>
        </div>
      </Card>
    </main>
  );
};

export default LoginPage;
