import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import AlertDialog from "../components/common/AlertDialog";
import { useAuth } from "../contexts/AuthContext";
import { matchesSearch } from "../utils/search";

import { getAuditReports, getAuditReportsByDate, getRelatorioDinamico } from "../services/api";

const TableNameLabels = {
  saida_produtos: "Saidas de Produtos",
  entrada: "Entradas",
  entrada_produtos: "Itens de Entrada",
  fornecedor: "Fornecedores",
  produto: "Produtos",
  localizacao: "Localizações",
  localizacao_produtos: "Estoque por Localização",
  usuarios: "Usuários",
  auditoria: "Auditoria",
};

const formatTableName = (tableName) => {
  if (!tableName) return "-";

  if (TableNameLabels[tableName]) {
    return TableNameLabels[tableName];
  }

  return String(tableName)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

// Função para formatar datas no formato brasileiro (dd/mm/yyyy)
const formatDataPDF = (dataString) => {
  if (!dataString) return '-';
  return String(dataString).slice(0, 10).split('-').reverse().join('/');
};

const AuditReportsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("monthly"); 

  const [isModalAberto, setIsModalAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState("geral");
  const [toastAviso, setToastAviso] = useState("");
  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    message: "",
    tone: "error",
  });

  const loadData = useCallback(async () => {
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
  }, [filterPeriod, token]);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [loadData, token]);

  const handleGerarPDF = async (e) => {
    e.preventDefault();
    try {
      const dados = await getRelatorioDinamico(token, tipoRelatorio, dataInicio, dataFim);

      if (!dados || dados.length === 0) {
        setToastAviso("Nenhum dado encontrado para este filtro!");
        setTimeout(() => setToastAviso(""), 5000);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Relatorio GranPlus - ${tipoRelatorio.toUpperCase()}`, 14, 22);
      doc.setFontSize(11);
      
      doc.text(`Periodo: ${formatDataPDF(dataInicio)} ate ${formatDataPDF(dataFim)}`, 14, 30);

      let colunasTabela = [];
      let linhasTabela = [];

      if (tipoRelatorio === "geral") {
        // 👇 1. O cabeçalho TEM de ter 6 itens:
        colunasTabela = [['ID', 'Usuario', 'Acao', 'ID Evento', 'Data', 'Hora']];

        // 👇 2. Os dados também TÊM de ter 6 itens na mesma ordem:
        linhasTabela = dados.map(item => [
          item.aud_id,                  // 1. ID
          item.user_nome,               // 2. Usuario
          item.aud_acao,                // 3. Acao (já com o ID embutido pelo back-end)
          item.aud_id_evento || '-',    // 4. ID Evento
          formatDataPDF(item.aud_data), // 5. Data
          item.aud_time                 // 6. Hora
        ]);
      
      } else if (tipoRelatorio === "entradas") {
        colunasTabela = [['Produto', 'Quantidade', 'Valor Total (R$)', 'Usuário', 'Data Entrada']]; 
        
        linhasTabela = dados.map(item => [
          item.pdt_nome, 
          item.quantidade,
          Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          item.usuario, 
          formatDataPDF(item.data)
        ]);

        const totalQuantidade = dados.reduce((acc, item) => acc + Number(item.quantidade), 0);
        const totalFinanceiro = dados.reduce((acc, item) => acc + Number(item.valor_total), 0);
        
        linhasTabela.push([
          'TOTAL GERAL', 
          totalQuantidade.toString(),
          totalFinanceiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          '-', 
          '-'
        ]);
      
      } else if (tipoRelatorio === "abaixo_estoque") {
        colunasTabela = [['Produto', 'Estoque Mínimo', 'Estoque Atual']];
        linhasTabela = dados.map(item => [item.pdt_nome, item.pdt_estoque_minimo, item.total_estoque]);

      } else if (tipoRelatorio === "saidas") {
        colunasTabela = [['Produto', 'Quantidade', 'Destino', 'Usuário', 'Data Saída']]; 
        linhasTabela = dados.map(item => [
          item.pdt_nome, 
          item.quantidade, 
          item.destino || 'Não informado',
          item.usuario,
          formatDataPDF(item.data)
        ]);

        const totalQuantidade = dados.reduce((acc, item) => acc + Number(item.quantidade), 0);
        linhasTabela.push(['TOTAL GERAL', totalQuantidade.toString(), '-', '-', '-']); 
      }

      autoTable(doc, {
        startY: 35,
        head: colunasTabela,
        body: linhasTabela,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] }, 
      });

      doc.save(`Relatorio_${tipoRelatorio}_${dataInicio}.pdf`);
      setIsModalAberto(false);

    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      setAlertState({
        open: true,
        title: "Erro ao gerar relatorio",
        message: "Erro ao buscar dados. Verifique o F12.",
        tone: "error",
      });
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((row) =>
      matchesSearch(
        [
          row?.aud_id,
          row?.user_nome,
          row?.user_id,
          row?.aud_acao,
          row?.aud_data,
          row?.aud_time,
          row?.aud_tabela_afetada,
          row?.aud_id_evento,
        ],
        searchTerm,
      ),
    );
  }, [reports, searchTerm]);

  if (!token) {
    return (
      <EmptyState
        title="Conecte-se para visualizar a auditoria e relatórios"
        description="A listagem depende do token gerado pela API."
      />
    );
  }

  if (loading) return <LoadingSpinner />;
  
  if (error) return <EmptyState title="Não foi possível carregar" description={error} />;

  const columns = [
    { key: "aud_id", label: "ID", sortable: true, sortType: "number" },
    {
      key: "user_id",
      label: "Usuário",
      sortable: true,
      sortAccessor: (row) => row.user_nome || row.user_id || "administrador",
      render: (row) => row.user_nome || row.user_id || "administrador",
    },
    { key: "aud_acao", label: "Ação realizada", sortable: true },
    {
      key: "aud_data",
      label: "Data",
      sortable: true,
      sortType: "number",
      sortAccessor: (row) => (row.aud_data ? new Date(row.aud_data).getTime() : 0),
      render: (row) => (row.aud_data ? new Date(row.aud_data).toLocaleDateString("pt-BR") : "-"),
    },
    { key: "aud_time", label: "Hora", sortable: true },
    {
      key: "aud_tabela_afetada",
      label: "Tabela Afetada",
      sortable: true,
      sortAccessor: (row) => formatTableName(row.aud_tabela_afetada),
      render: (row) => formatTableName(row.aud_tabela_afetada),
    },
    { key: "aud_id_evento", label: "ID do Evento", sortable: true, sortType: "number" },
  ];

  return (
  <div className="app-content">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          paddingTop: "4px",
          paddingBottom: "8px",
        }}
      >
        <SectionHeader 
          title="Relatórios" 
          subtitle="Acompanhe as movimentações no sistema (semanal, mensal, anual)." 
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="filter-button"
            onClick={() => setFilterPeriod("weekly")}
            style={{ opacity: filterPeriod === "weekly" ? 1 : 0.6 }}
          >
            Semanal
          </button>
          <button 
            className="filter-button"
            onClick={() => setFilterPeriod("monthly")}
            style={{ opacity: filterPeriod === "monthly" ? 1 : 0.6 }}
          >
            Mensal
          </button>
          <button 
            className="filter-button"
            onClick={() => setFilterPeriod("annual")}
            style={{ opacity: filterPeriod === "annual" ? 1 : 0.6 }}
          >
            Anual
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Buscar tabela ou usuário..."
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "inherit",
              minWidth: "250px"
            }}
          />

          <button className="btn btn-primary" onClick={() => setIsModalAberto(true)}>
            Exportar Relatório
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={filteredReports} rowKey="aud_id" />
    
      {isModalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '8px', width: '400px', color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginTop: 0, color: 'white' }}>Exportar Relatório</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Selecione o período exato desejado:</p>
            <hr style={{ borderColor: '#334155', marginBottom: '20px' }} />
            
            <form onSubmit={handleGerarPDF} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: 'white' }}>
                Tipo de Relatório:
                <select 
                  value={tipoRelatorio} 
                  onChange={(e) => setTipoRelatorio(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #334155', outline: 'none', backgroundColor: '#0f172a', color: 'white' }}
                >
                  <option value="geral">Geral (Auditoria)</option>
                  <option value="entradas">Somente Entradas</option>
                  <option value="saidas">Somente Saídas</option>
                  <option value="abaixo_estoque">Produtos Abaixo do Estoque</option>
                  {/* 💡 CORREÇÃO: Opção de produtos negativos removida daqui */}
                </select>
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: 'white' }}>
                Data de Início:
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  required 
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #334155', outline: 'none', backgroundColor: '#0f172a', color: 'white', colorScheme: 'dark' }} 
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: 'white' }}>
                Data de Fim:
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)} 
                  required 
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #334155', outline: 'none', backgroundColor: '#0f172a', color: 'white', colorScheme: 'dark' }} 
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalAberto(false)} style={{ padding: '10px 15px', border: 'none', backgroundColor: '#64748b', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 15px', border: 'none', backgroundColor: '#6366f1', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Gerar PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastAviso && (
        <div 
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            backgroundColor: "#080c16", /* Fundo bem escuro pra dar contraste */
            color: "#00d4ff", /* Azul neon do seu login */
            padding: "16px 24px",
            borderRadius: "8px",
            border: "1px solid #00d4ff", /* Borda brilhante */
            boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)", /* Aquele glow maroto */
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontWeight: "600",
            fontSize: "15px",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease-in-out"
          }}
        >
          <span style={{ fontSize: "20px" }}>⚠️</span>
          {toastAviso}
        </div>
      )}

      <AlertDialog
        isOpen={alertState.open}
        title={alertState.title}
        message={alertState.message}
        tone={alertState.tone}
        onClose={() =>
          setAlertState({ open: false, title: "", message: "", tone: "error" })
        }
      />

    </div> 
  );
}

export default AuditReportsPage;