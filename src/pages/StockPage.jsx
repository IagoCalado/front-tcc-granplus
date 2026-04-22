import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import ProductModal from "../components/common/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import { createProduct, getStock } from "../services/api";
import { formatNumber } from "../utils/format";

const StockPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState([]);
  const [error, setError] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadData();
  }, [token]);

  const handleSaveProduct = async (payload) => {
    try {
      await createProduct(token, payload);
      setIsProductModalOpen(false);
      await loadData();
    } catch (err) {
      alert("Erro ao cadastrar produto: " + err.message);
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <EmptyState title="Nao foi possivel carregar" description={error} />
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
    <div className="app-content">
      <SectionHeader
        title="Estoque"
        subtitle="Acompanhe niveis atuais e disponibilidade"
        actions={
          <button className="btn btn-primary" onClick={() => setIsProductModalOpen(true)}>
            Adicionar produto
          </button>
        }
      />
      <DataTable columns={columns} rows={stock} rowKey="pdt_id" />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default StockPage;
