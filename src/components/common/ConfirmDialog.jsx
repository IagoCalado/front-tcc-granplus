import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirmar acao",
  message,
  tone = "warning",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = tone === "danger" || tone === "error";

  return (
    <div className="modal-overlay">
      <div
        className="modal-content card alert-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <button className="modal-close" onClick={onCancel} aria-label="Fechar">
          ×
        </button>
        <div className="modal-header">
          <div
            className="alert-icon"
            style={{
              boxShadow: `0 0 0 6px ${
                isDanger
                  ? "rgba(239, 68, 68, 0.35)"
                  : "rgba(var(--warning-rgb), 0.35)"
              }`,
            }}
          >
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" style={{ margin: 0 }}>
              {title}
            </h3>
            {message && <p className="alert-message">{message}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
