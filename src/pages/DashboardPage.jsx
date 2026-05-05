import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import {
  getMostMovedProducts,
  getMinimumStock,
  getProducts,
  getStock,
  getUsers,
} from "../services/api";
import { formatNumber } from "../utils/format";

const truncateText = (value, maxLength = 18) => {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
};

const TruncatedAxisTick = ({
  x,
  y,
  payload,
  fill = "var(--muted)",
  fontSize = 12,
  angle = 0,
  textAnchor = "middle",
  dy = 16,
  maxLength = 18,
}) => {
  const full = String(payload?.value ?? "");
  const truncated = truncateText(full, maxLength);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={dy}
        textAnchor={textAnchor}
        fill={fill}
        fontSize={fontSize}
        transform={angle ? `rotate(${angle})` : undefined}
      >
        <title>{full}</title>
        {truncated}
      </text>
    </g>
  );
};

const ChartCardHeader = ({ title, subtitle, actions }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? <div style={{ flexShrink: 0 }}>{actions}</div> : null}
    </div>
  );
};

const DashboardTooltip = (props) => {
  const { active, payload, label } = props;

  if (!active || !payload?.length) return null;

  const tooltipLabel =
    label ??
    payload?.[0]?.payload?.name ??
    payload?.[0]?.name ??
    "";

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "10px 12px",
        boxShadow: "var(--shadow-sm)",
        color: "var(--ink)",
        minWidth: "200px",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>
        {tooltipLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                background: entry.color,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
              {entry.name}:
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800 }}>
              {typeof entry.value === "number"
                ? formatNumber(entry.value)
                : String(entry.value ?? "-")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardStatCard = ({ title, value, meta, loading }) => {
  if (!loading) {
    return <StatCard title={title} value={value} meta={meta} />;
  }

  return (
    <div className="card stat-card">
      <span className="stat-meta">{title}</span>
      <div className="stat-value" style={{ display: "flex" }}>
        <div className="skeleton" style={{ height: 34, width: "60%" }} />
      </div>
      <span className="stat-meta">
        <span
          className="skeleton"
          style={{ height: 12, width: "80%", display: "inline-block" }}
        />
      </span>
    </div>
  );
};

const DashboardPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState({
    products: "idle",
    stock: "idle",
    moved: "idle",
    min: "idle",
    users: "idle",
  });
  const [errors, setErrors] = useState({
    products: "",
    stock: "",
    moved: "",
    min: "",
    users: "",
  });

  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [users, setUsers] = useState([]);
  const [mostMoved, setMostMoved] = useState([]);
  const [minStock, setMinStock] = useState([]);
  const [topLimit, setTopLimit] = useState(8);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setStatus((prev) => ({
        ...prev,
        products: "loading",
        stock: "loading",
        moved: "loading",
        min: "loading",
        users: isAdmin ? "loading" : "ready",
      }));
      setErrors({ products: "", stock: "", moved: "", min: "", users: "" });

      try {
        const [productsRes, stockRes, movedRes, minRes] =
          await Promise.allSettled([
            getProducts(token),
            getStock(token),
            getMostMovedProducts(token),
            getMinimumStock(token),
          ]);

        if (productsRes.status === "fulfilled") {
          setProducts(productsRes.value || []);
          setStatus((prev) => ({ ...prev, products: "ready" }));
        } else {
          setProducts([]);
          setStatus((prev) => ({ ...prev, products: "error" }));
          setErrors((prev) => ({
            ...prev,
            products:
              productsRes.reason?.message ||
              "Falha ao carregar produtos.",
          }));
        }

        if (stockRes.status === "fulfilled") {
          setStock(stockRes.value || []);
          setStatus((prev) => ({ ...prev, stock: "ready" }));
        } else {
          setStock([]);
          setStatus((prev) => ({ ...prev, stock: "error" }));
          setErrors((prev) => ({
            ...prev,
            stock: stockRes.reason?.message || "Falha ao carregar estoque.",
          }));
        }

        if (movedRes.status === "fulfilled") {
          setMostMoved(movedRes.value || []);
          setStatus((prev) => ({ ...prev, moved: "ready" }));
        } else {
          setMostMoved([]);
          setStatus((prev) => ({ ...prev, moved: "error" }));
          setErrors((prev) => ({
            ...prev,
            moved:
              movedRes.reason?.message ||
              "Falha ao carregar movimentações.",
          }));
        }

        if (minRes.status === "fulfilled") {
          setMinStock(minRes.value || []);
          setStatus((prev) => ({ ...prev, min: "ready" }));
        } else {
          setMinStock([]);
          setStatus((prev) => ({ ...prev, min: "error" }));
          setErrors((prev) => ({
            ...prev,
            min:
              minRes.reason?.message ||
              "Falha ao carregar alertas de mínimo.",
          }));
        }

        if (isAdmin) {
          try {
            const usersData = await getUsers(token);
            setUsers(usersData?.usuarios || []);
            setStatus((prev) => ({ ...prev, users: "ready" }));
          } catch {
            setUsers([]);
            setStatus((prev) => ({ ...prev, users: "error" }));
            setErrors((prev) => ({
              ...prev,
              users: "Falha ao carregar usuários.",
            }));
          }
        }
      } catch {
        setStatus((prev) => ({
          ...prev,
          products: "error",
          stock: "error",
          moved: "error",
          min: "error",
          users: isAdmin ? "error" : prev.users,
        }));
        setErrors((prev) => ({
          ...prev,
          products: prev.products || "Erro crítico ao carregar o painel.",
        }));
      }
    };

    loadData();
  }, [token, isAdmin]);

  const estoqueTotal = useMemo(() => {
    return stock.reduce(
      (total, item) => total + Number(item.estoque_atual || 0),
      0,
    );
  }, [stock]);

  const productsActiveCount = useMemo(() => {
    return products.filter((p) => Boolean(p?.pdt_ativo)).length;
  }, [products]);

  const productsInactiveCount = useMemo(() => {
    return products.filter((p) => !p?.pdt_ativo).length;
  }, [products]);

  const productsWithStockCount = useMemo(() => {
    return products.filter((p) => Number(p?.pdt_estoque_atual || 0) > 0).length;
  }, [products]);

  const productsWithoutStockCount = useMemo(() => {
    return products.filter((p) => Number(p?.pdt_estoque_atual || 0) <= 0).length;
  }, [products]);

  const mostMovedChartData = useMemo(() => {
    return (mostMoved || [])
      .map((item) => ({
        name: item?.pdt_nome || "Produto",
        movimentado: Number(item?.total_movimentado || 0),
      }))
      .sort((a, b) => b.movimentado - a.movimentado)
      .slice(0, topLimit);
  }, [mostMoved, topLimit]);

  const minStockChartData = useMemo(() => {
    return (minStock || [])
      .map((item) => ({
        name: item?.pdt_nome || "Produto",
        atual: Number(item?.total_estoque || 0),
        minimo: Number(item?.pdt_estoque_minimo || 0),
      }))
      .sort((a, b) => (b.minimo - b.atual) - (a.minimo - a.atual))
      .slice(0, Math.min(topLimit, 10));
  }, [minStock, topLimit]);

  const topStockChartData = useMemo(() => {
    return (products || [])
      .map((p) => ({
        name: p?.pdt_nome || "Produto",
        estoque: Number(p?.pdt_estoque_atual || 0),
      }))
      .sort((a, b) => b.estoque - a.estoque)
      .slice(0, topLimit);
  }, [products, topLimit]);

  const productStatusChartData = useMemo(() => {
    const ativo = productsActiveCount;
    const inativo = productsInactiveCount;
    const total = ativo + inativo;

    if (!total) return [];

    return [
      { name: "Ativos", value: ativo },
      { name: "Inativos", value: inativo },
    ];
  }, [productsActiveCount, productsInactiveCount]);

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar o painel"
        description="Use suas credenciais para buscar os dados da API e destravar o dashboard."
      />
    );
  }

  const failedCards = [
    status.products === "error" ? "Produtos" : null,
    status.stock === "error" ? "Estoque" : null,
    status.moved === "error" ? "Movimentações" : null,
    status.min === "error" ? "Mínimo" : null,
    isAdmin && status.users === "error" ? "Usuários" : null,
  ].filter(Boolean);

  const anyLoading = Object.values(status).some((s) => s === "loading");

  return (
    <div className="app-content">
      <SectionHeader
        title="Painel Principal"
        subtitle="Visão geral do estoque, movimentações e alertas."
      />

      {failedCards.length ? (
        <div className="dashboard-callout" style={{ marginBottom: 16 }}>
          <div>
            <strong>Alguns dados não puderam ser carregados</strong>
            <p style={{ marginTop: 4 }}>
              Cards afetados: {failedCards.join(", ")}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.location.reload()}
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            Recarregar
          </button>
        </div>
      ) : null}

      <section className="stats-grid">
        <DashboardStatCard
          title="Produtos ativos"
          value={formatNumber(productsActiveCount)}
          meta={`De ${formatNumber(products.length)} cadastrados`}
          loading={anyLoading && status.products === "loading"}
        />
        <DashboardStatCard
          title="Itens em estoque"
          value={formatNumber(estoqueTotal)}
          meta={`${formatNumber(productsWithStockCount)} produtos com saldo`}
          loading={anyLoading && status.stock === "loading"}
        />
        <DashboardStatCard
          title="Alertas de minimo"
          value={formatNumber(minStock.length)}
          meta="Produtos abaixo do minimo"
          loading={anyLoading && status.min === "loading"}
        />
        <DashboardStatCard
          title="Usuários"
          value={formatNumber(isAdmin ? users.length : 1)}
          meta={isAdmin ? "Equipe ativa" : "Perfil ativo"}
          loading={isAdmin ? anyLoading && status.users === "loading" : false}
        />

        <DashboardStatCard
          title="Produtos sem saldo"
          value={formatNumber(productsWithoutStockCount)}
          meta="Ajuda a identificar rupturas"
          loading={anyLoading && status.products === "loading"}
        />
      </section>

      <div className="stats-grid" style={{ alignItems: "stretch" }}>
        <div className="card">
          <ChartCardHeader
            title="Movimentações (Top)"
            subtitle="Produtos com maior volume de entradas e saídas"
            actions={
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate("/entradas")}
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                >
                  Ver entradas
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate("/saidas")}
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                >
                  Ver saídas
                </button>
                {[5, 8, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={
                      topLimit === n ? "btn btn-primary" : "btn btn-outline"
                    }
                    onClick={() => setTopLimit(n)}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            }
          />

          {status.moved === "loading" ? (
            <div style={{ height: 300, display: "grid", gap: 10, alignContent: "center" }}>
              <div className="skeleton" style={{ height: 16, width: "50%" }} />
              <div className="skeleton" style={{ height: 12, width: "70%" }} />
              <div className="skeleton" style={{ height: 220, width: "100%", borderRadius: 16 }} />
            </div>
          ) : status.moved === "error" ? (
            <div className="dashboard-error">
              <strong>Falha ao carregar movimentações</strong>
              <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 13 }}>
                {errors.moved || "Tente recarregar a página."}
              </div>
            </div>
          ) : mostMovedChartData.length ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostMovedChartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={
                      <TruncatedAxisTick
                        angle={-12}
                        textAnchor="end"
                        dy={22}
                        maxLength={16}
                      />
                    }
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                    interval={0}
                    height={70}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend
                    wrapperStyle={{ color: "var(--muted)", fontSize: 12 }}
                  />
                  <Bar
                    dataKey="movimentado"
                    name="Total movimentado"
                    fill="var(--accent)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Sem movimentações"
              description="A API ainda não retornou registros de movimentação."
            />
          )}
        </div>

        <div className="card">
          <ChartCardHeader
            title="Estoque atual (Top)"
            subtitle="Produtos com maior saldo disponível"
            actions={
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/produtos")}
                style={{ padding: "6px 10px", fontSize: 12 }}
              >
                Ver produtos
              </button>
            }
          />

          {status.products === "loading" ? (
            <div style={{ height: 300, display: "grid", gap: 10, alignContent: "center" }}>
              <div className="skeleton" style={{ height: 16, width: "45%" }} />
              <div className="skeleton" style={{ height: 12, width: "65%" }} />
              <div className="skeleton" style={{ height: 220, width: "100%", borderRadius: 16 }} />
            </div>
          ) : status.products === "error" ? (
            <div className="dashboard-error">
              <strong>Falha ao carregar produtos</strong>
              <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 13 }}>
                {errors.products || "Tente recarregar a página."}
              </div>
            </div>
          ) : topStockChartData.length ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStockChartData} layout="vertical" margin={{ left: 30, right: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={<TruncatedAxisTick dy={4} textAnchor="end" maxLength={18} />}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Bar
                    dataKey="estoque"
                    name="Estoque"
                    fill="var(--accent-2)"
                    radius={[0, 10, 10, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Sem dados"
              description="Nenhum produto carregado para montar o gráfico de estoque."
            />
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ alignItems: "stretch", marginTop: 16 }}>
        <div className="card">
          <ChartCardHeader
            title="Alertas de estoque mínimo"
            subtitle="Comparativo do estoque atual"
            actions={
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/estoque")}
                style={{ padding: "6px 10px", fontSize: 12 }}
              >
                Abrir estoque
              </button>
            }
          />

          {status.min === "loading" ? (
            <div style={{ height: 320, display: "grid", gap: 10, alignContent: "center" }}>
              <div className="skeleton" style={{ height: 16, width: "55%" }} />
              <div className="skeleton" style={{ height: 12, width: "75%" }} />
              <div className="skeleton" style={{ height: 240, width: "100%", borderRadius: 16 }} />
            </div>
          ) : status.min === "error" ? (
            <div className="dashboard-error">
              <strong>Falha ao carregar alertas de mínimo</strong>
              <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 13 }}>
                {errors.min || "Tente recarregar a página."}
              </div>
            </div>
          ) : minStockChartData.length ? (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={minStockChartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={
                      <TruncatedAxisTick
                        angle={-12}
                        textAnchor="end"
                        dy={22}
                        maxLength={16}
                      />
                    }
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                    interval={0}
                    height={70}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend
                    wrapperStyle={{ color: "var(--muted)", fontSize: 12 }}
                  />
                  <Bar
                    dataKey="atual"
                    name="Estoque atual"
                    fill="var(--accent-2)"
                    radius={[10, 10, 0, 0]}
                  />
                  <Bar
                    dataKey="minimo"
                    name="Mínimo"
                    fill="var(--accent)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Sem alertas"
              description="Nenhum produto abaixo do mínimo no momento."
            />
          )}
        </div>

        <div className="card">
          <ChartCardHeader
            title="Saúde do catálogo"
            subtitle="Distribuição de produtos ativos e inativos"
          />

          {status.products === "loading" ? (
            <div style={{ height: 320, display: "grid", gap: 10, alignContent: "center" }}>
              <div className="skeleton" style={{ height: 16, width: "40%" }} />
              <div className="skeleton" style={{ height: 12, width: "60%" }} />
              <div className="skeleton" style={{ height: 240, width: "100%", borderRadius: 16 }} />
            </div>
          ) : status.products === "error" ? (
            <div className="dashboard-error">
              <strong>Falha ao carregar produtos</strong>
              <div style={{ marginTop: 6, color: "var(--ink-soft)", fontSize: 13 }}>
                {errors.products || "Tente recarregar a página."}
              </div>
            </div>
          ) : productStatusChartData.length ? (
            <div style={{ height: 320, display: "grid", placeItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ color: "var(--muted)", fontSize: 12 }}
                  />
                  <Pie
                    data={productStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    stroke="var(--bg-elevated)"
                  >
                    {productStatusChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === "Ativos" ? "var(--accent)" : "var(--border-strong)"
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Sem dados"
              description="Não foi possível montar a distribuição de status."
            />
          )}

          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--ink-soft)",
                fontSize: 13,
              }}
            >
              <span>Ativos</span>
              <strong style={{ color: "var(--ink)" }}>
                {formatNumber(productsActiveCount)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--ink-soft)",
                fontSize: 13,
              }}
            >
              <span>Inativos</span>
              <strong style={{ color: "var(--ink)" }}>
                {formatNumber(productsInactiveCount)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;