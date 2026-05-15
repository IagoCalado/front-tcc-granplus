import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { getOutputAvailableLots, getProducts } from "../../services/api";

const formatLotLabel = (lote) => {
  if (lote === null || lote === undefined || lote === "") return "Sem lote";
  return String(lote);
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("pt-BR");
};

const buildLotKey = (lote, validade, locId) =>
  `${lote ?? "sem-lote"}|${validade ?? "sem-validade"}|${
    locId ?? "sem-localizacao"
  }`;

const getValidDate = (value) => {
  if (!value) return null;

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const normalized = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getValidityStatus = (value) => {
  const validade = getValidDate(value);
  if (!validade) {
    return { label: "Sem data", color: "#6b7280" };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  const diferencaMs = validade.getTime() - hoje.getTime();
  const diasParaVencer = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));

  if (diasParaVencer < 0) {
    return { label: "Vencido", color: "#dc2626" };
  }

  if (diasParaVencer === 0) {
    return { label: "Vence hoje", color: "#ea580c" };
  }

  if (diasParaVencer <= 30) {
    return { label: "Próximo do vencimento", color: "#ca8a04" };
  }

  return { label: "OK", color: "#16a34a" };
};

export default function OutputModal({ isOpen, onClose, onSave, token }) {
  const [products, setProducts] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLotsModalOpen, setIsLotsModalOpen] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);
  const [lotSelections, setLotSelections] = useState({});

  const [formData, setFormData] = useState({
    pdt_id: "",
    lcl_qtde: "",
    lcl_destino: "",
    lcl_tipo: "", // vai ser usado como Motivo
    lcl_justificativa: "",
  });

  useEffect(() => {
    if (isOpen && token) {
      getProducts(token)
        .then((data) => setProducts(data || []))
        .catch(() => {});

      setFormData({
        pdt_id: "",
        lcl_qtde: "",
        lcl_destino: "",
        lcl_tipo: "", // Motivo
        lcl_justificativa: "",
      });
      setAvailableLots([]);
      setLotSelections({});
      setIsLotsModalOpen(false);
      setLoadingLots(false);
      setErrorMsg("");
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const selectedProduct = products.find(
    (p) => Number(p.pdt_id) === Number(formData.pdt_id),
  );

  const selectedLotsTotal = Object.values(lotSelections).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  const isLotsTotalValid =
    Math.abs(selectedLotsTotal - Number(formData.lcl_qtde || 0)) < 0.0001;

  const closeAll = () => {
    setIsLotsModalOpen(false);
    setAvailableLots([]);
    setLotSelections({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue =
      name === "lcl_qtde" || name === "pdt_id" || name === "loc_id"
        ? value === ""
          ? ""
          : Number(value)
        : value;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: parsedValue,
      };

      if (name === "pdt_id" || name === "lcl_qtde" || name === "loc_id") {
        setAvailableLots([]);
        setLotSelections({});
      }

      if (name === "lcl_qtde" && selectedProduct) {
        if (Number(value) > selectedProduct.pdt_estoque_atual) {
          setErrorMsg(
            `Atenção: A quantidade excede o estoque atual (${selectedProduct.pdt_estoque_atual}).`,
          );
        } else {
          setErrorMsg("");
        }
      }

      if (name === "pdt_id" && newData.lcl_qtde) {
        const newProd = products.find((p) => p.pdt_id === Number(value));
        if (newProd && newData.lcl_qtde > newProd.pdt_estoque_atual) {
          setErrorMsg(
            `Atenção: A quantidade excede o estoque atual (${newProd.pdt_estoque_atual}).`,
          );
        } else {
          setErrorMsg("");
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.pdt_id) {
      setErrorMsg("Selecione um produto.");
      return;
    }

    if (!formData.lcl_qtde || formData.lcl_qtde <= 0) {
      setErrorMsg("A quantidade deve ser maior que zero.");
      return;
    }

    if (!formData.lcl_tipo.trim()) {
      setErrorMsg("Informe o motivo da saída.");
      return;
    }

    if (
      selectedProduct &&
      formData.lcl_qtde > selectedProduct.pdt_estoque_atual
    ) {
      setErrorMsg(
        `Erro: Não há estoque suficiente. O limite é ${selectedProduct.pdt_estoque_atual}.`,
      );
      return;
    }

    try {
      setLoadingLots(true);
      const data = await getOutputAvailableLots(token, formData.pdt_id);
      const lots = Array.isArray(data?.lotes) ? data.lotes : [];

      if (lots.length === 0) {
        setErrorMsg("Não há lotes disponíveis para este produto no estoque.");
        return;
      }

      setAvailableLots(lots);
      setLotSelections({});
      setIsLotsModalOpen(true);
    } catch (error) {
      setErrorMsg(error?.message || "Erro ao buscar lotes disponíveis.");
    } finally {
      setLoadingLots(false);
    }
  };

  const handleChangeLotQuantity = (lot, value) => {
    const key = buildLotKey(lot.lote, lot.validade, lot.loc_id);
    const available = Number(lot.quantidade_disponivel || 0);
    const parsed = value === "" ? "" : Number(value);

    if (parsed !== "" && (Number.isNaN(parsed) || parsed < 0)) return;
    if (parsed !== "" && parsed > available) return;

    setLotSelections((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  };

  const handleConfirmLots = async () => {
    if (!isLotsTotalValid) {
      setErrorMsg(
        "A soma das quantidades por lote deve ser igual à quantidade da saída.",
      );
      return;
    }

    const lotesSelecionados = availableLots
      .map((lot) => {
        const key = buildLotKey(lot.lote, lot.validade, lot.loc_id);
        const quantidade = Number(lotSelections[key] || 0);

        if (!quantidade) return null;

        return {
          loc_id: lot.loc_id,
          lote: lot.lote,
          validade: lot.validade,
          quantidade,
        };
      })
      .filter(Boolean);

    if (lotesSelecionados.length === 0) {
      setErrorMsg("Selecione ao menos um lote para confirmar a saída.");
      return;
    }

    try {
      await onSave({
        ...formData,
        loc_id: lotesSelecionados[0]?.loc_id || null,
        lotes_selecionados: lotesSelecionados,
      });
      closeAll();
    } catch (error) {
      setErrorMsg(error?.message || "Erro ao registrar saída.");
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeAll}>
        <div
          className="modal-content card"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(94vw, 1120px)",
            maxHeight: "none",
            overflow: "visible",
          }}
        >
          <div className="modal-header">
            <h3 style={{ margin: 0 }}>Registrar Nova Saída</h3>
            <button
              className="modal-close"
              onClick={closeAll}
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-body">
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Produto{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    fontWeight: "normal",
                  }}
                >
                  (Ex: Ração Magnus 15kg)
                </span>
              </label>
              <select
                name="pdt_id"
                value={formData.pdt_id}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Selecione o produto...</option>
                {products.map((p) => (
                  <option key={p.pdt_id} value={p.pdt_id}>
                    {p.pdt_nome} (Estoque: {p.pdt_estoque_atual})
                  </option>
                ))}
              </select>
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
                Quantidade{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    fontWeight: "normal",
                  }}
                >
                  (Ex: 5, 10, 50)
                </span>
              </label>
              <input
                type="number"
                name="lcl_qtde"
                value={formData.lcl_qtde}
                onChange={handleChange}
                min="1"
                max={
                  selectedProduct
                    ? selectedProduct.pdt_estoque_atual
                    : undefined
                }
                placeholder="Digite a quantidade a ser retirada..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  borderColor: errorMsg.includes("estoque")
                    ? "#ef4444"
                    : "#ccc",
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
                Motivo{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    fontWeight: "normal",
                  }}
                >
                  (Ex: Venda, Descarte por vencimento, Doação)
                </span>
              </label>
              <input
                type="text"
                name="lcl_tipo"
                value={formData.lcl_tipo}
                onChange={handleChange}
                placeholder="Digite o motivo da saída..."
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
                Destino{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    fontWeight: "normal",
                  }}
                >
                  (Ex: Cliente João, Loja 2, Setor Financeiro)
                </span>
              </label>
              <input
                type="text"
                name="lcl_destino"
                value={formData.lcl_destino}
                onChange={handleChange}
                placeholder="Digite o destino... (Opcional)"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div
              style={{ display: "flex", gap: "16px", marginTop: "10px" }}
              className="modal-footer"
            >
              <button
                type="button"
                onClick={closeAll}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingLots}
                className="btn btn-primary"
              >
                {loadingLots ? "Carregando lotes..." : "Confirmar Saída"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLotsModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsLotsModalOpen(false)}
        >
          <div
            className="modal-content card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(94vw, 1180px)",
              maxHeight: "none",
              overflow: "visible",
            }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Selecionar Lotes da Saída</h3>
              <button
                className="modal-close"
                onClick={() => setIsLotsModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ marginTop: 0, marginBottom: "12px", color: "#4b5563" }}>
              Informe quanto será retirado de cada lote. Quantidade da saída:{" "}
              <strong>{formData.lcl_qtde}</strong>
            </p>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    >
                      Localização
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    >
                      Lote
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    >
                      Validade
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "10px",
                        fontSize: "13px",
                      }}
                    >
                      Disponível
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "10px",
                        fontSize: "13px",
                        width: "180px",
                      }}
                    >
                      Retirar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableLots.map((lot, index) => {
                    const key = buildLotKey(lot.lote, lot.validade, lot.loc_id);
                    const statusInfo = getValidityStatus(lot.validade);
                    return (
                      <tr
                        key={`${key}-${index}`}
                        style={{ borderTop: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "10px" }}>
                          {lot.loc_nome || "Sem localização"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {formatLotLabel(lot.lote)}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {formatDate(lot.validade)}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              backgroundColor: statusInfo.color,
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          {Number(lot.quantidade_disponivel || 0)}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <input
                            type="number"
                            min="0"
                            max={Number(lot.quantidade_disponivel || 0)}
                            step="0.01"
                            value={lotSelections[key] ?? ""}
                            onChange={(event) =>
                              handleChangeLotQuantity(lot, event.target.value)
                            }
                            style={{
                              width: "120px",
                              padding: "8px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              textAlign: "right",
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "14px",
                color: isLotsTotalValid ? "#065f46" : "#b91c1c",
              }}
            >
              Selecionado: {selectedLotsTotal} de{" "}
              {Number(formData.lcl_qtde || 0)}
            </div>

            <div
              style={{ display: "flex", gap: "16px", marginTop: "16px" }}
              className="modal-footer"
            >
              <button
                type="button"
                onClick={() => setIsLotsModalOpen(false)}
                className="btn btn-ghost"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmLots}
                disabled={!isLotsTotalValid}
                className="btn btn-primary"
              >
                Confirmar Lotes e Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
