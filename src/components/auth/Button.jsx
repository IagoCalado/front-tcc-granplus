const Button = ({ children, loading, ...props }) => {
  return (
    <button
      type="button"
      className={`auth-button ${loading ? "is-loading" : ""}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
      <span>{loading ? "Entrando..." : children}</span>
    </button>
  );
};

export default Button;
