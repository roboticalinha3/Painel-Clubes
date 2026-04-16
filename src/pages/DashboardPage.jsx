import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { DashboardView } from '../components/DashboardView';
import { canCreateClub } from '../utils/permissions';

export function DashboardPage({
  userName,
  userRole,
  onLogout,
  onOpenNewClubModal,
  clubes,
  loading,
  error,
}) {
  const navigate = useNavigate();

  async function handleExportExcel() {
    const { utils, writeFile } = await import('xlsx');

    const data = clubes.map((clube) => ({
      ID: clube.id,
      NOME: clube.nome,
      ESCOLA: clube.escola,
      UTEC: clube.utec,
      CATEGORIA: clube.categoria,
      STATUS: clube.status,
      ALUNOS: clube.alunos || 0,
      ENCONTROS_FEITOS: clube.encontrosFeitos || 0,
      PERCENTUAL_CONCLUSAO: `${clube.percentualConclusao || 0}%`,
    }));

    const sheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, sheet, 'Clubes');
    writeFile(workbook, `painel_clubes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function handleExportPdf() {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Relatorio de Clubes - CETEC', 14, 16);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'NOME', 'ESCOLA', 'UTEC', 'CATEGORIA', 'STATUS', 'ALUNOS', '% CONCLUSAO']],
      body: clubes.map((clube) => [
        clube.id || '-',
        clube.nome || '-',
        clube.escola || '-',
        clube.utec || '-',
        clube.categoria || '-',
        clube.status || '-',
        String(clube.alunos || 0),
        `${clube.percentualConclusao || 0}%`,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [1, 30, 98] },
      alternateRowStyles: { fillColor: [245, 247, 252] },
    });

    doc.save(`painel_clubes_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="dashboard"
        userName={userName}
        userRole={userRole}
        onLogout={onLogout}
        onOpenDashboard={() => navigate('/dashboard')}
        onOpenClubs={() => navigate('/clubes')}
        onOpenNewClub={onOpenNewClubModal}
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
              <button type="button" onClick={handleExportExcel} className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-100 hover:bg-blue-50 text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto">
                <span className="material-symbols-rounded text-[16px]">table_view</span>
                Excel
              </button>
              <button type="button" onClick={handleExportPdf} className="bg-white text-cetecBlue font-black py-2.5 px-4 rounded-xl border border-blue-100 hover:bg-blue-50 text-xs shadow-sm transition inline-flex items-center justify-center gap-1.5 w-full sm:w-auto">
                <span className="material-symbols-rounded text-[16px]">picture_as_pdf</span>
                PDF
              </button>
              {canCreateClub(userRole) && (
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
              onSelectClub={(clube) => navigate(`/clubes/${clube.id}`, { state: { from: '/dashboard' } })}
            />
          )}
        </div>
      </main>
    </div>
  );
}
