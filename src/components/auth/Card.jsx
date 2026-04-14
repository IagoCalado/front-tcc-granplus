const Card = ({ title, subtitle, children }) => {
  return (
    <section className="auth-card" role="region" aria-label={title}>
      <div className="auth-card-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
};

export default Card;
