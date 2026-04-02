import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import OutputModal from "../components/common/OutputModal";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber } from "../utils/format";
import { getOutputs, createOutput } from "../services/api";

const ProductOutputsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOutputs(token);
      setOutputs(Array.isArray(data) ? data : data?.saidas || []);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar saídas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const handleSaveOutput = async (payload) => {
    await createOutput(token, payload);
    setIsModalOpen(false);
    loadData();
  };

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar saídas"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  if (loading && outputs.length === 0) return <LoadingSpinner />;

  if (error && outputs.length === 0) {
    return <EmptyState title="Não foi possível carregar" description={error} />;
  }

  const columns = [
    { key: "sai_id", label: "ID" },
    {
      key: "sai_data",
      label: "Data",
      render: (row) =>
        row.sai_data ? new Date(row.sai_data).toLocaleDateString("pt-BR") : "-",
    },
    {
      key: "sai_hora",
      label: "Horário",
      render: (row) =>
        row.sai_data ? new Date(row.sai_data).toLocaleTimeString("pt-BR") : "-",
    },
    { key: "pdt_nome", label: "Produto" },
    {
      key: "sai_quantidade",
      label: "Quantidade",
      render: (row) => formatNumber(row.sai_quantidade),
    },
    { key: "sai_motivo", label: "Motivo" },
    { key: "sai_destino", label: "Destino" },
  ];

  return (
    <div className="app-content">
      <SectionHeader
        title="Saída de Produtos"
        subtitle="Controle a saída de produtos (venda, descarte, etc)."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Nova Saída
          </button>
        }
      />
      <DataTable columns={columns} rows={outputs} rowKey="sai_id" />

      <OutputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOutput}
        token={token}
      />
    </div>
  );
};

export default ProductOutputsPage;
