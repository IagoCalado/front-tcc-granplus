import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import { useAuth } from "../contexts/AuthContext";
import { getOutputAvailableLots, getStock } from "../services/api";
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

const getStatusSortWeight = (value) => {
  const label = getValidityStatus(value).label;

  if (label === "Vencido") return 0;
  if (label === "Vence hoje") return 1;
  if (label === "Proximo do vencimento") return 2;
  if (label === "OK") return 3;
  return 4;
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
  const [modalLotsFilter, setModalLotsFilter] = useState("");
  const [modalLotsSortColumn, setModalLotsSortColumn] = useState("validade");
  const [modalLotsSortDirection, setModalLotsSortDirection] = useState("asc");
  const [loadingModalLots, setLoadingModalLots] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableLotsCountByProduct, setAvailableLotsCountByProduct] =
    useState({});

  const loadData = useCallback(
    async (options = {}) => {
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
    },
    [token],
  );

  const loadSelectedProductLots = useCallback(
    async (productId) => {
      if (!token || !productId) return;

      setLoadingModalLots(true);
      try {
        const data = await getOutputAvailableLots(token, productId);
        const lotes = Array.isArray(data?.lotes) ? data.lotes : [];

        const normalizedLots = lotes
          .map((lote) => ({
            loc_nome: lote?.loc_nome || null,
            lote: lote?.lote ?? null,
            validade: lote?.validade ?? null,
            quantidade:
              Number(lote?.quantidade_disponivel ?? lote?.quantidade ?? 0) || 0,
          }))
          .filter((lote) => lote.quantidade > 0);

        setModalLots(normalizedLots);
        setModalLotsFilter("");
        setModalLotsSortColumn("validade");
        setModalLotsSortDirection("asc");
        setAvailableLotsCountByProduct((prev) => ({
          ...prev,
          [productId]: normalizedLots.length,
        }));
      } catch {
        setModalLots([]);
        setModalLotsFilter("");
        setModalLotsSortColumn("validade");
        setModalLotsSortDirection("asc");
        setAvailableLotsCountByProduct((prev) => ({
          ...prev,
          [productId]: 0,
        }));
      } finally {
        setLoadingModalLots(false);
      }
    },
    [token],
  );

  const loadAvailableLotsCount = useCallback(
    async (products) => {
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
                Number(lote?.quantidade_disponivel ?? lote?.quantidade ?? 0) >
                0,
            ).length;

            return [product.pdt_id, total];
          } catch {
            return [product.pdt_id, 0];
          }
        }),
      );

      setAvailableLotsCountByProduct(Object.fromEntries(entries));
    },
    [token],
  );

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
      setModalLotsFilter("");
      setModalLotsSortColumn("validade");
      setModalLotsSortDirection("asc");
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

  const filteredModalLots = useMemo(() => {
    const normalizedFilter = modalLotsFilter.trim().toLowerCase();
    if (!normalizedFilter) return modalLots;

    return modalLots.filter((item) => {
      const status = getValidityStatus(item.validade).label;
      const searchableText = [
        item.loc_nome,
        item.lote,
        item.validade ? formatValidityDate(item.validade) : null,
        item.quantidade,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedFilter);
    });
  }, [modalLots, modalLotsFilter]);

  const sortedModalLots = useMemo(() => {
    const lots = [...filteredModalLots];
    const direction = modalLotsSortDirection === "desc" ? -1 : 1;

    const compareText = (firstValue, secondValue) =>
      String(firstValue ?? "").localeCompare(
        String(secondValue ?? ""),
        "pt-BR",
        {
          numeric: true,
          sensitivity: "base",
        },
      );

    lots.sort((first, second) => {
      let comparison = 0;

      if (modalLotsSortColumn === "loc_nome") {
        comparison = compareText(
          first.loc_nome || "Sem localização",
          second.loc_nome || "Sem localização",
        );
      } else if (modalLotsSortColumn === "quantidade") {
        comparison =
          (Number(first.quantidade) || 0) - (Number(second.quantidade) || 0);
      } else if (modalLotsSortColumn === "lote") {
        comparison = compareText(
          formatLotName(first.lote),
          formatLotName(second.lote),
        );
      } else if (modalLotsSortColumn === "validade") {
        const firstDate = getValidDate(first.validade);
        const secondDate = getValidDate(second.validade);

        if (!firstDate && !secondDate) {
          comparison = 0;
        } else if (!firstDate) {
          comparison = 1;
        } else if (!secondDate) {
          comparison = -1;
        } else {
          comparison = firstDate.getTime() - secondDate.getTime();
        }
      } else if (modalLotsSortColumn === "status") {
        comparison =
          getStatusSortWeight(first.validade) -
          getStatusSortWeight(second.validade);
      }

      if (comparison === 0) {
        comparison = compareText(
          formatLotName(first.lote),
          formatLotName(second.lote),
        );
      }

      if (comparison === 0) {
        comparison = compareText(
          first.loc_nome || "Sem localização",
          second.loc_nome || "Sem localização",
        );
      }

      return comparison * direction;
    });

    return lots;
  }, [filteredModalLots, modalLotsSortColumn, modalLotsSortDirection]);

  const handleSortModalLots = (column) => {
    if (modalLotsSortColumn === column) {
      setModalLotsSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
      return;
    }

    setModalLotsSortColumn(column);
    setModalLotsSortDirection("asc");
  };

  const renderSortLabel = (column, label) => {
    const isActive = modalLotsSortColumn === column;
    const arrow = isActive
      ? modalLotsSortDirection === "asc"
        ? "▲"
        : "▼"
      : "↕";

    return (
      <button
        type="button"
        onClick={() => handleSortModalLots(column)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          width: "100%",
          background: "transparent",
          border: "none",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: "11px", opacity: isActive ? 1 : 0.55 }}>
          {arrow}
        </span>
      </button>
    );
  };

  useEffect(() => {
    if (!token) return;
    loadAvailableLotsCount(stockByProduct);
  }, [loadAvailableLotsCount, stockByProduct, token]);

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar o estoque"
        description="As informacoes de estoque exigem autenticacao."
      />
    );
  }
  const columns = [
    { key: "pdt_nome", label: "Produto", sortable: true },
    {
      key: "pdt_codigo",
      label: "Codigo",
      sortable: true,
      render: (row) => row.pdt_codigo || "-",
    },
    {
      key: "pdt_estoque_minimo",
      label: "Estoque minimo",
      sortable: true,
      sortType: "number",
      render: (row) => formatNumber(row.pdt_estoque_minimo),
    },
    {
      key: "pdt_descricao",
      label: "Descrição",
      sortable: true,
      render: (row) => row.pdt_descricao || "-",
    },
    {
      key: "lotes",
      label: "Lotes / Validade",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) =>
        availableLotsCountByProduct[row.pdt_id] ?? row.lotes?.length ?? 0,
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
                setModalLotsFilter("");
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
      sortable: true,
      sortType: "number",
      render: (row) => formatNumber(row.estoque_atual),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) => (row.estoque_atual > 0 ? 1 : 0),
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
              width: "min(96vw, 1100px)",
              maxWidth: "1100px",
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
                  setModalLotsFilter("");
                }}
              >
                Fechar
              </button>
            </div>

            <div className="input-field" style={{ marginBottom: "14px" }}>
              <label>Filtrar lotes</label>
              <input
                type="text"
                value={modalLotsFilter}
                onChange={(event) => setModalLotsFilter(event.target.value)}
                placeholder="Filtre por localização, lote, validade, quantidade ou status"
              />
            </div>

            {loadingModalLots ? (
              <LoadingSpinner />
            ) : sortedModalLots.length ? (
              <div
                className="table-shell"
                style={{ maxHeight: "320px", overflowY: "auto" }}
              >
                <table className="table" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>{renderSortLabel("loc_nome", "Localização")}</th>
                      <th style={{ textAlign: "center" }}>
                        {renderSortLabel("quantidade", "Quantidade")}
                      </th>
                      <th>{renderSortLabel("lote", "Lote")}</th>
                      <th>{renderSortLabel("validade", "Validade")}</th>
                      <th>{renderSortLabel("status", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModalLots.map((item, index) => {
                      const status = getValidityStatus(item.validade);

                      return (
                        <tr
                          key={`${item.lote ?? "sem-lote"}-${item.validade ?? "sem-validade"}-${index}`}
                        >
                          <td style={{ textAlign: "center" }}>
                            {item.loc_nome || "Sem localização"}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {formatNumber(item.quantidade)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {formatLotName(item.lote)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {formatValidityDate(item.validade)}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              color: status.color,
                              fontWeight: 600,
                            }}
                          >
                            {status.label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : modalLots.length ? (
              <EmptyState
                title="Nenhum lote encontrado"
                description="Nenhum lote corresponde ao filtro informado."
              />
            ) : (
              <EmptyState
                title="Sem lotes disponiveis"
                description="Não ha saldo para os lotes deste produto."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
