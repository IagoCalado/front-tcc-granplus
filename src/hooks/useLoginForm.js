import { useMemo, useState } from "react";

const initialForm = {
  email: "",
  password: "",
};

const useLoginForm = () => {
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});

  const isValid = useMemo(
    () => form.email.trim().length >= 3 && form.password.trim().length >= 3,
    [form.password, form.email]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = "Informe seu e-mail.";
    }

    if (!form.password.trim()) {
      errors.password = "Informe sua senha.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    form,
    fieldErrors,
    isValid,
    handleChange,
    validate,
  };
};

export default useLoginForm;
