const Input = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  error,
}) => {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input-wrap ${error ? "has-error" : ""}`.trim()}>
        {icon ? <span className="auth-input-icon">{icon}</span> : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : "false"}
        />
      </div>
      {error ? <p className="auth-field-error">{error}</p> : null}
    </div>
  );
};

export default Input;
