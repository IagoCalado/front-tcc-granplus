import { useMemo, useState } from "react";
import { FiAlertTriangle, FiEye } from "react-icons/fi";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const getDateOnly = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = getValidDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "-";
};

const getDaysRemaining = (validade) => {
  const validadeDate = getValidDate(validade);
  if (!validadeDate) return null;

  const today = getDateOnly(new Date());
  const validadeOnly = getDateOnly(validadeDate);

  return Math.ceil((validadeOnly.getTime() - today.getTime()) / MS_PER_DAY);
};

const hasLotStockData = (produto, lote = null) => {
  const source = lote || produto;

  if (lote) return true;

  return Boolean(
    source?.lote != null ||
      source?.ent_prod_lote != null ||
      source?.quantidade_lote != null ||
      source?.ent_prod_qtde != null ||
      source?.quantidade_disponivel != null,
  );
};

const getLotQuantity = (produto, lote = null) => {
  if (!hasLotStockData(produto, lote)) return 0;

  const source = lote || produto;
  const quantity =
    source?.quantidade_disponivel ??
    source?.quantidade_lote ??
    source?.quantidade ??
    source?.ent_prod_qtde ??
    source?.ep_quantidade ??
    0;

  return Number(quantity) || 0;
};

const getProductKey = (produto, index) => {
  return String(
    produto?.pdt_id ??
      produto?.id ??
      produto?.pdt_codigo ??
      produto?.pdt_nome ??
      produto?.nome ??
      index,
  );
};

const normalizeAlertItem = (produto, index, lote = null, loteIndex = 0) => {
  const source = lote || produto;
  const validade = hasLotStockData(produto, lote)
    ? source?.pdt_validade ?? source?.validade ?? null
    : null;
  const id =
    produto?.pdt_id ??
    produto?.id ??
    produto?.estoque_id ??
    produto?.loc_prod_id ??
    index + 1;

  return {
    ...produto,
    id,
    productKey: getProductKey(produto, index),
    estoqueAtual: getLotQuantity(produto, lote),
    lote: source?.lote ?? source?.ent_prod_lote ?? null,
    loteIndex,
    pdt_nome: produto?.pdt_nome || produto?.nome || "Produto",
    pdt_validade: validade,
    diasRestantes: getDaysRemaining(validade),
  };
};

const expandProductLots = (produto, index) => {
  const lotes = Array.isArray(produto?.lotes) ? produto.lotes : [];

  if (!lotes.length) {
    return [normalizeAlertItem(produto, index)];
  }

  return lotes.map((lote, loteIndex) =>
    normalizeAlertItem(produto, index, lote, loteIndex),
  );
};

const getAlertItemKey = (produto) => {
  const validadeDate = getValidDate(produto.pdt_validade);
  const validadeKey = validadeDate
    ? validadeDate.toISOString().slice(0, 10)
    : "sem-validade";

  return `${produto.productKey}|${produto.lote ?? "sem-lote"}|${validadeKey}`;
};

const dedupeByLot = (produtos) => {
  const grouped = new Map();

  produtos.forEach((produto) => {
    const key = getAlertItemKey(produto);
    const current = grouped.get(key);

    if (!current || produto.diasRestantes < current.diasRestantes) {
      grouped.set(key, {
        ...produto,
        estoqueAtual:
          produto.estoqueAtual + Number(current?.estoqueAtual || 0),
      });
      return;
    }

    current.estoqueAtual += produto.estoqueAtual;
  });

  return Array.from(grouped.values());
};

const ModalListaVencimento = ({ produtos, onClose }) => {
  return (
    <div className="expiry-modal-overlay" role="presentation">
      <section
        className="expiry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expiry-modal-title"
      >
        <header className="expiry-modal-header">
          <div>
            <span className="expiry-modal-kicker">Alerta de validade</span>
            <h2 id="expiry-modal-title">
              Lista de Produtos Proximos ao Vencimento
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
            title="Fechar"
          >
            &times;
          </button>
        </header>

        <div className="expiry-table-shell">
          <table className="expiry-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Produto</th>
                <th>Lote</th>
                <th>Data de Validade</th>
                <th>Dias Restantes</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length ? (
                produtos.map((produto, index) => (
                  <tr
                    key={`${produto.id}-${produto.pdt_validade ?? "sem-validade"}-${produto.lote ?? "sem-lote"}-${index}`}
                  >
                    <td>{produto.id}</td>
                    <td>{produto.pdt_nome}</td>
                    <td>{produto.lote || "-"}</td>
                    <td>{formatDate(produto.pdt_validade)}</td>
                    <td>
                      <span className="expiry-days-pill">
                        {produto.diasRestantes === 0
                          ? "Vence hoje"
                          : `${produto.diasRestantes} dia${
                              produto.diasRestantes === 1 ? "" : "s"
                            }`}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="expiry-empty-row">
                    Nenhum produto vence nos proximos 7 dias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const CardProdutosVencendo = ({ produtos = [], loading = false }) => {
  const [showModal, setShowModal] = useState(false);

  const produtosVencendo = useMemo(() => {
    const today = getDateOnly(new Date());
    const limitDate = getDateOnly(new Date());
    limitDate.setDate(today.getDate() + 7);

    const filteredProducts = (produtos || [])
      .flatMap(expandProductLots)
      .filter((produto) => {
        if (produto.estoqueAtual <= 0) return false;

        const validadeDate = getValidDate(produto.pdt_validade);
        if (!validadeDate) return false;

        const validade = getDateOnly(validadeDate);
        return validade >= today && validade <= limitDate;
      });

    return dedupeByLot(filteredProducts).sort(
      (a, b) => a.diasRestantes - b.diasRestantes,
    );
  }, [produtos]);

  return (
    <>
      <article
        className={`expiry-card ${
          produtosVencendo.length > 0
            ? "expiry-card--alert"
            : "expiry-card--neutral"
        }`}
      >
        <div className="expiry-card-glow" aria-hidden="true" />

        <div className="expiry-card-header">
          <div className="expiry-title-wrap">
            <span className="expiry-alert-icon" aria-hidden="true">
              <FiAlertTriangle size={22} />
            </span>
            <div>
              <span className="expiry-card-label">Produtos a Vencer</span>
            </div>
          </div>

          <button
            type="button"
            className="expiry-view-button"
            onClick={() => setShowModal(true)}
            aria-label="Ver lista de produtos proximos ao vencimento"
            title="Ver lista"
          >
            <FiEye size={17} aria-hidden="true" />
            <span>Ver Lista</span>
          </button>
        </div>

        <div className="expiry-card-body">
          <strong className="expiry-count">
            {loading ? "..." : produtosVencendo.length}
          </strong>
          <span className="expiry-card-meta">
            itens/lotes com validade entre hoje e os proximos 7 dias
          </span>
        </div>
      </article>

      {showModal ? (
        <ModalListaVencimento
          produtos={produtosVencendo}
          onClose={() => setShowModal(false)}
        />
      ) : null}
    </>
  );
};

export default CardProdutosVencendo;
