const StatCard = ({ title, value, meta }) => {
  return (
    <div className="card stat-card">
      <span className="stat-meta">{title}</span>
      <div className="stat-value">{value}</div>
      {meta ? <span className="stat-meta">{meta}</span> : null}
    </div>
  );
};

export default StatCard;
