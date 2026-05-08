import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
import { matchesSearch } from "../utils/search";

const SuppliersPage = () => {
  const { token } = useAuth(); // Recuperar o token da sessão do usuário
  const { searchTerm = "", setSearchTerm } = useOutletContext() || {};
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");
  const [selectedAddressSupplier, setSelectedAddressSupplier] = useState(null);

  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

  const formatCpfCnpj = (value) => {
    const digits = normalizeDigits(value).slice(0, 14);
    if (!digits) return "-";

    if (digits.length <= 11) {
      return digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    }

    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(
        /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/,
        "$1.$2.$3/$4-$5",
      );
  };

  const formatPhone = (value) => {
    const digits = normalizeDigits(value).slice(0, 11);
    if (!digits) return "-";
    if (digits.length < 3) return `(${digits}`;

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (digits.length <= 10) {
      const p1 = rest.slice(0, 4);
      const p2 = rest.slice(4, 8);
      return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
    }

    const p1 = rest.slice(0, 5);
    const p2 = rest.slice(5, 9);
    return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
  };

  const formatSupplierAddress = (supplier) => {
    if (!supplier) return "-";
    if (supplier.fncd_endereco) return supplier.fncd_endereco;

    const logradouro = supplier.fncd_logradouro || "";
    const numero = supplier.fncd_numero || "";
    const complemento = supplier.fncd_complemento || "";
    const bairro = supplier.fncd_bairro || "";
    const cidade = supplier.fncd_cidade || "";
    const estado = supplier.fncd_estado || "";
    const cep = supplier.fncd_cep || "";

    const parteRua = [logradouro, numero].filter(Boolean).join(", ");
    const parteComp = complemento ? ` - ${complemento}` : "";
    const parteCidade = [cidade, estado].filter(Boolean).join("/");
    const parteBairroCidade = [bairro, parteCidade].filter(Boolean).join(" - ");
    const parteCep = cep ? `CEP: ${cep}` : "";

    const endereco = [parteRua + parteComp, parteBairroCidade, parteCep]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
      .join(" - ");

    return endereco || "-";
  };

  const formatCep = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (!digits) return "";
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const getAddressLines = (supplier) => {
    if (!supplier) return { title: "", lines: [], meta: [] };

    const logradouro = supplier.fncd_logradouro || "";
    const numero = supplier.fncd_numero || "";
    const complemento = supplier.fncd_complemento || "";
    const bairro = supplier.fncd_bairro || "";
    const cidade = supplier.fncd_cidade || "";
    const estado = supplier.fncd_estado || "";
    const cep = formatCep(supplier.fncd_cep || "");

    const linhaRua = [logradouro, numero].filter(Boolean).join(", ").trim();
    const linhaComp = complemento ? complemento.trim() : "";
    const linhaBairro = bairro ? bairro.trim() : "";
    const linhaCidade = [cidade, estado].filter(Boolean).join("/").trim();

    const lines = [linhaRua, linhaComp, linhaBairro, linhaCidade].filter(
      Boolean,
    );
    const meta = [cep ? `CEP ${cep}` : ""].filter(Boolean);

    if (lines.length === 0 && supplier.fncd_endereco) {
      return {
        title: supplier.fncd_nome || "Fornecedor",
        lines: [String(supplier.fncd_endereco)],
        meta: [],
      };
    }

    return {
      title: supplier.fncd_nome || "Fornecedor",
      lines,
      meta,
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  // Função para carregar os dados de fornecedores usando o serviço de API
  const loadData = useCallback(async () => {
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
  }, [token]);

  // Efeito colateral para carregar a página inicialmente caso o usuário esteja autenticado
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, loadData]);

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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((row) =>
      matchesSearch(
        [
          row?.fncd_nome,
          row?.fncd_documento,
          row?.fncd_email,
          row?.fncd_tel,
          row?.fncd_endereco,
          row?.fncd_logradouro,
          row?.fncd_cep,
          row?.fncd_cidade,
          row?.fncd_estado,
        ],
        searchTerm,
      ),
    );
  }, [suppliers, searchTerm]);

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
    {
      key: "fncd_documento",
      label: "CPF/CNPJ",
      render: (row) => formatCpfCnpj(row.fncd_documento),
    },
    {
      key: "fncd_endereco",
      label: "Endereço",
      render: (row) => {
        const hasSomeAddress =
          row?.fncd_endereco ||
          row?.fncd_logradouro ||
          row?.fncd_cep ||
          row?.fncd_cidade ||
          row?.fncd_estado;

        const streetLabel =
          row?.fncd_logradouro ||
          (row?.fncd_endereco
            ? String(row.fncd_endereco).split(",")[0]
            : "");

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              title={formatSupplierAddress(row)}
              style={{
                maxWidth: "280px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: hasSomeAddress ? "inherit" : "var(--muted)",
              }}
            >
              {streetLabel || (hasSomeAddress ? "Endereço cadastrado" : "Sem endereço")}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSelectedAddressSupplier(row)}
              disabled={!hasSomeAddress}
              style={{ padding: "6px 10px", fontSize: "12px" }}
            >
              Endereço completo
            </button>
          </div>
        );
      },
    },
    {
      key: "fncd_tel",
      label: "Telefone",
      render: (row) => formatPhone(row.fncd_tel),
    },
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
            className="btn btn-ghost btn-danger"
            type="button"
            onClick={() => handleDeleteSupplier(row.fncd_id)}
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
          title="Fornecedores"
          subtitle="Gerencie os fornecedores de produtos e serviços."
          onSearch={setSearchTerm}
          searchPlaceholder="Buscar por nome ou documento..."
          actions={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Novo Fornecedor
            </button>
          }
        />
      </div>
      <DataTable columns={columns} rows={filteredSuppliers} rowKey="fncd_id" />

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={currentSupplier}
      />

      {selectedAddressSupplier && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAddressSupplier(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--overlay-bg, rgba(0,0,0,0.4))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-elevated)",
              padding: "20px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "520px",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {(() => {
              const { title, lines} = getAddressLines(
                selectedAddressSupplier,
              );

              const supplier = selectedAddressSupplier;
              const enderecoCompleto = formatSupplierAddress(supplier);
              const mapsQuery = encodeURIComponent(
                enderecoCompleto && enderecoCompleto !== "-"
                  ? enderecoCompleto
                  : `${supplier?.fncd_logradouro || ""} ${supplier?.fncd_numero || ""} ${supplier?.fncd_cidade || ""} ${supplier?.fncd_estado || ""}`.trim(),
              );
              const mapsUrl = mapsQuery
                ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
                : null;

              const fieldRowStyle = {
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-soft)",
              };

              const labelStyle = {
                fontSize: "11px",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              };

              const valueStyle = {
                fontSize: "14px",
                color: "var(--ink)",
                fontWeight: 600,
                lineHeight: 1.25,
                wordBreak: "break-word",
              };

              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        Endereço do fornecedor
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {title}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setSelectedAddressSupplier(null)}
                      style={{ padding: "6px 10px" }}
                    >
                      Fechar
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        background: "var(--bg-soft)",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Resumo
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--ink)",
                          marginTop: "4px",
                          lineHeight: 1.3,
                        }}
                      >
                        {enderecoCompleto && enderecoCompleto !== "-"
                          ? enderecoCompleto
                          : "Endereço não informado."}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          onClick={async () => {
                            try {
                              const textToCopy =
                                enderecoCompleto && enderecoCompleto !== "-"
                                  ? enderecoCompleto
                                  : lines.join("\n");

                              await navigator.clipboard.writeText(textToCopy);
                              alert("Endereço copiado!");
                            } catch {
                              alert(
                                "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.",
                              );
                            }
                          }}
                        >
                          Copiar
                        </button>

                        {mapsUrl ? (
                          <a
                            className="btn btn-outline"
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                          >
                            Abrir no Maps
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                        Detalhes do endereço
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Rua / Logradouro</div>
                          <div style={valueStyle}>
                            {supplier?.fncd_logradouro ||
                              (supplier?.fncd_endereco
                                ? String(supplier.fncd_endereco).split(",")[0]
                                : "-")}
                          </div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Número</div>
                          <div style={valueStyle}>{supplier?.fncd_numero || "-"}</div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Complemento</div>
                          <div style={valueStyle}>
                            {supplier?.fncd_complemento || "Não informado"}
                          </div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Bairro</div>
                          <div style={valueStyle}>{supplier?.fncd_bairro || "-"}</div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Cidade / UF</div>
                          <div style={valueStyle}>
                            {[supplier?.fncd_cidade, supplier?.fncd_estado]
                              .filter(Boolean)
                              .join("/") || "-"}
                          </div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>CEP</div>
                          <div style={valueStyle}>
                            {supplier?.fncd_cep ? formatCep(supplier.fncd_cep) : "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                        Contato do fornecedor
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                        }}
                      >
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>CPF/CNPJ</div>
                          <div style={valueStyle}>
                            {formatCpfCnpj(supplier?.fncd_documento)}
                          </div>
                        </div>
                        <div style={fieldRowStyle}>
                          <div style={labelStyle}>Telefone</div>
                          <div style={valueStyle}>{formatPhone(supplier?.fncd_tel)}</div>
                        </div>
                        <div style={{ ...fieldRowStyle, gridColumn: "1 / -1" }}>
                          <div style={labelStyle}>E-mail</div>
                          <div style={valueStyle}>{supplier?.fncd_email || "Não informado"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;