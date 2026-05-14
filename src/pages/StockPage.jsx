import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import ProductModal from "../components/common/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import { getOutputAvailableLots, getStock, createProduct } from "../services/api";
import { formatNumber } from "../utils/format";
import {
  STOCK_MOVEMENT_EVENT,
  STOCK_MOVEMENT_STORAGE_KEY,
} from "../utils/stockEvents";

const getValidDate = (value) => {
  if (!value) return null;

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const normalized = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const formatValidityDate = (value) => {
  const parsed = getValidDate(value);
  if (!parsed) return "Sem data";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatLotName = (value) => {
  if (value === null || value === undefined || value === "") return "Sem lote";
  return String(value);
};

const getValidityStatus = (value) => {
  const validade = getValidDate(value);
  if (!validade) {
    return { label: "Sem data de validade", color: "var(--ink)" };
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
    return { label: "Proximo do vencimento", color: "#ca8a04" };
  }

  return { label: "OK", color: "#16a34a" };
};

const StockPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState([]);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [modalLots, setModalLots] = useState([]);
  const [loadingModalLots, setLoadingModalLots] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableLotsCountByProduct, setAvailableLotsCountByProduct] =
    useState({});
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  const loadData = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await getStock(token);
      const rows = Array.isArray(data) ? data : [];
      const uniqueRows = Array.from(
        new Map(rows.map((item) => [item.pdt_id, item])).values(),
      );
      setStock(uniqueRows);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar estoque");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  const loadSelectedProductLots = useCallback(async (productId) => {
    if (!token || !productId) return;

    setLoadingModalLots(true);
    try {
      const data = await getOutputAvailableLots(token, productId);
      const lotes = Array.isArray(data?.lotes) ? data.lotes : [];

      const normalizedLots = lotes
        .map((lote) => ({
          lote: lote?.lote ?? null,
          validade: lote?.validade ?? null,
          quantidade:
            Number(lote?.quantidade_disponivel ?? lote?.quantidade ?? 0) || 0,
        }))
        .filter((lote) => lote.quantidade > 0);

      setModalLots(normalizedLots);
      setAvailableLotsCountByProduct((prev) => ({
        ...prev,
        [productId]: normalizedLots.length,
      }));
    } catch {
      setModalLots([]);
      setAvailableLotsCountByProduct((prev) => ({
        ...prev,
        [productId]: 0,
      }));
    } finally {
      setLoadingModalLots(false);
    }
  }, [token]);

  const loadAvailableLotsCount = useCallback(async (products) => {
    if (!token) return;

    if (!Array.isArray(products) || products.length === 0) {
      setAvailableLotsCountByProduct({});
      return;
    }

    const entries = await Promise.all(
      products.map(async (product) => {
        try {
          const data = await getOutputAvailableLots(token, product.pdt_id);
          const lotes = Array.isArray(data?.lotes) ? data.lotes : [];
          const total = lotes.filter(
            (lote) =>
              Number(lote?.quantidade_disponivel ?? lote?.quantidade ?? 0) > 0,
          ).length;

          return [product.pdt_id, total];
        } catch {
          return [product.pdt_id, 0];
        }
      }),
    );

    setAvailableLotsCountByProduct(Object.fromEntries(entries));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    loadData();
  }, [loadData, token]);

  useEffect(() => {
    if (!token) return;

    const handleStockMovement = () => {
      loadData({ silent: true });
      if (selectedProductId) {
        loadSelectedProductLots(selectedProductId);
      }
    };

    const handleStorage = (event) => {
      if (event.key !== STOCK_MOVEMENT_STORAGE_KEY) return;
      loadData({ silent: true });
      if (selectedProductId) {
        loadSelectedProductLots(selectedProductId);
      }
    };

    window.addEventListener(STOCK_MOVEMENT_EVENT, handleStockMovement);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(STOCK_MOVEMENT_EVENT, handleStockMovement);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadData, loadSelectedProductLots, selectedProductId, token]);

  useEffect(() => {
    if (!selectedProductId) {
      setModalLots([]);
      return;
    }

    loadSelectedProductLots(selectedProductId);
  }, [loadSelectedProductLots, selectedProductId]);

  const stockByProduct = useMemo(() => {
    const map = new Map();

    (stock || []).forEach((item) => {
      const productId = item.pdt_id;
      if (!productId) return;

      if (!map.has(productId)) {
        map.set(productId, {
          ...item,
          lotes: [],
          lotesKeys: new Set(),
        });
      }

      const product = map.get(productId);
      const loteValue = item.lote ?? item.ent_prod_lote ?? null;
      const quantidadeValue =
        Number(item.quantidade_lote ?? item.ent_prod_qtde ?? 0) || 0;
      const validadeValue = item.pdt_validade ?? null;
      const validadeDate = getValidDate(validadeValue);
      const validadeKey = validadeDate
        ? validadeDate.toISOString().slice(0, 10)
        : "sem-validade";
      const normalizedLotKey = `${loteValue ?? "sem-lote"}|${validadeKey}`;

      if (loteValue !== null || validadeValue) {
        if (!product.lotesKeys.has(normalizedLotKey)) {
          product.lotesKeys.add(normalizedLotKey);
          product.lotes.push({
            lote: loteValue,
            quantidade: quantidadeValue,
            validade: validadeKey === "sem-validade" ? null : validadeKey,
          });
        } else {
          const existingLot = product.lotes.find(
            (lot) =>
              `${lot.lote ?? "sem-lote"}|${lot.validade ?? "sem-validade"}` ===
              normalizedLotKey,
          );

          if (existingLot) {
            existingLot.quantidade =
              (Number(existingLot.quantidade) || 0) + quantidadeValue;
          }
        }
      }
    });

    map.forEach((product) => {
      product.lotes.sort((first, second) => {
        const firstDate = getValidDate(first.validade);
        const secondDate = getValidDate(second.validade);

        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;

        return firstDate.getTime() - secondDate.getTime();
      });
    });

    return Array.from(map.values()).map((product) => {
      const nextProduct = { ...product };
      delete nextProduct.lotesKeys;
      return nextProduct;
    });
  }, [stock]);

  const selectedProductLots = useMemo(() => {
    if (!selectedProductId) return null;
    return (
      stockByProduct.find((item) => item.pdt_id === selectedProductId) || null
    );
  }, [selectedProductId, stockByProduct]);

  const filteredStock = useMemo(() => {
    if (!searchTerm) return stockByProduct;
    return stockByProduct.filter((item) =>
      (item.pdt_nome || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [stockByProduct, searchTerm]);

  useEffect(() => {
    if (!token) return;
    loadAvailableLotsCount(stockByProduct);
  }, [loadAvailableLotsCount, stockByProduct, token]);

  const handleSaveInput = async (payload) => {
    try {
      await createProduct(token, payload);
      setIsInputModalOpen(false);
      loadData({ silent: true });
    } catch (err) {
      alert(
        "Erro ao adicionar produto. Detalhe: " + err.message,
      );
      console.error(err);
    }
  };

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar o estoque"
        description="As informacoes de estoque exigem autenticacao."
      />
    );
  }
  const columns = [
    { key: "pdt_nome", label: "Produto" },
    {
      key: "pdt_codigo",
      label: "Codigo",
      render: (row) => row.pdt_codigo || "-",
    },
    {
      key: "pdt_estoque_minimo",
      label: "Estoque minimo",
      render: (row) => formatNumber(row.pdt_estoque_minimo),
    },
    {
      key: "pdt_descricao",
      label: "Descrição",
      render: (row) => row.pdt_descricao || "-",
    },
    {
      key: "lotes",
      label: "Lotes / Validade",
      render: (row) => {
        const lotsCount =
          availableLotsCountByProduct[row.pdt_id] ?? row.lotes?.length ?? 0;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{formatNumber(lotsCount)} lotes</span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSelectedProductId(row.pdt_id);
                setSelectedProductName(row.pdt_nome || "");
                loadData({ silent: true });
              }}
              style={{ padding: "6px 10px", fontSize: "12px" }}
            >
              Ver lotes
            </button>
          </div>
        );
      },
    },
    {
      key: "estoque_atual",
      label: "Estoque atual",
      render: (row) => formatNumber(row.estoque_atual),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusPill
          label={row.estoque_atual > 0 ? "Disponivel" : "Zerado"}
          tone={row.estoque_atual > 0 ? "success" : "warning"}
        />
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          // background: "var(--bg)",
          paddingTop: "4px",
          paddingBottom: "8px",
        }}
      >
        <SectionHeader
          title="Estoque"
          subtitle="Visualize o estoque atual dos produtos."
          onSearch={setSearchTerm}
          // actions={
          //   <button className="btn btn-primary" onClick={() => setIsInputModalOpen(true)}>
          //     Adicionar Produto
          //   </button>
          // }
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Não foi possivel carregar" description={error} />
      ) : (
        <DataTable columns={columns} rows={filteredStock} rowKey="pdt_id" />
      )}

      {selectedProductId && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedProductId(null);
            setSelectedProductName("");
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--overlay-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "var(--bg-elevated)",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "560px",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, color: "var(--ink)" }}>
                Lotes de {selectedProductLots?.pdt_nome || selectedProductName}
              </h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedProductId(null);
                  setSelectedProductName("");
                }}
              >
                Fechar
              </button>
            </div>

            {loadingModalLots ? (
              <LoadingSpinner />
            ) : modalLots.length ? (
              <div className="table-shell" style={{ maxHeight: "320px", overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "center" }}>Quantidade</th>
                      <th>Lote</th>
                      <th>Validade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalLots.map((item, index) => {
                      const status = getValidityStatus(item.validade);

                      return (
                        <tr
                          key={`${item.lote ?? "sem-lote"}-${item.validade ?? "sem-validade"}-${index}`}
                        >
                          <td style={{ textAlign: "center" }}>
                            {formatNumber(item.quantidade)}
                          </td>
                          <td>{formatLotName(item.lote)}</td>
                          <td>{formatValidityDate(item.validade)}</td>
                          <td style={{ color: status.color, fontWeight: 600 }}>
                            {status.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Sem lotes disponiveis"
                description="Não ha saldo para os lotes deste produto."
              />
            )}
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSave={handleSaveInput}
      />
    </div>
  );
};

export default StockPage;