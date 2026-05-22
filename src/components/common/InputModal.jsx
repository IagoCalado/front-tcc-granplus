/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getLocations, getSuppliers, getProducts } from "../../services/api";
import AlertDialog from "./AlertDialog";

export default function InputModal({
  isOpen,
  onClose,
  onSave,
  token,
  inputData,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "warning",
  });

  const [formData, setFormData] = useState({
    loc_id: 1,
    fncd_id: "",
    ent_data_compra: "",
    ent_valor_compra: "",
    produtos: [
      {
        pdt_id: "",
        quantidade: "",
        lote: "",
        pdt_validade: "",
      },
    ],
  });

  const activeSuppliers = suppliers.filter((supplier) => supplier?.fncd_ativo === 1);

  const getLocalISODate = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return "";

    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 16);
  };

  useEffect(() => {
    if (isOpen && token) {
      getSuppliers(token)
        .then((data) => setSuppliers(data || []))
        .catch(() => {});
      getProducts(token)
        .then((data) => setProducts(data || []))
        .catch(() => {});
      getLocations(token)
        .then((data) => setLocations(Array.isArray(data) ? data : []))
        .catch(() => setLocations([]));

      if (inputData) {
        const rawDate = inputData.ent_data_compra || inputData.ent_data || "";
        const ISODate = rawDate ? getLocalISODate(rawDate) : "";

        setFormData({
          loc_id: inputData.loc_id || 1,
          fncd_id: inputData.fncd_id || "",
          ent_data_compra: ISODate,
          ent_valor_compra: inputData.ent_valor_compra || "",
          produtos: [
            {
              pdt_id: inputData.pdt_id || "",
              quantidade: inputData.ent_quantidade || "",
              lote: inputData.lote || "",
              pdt_validade: inputData.pdt_validade || "",
            },
          ],
        });
      } else {
        setFormData({
          loc_id: 1,
          fncd_id: "",
          ent_data_compra: getLocalISODate(),
          ent_valor_compra: "",
          produtos: [
            {
              pdt_id: "",
              quantidade: "",
              lote: "",
              pdt_validade: "",
            },
          ],
        });
      }
    }
  }, [isOpen, token, inputData]);

  useEffect(() => {
    if (!isOpen) return;
    if (Array.isArray(locations) && locations.length > 0) {
      setFormData((prev) => {
        if (prev.loc_id && prev.loc_id !== 1) return prev;
        return { ...prev, loc_id: locations[0].loc_id };
      });
    }
  }, [locations, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "fncd_id" || name === "ent_valor_compra" || name === "loc_id"
          ? Number(value)
          : value,
    }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProdutos = [...formData.produtos];
    newProdutos[index][name] =
      name === "pdt_id" || name === "quantidade" ? Number(value) : value;
    setFormData({ ...formData, produtos: newProdutos });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      produtos: [
        ...formData.produtos,
        {
          pdt_id: "",
          quantidade: "",
          lote: "",
          pdt_validade: "",
        },
      ],
    });
  };

  const removeProductRow = (index) => {
    setFormData((prev) => {
      if (prev.produtos.length === 1) return prev;

      return {
        ...prev,
        produtos: prev.produtos.filter(
          (_, currentIndex) => currentIndex !== index,
        ),
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.fncd_id ||
      formData.produtos.some((p) => !p.pdt_id || !p.quantidade)
    ) {
      setAlertState({
        open: true,
        title: "Campos obrigatorios",
        message: "Preencha todos os campos do fornecedor, produto e quantidade.",
        tone: "warning",
      });
      return;
    }

    // Convert data compra to MySql DateTime format YYYY-MM-DD HH:MM:SS format
    const formattedData = {
      ...formData,
      ent_data_compra: formData.ent_data_compra.replace("T", " ") + ":00",
      produtos: formData.produtos.map((p) => ({
        ...p,
        // Garante que o lote seja enviado como inteiro nulo se ficar vazio, para não quebrar a tipagem INT do banco
        lote: p.lote === "" ? null : Number(p.lote),
        pdt_validade: p.pdt_validade === "" ? null : p.pdt_validade,
      })),
    };

    onSave(formattedData);
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(94vw, 1180px)",
          maxHeight: "none",
          overflow: "visible",
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Nova Entrada de Produto</h3>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Fornecedor</label>
            <select
              name="fncd_id"
              value={formData.fncd_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {activeSuppliers.map((sup) => (
                <option key={sup.fncd_id} value={sup.fncd_id}>
                  {sup.fncd_nome}
                </option>
              ))}
            </select>
          </div>

          <div className="input-field">
            <label>Localização</label>
            <select
              name="loc_id"
              value={formData.loc_id}
              onChange={handleChange}
              required
            >
              <option value="">Selecione...</option>
              {locations.map((loc) => (
                <option key={loc.loc_id} value={loc.loc_id}>
                  {loc.loc_nome}
                </option>
              ))}
            </select>
          </div>

          <div className="input-field">
            <label>Data / Hora da Compra</label>
            <input
              type="datetime-local"
              name="ent_data_compra"
              value={formData.ent_data_compra}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-field">
            <label>Valor Total da Compra (R$)</label>
            <input
              type="number"
              step="0.01"
              name="ent_valor_compra"
              value={formData.ent_valor_compra}
              onChange={handleChange}
              required
              placeholder="Ex: 1500.50"
            />
          </div>

          <div style={{ paddingTop: "15px" }}>
            <h4
              style={{ fontSize: "16px", marginBottom: "10px", marginTop: 0 }}
            >
              Itens da Entrada
            </h4>

            {formData.produtos.map((prod, index) => (
              <div key={index}>
                {index === 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <label style={{ fontSize: "14px", fontWeight: "500" }}>
                      Produto
                    </label>
                    <label style={{ fontSize: "14px", fontWeight: "500" }}>
                      Quantidade
                    </label>
                    <label style={{ fontSize: "14px", fontWeight: "500" }}>
                      Lote
                    </label>
                    <label style={{ fontSize: "14px", fontWeight: "500" }}>
                      Validade
                    </label>
                    <div />
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "10px",
                    marginBottom: "10px",
                    alignItems: "center",
                  }}
                >
                  <select
                    name="pdt_id"
                    value={prod.pdt_id}
                    onChange={(e) => handleProductChange(index, e)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="">Produto...</option>
                    {products.map((p) => (
                      <option key={p.pdt_id} value={p.pdt_id}>
                        {p.pdt_nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="quantidade"
                    value={prod.quantidade}
                    onChange={(e) => handleProductChange(index, e)}
                    required
                    placeholder="Qtd"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <input
                    type="text"
                    name="lote"
                    value={prod.lote}
                    onChange={(e) => handleProductChange(index, e)}
                    placeholder="Lote (Opcional)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <input
                    type="date"
                    name="pdt_validade"
                    value={prod.pdt_validade || ""}
                    onChange={(e) => handleProductChange(index, e)}
                    placeholder="Validade (Opcional)"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeProductRow(index)}
                    aria-label="Remover produto"
                    title="Remover produto"
                    disabled={formData.produtos.length === 1}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        formData.produtos.length === 1
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "18px",
                      lineHeight: 1,
                      padding: 0,
                      justifySelf: "start",
                      opacity: formData.produtos.length === 1 ? 0.5 : 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProductRow}
              style={{
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                padding: "0",
                marginTop: "5px",
              }}
            >
              + Adicionar mais um produto
            </button>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>

      <AlertDialog
        isOpen={alertState.open}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        onClose={() =>
          setAlertState({ open: false, title: "", message: "", tone: "warning" })
        }
      />
    </div>
  );
}
