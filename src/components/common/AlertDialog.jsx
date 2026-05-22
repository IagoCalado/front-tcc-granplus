import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const toneConfig = {
  info: {
    icon: Info,
    title: "Aviso",
    accent: "rgba(var(--neutral-rgb), 0.35)",
  },
  success: {
    icon: CheckCircle2,
    title: "Sucesso",
    accent: "rgba(var(--success-rgb), 0.35)",
  },
  warning: {
    icon: AlertCircle,
    title: "Atenção",
    accent: "rgba(var(--warning-rgb), 0.35)",
  },
  error: {
    icon: XCircle,
    title: "Erro",
    accent: "rgba(239, 68, 68, 0.35)",
  },
};

export default function AlertDialog({
  isOpen,
  title,
  message,
  tone = "info",
  onClose,
  confirmLabel = "Ok",
}) {
  if (!isOpen) return null;

  const config = toneConfig[tone] || toneConfig.info;
  const Icon = config.icon;
  const fallbackTitle = title || config.title;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content card alert-dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <div className="modal-header">
          <div className="alert-icon" style={{ boxShadow: `0 0 0 6px ${config.accent}` }}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 id="alert-dialog-title" style={{ margin: 0 }}>
              {fallbackTitle}
            </h3>
            {message && <p className="alert-message">{message}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
