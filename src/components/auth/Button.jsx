const Button = ({ children, loading, loadingLabel = "Entrando...", ...props }) => {
  return (
    <button
      type="button"
      className={`auth-button ${loading ? "is-loading" : ""}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
};

export default Button;
