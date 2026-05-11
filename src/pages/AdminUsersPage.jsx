import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { ConfirmPasswordModal } from '../components/ui/ConfirmPasswordModal';
import { BaseModal } from '../components/ui/BaseModal';
import { FormSelect } from '../components/ui/FormSelect';
import { FormTextInput } from '../components/ui/FormTextInput';
import { ModalActionRow } from '../components/ui/ModalActionRow';
import { accessLabel, normalizeAccessLevel } from '../utils/permissions';

const EMPTY_FORM = {
  nome: '',
  email: '',
  senha: '',
  acesso: 'editor',
  utec: '',
};

export function AdminUsersPage({
  userName,
  userRole,
  allowAdminTools,
  allowUsersTools = false,
  onLogout,
  onOpenDashboard,
  onOpenClubs,
  onOpenNewClub,
  onOpenAdminDeleteClubs,
  onOpenAdminUsers,
  utecOptions,
  usuarios = [],
  usuariosLoading = false,
  usuariosError = '',
  onRefreshUsuarios,
  onSaveUser,
  onDeleteUser,
}) {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSaving, setDeleteSaving] = useState(false);

  const isAdmin = String(userRole || '').toLowerCase() === 'administrador';
  const canManageUsers = isAdmin && allowAdminTools;
  const options = useMemo(() => (Array.isArray(utecOptions) ? utecOptions : []), [utecOptions]);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const access = normalizeAccessLevel(user.acesso || user.tipoUsuario || user.tipo_usuario);
      const userIsGlobal = Boolean(user.verTodasUtecs) || String(user.tipoUsuario || '').toLowerCase() === 'global';
      if (!matchQuickFilter(quickFilter, access, userIsGlobal)) return false;

      if (!normalizedSearch) return true;

      return [user.nome, user.email, user.utec, user.tipoUsuario, user.acesso]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(normalizedSearch));
    });
  }, [usuarios, quickFilter, normalizedSearch]);

  if (!allowUsersTools) {
    return <Navigate to="/dashboard" replace />;
  }

  function openAddModal() {
    setError('');
    setSuccess('');
    setShowAddModal(true);
    setForm({
      ...EMPTY_FORM,
      acesso: 'editor',
      utec: options[0]?.value || '',
    });
  }

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'acesso') {
        if (String(value).toLowerCase() === 'administrador') {
          next.utec = '';
        } else if (!next.utec) {
          next.utec = options[0]?.value || '';
        }
      }

      if (field === 'utec' && String(current.acesso).toLowerCase() === 'administrador') {
        next.utec = '';
      }

      return next;
    });
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const isGlobalUser = String(form.acesso).toLowerCase() === 'administrador';
      const payload = {
        acao: 'salvar_usuario',
        nome: String(form.nome || '').trim(),
        email: String(form.email || '').trim(),
        senha: String(form.senha || '').trim(),
        acesso: form.acesso,
        tipo_usuario: isGlobalUser ? 'global' : 'utec',
        ver_todas_utecs: isGlobalUser,
        utec: isGlobalUser ? '' : form.utec,
      };

      let result = await onSaveUser(payload);
      if (!result?.sucesso) {
        result = await onSaveUser({ ...payload, acao: 'cadastrar_usuario' });
      }

      if (result?.sucesso) {
        setShowAddModal(false);
        setForm(EMPTY_FORM);
        setSuccess('Usuário cadastrado com sucesso.');
        if (onRefreshUsuarios) await onRefreshUsuarios();
        return;
      }

      setError(String(result?.erro || result?.mensagem || 'Não foi possível cadastrar o usuário.'));
    } catch {
      setError('Não foi possível cadastrar o usuário.');
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(user) {
    setDeleteError('');
    setPendingDelete(user);
  }

  async function handleConfirmDelete(password) {
    if (!pendingDelete?.id) return;

    setDeleteSaving(true);
    setDeleteError('');

    try {
      let response = await onDeleteUser({ acao: 'remover_usuario', id_usuario: pendingDelete.id, senha: password });
      if (!response?.sucesso) {
        response = await onDeleteUser({ acao: 'excluir_usuario', id_usuario: pendingDelete.id, senha: password });
      }

      if (response?.sucesso) {
        setPendingDelete(null);
        if (onRefreshUsuarios) await onRefreshUsuarios();
        return;
      }

      setDeleteError(String(response?.erro || response?.mensagem || 'Não foi possível excluir o usuário.'));
    } catch {
      setDeleteError('Não foi possível excluir o usuário.');
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <div id="main-app" className="app-shell flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden lg:overflow-hidden lg:h-screen">
      <AppSidebar
        activeView="admin-users"
        userName={userName}
        allowCreateClub={true}
        allowAdminTools={allowAdminTools}
        allowUsersTools={allowUsersTools}
        onLogout={onLogout}
        onOpenDashboard={onOpenDashboard}
        onOpenClubs={onOpenClubs}
        onOpenNewClub={onOpenNewClub}
        onOpenAdminDeleteClubs={onOpenAdminDeleteClubs}
        onOpenAdminUsers={onOpenAdminUsers}
      />

      <main className="app-main-pane dashboard-main-modern flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden relative bg-bgDashboard lg:h-screen">
        <div className="dashboard-bg-orb dashboard-bg-orb-a" aria-hidden="true" />
        <div className="dashboard-bg-orb dashboard-bg-orb-b" aria-hidden="true" />

        <header className="dashboard-header-modern pt-4 lg:pt-6 pb-4 px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex justify-between items-end gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-cetecBlue tracking-tight">Usuários</h2>
              <p className="text-gray-500 font-bold text-xs mt-1">Cadastro, consulta e remoção de usuários do painel</p>
            </div>
            {canManageUsers && (
              <button type="button" onClick={openAddModal} className="btn-3d bg-cetecGreen text-white font-black py-2.5 px-5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] text-xs items-center shadow-sm transition w-full sm:w-auto">
                + Novo Usuário
              </button>
            )}
          </div>

          <div className="clubes-toolbar-row mt-4">
            <div className="dashboard-search-pill clubes-search-inline w-full max-w-2xl">
              <span className="material-symbols-rounded text-[16px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, e-mail ou UTEC"
                aria-label="Pesquisar usuários"
              />
            </div>

            <div className="dashboard-filter-bar clubes-filter-inline">
              <FilterChip label="Todos" icon="dashboard" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
              <FilterChip label="Administradores" icon="shield_person" active={quickFilter === 'administrador'} onClick={() => setQuickFilter('administrador')} />
              <FilterChip label="Editores" icon="edit" active={quickFilter === 'editor'} onClick={() => setQuickFilter('editor')} />
              <FilterChip label="Leitores" icon="visibility" active={quickFilter === 'leitor'} onClick={() => setQuickFilter('leitor')} />
              <FilterChip label="UTEC" icon="apartment" active={quickFilter === 'utec'} onClick={() => setQuickFilter('utec')} />
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 pb-5 lg:pb-6 flex-1 flex flex-col min-h-0 overflow-visible lg:overflow-hidden relative z-[2]">
          {usuariosLoading && <div className="ui-state-panel ui-state-panel--loading">Carregando usuários...</div>}
          {usuariosError && <div className="ui-state-panel ui-state-panel--empty text-red-500">{usuariosError}</div>}
          {success && <div className="ui-state-panel ui-state-panel--empty text-green-600">{success}</div>}

          {!usuariosLoading && !usuariosError && (
            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pr-0 sm:pr-2">
              {filteredUsers.length === 0 && (
                <div className="ui-state-panel ui-state-panel--empty mb-4">Nenhum usuário encontrado para os filtros aplicados.</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ui-card-grid ui-card-grid--three">
                {filteredUsers.map((user, index) => {
                  const access = normalizeAccessLevel(user.acesso || user.tipoUsuario || user.tipo_usuario);
                  const isGlobalUser = Boolean(user.verTodasUtecs) || String(user.tipoUsuario || '').toLowerCase() === 'global' || access === 'administrador';
                  return (
                    <article key={user.id || user.email || `user-${index}`} className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 min-h-[240px]">
                      <div>
                        <h3 className="text-lg font-black text-cetecBlue truncate">{user.nome || 'Usuário sem nome'}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1 rounded-lg border border-indigo-100 inline-block truncate max-w-full">📧 {user.email || '-'}</span>
                          <span className="bg-sky-100 text-sky-700 border-sky-200 font-extrabold text-xs px-3 py-1 rounded-lg border truncate max-w-full">{isGlobalUser ? 'GLOBAL' : (user.utec || 'UTEC')}</span>
                        </div>
                      </div>

                      <div className="mt-1 space-y-2">
                        <span className="text-gray-600 font-extrabold text-sm block truncate">👤 Acesso: {accessLabel(access)}</span>
                        <span className="text-purple-600 font-extrabold text-sm block truncate">🏢 {isGlobalUser ? 'Acesso global' : `UTEC: ${user.utec || '-'}`}</span>
                      </div>

                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                        <span className={`status-badge ${accessClass(access)} font-black text-xs px-3 py-1.5 rounded-lg inline-flex items-center border w-fit`}>{accessLabel(access).toUpperCase()}</span>
                        {canManageUsers && (
                          <button
                            type="button"
                            onClick={() => requestDelete(user)}
                            className="bg-red-500 text-white font-black px-4 py-2.5 rounded-xl border-b-[4px] border-red-700 hover:bg-red-600 transition"
                          >
                            EXCLUIR
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <BaseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Adicionar Usuário"
        sizeClass="ui-modal-card"
        contentAs="form"
        contentProps={{ onSubmit: handleSubmit }}
        bodyClass="ui-modal-body space-y-4"
      >
        {error && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormTextInput
            label="Nome"
            value={form.nome}
            onChange={(event) => updateField('nome', event.target.value)}
            placeholder="Nome completo"
            required
          />
          <FormTextInput
            label="E-mail"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="email@exemplo.com"
            type="email"
            required
          />
          <FormTextInput
            label="Senha"
            value={form.senha}
            onChange={(event) => updateField('senha', event.target.value)}
            placeholder="Senha de acesso"
            type="password"
            required
          />
          <FormSelect
            label="Acesso"
            value={form.acesso}
            onChange={(event) => updateField('acesso', event.target.value)}
            options={[
              { value: 'administrador', label: 'Administrador' },
              { value: 'editor', label: 'Editor' },
              { value: 'leitor', label: 'Leitor' },
            ]}
            getOptionKey={(option) => option.value}
            getOptionLabel={(option) => option.label}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            selectClassName="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            optionClassName="bg-white text-gray-800 font-semibold"
            required
          />
          <FormSelect
            label="UTEC"
            value={String(form.acesso).toLowerCase() === 'administrador' ? '' : form.utec}
            onChange={(event) => updateField('utec', event.target.value)}
            options={String(form.acesso).toLowerCase() === 'administrador' ? [] : options}
            getOptionKey={(option) => option.value}
            getOptionLabel={(option) => option.label}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            selectClassName="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700 shadow-sm appearance-none bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,252,1))] pr-11"
            optionClassName="bg-white text-gray-800 font-semibold"
            disabled={String(form.acesso).toLowerCase() === 'administrador'}
            required={String(form.acesso).toLowerCase() !== 'administrador'}
          />
        </div>

        <p className="text-xs font-bold text-gray-500">
          {String(form.acesso).toLowerCase() === 'administrador'
            ? 'Usuários administradores não precisam de UTEC vinculada.'
            : 'Usuários comuns devem ficar vinculados a uma UTEC.'}
        </p>

        <ModalActionRow
          onCancel={() => setShowAddModal(false)}
          submitLabel={saving ? 'SALVANDO...' : 'SALVAR USUÁRIO'}
          saving={saving}
          submitClassName="btn-3d bg-cetecGreen text-white font-black px-5 py-2.5 rounded-xl border-b-[4px] border-cetecGreenDark hover:bg-[#7ed152] w-full sm:w-auto"
          cancelClassName="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl w-full sm:w-auto"
        />
      </BaseModal>

      <ConfirmPasswordModal
        open={Boolean(pendingDelete)}
        title="Confirmar exclusão"
        message={pendingDelete ? `Deseja mesmo excluir o usuário ${pendingDelete.nome || pendingDelete.email || 'selecionado'}? Esta ação não pode ser desfeita.` : ''}
        passwordLabel="Senha do administrador"
        passwordPlaceholder="Digite sua senha para confirmar"
        confirmLabel="Excluir usuário"
        saving={deleteSaving}
        error={deleteError}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
      />
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

function matchQuickFilter(filter, access, isGlobalUser) {
  if (filter === 'all') return true;
  if (filter === 'global') return isGlobalUser;
  if (filter === 'utec') return !isGlobalUser;
  return access === filter;
}

function accessClass(access) {
  const normalized = String(access || '').toLowerCase();
  if (normalized.includes('admin')) return 'bg-red-100 text-red-700 border-red-200';
  if (normalized.includes('edit')) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-cyan-100 text-cyan-700 border-cyan-200';
}