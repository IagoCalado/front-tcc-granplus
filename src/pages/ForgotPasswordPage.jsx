import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  return (
    <main className="login-page">
      <section className="auth-card" style={{ width: "min(460px, 100%)" }}>
        <div className="auth-card-header">
          <h1>Recuperacao de senha</h1>
          <p>
            Entre em contato com o administrador para redefinir seu acesso.
          </p>
        </div>
        <Link to="/login" className="forgot-link" style={{ width: "fit-content" }}>
          Voltar para login
        </Link>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
