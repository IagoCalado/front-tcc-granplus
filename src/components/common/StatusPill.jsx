const StatusPill = ({ label, tone = "neutral" }) => {
  return <span className={`pill ${tone}`}>{label}</span>;
};

export default StatusPill;
