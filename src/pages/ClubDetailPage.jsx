import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { BaseModal } from '../components/ui/BaseModal';
import { FormSelect } from '../components/ui/FormSelect';
import { FormTextInput } from '../components/ui/FormTextInput';
import { ModalActionRow } from '../components/ui/ModalActionRow';
import { formatDateBR, statusKey, toUpperText } from '../utils/clubes';
import { canCreateAluno, canCreateEncontro, canDeleteAluno, canDeleteEncontro, canUpdateStatus } from '../utils/permissions';

export function ClubDetailPage({ userName, userRole, onLogout, onOpenNewClubModal, clubes, details, detailsError, onLoadDetails, onRefresh, onSaveAluno, onDeleteAluno, onSaveEncontro, onDeleteEncontro, onUpdateStatus }) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [statusValue, setStatusValue] = useState('pendente');
  const [showAlunoModal, setShowAlunoModal] = useState(false);
  const [showEncontroModal, setShowEncontroModal] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAluno, setSavingAluno] = useState(false);
  const [savingEncontro, setSavingEncontro] = useState(false);
  const [actionError, setActionError] = useState('');
  const [alunoLoadingMap, setAlunoLoadingMap] = useState({});
  const [encontroLoadingMap, setEncontroLoadingMap] = useState({});
  const [novoAluno, setNovoAluno] = useState({ matricula: '', nome: '' });
  const [novoEncontro, setNovoEncontro] = useState({ modulo: 'lista-scratch', assunto: '', data: '' });

  const club = useMemo(() => clubes.find((item) => item.id === clubId) || null, [clubes, clubId]);
  const allowCreateAluno = canCreateAluno(userRole);
  const allowCreateEncontro = canCreateEncontro(userRole);
  const allowDeleteAluno = canDeleteAluno(userRole);
  const allowDeleteEncontro = canDeleteEncontro(userRole);
  const allowUpdateStatus = canUpdateStatus(userRole);
  const returnTo = location.state?.from || '/clubes';
  const encontros = useMemo(() => details?.encontros || [], [details]);
  const alunos = useMemo(() => details?.alunos || [], [details]);

  const encontrosPorModulo = useMemo(() => {
    const base = {
      'lista-scratch': [],
      'lista-ev3': [],
      'lista-maker': [],
      'lista-python': [],
    };

    encontros.forEach((enc) => {
      const bucket = mapModulo(enc.modulo);
      base[bucket].push(enc);
    });

    return base;
  }, [encontros]);

  useEffect(() => {
    if (clubId) {
      onLoadDetails(clubId);
    }
  }, [clubId, onLoadDetails]);

  useEffect(() => {
    if (club?.status) setStatusValue(statusKey(club.status));
  }, [club]);

  if (!club) {
    return (
      <main className="panel-shell">
        <div className="ui-state-panel ui-state-panel--empty">
          <p className="state-note state-error">Clube não encontrado.</p>
          <button className="btn-primary btn-ghost" type="button" onClick={() => navigate('/dashboard')}>Voltar</button>
        </div>
      </main>
    );
  }

  async function refreshDetails() {
    await onRefresh();
    await onLoadDetails(club.id);
  }

  async function handleUpdateClubStatus(nextStatus) {
    setStatusValue(nextStatus);
    setSavingStatus(true);
    setActionError('');
    try {
      const response = await onUpdateStatus({ acao: 'atualizar_status_clube', id_clube: club.id, status: statusValueToBackend(nextStatus) });
      if (response?.sucesso) {
        await refreshDetails();
      } else {
        setStatusValue(statusKey(club.status) || 'pendente');
        setActionError(getErrorMessage(response, 'Não foi possível atualizar o status do clube.'));
      }
    } catch {
      setStatusValue(statusKey(club.status) || 'pendente');
      setActionError('Não foi possível atualizar o status do clube.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveAluno(event) {
    event.preventDefault();
    setSavingAluno(true);
    setActionError('');
    try {
      const response = await onSaveAluno({ acao: 'salvar_aluno', id_clube: club.id, matricula: novoAluno.matricula || 'S/ MATRÍCULA', nome: novoAluno.nome });
      if (response?.sucesso) {
        setNovoAluno({ matricula: '', nome: '' });
        setShowAlunoModal(false);
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível salvar o aluno.'));
      }
    } catch {
      setActionError('Não foi possível salvar o aluno.');
    } finally {
      setSavingAluno(false);
    }
  }

  function handleAlunoMatriculaChange(value) {
    const sanitized = String(value || '').replace(/\D/g, '').slice(0, 10);
    setNovoAluno((curr) => ({ ...curr, matricula: sanitized }));
  }

  async function handleSaveEncontro(event) {
    event.preventDefault();
    setSavingEncontro(true);
    setActionError('');
    try {
      const response = await onSaveEncontro({
        acao: 'salvar_encontro',
        id_clube: club.id,
        modulo: novoEncontro.modulo,
        assunto: novoEncontro.assunto,
        data: novoEncontro.data,
      });
      if (response?.sucesso) {
        setNovoEncontro({ modulo: 'lista-scratch', assunto: '', data: '' });
        setShowEncontroModal(false);
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível salvar o encontro.'));
      }
    } catch {
      setActionError('Não foi possível salvar o encontro.');
    } finally {
      setSavingEncontro(false);
    }
  }

  async function toggleEncontroStatus(encontro) {
    if (!encontro?.id) return;

    setEncontroLoadingMap((curr) => ({ ...curr, [encontro.id]: true }));
    const novoStatus = String(encontro.status || '').toUpperCase() === 'FEITO' ? 'A FAZER' : 'FEITO';
    try {
      const response = await onUpdateStatus({ acao: 'atualizar_status_encontro', id_encontro: encontro.id, status: novoStatus });
      if (response?.sucesso) await refreshDetails();
    } finally {
      setEncontroLoadingMap((curr) => ({ ...curr, [encontro.id]: false }));
    }
  }

  async function removeEncontro(encontro) {
    const encontroKey = encontro?.id || `${encontro?.modulo || ''}-${encontro?.assunto || ''}-${encontro?.data || ''}`;
    if (!encontroKey) return;

    setEncontroLoadingMap((curr) => ({ ...curr, [encontroKey]: true }));
    try {
      setActionError('');
      let response = await onDeleteEncontro({ acao: 'remover_encontro', id_encontro: encontro?.id || '' });
      if (!isSuccessResponse(response)) {
        response = await onDeleteEncontro({ acao: 'excluir_encontro', id_encontro: encontro?.id || '' });
      }

      if (isSuccessResponse(response)) {
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível remover o encontro.'));
      }
    } catch {
      setActionError('Não foi possível remover o encontro.');
    } finally {
      setEncontroLoadingMap((curr) => ({ ...curr, [encontroKey]: false }));
    }
  }

  async function removeAluno(aluno) {
    if (!aluno) return;

    const alunoKey = aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`;
    if (!alunoKey) return;

    setAlunoLoadingMap((curr) => ({ ...curr, [alunoKey]: true }));
    try {
      setActionError('');
      const basePayload = {
        id_aluno: aluno?.id || '',
        idAluno: aluno?.id || '',
        id: aluno?.id || '',
        id_clube: club.id,
        matricula: aluno?.matricula || '',
        nome: aluno?.nome || '',
      };

      let response = await onDeleteAluno({ acao: 'remover_aluno', ...basePayload });
      if (!isSuccessResponse(response)) {
        response = await onDeleteAluno({ acao: 'excluir_aluno', ...basePayload });
      }

      if (isSuccessResponse(response)) {
        await refreshDetails();
      } else {
        setActionError(getErrorMessage(response, 'Não foi possível remover o aluno.'));
      }
    } catch {
      setActionError('Não foi possível remover o aluno.');
    } finally {
      setAlunoLoadingMap((curr) => ({ ...curr, [alunoKey]: false }));
    }
  }

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
        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden">
          {(detailsError || actionError) && <div className="ui-state-panel ui-state-panel--empty text-red-500">{detailsError || actionError}</div>}

          <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-in-out] overflow-visible lg:overflow-hidden">
            <div className="shrink-0 mb-3 flex justify-end items-center">
              <button
                onClick={() => navigate(returnTo)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition shadow-sm font-black text-base sm:text-lg leading-none flex items-center justify-center"
                type="button"
                aria-label="Fechar detalhes e voltar"
                title="Fechar"
              >
                X
              </button>
            </div>

            <div className="ui-surface-card ui-surface-card--pad-lg mb-4 lg:mb-6 shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="flex flex-col gap-2 min-w-0 lg:col-span-4">
                <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight break-words">{club.nome}</h3>
                <select value={statusValue} disabled={savingStatus || !allowUpdateStatus} onChange={(event) => handleUpdateClubStatus(event.target.value)} className={statusSelectClass(statusValue, savingStatus || !allowUpdateStatus)}>
                  <option value="pendente">🟠 PENDENTE</option>
                  <option value="em_andamento">🔵 EM ANDAMENTO</option>
                  <option value="concluido">🟢 CONCLUÍDO</option>
                </select>
                <span className={`font-extrabold text-xs px-3 py-1 rounded-lg border w-fit ${categoriaBadgeClass(club.categoria)}`}>{normalizeCategoriaLabel(club.categoria)}</span>
              </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                  <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-6 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Localização</span>
                    <span className="text-sm font-black text-gray-800 break-words">🏫 {club.escola}</span>
                    <span className="text-xs font-bold text-cetecBlue mt-0.5 break-words">{club.utec}</span>
                  </div>
                  <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-6 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Equipe Responsável</span>
                    <span className="text-sm font-black text-gray-800 break-words">👩‍🏫 Profª {club.prof}</span>
                    <span className="text-xs font-bold text-purple-600 mt-0.5 break-words">👨‍💻 {club.estag} (Estag)</span>
                  </div>
                  <div className="flex flex-col border-t xl:border-t-0 xl:border-l border-gray-200 pt-3 xl:pt-0 xl:pl-6 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Agenda</span>
                    <span className="text-sm font-black text-gray-800 break-words">{club.dias}</span>
                    <span className="text-xs font-bold text-cetecBlue mt-0.5 break-words">{club.horario}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-5 flex-1 min-h-0 overflow-visible xl:overflow-hidden">
              <div className="w-full xl:w-[34%] ui-surface-card ui-surface-card--pad flex flex-col h-[320px] sm:h-[340px] xl:h-full overflow-hidden shrink-0">
                <div className="ui-section-head shrink-0 border-b border-gray-50 pb-4 mb-5">
                  <h4 className="font-black text-lg text-gray-800">Alunos</h4>
                  {allowCreateAluno && <button type="button" onClick={() => setShowAlunoModal(true)} className="bg-gray-100 text-cetecBlue hover:bg-blue-50 font-black w-9 h-9 rounded-lg text-xl leading-none transition flex items-center justify-center">+</button>}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                  {alunos.length === 0 && <div className="ui-state-panel ui-state-panel--empty">Nenhum aluno vinculado ainda.</div>}
                  <ul className="space-y-3 font-semibold text-gray-600">
                    {alunos.map((aluno) => (
                      <li key={aluno.id || `${aluno.nome}-${aluno.matricula}`} className="ui-card-tile ui-card-tile--row group animate-[fadeIn_0.3s_ease-in-out]">
                        <div className="flex items-start sm:items-center w-full gap-2">
                          <div className="w-9 h-9 bg-blue-50 text-cetecBlue rounded-full flex items-center justify-center mr-3 shrink-0">
                            <span className="material-symbols-rounded text-[18px]">person</span>
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="block text-gray-800 font-black leading-tight text-sm truncate">{aluno.nome}</span>
                            <span className="block text-xs font-bold text-gray-400 truncate mt-0.5">MAT: {aluno.matricula || 'S/ MATRÍCULA'}</span>
                          </div>
                          {allowDeleteAluno && (
                            <button
                              type="button"
                              onClick={() => removeAluno(aluno)}
                              disabled={alunoLoadingMap?.[aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`]}
                              className={`btn-3d font-black text-[10px] px-2.5 py-1.5 rounded-md border-b-[3px] transition-colors min-w-[74px] shrink-0 mt-0.5 sm:mt-0 ${alunoLoadingMap?.[aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`] ? 'bg-gray-400 text-white border-gray-600 cursor-wait' : 'bg-gray-700 text-white border-gray-900 hover:bg-gray-800'}`}
                            >
                              {alunoLoadingMap?.[aluno.id || `${aluno?.matricula || ''}-${aluno?.nome || ''}`] ? '...' : 'REMOVER'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="w-full xl:w-[66%] ui-surface-card ui-surface-card--pad flex flex-col h-full overflow-hidden relative">
                <div className="ui-section-head shrink-0 border-b border-gray-50 pb-3 mb-4">
                  <h4 className="font-black text-lg text-gray-800">Cronograma da Trilha</h4>
                  {allowCreateEncontro && <button type="button" onClick={() => setShowEncontroModal(true)} className="bg-gray-100 text-cetecGreen hover:bg-green-50 font-black w-8 h-8 rounded-lg text-lg leading-none transition flex items-center justify-center">+</button>}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4">
                  <div className="ui-card-grid ui-card-grid--single" style={{ gap: '1.25rem' }}>
                    <ModuloSection title="1. SCRATCH" colorClass="bg-[#F3A712]" encontros={encontrosPorModulo['lista-scratch']} onToggleStatus={toggleEncontroStatus} onRemoveEncontro={removeEncontro} onCanRemove={allowDeleteEncontro} onCanToggleStatus={allowUpdateStatus} encontroLoadingMap={encontroLoadingMap} />
                    <ModuloSection title="2. EV3" colorClass="bg-cetecBlue" encontros={encontrosPorModulo['lista-ev3']} onToggleStatus={toggleEncontroStatus} onRemoveEncontro={removeEncontro} onCanRemove={allowDeleteEncontro} onCanToggleStatus={allowUpdateStatus} encontroLoadingMap={encontroLoadingMap} />
                    <ModuloSection title="3. MAKER / ARDUINO" colorClass="bg-cetecOrange" encontros={encontrosPorModulo['lista-maker']} onToggleStatus={toggleEncontroStatus} onRemoveEncontro={removeEncontro} onCanRemove={allowDeleteEncontro} onCanToggleStatus={allowUpdateStatus} encontroLoadingMap={encontroLoadingMap} />
                    <ModuloSection title="4. PYTHON" colorClass="bg-cetecGreen" encontros={encontrosPorModulo['lista-python']} onToggleStatus={toggleEncontroStatus} onRemoveEncontro={removeEncontro} onCanRemove={allowDeleteEncontro} onCanToggleStatus={allowUpdateStatus} encontroLoadingMap={encontroLoadingMap} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAlunoModal && (
        <BaseModal
          open={showAlunoModal}
          onClose={() => setShowAlunoModal(false)}
          title="Adicionar Aluno"
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--sm"
          contentAs="form"
          contentProps={{ onSubmit: handleSaveAluno }}
          bodyClass="ui-modal-body space-y-4"
        >
          <FormTextInput
            placeholder="Matrícula (até 10 dígitos)"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{0,10}"
            title="Digite somente números, até 10 dígitos"
            value={novoAluno.matricula}
            onChange={(event) => handleAlunoMatriculaChange(event.target.value)}
          />
          <FormTextInput
            placeholder="Ex: ANA SOUZA"
            value={novoAluno.nome}
            autoCapitalize="characters"
            onChange={(event) => setNovoAluno((curr) => ({ ...curr, nome: toUpperText(event.target.value, '') }))}
            required
          />
          <ModalActionRow
            onCancel={() => setShowAlunoModal(false)}
            submitLabel="Salvar Aluno"
            saving={savingAluno}
          />
        </BaseModal>
      )}

      {showEncontroModal && (
        <BaseModal
          open={showEncontroModal}
          onClose={() => setShowEncontroModal(false)}
          title="Adicionar Encontro"
          backdropClass="fixed inset-0 bg-cetecBlue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          sizeClass="ui-modal-card ui-modal-card--compact"
          contentAs="form"
          contentProps={{ onSubmit: handleSaveEncontro }}
          bodyClass="ui-modal-body space-y-4"
        >
          <FormSelect
            value={novoEncontro.modulo}
            onChange={(event) => setNovoEncontro((curr) => ({ ...curr, modulo: event.target.value }))}
            options={[
              { label: 'SCRATCH', value: 'lista-scratch' },
              { label: 'EV3', value: 'lista-ev3' },
              { label: 'MAKER / ARDUINO', value: 'lista-maker' },
              { label: 'PYTHON', value: 'lista-python' },
            ]}
            getOptionLabel={(option) => option.label}
            getOptionKey={(option) => option.value}
          />
          <FormTextInput
            placeholder="Ex: INTRODUÇÃO AO SCRATCH"
            value={novoEncontro.assunto}
            autoCapitalize="characters"
            onChange={(event) => setNovoEncontro((curr) => ({ ...curr, assunto: toUpperText(event.target.value, '') }))}
            required
          />
          <FormTextInput
            type="date"
            placeholder="Data do encontro"
            title="Selecione a data do encontro"
            value={novoEncontro.data}
            onChange={(event) => setNovoEncontro((curr) => ({ ...curr, data: event.target.value }))}
            required
          />
          <ModalActionRow
            onCancel={() => setShowEncontroModal(false)}
            submitLabel="Salvar Encontro"
            saving={savingEncontro}
          />
        </BaseModal>
      )}
    </div>
  );
}

function ModuloSection({ title, colorClass, encontros, onToggleStatus, onRemoveEncontro, onCanRemove, onCanToggleStatus, encontroLoadingMap }) {
  return (
    <details className="ui-surface-card group shadow-sm h-fit">
      <summary className={`font-black text-white p-3.5 text-sm cursor-pointer hover:opacity-90 transition rounded-t-2xl group-open:rounded-b-none rounded-b-2xl flex justify-between items-center outline-none ${colorClass}`}>
        {title}
        <span className="text-white text-base font-bold group-open:rotate-180 transition-transform leading-none">▼</span>
      </summary>
      <div className="p-3 border-t-0 space-y-3 rounded-b-2xl flex flex-col">
        {encontros.length === 0 && <p className="text-xs font-bold text-gray-400">Nenhum encontro neste módulo.</p>}
        {encontros.map((enc) => (
          <div key={enc.id || `${enc.assunto}-${enc.data}`} className="item-encontro ui-card-tile ui-card-tile--row justify-between animate-[fadeIn_0.3s_ease-in-out]">
            <div className="flex-1">
              <p className="font-black text-gray-800 text-sm leading-tight pr-2">{enc.assunto}</p>
              <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-md mt-1.5 inline-flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">calendar_month</span>
                {formatDateBR(enc.data)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onCanToggleStatus && (
                <button
                  type="button"
                  onClick={() => onToggleStatus(enc)}
                  disabled={encontroLoadingMap?.[enc.id]}
                  className={`btn-3d status-btn font-black text-[10px] px-2.5 py-1.5 rounded-md border-b-[3px] transition-colors min-w-[64px] ${encontroLoadingMap?.[enc.id] ? 'bg-gray-400 text-white border-gray-600 cursor-wait' : String(enc.status || '').toUpperCase() === 'FEITO' ? 'bg-green-500 text-white border-green-700' : 'bg-red-500 text-white border-red-700'}`}
                >
                  {encontroLoadingMap?.[enc.id] ? '...' : String(enc.status || '').toUpperCase() === 'FEITO' ? 'FEITO' : 'A FAZER'}
                </button>
              )}
              {onCanRemove && (
                <button
                  type="button"
                  onClick={() => onRemoveEncontro(enc)}
                  disabled={encontroLoadingMap?.[enc.id]}
                  className={`btn-3d font-black text-[10px] px-2.5 py-1.5 rounded-md border-b-[3px] transition-colors min-w-[64px] ${encontroLoadingMap?.[enc.id] ? 'bg-gray-400 text-white border-gray-600 cursor-wait' : 'bg-gray-700 text-white border-gray-900 hover:bg-gray-800'}`}
                >
                  REMOVER
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function statusValueToBackend(statusValue) {
  if (statusValue === 'concluido') return 'CONCLUIDO';
  if (statusValue === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}

function mapModulo(rawModulo) {
  const modulo = String(rawModulo || '').toLowerCase();
  if (modulo.includes('scratch')) return 'lista-scratch';
  if (modulo.includes('ev3')) return 'lista-ev3';
  if (modulo.includes('maker') || modulo.includes('arduino')) return 'lista-maker';
  if (modulo.includes('python')) return 'lista-python';
  if (['lista-scratch', 'lista-ev3', 'lista-maker', 'lista-python'].includes(modulo)) return modulo;
  return 'lista-scratch';
}

function normalizeCategoriaLabel(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'Clubes Mistos';
  if (current.includes('fina')) return 'Clubes Finais';
  return 'Clubes Iniciais';
}

function categoriaBadgeClass(categoria) {
  const current = String(categoria || '').toLowerCase();
  if (current.includes('mist')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (current.includes('fina')) return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-sky-100 text-sky-700 border-sky-200';
}

function statusSelectClass(status, disabled) {
  const base = disabled
    ? 'font-black text-xs px-3 py-1.5 rounded-lg mt-1 border outline-none w-fit appearance-none text-center opacity-70 cursor-wait'
    : 'font-black text-xs px-3 py-1.5 rounded-lg mt-1 border outline-none cursor-pointer w-fit appearance-none text-center';

  if (status === 'concluido') return `bg-green-100 text-green-700 border-green-200 ${base}`;
  if (status === 'em_andamento') return `bg-blue-100 text-blue-700 border-blue-200 ${base}`;
  return `bg-cyan-100 text-cyan-700 border-cyan-200 ${base}`;
}

function isSuccessResponse(response) {
  if (!response) return false;
  if (response === true) return true;
  return response.sucesso === true || response.SUCESSO === true;
}

function getErrorMessage(response, fallback) {
  if (!response || typeof response !== 'object') return fallback;
  const code = String(response.codigo || '').toUpperCase();
  if (code === 'ACAO_INVALIDA') {
    return 'Ação inválida no backend. Verifique se o frontend está apontando para o deployment mais recente do Apps Script.';
  }

  return response.erro || response.mensagem || response.message || fallback;
}
