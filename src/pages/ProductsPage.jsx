import { useCallback, useEffect, useMemo, useState } from "react";
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

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const loadData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [loadData, token]);

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

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      const searchableFields = [
        product?.pdt_nome,
        product?.pdt_codigo,
        product?.cat_id,
        product?.unid_med_id,
        product?.pdt_estoque_atual,
        product?.pdt_estoque_minimo,
        product?.pdt_ativo ? "ativo" : "inativo",
      ];

      return searchableFields.some((field) =>
        normalizeText(field).includes(normalizedSearch),
      );
    });
  }, [products, searchTerm]);

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

  const categoriaMap = {
    1: 'Limpeza',
    2: 'Escritório',
    3: 'Informática',
    4: 'Alimentos'
  };

  const unidadeMap = {
    1: 'UN',
    2: 'CX',
    3: 'KG',
    4: 'LT'
  };

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
    { 
      key: "cat_id", 
      label: "Categoria",
      render: (row) => categoriaMap[row.cat_id] || row.cat_id 
    },
    { 
      key: "unid_med_id", 
      label: "Unidade",
      render: (row) => unidadeMap[row.unid_med_id] || row.unid_med_id 
    },
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
      </div>
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
