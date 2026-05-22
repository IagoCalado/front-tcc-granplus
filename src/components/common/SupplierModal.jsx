import { useState, useEffect } from "react";
import AlertDialog from "./AlertDialog";

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const initialFormData = {
  fncd_nome: "",
  fncd_documento: "",
  fncd_cep: "",
  fncd_logradouro: "",
  fncd_numero: "",
  fncd_complemento: "",
  fncd_bairro: "",
  fncd_cidade: "",
  fncd_estado: "",
  fncd_tel: "",
  fncd_email: "",
};

const normalizeCep = (value) => String(value || "").replace(/\D/g, "");

const formatCep = (value) => {
  const digits = normalizeCep(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const formatCpfCnpj = (value) => {
  const digits = normalizeDigits(value).slice(0, 14);
  if (!digits) return "";

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }

  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(
      /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/,
      "$1.$2.$3/$4-$5",
    );
};

const formatPhone = (value) => {
  const digits = normalizeDigits(value).slice(0, 11);
  if (!digits) return "";

  if (digits.length < 3) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  // Fixo: (11) 4000-1000 (10 dígitos)
  if (digits.length <= 10) {
    const p1 = rest.slice(0, 4);
    const p2 = rest.slice(4, 8);
    return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
  }

  // Celular: (11) 94000-1000 (11 dígitos)
  const p1 = rest.slice(0, 5);
  const p2 = rest.slice(5, 9);
  return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
};

export default function SupplierModal({ isOpen, onClose, onSave, supplier }) {
  const [formData, setFormData] = useState(initialFormData);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "warning",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        ...initialFormData,
        fncd_nome: supplier.fncd_nome || "",
        fncd_documento: formatCpfCnpj(supplier.fncd_documento || ""),
        fncd_cep: formatCep(supplier.fncd_cep || ""),
        fncd_logradouro: supplier.fncd_logradouro || "",
        fncd_numero: supplier.fncd_numero || "",
        fncd_complemento: supplier.fncd_complemento || "",
        fncd_bairro: supplier.fncd_bairro || "",
        fncd_cidade: supplier.fncd_cidade || "",
        fncd_estado: supplier.fncd_estado || "",
        fncd_tel: formatPhone(supplier.fncd_tel || ""),
        fncd_email: supplier.fncd_email || "",
      });
    } else {
      setFormData({
        fncd_nome: "",
        fncd_documento: "",
        fncd_cep: "",
        fncd_logradouro: "",
        fncd_numero: "",
        fncd_complemento: "",
        fncd_bairro: "",
        fncd_cidade: "",
        fncd_estado: "",
        fncd_tel: "",
        fncd_email: "",
      });
    }
    setCepError("");
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleConsultarCep = async () => {
    const cepDigits = normalizeCep(formData.fncd_cep);
    if (cepDigits.length !== 8) {
      setAlertState({
        open: true,
        title: "CEP invalido",
        message: "Informe um CEP valido com 8 digitos.",
        tone: "warning",
      });
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (!response.ok || data?.erro) {
        setAlertState({
          open: true,
          title: "CEP nao encontrado",
          message: "CEP nao encontrado.",
          tone: "error",
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        fncd_cep: formatCep(cepDigits),
        fncd_logradouro: data.logradouro || prev.fncd_logradouro,
        fncd_bairro: data.bairro || prev.fncd_bairro,
        fncd_cidade: data.localidade || prev.fncd_cidade,
        fncd_estado: (data.uf || prev.fncd_estado || "").toUpperCase(),
        fncd_complemento: data.complemento || prev.fncd_complemento,
      }));
    } catch (err) {
      setAlertState({
        open: true,
        title: "Falha ao consultar CEP",
        message:
          "Nao foi possivel consultar o CEP. Verifique sua conexao e tente novamente.",
        tone: "error",
      });
      console.error(err);
    } finally {
      setCepLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "fncd_estado"
          ? value.toUpperCase()
          : name === "fncd_cep"
            ? formatCep(value)
            : name === "fncd_documento"
              ? formatCpfCnpj(value)
              : name === "fncd_tel"
                ? formatPhone(value)
            : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Importante: backend valida CPF/CNPJ somente com números.
    const payload = {
      ...formData,
      fncd_documento: normalizeDigits(formData.fncd_documento),
      fncd_tel: normalizeDigits(formData.fncd_tel),
      fncd_cep: formatCep(formData.fncd_cep),
      fncd_estado: String(formData.fncd_estado || "").toUpperCase(),
    };

    onSave(payload, supplier?.fncd_id); // Passa fncd_id se for update
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <div className="modal-header">
          <h3 style={{ margin: 0 }}>
            {supplier ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h3>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div>

          <AlertDialog
            isOpen={alertState.open}
            title={alertState.title}
            message={alertState.message}
            tone={alertState.tone}
            onClose={() =>
              setAlertState({ open: false, title: "", message: "", tone: "warning" })
            }
          />
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Nome do Fornecedor              
            </label>
            <input
              type="text"
              name="fncd_nome"
              value={formData.fncd_nome}
              onChange={handleChange}
              required
              placeholder="Ex: Higiene & Limpeza LTDA"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              CPF/CNPJ
            </label>
            <input
              type="text"
              name="fncd_documento"
              value={formData.fncd_documento}
              onChange={handleChange}
              required
              placeholder="Ex: 000.000.000-00 ou 00.000.000/0000-00"
              inputMode="numeric"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              CEP
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                name="fncd_cep"
                value={formData.fncd_cep}
                onChange={handleChange}
                required
                placeholder="Ex: 01001-000"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />

              <input
                type="text"
                name="fncd_estado"
                value={formData.fncd_estado}
                onChange={handleChange}
                required
                placeholder="UF"
                maxLength={2}
                style={{
                  width: "72px",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  textTransform: "uppercase",
                }}
              />

              <button
                type="button"
                onClick={handleConsultarCep}
                disabled={cepLoading}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  background: "#f8fafc",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cepLoading ? "Buscando..." : "Buscar CEP"}
              </button>
            </div>
            {cepError ? (
              <small style={{ color: "#dc2626", display: "block", marginTop: "4px" }}>
                {cepError}
              </small>
            ) : null}
          </div>
        <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Logradouro (Rua)
            </label>
            <input
              type="text"
              name="fncd_logradouro"
              value={formData.fncd_logradouro || ""}
              onChange={handleChange}
              required
              placeholder="Ex: Avenida das Indústrias"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "inherit"
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
            }}
          >
            {/* <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                CEP
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  name="fncd_cep"
                  value={formData.fncd_cep}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 01001-000"
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleConsultarCep}
                    disabled={cepLoading}
                    title="Consultar endereço pelo CEP"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: cepLoading ? "#e2e8f0" : "#fff",
                      cursor: cepLoading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      minWidth: "100px",
                    }}
                  >
                    {cepLoading ? "Consultando..." : "Consultar"}
                  </button>
                </div>
              </div>
            </div> */}
          </div>

          {/* <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Logradouro
            </label>
            <input
              type="text"
              name="fncd_logradouro"
              value={formData.fncd_logradouro}
              onChange={handleChange}
              required
              placeholder="Ex: Rua das Flores"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                textTransform: "uppercase",
              }}
            />
          </div> */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Número
              </label>
              <input
                type="text"
                name="fncd_numero"
                value={formData.fncd_numero}
                onChange={handleChange}
                required
                placeholder="Ex: 250"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Complemento (opcional)
              </label>
              <input
                type="text"
                name="fncd_complemento"
                value={formData.fncd_complemento}
                onChange={handleChange}
                placeholder="Ex: Sala 12"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Bairro
              </label>
              <input
                type="text"
                name="fncd_bairro"
                value={formData.fncd_bairro}
                onChange={handleChange}
                required
                placeholder="Ex: Centro"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cidade
              </label>
              <input
                type="text"
                name="fncd_cidade"
                value={formData.fncd_cidade}
                onChange={handleChange}
                required
                placeholder="Ex: São Paulo"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Telefone
            </label>
            <input
              type="text"
              name="fncd_tel"
              value={formData.fncd_tel}
              onChange={handleChange}
              required
              placeholder="Ex: (11) 94000-1000"
              inputMode="tel"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              name="fncd_email"
              value={formData.fncd_email}
              onChange={handleChange}
              placeholder="Ex: contato@fornecedor.com.br"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#0284c7",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

}

