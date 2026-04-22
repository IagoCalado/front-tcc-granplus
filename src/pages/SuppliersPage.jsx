import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import SupplierModal from "../components/common/SupplierModal";
import { useAuth } from "../contexts/AuthContext";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/api";

const SuppliersPage = () => {
  const { token } = useAuth(); // Recuperar o token da sessão do usuário
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  // Função para carregar os dados de fornecedores usando o serviço de API
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSuppliers(token);
      setSuppliers(data || []);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  // Efeito colateral para carregar a página inicialmente caso o usuário esteja autenticado
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const handleOpenModal = (supplier = null) => {
    setCurrentSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (formData, id) => {
    try {
      if (id) {
        await updateSupplier(token, id, formData);
      } else {
        await createSupplier(token, formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert("Erro ao salvar fornecedor: " + error.message);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm("Certeza que deseja excluir este fornecedor?")) {
      try {
        await deleteSupplier(token, id);
        loadData();
      } catch (error) {
        alert("Erro ao excluir fornecedor: " + error.message);
      }
    }
  };

  // Se não existir token, exige o login antes de mostrar os dados da tabela
  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar fornecedores"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  // Se a requisição de busca estiver rodando, exibe o componente de carregamento
  if (loading) return <LoadingSpinner />;

  // Se a requisição apresentar falha, reflete na interface via EmptyState com a descrição do Erro
  if (error)
    return <EmptyState title="Não foi possível carregar" description={error} />;

  // Colunas contendo as chaves para match correspondente de chaves vindas da API de fornecedores
  const columns = [
    { key: "fncd_nome", label: "Nome do Fornecedor" },
    { key: "fncd_documento", label: "CPF/CNPJ" },
    {
      key: "fncd_logradouro",
      label: "Nome da Rua",
      render: (row) => row.fncd_logradouro || "-",
    },
    {
      key: "fncd_endereco_formatado",
      label: "Endereço",
      render: (row) => {
        const endereco = [
          row.fncd_logradouro,
          row.fncd_numero,
          row.fncd_complemento,
          row.fncd_bairro,
          row.fncd_cidade,
          row.fncd_estado,
          row.fncd_cep,
        ]
          .filter(Boolean)
          .map((item) => String(item).trim())
          .filter(Boolean)
          .join(", ");

        return endereco || "-";
      },
    },
    { key: "fncd_tel", label: "Telefone" },
    { key: "fncd_email", label: "E-mail" },
    {
      key: "actions",
      label: "Ações",
      render: (row) => (
        <div className="table-actions">
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => handleOpenModal(row)}
          >
            Editar
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => handleDeleteSupplier(row.fncd_id)}
            style={{ color: "#ef4444", borderColor: "#fee2e2" }}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="app-content">
      <SectionHeader
        title="Fornecedores"
        subtitle="Gerencie os fornecedores de produtos e serviços."
        actions={
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Novo Fornecedor
          </button>
        }
      />
      <DataTable columns={columns} rows={suppliers} rowKey="fncd_id" />

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={currentSupplier}
      />
    </div>
  );
};

export default SuppliersPage;