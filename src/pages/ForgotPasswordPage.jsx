import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Hash,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Button from "../components/auth/Button";
import Input from "../components/auth/Input";
import {
  resetPasswordWithPin,
  sendResetPin,
  verifyUserForReset,
} from "../services/api";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [form, setForm] = useState({
    usuario: "",
    pin: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const resetFlow = () => {
    setStep("request");
    setError("");
    setMessage("");
    setMaskedEmail("");
    setForm({
      usuario: "",
      pin: "",
      novaSenha: "",
      confirmarSenha: "",
    });
  };

  const handleSendPin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const usuario = form.usuario.trim();
    if (usuario.length < 3) {
      setError("Informe seu usuario para continuar.");
      return;
    }

    try {
      setLoading(true);
      const verification = await verifyUserForReset({ user_nome: usuario });
      await sendResetPin({ user_nome: usuario });

      setMaskedEmail(verification?.emailMascarado || "seu e-mail cadastrado");
      setStep("confirm");
      setMessage(
        `Codigo enviado com sucesso para ${verification?.emailMascarado || "seu e-mail cadastrado"}.`
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Nao foi possivel enviar o codigo. Verifique o usuario e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const usuario = form.usuario.trim();
    const pin = form.pin.trim();
    const novaSenha = form.novaSenha.trim();

    if (!usuario) {
      setError("Informe o usuario antes de redefinir a senha.");
      return;
    }

    if (pin.length !== 6) {
      setError("Informe o PIN de 6 digitos enviado para o e-mail cadastrado.");
      return;
    }

    if (novaSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== form.confirmarSenha.trim()) {
      setError("A confirmacao da senha nao confere.");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithPin({
        user_nome: usuario,
        pin,
        novaSenha,
      });

      setStep("done");
      setMessage("Senha redefinida com sucesso. Voce ja pode entrar no sistema.");
    } catch (resetError) {
      setError(
        resetError.message ||
          "Nao foi possivel redefinir a senha. Verifique o PIN e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-aurora" aria-hidden="true" />

      <section className="auth-card forgot-password-card">
        <div className="auth-card-header">
          <h1>Recuperacao de senha</h1>
          <p>
            Solicite um PIN por e-mail, confirme o codigo e defina uma nova senha.
          </p>
        </div>

        {message ? (
          <p className="auth-success-box" role="status">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="auth-error-box" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="login-form forgot-password-form"
          onSubmit={
            step === "request"
              ? handleSendPin
              : step === "confirm"
                ? handleResetPassword
                : (event) => event.preventDefault()
          }
          noValidate
        >
          <Input
            id="usuario"
            name="usuario"
            label="Usuario"
            value={form.usuario}
            onChange={handleChange}
            placeholder="Seu usuario"
            autoComplete="username"
            icon={<UserRound size={18} />}
            disabled={step !== "request"}
          />

          {step !== "request" ? (
            <div className="forgot-step-summary">
              <div className="forgot-step-summary-icon">
                <Mail size={18} />
              </div>
              <div>
                <strong>PIN enviado</strong>
                <p>{maskedEmail || "Seu e-mail cadastrado recebeu o codigo."}</p>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <>
              <Input
                id="pin"
                name="pin"
                label="PIN de 6 digitos"
                value={form.pin}
                onChange={handleChange}
                placeholder="000000"
                autoComplete="one-time-code"
                icon={<Hash size={18} />}
              />

              <Input
                id="novaSenha"
                name="novaSenha"
                type="password"
                label="Nova senha"
                value={form.novaSenha}
                onChange={handleChange}
                placeholder="Digite a nova senha"
                autoComplete="new-password"
                icon={<KeyRound size={18} />}
              />

              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                label="Confirmar nova senha"
                value={form.confirmarSenha}
                onChange={handleChange}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                icon={<ShieldCheck size={18} />}
              />
            </>
          ) : null}

          {step === "request" ? (
            <Button
              type="submit"
              loading={loading}
              loadingLabel="Enviando codigo..."
              disabled={form.usuario.trim().length < 3}
            >
              Enviar codigo
            </Button>
          ) : step === "confirm" ? (
            <Button type="submit" loading={loading} loadingLabel="Redefinindo senha...">
              Redefinir senha
            </Button>
          ) : (
            <div className="forgot-password-actions forgot-password-actions-final">
              <button type="button" className="forgot-link-button" onClick={resetFlow}>
                <ArrowLeft size={16} />
                Fazer nova tentativa
              </button>

              <Link to="/login" className="forgot-link">
                Ir para login
              </Link>
            </div>
          )}
        </form>

        <div className="forgot-password-actions">
          {step === "confirm" ? (
            <button type="button" className="forgot-link-button" onClick={resetFlow}>
              <ArrowLeft size={16} />
              Alterar usuario
            </button>
          ) : null}

          {step !== "done" ? (
            <button
              type="button"
              className="forgot-link-button"
              onClick={async () => {
                if (!form.usuario.trim()) {
                  setError("Informe o usuario antes de reenviar o codigo.");
                  return;
                }

                try {
                  setLoading(true);
                  await sendResetPin({ user_nome: form.usuario.trim() });
                  setStep("confirm");
                  setMessage(
                    `Novo codigo reenviado para ${maskedEmail || "seu e-mail cadastrado"}.`
                  );
                  setError("");
                } catch (resendError) {
                  setError(
                    resendError.message ||
                      "Nao foi possivel reenviar o codigo no momento."
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Send size={16} />
              Reenviar codigo
            </button>
          ) : null}
        </div>

        {step === "done" ? (
          <div className="forgot-complete-box">
            <CheckCircle2 size={18} />
            <span>Sua senha foi atualizada. Voce pode entrar novamente.</span>
          </div>
        ) : null}

        <div className="auth-footer-tip">
          <ShieldCheck size={16} />
          <span>O PIN expira em 15 minutos por seguranca.</span>
        </div>

        <Link to="/login" className="forgot-link forgot-link-back">
          Voltar para login
        </Link>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
