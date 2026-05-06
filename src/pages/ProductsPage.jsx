import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";
import ProductModal from "../components/common/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/api";
import { formatNumber } from "../utils/format";

const ProductsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts(token);
      setProducts(data || []);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const handleOpenModal = (product = null) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData, id) => {
    try {
      if (id) {
        await updateProduct(token, id, formData);
      } else {
        await createProduct(token, formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o produto ${product.pdt_nome}?`,
    );

    if (!confirmDelete) return;

    try {
      await deleteProduct(token, product.pdt_id);
      await loadData();
    } catch (deleteError) {
      alert("Erro ao excluir produto: " + deleteError.message);
    }
  };

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar produtos"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <EmptyState title="Nao foi possivel carregar" description={error} />;
  }

  const columns = [
    { key: "pdt_nome", label: "Produto" },
    { key: "pdt_codigo", label: "Codigo" },
    {
      key: "pdt_estoque_atual",
      label: "Estoque",
      render: (row) => formatNumber(row.pdt_estoque_atual),
    },
    {
      key: "pdt_estoque_minimo",
      label: "Minimo",
      render: (row) => formatNumber(row.pdt_estoque_minimo),
    },
    { key: "cat_id", label: "Categoria" },
    { key: "unid_med_id", label: "Unidade" },
    {
      key: "pdt_ativo",
      label: "Status",
      render: (row) => (
        <StatusPill
          label={row.pdt_ativo ? "Ativo" : "Inativo"}
          tone={row.pdt_ativo ? "success" : "neutral"}
        />
      ),
    },
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
            className="btn btn-ghost btn-danger"
            type="button"
            onClick={() => handleDeleteProduct(row)}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  const filteredProducts = products.filter((product) =>
    (product.pdt_nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.pdt_codigo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-content">
      <SectionHeader
        title="Produtos"
        subtitle="Controle total do catalogo ativo"
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por produto/código..."
        actions={
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            Novo produto
          </button>
        }
      />
      <DataTable columns={columns} rows={filteredProducts} rowKey="pdt_id" />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={currentProduct}
      />
    </div>
  );
};

export default ProductsPage;
