import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { statusKey } from '../utils/clubes';
import { canCreateClub } from '../utils/permissions';

export function ClubsPanelPage({ userName, userRole, onLogout, onOpenNewClubModal, clubes, loading, error }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchField, setSearchField] = useState('all');

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClubes = useMemo(() => {
    return clubes.filter((clube) => {
      const key = statusKey(clube.status);
      const categoria = String(clube.categoria || '').toLowerCase();
      const inQuickFilter = matchQuickFilter(quickFilter, key, categoria);
      if (!inQuickFilter) return false;

      if (!normalizedSearch) return true;

      return matchSearchField(clube, searchField, normalizedSearch);
    });
  }, [clubes, normalizedSearch, quickFilter, searchField]);

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="clubs"
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
          <div className="flex justify-between items-end gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-cetecBlue tracking-tight">Painel de Clubes</h2>
              <p className="text-gray-500 font-bold text-xs mt-1">Gestão completa dos clubes cadastrados com busca ativa e filtros rápidos</p>
            </div>
            {canCreateClub(userRole) && (
              <button type="button" onClick={onOpenNewClubModal} className="btn-3d bg-cetecGreen text-white font-black py-2.5 px-5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] text-xs items-center shadow-sm transition w-full sm:w-auto">
                + Novo Clube
              </button>
            )}
          </div>

          <div className="clubes-toolbar-row mt-4">
            <div className="dashboard-search-pill clubes-search-inline">
              <span className="material-symbols-rounded text-[16px]">search</span>
              <select
                value={searchField}
                onChange={(event) => setSearchField(event.target.value)}
                className="clubes-search-select"
                aria-label="Campo de pesquisa"
              >
                <option value="all">Todos os campos</option>
                <option value="nome">Nome do clube</option>
                <option value="escola">Escola</option>
                <option value="estag">Estagiário</option>
                <option value="prof">Professor</option>
              </select>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder(searchField)}
                aria-label="Pesquisar clubes"
              />
            </div>

            <div className="dashboard-filter-bar clubes-filter-inline">
              <FilterChip label="Todos" icon="dashboard" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
              <FilterChip label="Pendentes" icon="hourglass_top" active={quickFilter === 'pendente'} onClick={() => setQuickFilter('pendente')} />
              <FilterChip label="Andamento" icon="progress_activity" active={quickFilter === 'em_andamento'} onClick={() => setQuickFilter('em_andamento')} />
              <FilterChip label="Concluídos" icon="task_alt" active={quickFilter === 'concluido'} onClick={() => setQuickFilter('concluido')} />
              <FilterChip label="Iniciais" icon="school" active={quickFilter === 'iniciais'} onClick={() => setQuickFilter('iniciais')} />
              <FilterChip label="Mistos" icon="groups" active={quickFilter === 'mistos'} onClick={() => setQuickFilter('mistos')} />
              <FilterChip label="Finais" icon="category" active={quickFilter === 'finais'} onClick={() => setQuickFilter('finais')} />
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 pb-5 lg:pb-6 flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden relative z-[2]">
          {loading && <div className="ui-state-panel ui-state-panel--loading">A sincronizar com a base de dados...</div>}
          {error && <div className="ui-state-panel ui-state-panel--empty text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pr-0 sm:pr-2">
              {filteredClubes.length === 0 && (
                <div className="ui-state-panel ui-state-panel--empty mb-4">Nenhum clube encontrado para os filtros aplicados.</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 ui-card-grid ui-card-grid--three" id="grid-clubes-react">
                {filteredClubes.map((clube) => (
                  <button
                    key={clube.id}
                    type="button"
                    onClick={() => navigate(`/clubes/${clube.id}`, { state: { from: '/clubes' } })}
                    data-status={clube.status}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:border-cetecGreen cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between gap-4 min-h-[240px] text-left ui-card-tile ui-card-tile--clickable"
                  >
                    <div>
                      <h3 className="text-lg font-black text-cetecBlue group-hover:text-cetecGreen transition-colors truncate ui-card-title">{clube.nome}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-lg border border-indigo-100 inline-block truncate max-w-full ui-card-pill">🏫 {clube.escola}</span>
                        <span className={`badge-categoria ${categoriaClass(clube.categoria)} font-extrabold text-xs px-3 py-1 rounded-lg border ui-card-pill`}>{normalizeCategoriaLabel(clube.categoria)}</span>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2 ui-card-meta">
                      <span className="text-gray-600 font-extrabold text-sm block truncate">👩‍🏫 Prof: {clube.prof}</span>
                      <span className="text-purple-600 font-extrabold text-sm block truncate">👨‍💻 Estag: {clube.estag}</span>
                    </div>

                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50 ui-card-footer">
                      <span className="card-alunos-count text-cetecBlue font-black text-sm">{clube.alunos || 0} Alunos</span>
                      <span className={`status-badge ${statusClass(clube.status)} ui-card-pill font-black text-xs px-3 py-1.5 rounded-lg flex items-center shrink-0 border`}>{statusText(clube.status)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FilterChip({ label, icon, active, onClick }) {
  return (
    <button type="button" className={`dashboard-filter-chip ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="material-symbols-rounded">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function searchPlaceholder(field) {
  if (field === 'nome') return 'Pesquisar por nome do clube';
  if (field === 'escola') return 'Pesquisar por escola';
  if (field === 'estag') return 'Pesquisar por estagiário';
  if (field === 'prof') return 'Pesquisar por professor';
  return 'Pesquisar clube, escola, estagiário ou professor';
}

function matchQuickFilter(filter, status, categoria) {
  if (filter === 'pendente' || filter === 'em_andamento' || filter === 'concluido') {
    return status === filter;
  }
  if (filter === 'iniciais') return categoria.includes('iniciais');
  if (filter === 'mistos') return categoria.includes('mistos');
  if (filter === 'finais') return categoria.includes('finais');
  return true;
}

function matchSearchField(clube, field, search) {
  const nome = String(clube.nome || '').toLowerCase();
  const escola = String(clube.escola || '').toLowerCase();
  const estag = String(clube.estag || '').toLowerCase();
  const prof = String(clube.prof || '').toLowerCase();

  if (field === 'nome') return nome.includes(search);
  if (field === 'escola') return escola.includes(search);
  if (field === 'estag') return estag.includes(search);
  if (field === 'prof') return prof.includes(search);

  return [nome, escola, estag, prof].join(' ').includes(search);
}

function normalizeCategoriaLabel(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'Clubes Mistos';
  if (current.includes('fina')) return 'Clubes Finais';
  return 'Clubes Iniciais';
}

function categoriaClass(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (current.includes('fina')) return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-sky-100 text-sky-700 border-sky-200';
}

function statusClass(status) {
  const key = statusKey(status);
  if (key === 'concluido') return 'bg-green-100 text-green-700 border-green-200';
  if (key === 'em_andamento') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-cyan-100 text-cyan-700 border-cyan-200';
}

function statusText(status) {
  const key = statusKey(status);
  if (key === 'concluido') return 'CONCLUÍDO';
  if (key === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}
