import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
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
    setForm({
      email: "",
      pin: "",
      novaSenha: "",
      confirmarSenha: "",
    });
  };

  const handleSendPin = async (event) => {
    event.preventDefault();
    setError("");
    // setMessage("");

    const email = form.email.trim();
    if (email.length < 3) {
      setError("Informe seu e-mail para continuar.");
      return;
    }

    try {
      setLoading(true);
      await verifyUserForReset({ user_email: email });
      await sendResetPin({ user_email: email });

      setStep("confirm");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possivel enviar o codigo. Verifique o e-mail e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    // setMessage("");

    const email = form.email.trim();
    const pin = form.pin.trim();
    const novaSenha = form.novaSenha.trim();

    if (!email) {
      setError("Informe o e-mail antes de redefinir a senha.");
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
        user_email: email,
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
    if (!form.email.trim()) {
      setError("Informe o e-mail antes de reenviar o codigo.");
      return;
    }

    try {
      setLoading(true);
      await sendResetPin({ user_email: form.email.trim() });
      setStep("confirm");
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
                <h1>Recuperar Senha</h1>
                {/* <p>Confirme o codigo e defina uma nova senha</p> */}
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

              {step === "done" ? (
                <p
                  role="status"
                  style={{
                    marginTop: "18px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(0, 200, 255, 0.35)",
                    background: "rgba(0, 200, 255, 0.08)",
                    color: "#cfefff",
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  Sua senha foi redefinida com sucesso. Agora você já pode acessar o sistema.
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
                {step !== "done" ? (
                  <>
                    <div className="login-field">
                      <label htmlFor="email">E-mail</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Digite seu e-mail"
                        autoComplete="email"
                        disabled={step !== "request"}
                      />
                    </div>

                    {step !== "request" ? (
                      <p className="login-form-error" role="status">
                        PIN enviado com sucesso para o seu e-mail.
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
                          <div className="input-with-toggle">
                            <input
                              id="novaSenha"
                              name="novaSenha"
                              type={showNewPassword ? "text" : "password"}
                              value={form.novaSenha}
                              onChange={handleChange}
                              placeholder="Digite a nova senha"
                              autoComplete="new-password"
                            />

                            <button
                              type="button"
                              className="password-toggle btn-ghost"
                              onClick={() => setShowNewPassword((s) => !s)}
                              aria-pressed={showNewPassword}
                              aria-label={showNewPassword ? "Esconder senha" : "Mostrar senha"}
                            >
                              {showNewPassword ? <AiOutlineEyeInvisible size={18} aria-hidden="true" /> : <AiOutlineEye size={18} aria-hidden="true" />}
                            </button>
                          </div>
                        </div>

                        <div className="login-field">
                          <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                          <div className="input-with-toggle">
                            <input
                              id="confirmarSenha"
                              name="confirmarSenha"
                              type={showConfirmPassword ? "text" : "password"}
                              value={form.confirmarSenha}
                              onChange={handleChange}
                              placeholder="Repita a nova senha"
                              autoComplete="new-password"
                            />

                            <button
                              type="button"
                              className="password-toggle btn-ghost"
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              aria-pressed={showConfirmPassword}
                              aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                            >
                              {showConfirmPassword ? <AiOutlineEyeInvisible size={18} aria-hidden="true" /> : <AiOutlineEye size={18} aria-hidden="true" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}

                    {step === "request" ? (
                      <button
                        type="submit"
                        className="login-submit"
                        disabled={loading || form.email.trim().length < 3}
                      >
                        {loading ? "Enviando codigo..." : "Enviar codigo"}
                      </button>
                    ) : step === "confirm" ? (
                      <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? "Redefinindo senha..." : "Redefinir senha"}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </form>

              <div className="login-link-row forgot-actions-inline">
                {step === "confirm" ? (
                  <button type="button" className="login-link" onClick={resetFlow}>
                    Alterar usuário
                  </button>
                ) : null}

                {step === "request" || step === "confirm" ? (
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