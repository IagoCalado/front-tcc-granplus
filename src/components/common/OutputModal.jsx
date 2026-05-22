import { useState, useEffect, useRef } from "react";
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
  const [currentLineIndex, setCurrentLineIndex] = useState(null);
  const [loadingLots, setLoadingLots] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);
  const [lotSelections, setLotSelections] = useState({});

  const [formData, setFormData] = useState({
    lcl_tipo: "", // Motivo
    lcl_destino: "", // Destino (opcional)
    produtos: [
      {
        pdt_id: "",
        quantidade: "",
        lotes_selecionados: [],
      },
    ],
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && token) {
      getProducts(token)
        .then((data) => setProducts(data || []))
        .catch(() => {});

      setFormData({
        lcl_tipo: "",
        lcl_destino: "",
        produtos: [
          {
            pdt_id: "",
            quantidade: "",
            lotes_selecionados: [],
          },
        ],
      });
      setAvailableLots([]);
      setLotSelections({});
      setIsLotsModalOpen(false);
      setCurrentLineIndex(null);
      setLoadingLots(false);
      setErrorMsg("");
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const selectedProduct =
    currentLineIndex !== null && formData.produtos[currentLineIndex]
      ? products.find(
          (p) =>
            Number(p.pdt_id) ===
            Number(formData.produtos[currentLineIndex].pdt_id),
        )
      : null;

  const selectedLotsTotal = Object.values(lotSelections).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  const currentLineQuantity =
    currentLineIndex !== null
      ? formData.produtos[currentLineIndex].quantidade
      : 0;

  const isLotsTotalValid =
    Math.abs(selectedLotsTotal - Number(currentLineQuantity || 0)) < 0.0001;

  const closeLotsModal = () => {
    setIsLotsModalOpen(false);
    setAvailableLots([]);
    setLotSelections({});
    setCurrentLineIndex(null);
  };

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProdutos = [...formData.produtos];
    newProdutos[index][name] =
      name === "pdt_id" || name === "quantidade" ? Number(value) : value;

    if (name === "pdt_id" || name === "quantidade") {
      newProdutos[index].lotes_selecionados = [];
    }

    setFormData({ ...formData, produtos: newProdutos });
  };

  const addProductRow = () => {
    setFormData((prev) => {
      const next = {
        ...prev,
        produtos: [
          ...prev.produtos,
          {
            pdt_id: "",
            quantidade: "",
            lotes_selecionados: [],
          },
        ],
      };

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);

      return next;
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

  const handleOpenLotsModal = async (index) => {
    const line = formData.produtos[index];

    if (!line.pdt_id) {
      setErrorMsg("Selecione um produto antes.");
      return;
    }

    if (!line.quantidade || line.quantidade <= 0) {
      setErrorMsg("Informe uma quantidade válida.");
      return;
    }

    const prod = products.find((p) => p.pdt_id === Number(line.pdt_id));
    if (!prod) {
      setErrorMsg("Produto não encontrado.");
      return;
    }

    if (line.quantidade > prod.pdt_estoque_atual) {
      setErrorMsg(
        `Quantidade excede o estoque disponível (${prod.pdt_estoque_atual}).`,
      );
      return;
    }

    try {
      setLoadingLots(true);
      setErrorMsg("");
      const data = await getOutputAvailableLots(token, line.pdt_id);
      const lots = Array.isArray(data?.lotes) ? data.lotes : [];

      if (lots.length === 0) {
        setErrorMsg("Não há lotes disponíveis para este produto.");
        return;
      }

      setCurrentLineIndex(index);
      setAvailableLots(lots);
      setLotSelections(
        line.lotes_selecionados.reduce((acc, lot) => {
          const key = buildLotKey(lot.lote, lot.validade, lot.loc_id);
          acc[key] = lot.quantidade;
          return acc;
        }, {}),
      );
      setIsLotsModalOpen(true);
    } catch (error) {
      setErrorMsg(error?.message || "Erro ao buscar lotes.");
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

  const handleConfirmLots = () => {
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
      setErrorMsg("Selecione ao menos um lote.");
      return;
    }

    const newProdutos = [...formData.produtos];
    newProdutos[currentLineIndex].lotes_selecionados = lotesSelecionados;
    setFormData({ ...formData, produtos: newProdutos });
    setErrorMsg("");
    closeLotsModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.lcl_tipo?.trim()) {
      setErrorMsg("Informe o motivo da saída.");
      return;
    }

    const productsWithoutLots = formData.produtos.filter(
      (p) => p.pdt_id && p.lotes_selecionados.length === 0,
    );

    if (productsWithoutLots.length > 0) {
      setErrorMsg(
        "Selecione os lotes para todos os produtos com quantidade informada.",
      );
      return;
    }

    try {
      await onSave(formData);
      setFormData({
        lcl_tipo: "",
        lcl_destino: "",
        produtos: [
          {
            pdt_id: "",
            quantidade: "",
            lotes_selecionados: [],
          },
        ],
      });
      onClose();
    } catch (error) {
      setErrorMsg(error?.message || "Erro ao registrar saída.");
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={() => { onClose(); }}>
        <div
          className="modal-content card"
          onClick={(e) => e.stopPropagation()}
          style={{ width: "min(94vw, 1180px)", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

          <div className="modal-header">
            <h3 style={{ margin: 0 }}>Registrar Nova Saída</h3>
          </div>

          {errorMsg && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div ref={scrollRef} style={{ overflowY: formData.produtos.length > 1 ? "auto" : "visible", paddingRight: 8 }}>
              <div className="input-field">
                <label>Motivo da Saída</label>
                <input type="text" name="lcl_tipo" value={formData.lcl_tipo} onChange={handleMainChange} placeholder="Ex: Venda, Descarte por vencimento, Doação" required />
              </div>

              <div className="input-field">
                <label>Destino (Opcional)</label>
                <input type="text" name="lcl_destino" value={formData.lcl_destino} onChange={handleMainChange} placeholder="Ex: Cliente João, Loja 2, Setor Financeiro" />
              </div>

              <div style={{ paddingTop: "15px" }}>
                <h4 style={{ fontSize: "16px", marginBottom: "10px", marginTop: 0 }}>Itens da Saída</h4>

                {formData.produtos.map((prod, index) => (
                  <div key={index} style={{ marginBottom: "6px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "10px", alignItems: "start" }}>
                      <div>
                        <label style={{ fontSize: "14px", fontWeight: "500", display: "block", marginBottom: "6px" }}>Produto</label>
                        <select name="pdt_id" value={prod.pdt_id} onChange={(e) => handleProductChange(index, e)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <option value="">Produto...</option>
                          {products.map((p) => (
                            <option key={p.pdt_id} value={p.pdt_id}>{p.pdt_nome} (Est: {p.pdt_estoque_atual})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "14px", fontWeight: "500", display: "block", marginBottom: "6px" }}>Quantidade</label>
                        <input type="number" name="quantidade" value={prod.quantidade} onChange={(e) => handleProductChange(index, e)} min="0" step="0.01" placeholder="Qtd" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)" }} />
                      </div>

                      <div>
                        <label style={{ fontSize: "14px", fontWeight: "500", display: "block", marginBottom: "6px" }}>Ação</label>
                        <div style={{ display: "flex", gap: "8px", justifySelf: "start" }}>
                          <button type="button" onClick={() => handleOpenLotsModal(index)} disabled={!prod.pdt_id || !prod.quantidade} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: prod.lotes_selecionados.length > 0 ? "#dcfce7" : "var(--background)", color: prod.lotes_selecionados.length > 0 ? "#166534" : "var(--text)", cursor: !prod.pdt_id || !prod.quantidade ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "500", opacity: !prod.pdt_id || !prod.quantidade ? 0.5 : 1 }}>
                            {prod.lotes_selecionados.length > 0 ? `✓ ${prod.lotes_selecionados.length} lote(s)` : "Selecionar Lote"}
                          </button>
                          <button type="button" onClick={() => removeProductRow(index)} disabled={formData.produtos.length === 1} title="Remover produto" style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)", color: "var(--text)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: formData.produtos.length === 1 ? "not-allowed" : "pointer", fontSize: "18px", lineHeight: 1, padding: 0, opacity: formData.produtos.length === 1 ? 0.5 : 1 }}>
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addProductRow} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: "600", padding: "0", marginTop: "5px" }}>
                  + Adicionar mais um produto
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }} className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Saída</button>
            </div>
          </form>
        </div>
      </div>

      {isLotsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ width: "min(94vw, 1180px)", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Selecionar Lotes da Saída</h3>
              <button className="modal-close" onClick={closeLotsModal} aria-label="Fechar"><X size={24} /></button>
            </div>

            <div style={{ overflowY: "auto", paddingRight: 8 }}>
              <p style={{ marginTop: 0, marginBottom: "12px", color: "#4b5563" }}>
                Informe quanto será retirado de cada lote. Quantidade da saída: <strong>{currentLineQuantity}</strong>
              </p>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "13px" }}>Localização</th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "13px" }}>Lote</th>
                      <th style={{ textAlign: "left", padding: "10px", fontSize: "13px" }}>Validade</th>
                      <th style={{ textAlign: "center", padding: "10px", fontSize: "13px" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "10px", fontSize: "13px" }}>Disponível</th>
                      <th style={{ textAlign: "right", padding: "10px", fontSize: "13px", width: "180px" }}>Retirar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableLots.map((lot, index) => {
                      const key = buildLotKey(lot.lote, lot.validade, lot.loc_id);
                      const statusInfo = getValidityStatus(lot.validade);
                      return (
                        <tr key={`${key}-${index}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "10px" }}>{lot.loc_nome || "Sem localização"}</td>
                          <td style={{ padding: "10px" }}>{formatLotLabel(lot.lote)}</td>
                          <td style={{ padding: "10px" }}>{formatDate(lot.validade)}</td>
                          <td style={{ padding: "10px", textAlign: "center", fontSize: "12px", fontWeight: "500" }}>
                            <span style={{ display: "inline-block", backgroundColor: statusInfo.color, color: "#fff", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>{statusInfo.label}</span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "right" }}>{Number(lot.quantidade_disponivel || 0)}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>
                            <input type="number" min="0" max={Number(lot.quantidade_disponivel || 0)} step="0.01" value={lotSelections[key] ?? ""} onChange={(event) => handleChangeLotQuantity(lot, event.target.value)} style={{ width: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", textAlign: "right" }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "14px", fontSize: "14px", color: isLotsTotalValid ? "#065f46" : "#b91c1c" }}>
                Selecionado: {selectedLotsTotal} de {Number(currentLineQuantity || 0)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }} className="modal-footer">
              <button type="button" onClick={closeLotsModal} className="btn btn-ghost">Voltar</button>
              <button type="button" onClick={handleConfirmLots} disabled={!isLotsTotalValid} className="btn btn-primary">Confirmar Lotes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
