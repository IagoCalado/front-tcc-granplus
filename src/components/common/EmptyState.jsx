const EmptyState = ({ title, description }) => {
  return (
    <div className="card empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
};

export default EmptyState;
