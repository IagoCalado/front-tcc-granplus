import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function SupplierModal({ isOpen, onClose, onSave, supplier }) {
  const initialFormData = {
    fncd_nome: "",
    fncd_documento: "",
    fncd_tel: "",
    fncd_email: "",
    fncd_cep: "",
    fncd_logradouro: "",
    fncd_numero: "",
    fncd_complemento: "",
    fncd_bairro: "",
    fncd_cidade: "",
    fncd_estado: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  useEffect(() => {
    if (supplier) {
      setFormData({
        fncd_nome: supplier.fncd_nome || "",
        fncd_documento: supplier.fncd_documento || "",
        fncd_tel: supplier.fncd_tel || "",
        fncd_email: supplier.fncd_email || "",
        fncd_cep: supplier.fncd_cep || "",
        fncd_logradouro: supplier.fncd_logradouro || "",
        fncd_numero: supplier.fncd_numero || "",
        fncd_complemento: supplier.fncd_complemento || "",
        fncd_bairro: supplier.fncd_bairro || "",
        fncd_cidade: supplier.fncd_cidade || "",
        fncd_estado: supplier.fncd_estado || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setCepError("");
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      fncd_documento: String(formData.fncd_documento || "").replace(/\D/g, ""),
      fncd_cep: String(formData.fncd_cep || "").replace(/\D/g, ""),
      fncd_estado: String(formData.fncd_estado || "").trim().toUpperCase(),
    };

    onSave(payload, supplier?.fncd_id);
  };

  const handleBuscarCep = async () => {
    const cep = String(formData.fncd_cep || "").replace(/\D/g, "");

    if (!cep) {
      setCepError("");
      return;
    }

    if (cep.length !== 8) {
      setCepError("CEP deve conter 8 numeros");
      return;
    }

    setCepLoading(true);
    setCepError("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        fncd_cep: cep,
        fncd_logradouro: data.logradouro || prev.fncd_logradouro,
        fncd_bairro: data.bairro || prev.fncd_bairro,
        fncd_cidade: data.localidade || prev.fncd_cidade,
        fncd_estado: data.uf || prev.fncd_estado,
      }));
    } catch {
      setCepError("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "#1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>
            {supplier ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={24} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
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
              CEP
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                name="fncd_cep"
                value={formData.fncd_cep}
                onChange={handleChange}
                required
                placeholder="Ex: 01001000"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                type="button"
                onClick={handleBuscarCep}
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
              Nome da Rua
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
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Numero
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
                Complemento
              </label>
              <input
                type="text"
                name="fncd_complemento"
                value={formData.fncd_complemento}
                onChange={handleChange}
                placeholder="Ex: Sala 4"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                placeholder="Ex: Sao Paulo"
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
              Estado (UF)
            </label>
            <input
              type="text"
              name="fncd_estado"
              value={formData.fncd_estado}
              onChange={handleChange}
              required
              maxLength={2}
              placeholder="Ex: SP"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                textTransform: "uppercase",
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
              placeholder="Ex: 12345678000190"
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
              Telefone
            </label>
            <input
              type="text"
              name="fncd_tel"
              value={formData.fncd_tel}
              onChange={handleChange}
              required
              placeholder="Ex: (11) 4000-1000"
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
