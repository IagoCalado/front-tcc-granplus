import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import BarList from "../components/charts/BarList";
import { useAuth } from "../contexts/AuthContext";
import {
  getMostMovedProducts,
  getMinimumStock,
  getProducts,
  getStock,
  getUsers,
} from "../services/api";
import { formatNumber } from "../utils/format";

const DashboardPage = () => {
  const { token, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [users, setUsers] = useState([]);
  const [mostMoved, setMostMoved] = useState([]);
  const [minStock, setMinStock] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [productsData, stockData, movedData, minData] =
          await Promise.all([
            getProducts(token),
            getStock(token),
            getMostMovedProducts(token),
            getMinimumStock(token),
          ]);

        setProducts(productsData || []);
        setStock(stockData || []);
        setMostMoved(movedData || []);
        setMinStock(minData || []);

        if (isAdmin) {
          const usersData = await getUsers(token);
          setUsers(usersData?.usuarios || []);
        }
      } catch (loadError) {
        setError(loadError.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isAdmin]);

  const estoqueTotal = useMemo(
    () =>
      stock.reduce((total, item) => total + Number(item.estoque_atual || 0), 0),
    [stock]
  );

  const topMovements = useMemo(
    () =>
      mostMoved.slice(0, 5).map((item) => ({
        label: item.pdt_nome,
        value: Number(item.total_movimentado || 0),
      })),
    [mostMoved]
  );

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar o painel"
        description="Use suas credenciais para buscar os dados da API e destravar o dashboard."
      />
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <EmptyState
        title="Nao foi possivel carregar"
        description={error}
      />
    );
  }

  return (
    <div className="app-content">
      <SectionHeader
        title="Painel Principal"
        subtitle="Resumo estrategico com indicadores criticos"
      />

      <section className="stats-grid">
        <StatCard
          title="Produtos ativos"
          value={formatNumber(products.length)}
          meta="Catalogo atualizado"
        />
        <StatCard
          title="Itens em estoque"
          value={formatNumber(estoqueTotal)}
          meta="Soma total em unidades"
        />
        <StatCard
          title="Alertas de minimo"
          value={formatNumber(minStock.length)}
          meta="Produtos abaixo do minimo"
        />
        <StatCard
          title="Usuários"
          value={formatNumber(isAdmin ? users.length : 1)}
          meta={isAdmin ? "Equipe ativa" : "Perfil ativo"}
        />
      </section>

      <div className="stats-grid">
        <div className="card">
          <SectionHeader
            title="Produtos mais movimentados"
            subtitle="Movimentacoes de entrada e saida"
          />
          {topMovements.length ? (
            <BarList data={topMovements} />
          ) : (
            <EmptyState
              title="Sem movimentacoes"
              description="A API ainda nao retornou registros de movimentacao."
            />
          )}
        </div>
        <div className="card">
          <SectionHeader
            title="Estoque minimo"
            subtitle="Itens abaixo do estoque minimo"
          />
          {minStock.length ? (
            <div className="bar-list">
              {minStock.slice(0, 6).map((item) => (
                <div className="bar-item" key={item.pdt_id}>
                  <div className="bar-label">{item.pdt_nome}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: "100%",
                        background: "var(--danger-gradient)",
                      }}
                    />
                  </div>
                  <strong>
                    {formatNumber(item.total_estoque)} / {" "}
                    {formatNumber(item.pdt_estoque_minimo)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem alertas"
              description="Nenhum produto abaixo do minimo no momento."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
