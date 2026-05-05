import { useEffect, useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SectionHeader from "../components/common/SectionHeader";
import DataTable from "../components/common/DataTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../contexts/AuthContext";

// Agora importamos certinho as duas funções do seu api.js!
import { getAuditReports, getAuditReportsByDate } from "../services/api";

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

const AuditReportsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("monthly"); 

  // Estados para o Modal e Datas do PDF
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Função para carregar a tabela
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

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, filterPeriod]);

  // A MÁGICA DO PDF
  const handleGerarPDF = async (e) => {
    e.preventDefault();
    
    try {
      // Usamos a função nova que criamos no api.js
      const dadosAuditoria = await getAuditReportsByDate(token, dataInicio, dataFim);

      if (!dadosAuditoria || dadosAuditoria.length === 0) {
        alert("Nenhum dado encontrado para as datas selecionadas!");
        return;
      }

      // Inicializa o PDF
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text(`Relatorio de Auditoria - GranPlus`, 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Periodo: ${dataInicio.split('-').reverse().join('/')} ate ${dataFim.split('-').reverse().join('/')}`, 14, 30);

      // Desenha a tabela perfeita
      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Usuario', 'Acao', 'Data', 'Hora', 'Tabela']],
        body: dadosAuditoria.map(item => [
          item.aud_id,
          item.user_nome || item.user_id || 'Administrador',
          item.aud_acao,
          item.aud_data ? new Date(item.aud_data).toLocaleDateString("pt-BR") : "-",
          item.aud_time,
          item.aud_tabela_afetada
        ]),
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] }, 
      });

      // Salva o arquivo e fecha tudo
      doc.save(`Auditoria_${dataInicio}_a_${dataFim}.pdf`);
      setIsModalAberto(false);
      setDataInicio("");
      setDataFim("");

    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      alert("Erro ao buscar dados para o relatório. Verifique o F12.");
    }
  };

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
    { key: "aud_id", label: "ID" },
    { key: "user_id", label: "Usuário", render: (row) => row.user_nome || row.user_id || "administrador" },
    { key: "aud_acao", label: "Ação realizada" },
    { key: "aud_data",
      label: "Data",
      render: (row) => (row.aud_data ? new Date(row.aud_data).toLocaleDateString("pt-BR") : "-"),
    },
    { key: "aud_time", label: "Hora" },
    {
      key: "aud_tabela_afetada",
      label: "Tabela Afetada",
      render: (row) => formatTableName(row.aud_tabela_afetada),
    },
    { key: "aud_id_evento", label: "ID do Evento" },
  ];

  return (
    <div>
      <SectionHeader 
        title="Relatórios" 
        subtitle="Acompanhe as movimentações no sistema (semanal, mensal, anual)." 
        actions={
          <button className="btn btn-primary" onClick={() => setIsModalAberto(true)}>
            Exportar Relatório
          </button>
        }
      />

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

      {/* MODAL DE FILTRO DO PDF (Design Dark) */}
      {isModalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '8px', width: '400px', color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginTop: 0, color: 'white' }}>Exportar Relatório</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Selecione o período exato desejado:</p>
            <hr style={{ borderColor: '#334155', marginBottom: '20px' }} />
            
            <form onSubmit={handleGerarPDF} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
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

    </div>
  );
};

export default AuditReportsPage;