import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function SupplierModal({ isOpen, onClose, onSave, supplier }) {
  const [formData, setFormData] = useState({
    fncd_nome: "",
    fncd_documento: "",
    fncd_endereco: "",
    fncd_tel: "",
    fncd_email: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        fncd_nome: supplier.fncd_nome || "",
        fncd_documento: supplier.fncd_documento || "",
        fncd_endereco: supplier.fncd_endereco || "",
        fncd_tel: supplier.fncd_tel || "",
        fncd_email: supplier.fncd_email || "",
      });
    } else {
      setFormData({
        fncd_nome: "",
        fncd_documento: "",
        fncd_endereco: "",
        fncd_tel: "",
        fncd_email: "",
      });
    }
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
    onSave(formData, supplier?.fncd_id); // Passa fncd_id se for update
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
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Endereço
            </label>
            <input
              type="text"
              name="fncd_endereco"
              value={formData.fncd_endereco}
              onChange={handleChange}
              placeholder="Ex: Rua das Flores, 250"
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
