import { FiAlertTriangle } from "react-icons/fi";

const MinAlertCard = ({ value = 0, meta = "", loading = false }) => {
  // Amber/orange accent
  const accentRgb = "245, 158, 11"; // #f59e0b
  const accentSoft = "#ffd7a8";

  return (
    <article
      className={`expiry-card expiry-card--alert`}
      style={{
        ['--expiry-accent']: '#f59e0b',
        ['--expiry-accent-rgb']: accentRgb,
        ['--expiry-accent-soft']: accentSoft,
      }}
    >
      <div className="expiry-card-glow" aria-hidden="true" />

      <div className="expiry-card-header">
        <div className="expiry-title-wrap">
          <span className="expiry-alert-icon" aria-hidden="true">
            <FiAlertTriangle size={22} />
          </span>
          <div>
            <span className="expiry-card-label">Alertas de mínimo</span>
          </div>
        </div>
      </div>

      <div className="expiry-card-body">
        <strong className="expiry-count">{loading ? "..." : value}</strong>
        <span className="expiry-card-meta">{meta}</span>
      </div>
    </article>
  );
};

export default MinAlertCard;
