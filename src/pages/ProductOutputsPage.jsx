import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import OutputModal from "../components/common/OutputModal";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber } from "../utils/format";
import { getOutputs, createOutput } from "../services/api";
import { notifyStockMovement } from "../utils/stockEvents";
import { matchesSearch } from "../utils/search";

const ProductOutputsPage = () => {
  const { token } = useAuth();
  const { searchTerm = "" } = useOutletContext() || {};
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
    notifyStockMovement();
    setIsModalOpen(false);
    loadData();
  };

  const filteredOutputs = useMemo(() => {
    return outputs.filter((row) =>
      matchesSearch(
        [
          row?.sai_id,
          row?.sai_data,
          row?.pdt_nome,
          row?.sai_quantidade,
          row?.sai_motivo,
          row?.sai_destino,
        ],
        searchTerm,
      ),
    );
  }, [outputs, searchTerm]);

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

  const hasSearchTerm = Boolean(String(searchTerm || "").trim());

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
        subtitle={
          hasSearchTerm
            ? `${filteredOutputs.length} resultado(s) para "${searchTerm}"`
            : "Controle a saída de produtos (venda, descarte, etc)."
        }
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Nova Saída
          </button>
        }
      />
        {filteredOutputs.length ? (
          <DataTable columns={columns} rows={filteredOutputs} rowKey="sai_id" />
        ) : (
          <EmptyState
            title={hasSearchTerm ? "Nenhuma saída encontrada" : "Nenhuma saída cadastrada"}
            description={
              hasSearchTerm
                ? "Tente um termo diferente para localizar a saída desejada."
                : "Cadastre a primeira saída para começar a acompanhar o movimento."
            }
          />
        )}

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
