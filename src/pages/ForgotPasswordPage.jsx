import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  resetPasswordWithPin,
  sendResetPin,
  verifyUserForReset,
} from "../services/api";
import NeonParticles from "../components/common/NeonParticles";
import logoMark from "../assets/granPlus.png";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("splash");
  const [cardVisible, setCardVisible] = useState(false);
  // const [message, setMessage] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [form, setForm] = useState({
    usuario: "",
    pin: "",
    novaSenha: "",
    confirmarSenha: "",
  });

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const resetFlow = () => {
    setStep("request");
    setError("");
    // setMessage("");
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
    // setMessage("");

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
      // setMessage(
      //   `Codigo enviado com sucesso para ${verification?.emailMascarado || "seu e-mail cadastrado"}.`,
      // );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Nao foi possivel enviar o codigo. Verifique o usuario e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    // setMessage("");

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
      // setMessage(
      //   "Senha redefinida com sucesso. Voce ja pode entrar no sistema.",
      // );
    } catch (resetError) {
      setError(
        resetError.message ||
          "Nao foi possivel redefinir a senha. Verifique o PIN e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    if (!form.usuario.trim()) {
      setError("Informe o usuario antes de reenviar o codigo.");
      return;
    }

    try {
      setLoading(true);
      await sendResetPin({ user_nome: form.usuario.trim() });
      setStep("confirm");
      // setMessage(
      //   `Novo codigo reenviado para ${maskedEmail || "seu e-mail cadastrado"}.`,
      // );
      setError("");
    } catch (resendError) {
      setError(
        resendError.message ||
          "Nao foi possivel reenviar o codigo no momento.",
      );
    } finally {
      setLoading(false);
    }
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
            aria-label="Recuperacao de senha"
          >
            <div className="login-card">
              <div className="login-card-header">
                <span className="login-kicker">Seguranca de acesso</span>
                <h1>Recuperar senha</h1>
                <p>Confirme o codigo e defina uma nova senha</p>
              </div>

              {/* {message ? (
                <p className="login-form-error" role="status">
                  {message}
                </p>
              ) : null} */}

              {error ? (
                <p className="login-form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <form
                className="login-form"
                onSubmit={
                  step === "request"
                    ? handleSendPin
                    : step === "confirm"
                      ? handleResetPassword
                      : (event) => event.preventDefault()
                }
                noValidate
              >
                <div className="login-field">
                  <label htmlFor="usuario">Usuario</label>
                  <input
                    id="usuario"
                    name="usuario"
                    type="text"
                    value={form.usuario}
                    onChange={handleChange}
                    placeholder="Digite seu usuario"
                    autoComplete="username"
                    disabled={step !== "request"}
                  />
                </div>

                {step !== "request" ? (
                  <p className="login-form-error" role="status">
                    PIN enviado para {maskedEmail || "seu e-mail cadastrado"}.
                  </p>
                ) : null}

                {step === "confirm" ? (
                  <>
                    <div className="login-field">
                      <label htmlFor="pin">PIN de 6 digitos</label>
                      <input
                        id="pin"
                        name="pin"
                        type="text"
                        value={form.pin}
                        onChange={handleChange}
                        placeholder="000000"
                        autoComplete="one-time-code"
                        maxLength={6}
                      />
                    </div>

                    <div className="login-field">
                      <label htmlFor="novaSenha">Nova senha</label>
                      <input
                        id="novaSenha"
                        name="novaSenha"
                        type="password"
                        value={form.novaSenha}
                        onChange={handleChange}
                        placeholder="Digite a nova senha"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="login-field">
                      <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                      <input
                        id="confirmarSenha"
                        name="confirmarSenha"
                        type="password"
                        value={form.confirmarSenha}
                        onChange={handleChange}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                ) : null}

                {step === "request" ? (
                  <button
                    type="submit"
                    className="login-submit"
                    disabled={loading || form.usuario.trim().length < 3}
                  >
                    {loading ? "Enviando codigo..." : "Enviar codigo"}
                  </button>
                ) : step === "confirm" ? (
                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? "Redefinindo senha..." : "Redefinir senha"}
                  </button>
                ) : (
                  <button type="button" className="login-submit" onClick={resetFlow}>
                    Fazer nova tentativa
                  </button>
                )}
              </form>

              <div className="login-link-row forgot-actions-inline">
                {step === "confirm" ? (
                  <button type="button" className="login-link" onClick={resetFlow}>
                    Alterar usuário
                  </button>
                ) : null}

                {step !== "done" ? (
                  <button type="button" className="login-link" onClick={handleResendPin}>
                    Reenviar codigo
                  </button>
                ) : null}

                <Link to="/login" className="login-link">
                  Voltar para tela de login
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default ForgotPasswordPage;