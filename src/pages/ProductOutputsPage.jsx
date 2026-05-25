import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import OutputModal from "../components/common/OutputModal";
import AlertDialog from "../components/common/AlertDialog";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber } from "../utils/format";
import { getOutputs, createOutput } from "../services/api";
import { notifyStockMovement } from "../utils/stockEvents";
import { matchesSearch } from "../utils/search";

const ProductOutputsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });
  const [saveConfirmState, setSaveConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    payload: null,
  });

  const loadData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [loadData, token]);

  const handleSaveOutput = (payload) => {
    setSaveConfirmState({
      open: true,
      title: "Registrar saida",
      message: "Deseja registrar esta nova saida?",
      payload,
    });
  };

  const handleConfirmSaveOutput = async () => {
    const payload = saveConfirmState.payload;
    if (!payload) {
      setSaveConfirmState({ open: false, title: "", message: "", payload: null });
      return;
    }

    try {
      const produtos = Array.isArray(payload?.produtos)
        ? payload.produtos.filter((item) => item?.pdt_id && item?.quantidade)
        : [];

      if (produtos.length > 0) {
        for (const item of produtos) {
          const lotes = Array.isArray(item.lotes_selecionados)
            ? item.lotes_selecionados
            : [];

          // Agrupa lotes por loc_id e envia uma requisição por localização
          const grupos = new Map();
          for (const lote of lotes) {
            const loc = lote.loc_id || null;
            if (!grupos.has(loc)) grupos.set(loc, []);
            grupos.get(loc).push(lote);
          }

          if (grupos.size === 0) {
            // sem lotes detalhados: envia como antes (o backend pode validar)
            await createOutput(token, {
              pdt_id: item.pdt_id,
              lcl_qtde: item.quantidade,
              lcl_destino: payload.lcl_destino,
              lcl_tipo: payload.lcl_tipo,
              lcl_justificativa: payload.lcl_justificativa,
              lotes_selecionados: [],
            });
            continue;
          }

          for (const [locId, grupoLotes] of grupos.entries()) {
            const quantidadeTotal = grupoLotes.reduce(
              (s, l) => s + Number(l.quantidade || 0),
              0,
            );

            await createOutput(token, {
              pdt_id: item.pdt_id,
              lcl_qtde: quantidadeTotal,
              lcl_destino: payload.lcl_destino,
              lcl_tipo: payload.lcl_tipo,
              lcl_justificativa: payload.lcl_justificativa,
              lotes_selecionados: grupoLotes,
              // opcionalmente enviar loc_id raiz se necessário pelo backend
              loc_id: locId,
            });
          }
        }
      } else {
        await createOutput(token, payload);
      }

      notifyStockMovement();
      setIsModalOpen(false);
      loadData();
      setAlertState({
        open: true,
        title: "Saida registrada",
        message: "Saida registrada com sucesso.",
        tone: "success",
      });
    } catch (err) {
      setAlertState({
        open: true,
        title: "Erro ao registrar saida",
        message: err?.message || "Erro ao registrar saida de produtos.",
        tone: "error",
      });
    } finally {
      setSaveConfirmState({ open: false, title: "", message: "", payload: null });
    }
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

  const resetAlert = () =>
    setAlertState({ open: false, title: "", message: "", tone: "info" });

  const columns = [
    { key: "sai_id", label: "ID", sortable: true, sortType: "number" },
    {
      key: "sai_data",
      label: "Data",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) =>
        row.sai_data ? new Date(row.sai_data).getTime() : 0,
      render: (row) =>
        row.sai_data ? new Date(row.sai_data).toLocaleDateString("pt-BR") : "-",
    },
    {
      key: "sai_hora",
      label: "Horário",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) =>
        row.sai_data ? new Date(row.sai_data).getTime() : 0,
      render: (row) =>
        row.sai_data ? new Date(row.sai_data).toLocaleTimeString("pt-BR") : "-",
    },
    { key: "pdt_nome", label: "Produto", sortable: true },
    {
      key: "sai_quantidade",
      label: "Quantidade",
      sortable: true,
      sortType: "number",
      render: (row) => formatNumber(row.sai_quantidade),
    },
    { key: "sai_motivo", label: "Motivo", sortable: true },
    { key: "sai_destino", label: "Destino", sortable: true },
  ];

  return (
    <div className="app-content">
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
          title="Saída de Produtos"
          subtitle="Controle a saída de produtos (venda, descarte, etc)."
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar produto, motivo ou destino..."
          actions={
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              Nova Saída
            </button>
          }
        />
      </div>
      <DataTable columns={columns} rows={filteredOutputs} rowKey="sai_id" />

      <OutputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOutput}
        token={token}
      />

      <AlertDialog
        isOpen={alertState.open}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        onClose={resetAlert}
      />

      <ConfirmDialog
        isOpen={saveConfirmState.open}
        title={saveConfirmState.title}
        message={saveConfirmState.message}
        tone="warning"
        confirmLabel="Registrar"
        onConfirm={handleConfirmSaveOutput}
        onCancel={() =>
          setSaveConfirmState({ open: false, title: "", message: "", payload: null })
        }
      />
    </div>
  );
};

export default ProductOutputsPage;
