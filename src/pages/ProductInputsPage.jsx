import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import InputModal from "../components/common/InputModal";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber } from "../utils/format";
import { notifyStockMovement } from "../utils/stockEvents";
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

  // Função para buscar as entradas de produtos já cadastradas com seus detalhes em junção à tabela de fornecedores
  const loadData = async () => {
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
  };

  // Previne carregamento caso não haja token ainda, efetuando o get inicial se tiver token
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const handleOpenModal = (input = null) => {
    setCurrentInput(input);
    setIsModalOpen(true);
  };

  const handleSaveInput = async (payload) => {
    try {
      if (currentInput) {
        await updateInput(token, currentInput.ent_id, payload);
      } else {
        await createInput(token, payload);
      }
      notifyStockMovement();
      setIsModalOpen(false);
      loadData(); // Recarrega os dados da tabela
    } catch (err) {
      alert(
        "Erro ao salvar entrada de produtos. Detalhe do banco: " + err.message,
      );
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Você tem certeza que deseja excluir esta entrada? AVISO: Certifique-se de que a API possui a regra de reversão de estoque implementada para deleções.",
      )
    ) {
      try {
        await deleteInput(token, id);
        alert("Entrada apagada com sucesso.");
        loadData();
      } catch (err) {
        alert(
          "Erro ao apagar a entrada. Verifique se as rotas DELETE de Entrada e estorno de estoque existem no Back-End. Mensagem: " +
            err.message,
        );
      }
    }
  };

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
    { key: "ent_id", label: "ID" },
    {
      key: "ent_data",
      label: "Data",
      render: (row) => {
        const dataCompleta = row.ent_data_compra || row.ent_data;
        if (!dataCompleta) return "-";
        return new Date(dataCompleta).toLocaleDateString("pt-BR");
      },
    },
    {
      key: "ent_hora",
      label: "Horário",
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
    { key: "pdt_nome", label: "Produto" },
    {
      key: "forn_nome",
      label: "Fornecedor",
      render: (row) => row.forn_nome || "N/D",
    },
    {
      key: "ent_quantidade",
      label: "Quantidade",
      render: (row) => formatNumber(row.ent_quantidade || row.ep_quantidade),
    },
    {
      key: "ent_valor_compra",
      label: "Valor",
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
            onClick={() => handleDelete(row.ent_id)}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  const filteredInputs = inputs.filter((item) =>
    (item.pdt_nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.forn_nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    </div>
  );
};

export default ProductInputsPage;
