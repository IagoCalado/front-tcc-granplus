import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { updatePassword } from "../../services/api";
import LoadingSpinner from "./LoadingSpinner";
import "../../App.css";

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [current, setCurrent] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !user?.user_id) return;

    if (nueva !== confirmNew) {
      setStatus("A nova senha e a confirmação não conferem.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      await updatePassword(token, user.user_id, {
        senhaAtual: current,
        novaSenha: nueva,
      });
      setStatus("Senha atualizada com sucesso.");
      setCurrent("");
      setNueva("");
      setConfirmNew("");
    } catch (err) {
      setStatus("Erro: " + (err.message || "Falha ao atualizar senha"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <div className="modal-header" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="profile-avatar" aria-hidden>
            {user?.user_nome?.slice(0,2).toUpperCase() || 'GP'}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user?.user_nome || "Meu perfil"}</h3>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user?.user_email || ''}</div>
          </div>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Senha atual</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label>Nova senha</label>
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="input-field">
            <label>Confirmar nova senha</label>
            <input
              type="password"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : "Alterar senha"}
            </button>
          </div>

          {status && (
            <div
              className={`auth-${status.startsWith("Erro") || status.includes("não conferem") ? "error" : "success"}-box`}
              style={{ marginTop: 12 }}
            >
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
