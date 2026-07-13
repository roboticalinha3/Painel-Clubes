import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { DashboardView } from '../components/DashboardView';

export function DashboardPage({
  userName,
  allowCreateClub,
  allowAdminTools = false,
  allowUsersTools = false,
  onLogout,
  onOpenNewClubModal,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  clubes,
  genderStats,
  loading,
  error,
}) {
  const navigate = useNavigate();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      const { utils, writeFile } = await import('xlsx');

      // Ordenar os clubes pelo nome da UTEC de forma ascendente (A-Z)
      const sortedClubes = [...clubes].sort((a, b) => {
        const utecA = String(a.nomeUtec || a.nome_utec || a.utec || '').trim().toUpperCase();
        const utecB = String(b.nomeUtec || b.nome_utec || b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          const nomeA = String(a.nome || '').trim().toUpperCase();
          const nomeB = String(b.nome || '').trim().toUpperCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      // Indicadores Gerais Consolidados
      const totalClubes = sortedClubes.length;
      let totalAlunosGeral = 0;
      let totalAlunosM = 0;
      let totalAlunosF = 0;
      let totalEncontrosRealizados = 0;
      let sumCompletion = 0;
      const uniqueSchools = new Set();

      sortedClubes.forEach((clube) => {
        totalAlunosGeral += Number(clube.alunos || 0);
        totalAlunosM += Number(clube.alunosM || 0);
        totalAlunosF += Number(clube.alunosF || 0);
        
        const encontrosCount = Number(clube.encontrosFeitos || 0);
        totalEncontrosRealizados += encontrosCount;
        
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontrosCount / 16) * 100);
        sumCompletion += Math.max(0, Math.min(100, percentualVal));
        
        if (clube.escola) {
          uniqueSchools.add(String(clube.escola).trim().toUpperCase());
        }
      });

      const totalEscolas = uniqueSchools.size;
      const overallCompletionRate = totalClubes > 0 ? Math.round(sumCompletion / totalClubes) : 0;

      const data = sortedClubes.map((clube) => {
        // Calcular percentual de conclusão de forma robusta
        const encontros = Number(clube.encontrosFeitos || 0);
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontros / 16) * 100);
        const percentualFormatted = `${Math.max(0, Math.min(100, percentualVal))}%`;

        // Normalizar Categoria e Status
        const catLower = String(clube.categoria || '').toLowerCase();
        let categoriaLabel = 'Iniciais';
        if (catLower.includes('mist')) categoriaLabel = 'Mistos';
        else if (catLower.includes('fina')) categoriaLabel = 'Finais';

        const statusLower = String(clube.status || '').toLowerCase();
        let statusLabel = 'Pendente';
        if (statusLower.includes('andamento') || statusLower === 'em andamento') {
          statusLabel = 'Em andamento';
        } else if (statusLower.includes('conclui') || statusLower.includes('concluí') || statusLower === 'feito') {
          statusLabel = 'Concluído';
        }

        const nomeDaUtec = String(clube.nomeUtec || clube.nome_utec || clube.utec || '-').trim();

        return {
          'ID CLUBE': clube.id || '-',
          'NOME DO CLUBE': clube.nome || '-',
          'ESCOLA': clube.escola || '-',
          'UTEC': nomeDaUtec,
          'CATEGORIA': categoriaLabel,
          'STATUS': statusLabel.toUpperCase(),
          'QTD ALUNOS': clube.alunos || 0,
          'QTD MASCULINO (M)': clube.alunosM || 0,
          'QTD FEMININO (F)': clube.alunosF || 0,
          'ENCONTROS REALIZADOS': encontros,
          '% CONCLUSÃO (META 16)': percentualFormatted,
        };
      });

      const sheet = utils.json_to_sheet(data);

      // Adiciona linhas de resumo após o final dos dados
      const startRow = data.length + 3; // Pula duas linhas
      const summaryRows = [
        ['RESUMO GERAL DO RELATÓRIO', ''],
        ['Total de Clubes:', totalClubes],
        ['Total de Alunos:', totalAlunosGeral],
        ['Total Masculino (M):', totalAlunosM],
        ['Total Feminino (F):', totalAlunosF],
        ['Quantidade de Escolas:', totalEscolas],
        ['Total de Encontros Realizados:', totalEncontrosRealizados],
        ['Taxa Média de Conclusão:', `${overallCompletionRate}%`],
      ];

      utils.sheet_add_aoa(sheet, summaryRows, { origin: `A${startRow}` });

      // Auto-ajustar larguras das colunas
      const colWidths = {};
      // Iniciar com largura mínima correspondente ao tamanho dos cabeçalhos
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key) => {
          colWidths[key] = Math.max(key.length + 3, 10);
        });
      }
      // Calcular tamanho máximo com base nos dados
      data.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const valueStr = String(row[key] ?? '');
          if (valueStr.length > (colWidths[key] || 10)) {
            colWidths[key] = valueStr.length + 2;
          }
        });
      });
      sheet['!cols'] = Object.keys(colWidths).map((key) => ({ wch: colWidths[key] }));

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, sheet, 'Lista de Clubes');
      
      const formattedDate = new Date().toISOString().slice(0, 10);
      writeFile(workbook, `painel_clubes_cetec_${formattedDate}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingExcel(false);
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape' });
      const totalPagesExp = '{total_pages_count_string}';

      // Ordenar os clubes pelo nome da UTEC de forma ascendente (A-Z)
      const sortedClubes = [...clubes].sort((a, b) => {
        const utecA = String(a.nomeUtec || a.nome_utec || a.utec || '').trim().toUpperCase();
        const utecB = String(b.nomeUtec || b.nome_utec || b.utec || '').trim().toUpperCase();
        if (utecA === utecB) {
          const nomeA = String(a.nome || '').trim().toUpperCase();
          const nomeB = String(b.nome || '').trim().toUpperCase();
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        return utecA.localeCompare(utecB, 'pt-BR');
      });

      // Indicadores Gerais Consolidados
      const totalClubes = sortedClubes.length;
      let totalAlunosGeral = 0;
      let totalAlunosM = 0;
      let totalAlunosF = 0;
      let totalEncontrosRealizados = 0;
      let sumCompletion = 0;
      const uniqueSchools = new Set();

      sortedClubes.forEach((clube) => {
        totalAlunosGeral += Number(clube.alunos || 0);
        totalAlunosM += Number(clube.alunosM || 0);
        totalAlunosF += Number(clube.alunosF || 0);
        
        const encontrosCount = Number(clube.encontrosFeitos || 0);
        totalEncontrosRealizados += encontrosCount;
        
        const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
          ? Number(clube.percentualConclusao)
          : Math.round((encontrosCount / 16) * 100);
        sumCompletion += Math.max(0, Math.min(100, percentualVal));
        
        if (clube.escola) {
          uniqueSchools.add(String(clube.escola).trim().toUpperCase());
        }
      });

      const totalEscolas = uniqueSchools.size;
      const overallCompletionRate = totalClubes > 0 ? Math.round(sumCompletion / totalClubes) : 0;

      autoTable(doc, {
        startY: 32,
        head: [['ID', 'NOME DO CLUBE', 'ESCOLA', 'UTEC', 'CATEGORIA', 'STATUS', 'ALUNOS', 'M', 'F', 'ENCONTROS', '% CONCLUÍDO']],
        body: sortedClubes.map((clube) => {
          const encontros = Number(clube.encontrosFeitos || 0);
          const percentualVal = clube.percentualConclusao !== undefined && clube.percentualConclusao !== null
            ? Number(clube.percentualConclusao)
            : Math.round((encontros / 16) * 100);
          const percentualFormatted = `${Math.max(0, Math.min(100, percentualVal))}%`;

          const catLower = String(clube.categoria || '').toLowerCase();
          let categoriaLabel = 'Iniciais';
          if (catLower.includes('mist')) categoriaLabel = 'Mistos';
          else if (catLower.includes('fina')) categoriaLabel = 'Finais';

          const statusLower = String(clube.status || '').toLowerCase();
          let statusLabel = 'PENDENTE';
          if (statusLower.includes('andamento') || statusLower === 'em andamento') {
            statusLabel = 'EM ANDAMENTO';
          } else if (statusLower.includes('conclui') || statusLower.includes('concluí') || statusLower === 'feito') {
            statusLabel = 'CONCLUÍDO';
          }

          const nomeDaUtec = String(clube.nomeUtec || clube.nome_utec || clube.utec || '-').trim();

          return [
            clube.id || '-',
            clube.nome || '-',
            clube.escola || '-',
            nomeDaUtec,
            categoriaLabel,
            statusLabel,
            String(clube.alunos || 0),
            String(clube.alunosM || 0),
            String(clube.alunosF || 0),
            String(encontros),
            percentualFormatted,
          ];
        }),
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          font: 'helvetica',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [3, 37, 140], // Azul padrão CETEC / ID
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // ID
          1: { fontStyle: 'bold', cellWidth: 'auto' }, // NOME DO CLUBE
          2: { cellWidth: 'auto' }, // ESCOLA
          3: { cellWidth: 35 }, // UTEC
          4: { halign: 'center', cellWidth: 20 }, // CATEGORIA
          5: { halign: 'center', cellWidth: 25 }, // STATUS
          6: { halign: 'center', cellWidth: 14 }, // ALUNOS
          7: { halign: 'center', cellWidth: 10 }, // M
          8: { halign: 'center', cellWidth: 10 }, // F
          9: { halign: 'center', cellWidth: 18 }, // ENCONTROS
          10: { halign: 'center', cellWidth: 20 }, // % CONCLUÍDO
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 32, bottom: 18, left: 14, right: 14 },
        didDrawPage: function (data) {
          // Retângulo Sólido de Cabeçalho Superior Azul do CETEC
          doc.setFillColor(3, 37, 140);
          doc.rect(14, 10, doc.internal.pageSize.width - 28, 15, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('PAINEL DE CONTROL DE CLUBES - RELATÓRIO GERAL', 20, 19.5);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.internal.pageSize.width - 90, 19.5);

          // Rodapé de Página
          const str = `Página ${data.pageNumber} de ` + totalPagesExp;
          doc.setFontSize(7.5);
          doc.setTextColor(110);
          doc.text(str, doc.internal.pageSize.width - 32, doc.internal.pageSize.height - 8);
          doc.text('CETEC - Gestão Estratégica de Robótica e Programação | EducaCode', 14, doc.internal.pageSize.height - 8);
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 32;

      // Adiciona tabela de resumo geral no PDF
      autoTable(doc, {
        startY: finalY + 12,
        head: [['MÉTRICA / INDICADOR CONSOLIDADO', 'VALOR']],
        body: [
          ['Total de Clubes', String(totalClubes)],
          ['Total de Alunos Geral', String(totalAlunosGeral)],
          ['Alunos do Gênero Masculino (M)', String(totalAlunosM)],
          ['Alunos do Gênero Feminino (F)', String(totalAlunosF)],
          ['Quantidade de Escolas Atendidas', String(totalEscolas)],
          ['Total de Encontros Realizados', String(totalEncontrosRealizados)],
          ['Taxa Média de Conclusão', `${overallCompletionRate}%`],
        ],
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' }, // Laranja CETEC
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'center', cellWidth: 40 },
        },
        theme: 'grid',
      });

      if (typeof doc.putTotalPages === 'function') {
        doc.putTotalPages(totalPagesExp);
      }

      const formattedDate = new Date().toISOString().slice(0, 10);
      doc.save(`painel_clubes_cetec_${formattedDate}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="dashboard"
        userName={userName}
        allowCreateClub={allowCreateClub}
        allowAdminTools={allowAdminTools}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={() => navigate('/dashboard')}
        onOpenClubs={() => navigate('/clubes')}
        onOpenNewClub={onOpenNewClubModal}
        onOpenAdminDeleteClubs={onOpenAdminDeleteClubs}
        onOpenAdminUsers={onOpenAdminUsers}
      />

      <main className="app-main-pane dashboard-main-modern flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden relative bg-bgDashboard lg:h-screen">
        <div className="dashboard-bg-orb dashboard-bg-orb-a" aria-hidden="true" />
        <div className="dashboard-bg-orb dashboard-bg-orb-b" aria-hidden="true" />

        <header className="dashboard-header-modern pt-4 lg:pt-6 pb-4 px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="dashboard-commandbar">
            <div className="dashboard-command-actions">
              <span className="dashboard-command-chip">CICLO 2026</span>
              <span className="dashboard-command-chip dashboard-command-chip--soft">Atualização automática</span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-3 lg:mt-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-cetecBlue tracking-tight">Visão Geral Estratégica</h2>
              <p className="text-gray-500 font-bold text-xs mt-1">Resumo operacional dos clubes com foco em acompanhamento e cobertura territorial</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button
                type="button"
                disabled={isExportingExcel || isExportingPdf}
                onClick={handleExportExcel}
                className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-100 hover:bg-blue-50 text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait"
              >
                {isExportingExcel ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-cetecBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-[16px]">table_view</span>
                    Excel
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isExportingExcel || isExportingPdf}
                onClick={handleExportPdf}
                className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-100 hover:bg-blue-50 text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait"
              >
                {isExportingPdf ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-cetecBlue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-[16px]">picture_as_pdf</span>
                    PDF
                  </>
                )}
              </button>
              {allowCreateClub && (
                <button type="button" onClick={onOpenNewClubModal} className="btn-3d bg-cetecGreen text-white font-black py-2.5 px-5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] text-xs items-center shadow-sm transition w-full sm:w-auto">
                  + Novo Clube
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 pb-5 lg:pb-6 flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden">
          {loading && <div className="ui-state-panel ui-state-panel--loading">A sincronizar com a base de dados...</div>}
          {error && <div className="ui-state-panel ui-state-panel--empty text-red-500">{error}</div>}

          {!loading && !error && (
            <DashboardView
              clubes={clubes}
              genderStats={genderStats}
              onSelectClub={(clube) => navigate(`/clubes/${clube.id}`, { state: { from: '/dashboard' } })}
            />
          )}
        </div>
      </main>
    </div>
  );
}
