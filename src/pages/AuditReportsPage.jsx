import { useEffect, useState } from "react";
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import { getAuditReports } from "../services/api";

const AuditReportsPage = () => {
  const { token } = useAuth(); // Recuperar o token da aplicação
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("monthly"); // Estados de seleção (Semanal/Mensal/Anual)

  // Função para carregar os de relatórios auditoria da API do app por período especificado
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditReports(token, filterPeriod);
      setReports(data || []);
    } catch (loadError) {
      setError(loadError.message || "Erro ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  };

  // Carrega listagem inicial na renderização da view desde que tenha token de autenticação e refaz caso de alteração no filtro de período
  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, filterPeriod]);

  // View bloqueada para visualização quando faltar a autenticação
  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar a auditoria e relatórios"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  // Se a requisição de busca estiver pendente exibe componente de Spinner
  if (loading) return <LoadingSpinner />;
  
  // Tratamental de falha para exibir Erro da requisição ao carregar dados
  if (error) return <EmptyState title="Não foi possível carregar" description={error} />;

  // Colunas de apresentação e mapeamento dos registros de histórico 
  const columns = [
    { key: "aud_id", label: "ID" },
    { key: "user_id", label: "Usuário", render: (row) => row.user_nome || row.user_id },
    { key: "aud_acao", label: "Ação realizada" },
    { key: "aud_data",
      label: "Data",
      render: (row) => (row.aud_data ? new Date(row.aud_data).toLocaleDateString("pt-BR") : "-"),
    },
    { key: "aud_time", label: "Hora" },
    { key: "aud_tabela_afetada", label: "Tabela Afetada" },
    { key: "aud_id_evento", label: "ID do Evento" },
  ];

  return (
    <div>
      <SectionHeader 
        title="Relatórios" 
        subtitle="Acompanhe as movimentações no sistema (semanal, mensal, anual)." 
        actions={<button className="btn btn-primary" onClick={() => alert('Exportando...')}>Exportar Relatório</button>}
      />

      {/* Botões de filtro para refazer a listagem e enviar via ?period por Query Params ao Backend  */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={() => setFilterPeriod("weekly")}
          style={{ fontWeight: filterPeriod === "weekly" ? "bold" : "normal" }}
        >
          Semanal
        </button>
        <button 
          onClick={() => setFilterPeriod("monthly")}
          style={{ fontWeight: filterPeriod === "monthly" ? "bold" : "normal" }}
        >
          Mensal
        </button>
        <button 
          onClick={() => setFilterPeriod("annual")}
          style={{ fontWeight: filterPeriod === "annual" ? "bold" : "normal" }}
        >
          Anual
        </button>
      </div>

      <DataTable columns={columns} rows={reports} rowKey="aud_id" />
    </div>
  );
};

export default AuditReportsPage;
