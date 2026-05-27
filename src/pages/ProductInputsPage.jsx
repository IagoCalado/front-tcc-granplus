import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import InputModal from "../components/common/InputModal";
import AlertDialog from "../components/common/AlertDialog";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber } from "../utils/format";
import { notifyStockMovement } from "../utils/stockEvents";
import { matchesSearch } from "../utils/search";
import {
  getInputs,
  createInput,
  updateInput,
  deleteInput,
} from "../services/api";

const ProductInputsPage = () => {
  const { token } = useAuth(); // Recupera o token do usuário para autorizar a requisição
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Adicionado para suportar modo de edição (mesmo que o backend ainda precise ser implementado para edição/deleção de entradas)
  const [currentInput, setCurrentInput] = useState(null);
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    targetId: null,
  });
  const [saveConfirmState, setSaveConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    payload: null,
    targetId: null,
  });

  // Função para buscar as entradas de produtos já cadastradas com seus detalhes em junção à tabela de fornecedores
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInputs(token);
      setInputs(data || []);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar entradas");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Previne carregamento caso não haja token ainda, efetuando o get inicial se tiver token
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [loadData, token]);

  const handleOpenModal = (input = null) => {
    setCurrentInput(input);
    setIsModalOpen(true);
  };

  const handleSaveInput = (payload) => {
    const targetId = currentInput?.ent_id || null;
    setSaveConfirmState({
      open: true,
      title: targetId ? "Deseja salvar as alterações desta entrada ?" : "Deseja registrar esta nova entrada ?",
      // message: targetId
      //   ? "Deseja salvar as alterações desta entrada?"
      //   : "Deseja criar esta nova entrada ?",
      payload,
      targetId,
    });
  };

  const handleConfirmSaveInput = async () => {
    const payload = saveConfirmState.payload;
    if (!payload) {
      setSaveConfirmState({
        open: false,
        title: "",
        message: "",
        payload: null,
        targetId: null,
      });
      return;
    }

    try {
      if (saveConfirmState.targetId) {
        await updateInput(token, saveConfirmState.targetId, payload);
      } else {
        await createInput(token, payload);
      }
      notifyStockMovement();
      setIsModalOpen(false);
      loadData();
      setAlertState({
        open: true,
        title: saveConfirmState.targetId ? "Entrada atualizada com sucesso." : "Entrada registrada com sucesso.",
        tone: "success",
      });
    } catch (err) {
      setAlertState({
        open: true,
        title: "Erro ao salvar entrada de produtos.",
        tone: "error",
      });
      console.error(err);
    } finally {
      setSaveConfirmState({
        open: false,
        title: "",
        message: "",
        payload: null,
        targetId: null,
      });
    }
  };

  const handleDeleteRequest = (id) => {
    setConfirmState({
      open: true,
      title: "Você tem certeza que deseja excluir ?",
      message: "AVISO: Não será possível reverter esta ação.",
      targetId: id,
    });
  };  

  const handleConfirmDelete = async () => {
    const targetId = confirmState.targetId;
    if (!targetId) {
      setConfirmState({ open: false, title: "", message: "", targetId: null });
      return;
    }

    setConfirmState((prev) => ({ ...prev, open: false }));
    try {
      await deleteInput(token, targetId);
      setAlertState({
        open: true,
        title: "Entrada excluida com sucesso.",
        tone: "success",
      });
      loadData();
    } catch (err) {
      setAlertState({
        open: true,
        title: "Erro ao apagar" + err.message,
        tone: "error",
      });
    } finally {
      setConfirmState({ open: false, title: "", message: "", targetId: null });
    }
  };

  const filteredInputs = useMemo(() => {
    return inputs.filter((row) =>
      matchesSearch(
        [
          row?.ent_id,
          row?.ent_data,
          row?.ent_data_compra,
          row?.pdt_nome,
          row?.forn_nome,
          row?.ent_quantidade,
          row?.ep_quantidade,
          row?.ent_valor_compra,
        ],
        searchTerm,
      ),
    );
  }, [inputs, searchTerm]);

  // View exibida se usuário não estiver no escopo seguro da aplicação com JWT válido
  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar entradas"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error)
    return <EmptyState title="Não foi possível carregar" description={error} />;

  

  // Colunas contendo o map das chaves do endpoint de Entradas com renderizadores personalizados para valores/moedas/data
  const columns = [
    { key: "ent_id", label: "ID", sortable: true, sortType: "number" },
    {
      key: "ent_data",
      label: "Data",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) => {
        const dataCompleta = row.ent_data_compra || row.ent_data;
        return dataCompleta ? new Date(dataCompleta).getTime() : 0;
      },
      render: (row) => {
        const dataCompleta = row.ent_data_compra || row.ent_data;
        if (!dataCompleta) return "-";
        return new Date(dataCompleta).toLocaleDateString("pt-BR");
      },
    },
    {
      key: "ent_hora",
      label: "Horário",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) => {
        const dataCompleta = row.ent_data_compra || row.ent_data;
        return dataCompleta ? new Date(dataCompleta).getTime() : 0;
      },
      render: (row) => {
        const dataCompleta = row.ent_data_compra || row.ent_data;
        if (!dataCompleta) return "-";

        // Retorna só a hora e minuto (ex: 14:30)
        return new Date(dataCompleta).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    { key: "pdt_nome", label: "Produto", sortable: true },
    {
      key: "forn_nome",
      label: "Fornecedor",
      sortable: true,
      sortAccessor: (row) => row.forn_nome || "N/D",
      render: (row) => row.forn_nome || "N/D",
    },
    {
      key: "ent_quantidade",
      label: "Quantidade",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) => Number(row.ent_quantidade || row.ep_quantidade || 0),
      render: (row) => formatNumber(row.ent_quantidade || row.ep_quantidade),
    },
    {
      key: "ent_valor_compra",
      label: "Valor",
      sortable: true,
      sortType: "number",
      render: (row) => `R$ ${formatNumber(row.ent_valor_compra || 0)}`,
    },
    {
      key: "actions",
      label: "Ações",
      render: (row) => (
        <div className="table-actions" style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => handleOpenModal(row)}
          >
            Editar
          </button>
          <button
            className="btn btn-ghost btn-danger"
            type="button"
            onClick={() => handleDeleteRequest(row.ent_id)}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  const resetAlert = () =>
    setAlertState({ open: false, title: "", message: "", tone: "info" });
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
          title="Entrada de Produtos"
          subtitle="Controle as entradas de estoque (compras/recebimentos)."
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar por produto/fornecedor..."
          actions={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Nova Entrada
            </button>
          }
        />
      </div>
      <DataTable columns={columns} rows={filteredInputs} />

      <InputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInput}
        token={token}
        inputData={currentInput} // Passamos o modal atual
      />

      <AlertDialog
        isOpen={alertState.open}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        onClose={resetAlert}
      />

      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        tone="danger"
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setConfirmState({ open: false, title: "", message: "", targetId: null })
        }
      />

      <ConfirmDialog
        isOpen={saveConfirmState.open}
        title={saveConfirmState.title}
        message={saveConfirmState.message}
        tone="warning"
        confirmLabel={saveConfirmState.targetId ? "Atualizar" : "Registrar"}
        onConfirm={handleConfirmSaveInput}
        onCancel={() =>
          setSaveConfirmState({
            open: false,
            title: "",
            message: "",
            payload: null,
            targetId: null,
          })
        }
      />
    </div>
  );
};

export default ProductInputsPage;
