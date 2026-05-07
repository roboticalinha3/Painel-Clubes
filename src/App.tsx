import { useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ClubFormModal } from './components/ClubFormModal';
import { useClubes } from './hooks/useClubes';
import { DashboardPage } from './pages/DashboardPage';
import { ClubsPanelPage } from './pages/ClubsPanelPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { ClubFormPage } from './pages/ClubFormPage';
import { LoginPageRoute } from './pages/LoginPageRoute';
import { AUTH_EXPIRED_EVENT, clearSessionToken, getSessionToken, logoutSession, validateSession } from './services/api';
import type { ApiBaseResponse } from './services/api';
import {
  USER_ROLE_STORAGE_KEY,
  USER_UTEC_SCOPE_STORAGE_KEY,
  USER_VIEW_ALL_UTECS_STORAGE_KEY,
  canCreateClub,
  normalizeAccessLevel,
  resolveUserScope,
} from './utils/permissions';

interface AuthLoginPayload {
  name: string;
  access: string;
  token?: string;
  tipoUsuario?: string;
  utec?: string;
  verTodasUtecs?: boolean;
}

interface ClubFormValues {
  nome: string;
  escola: string;
  utec: string;
  prof: string;
  estag: string;
  dias: string;
  horario: string;
  categoria: string;
}

interface UtecOption {
  value: string;
  label: string;
}

interface AuthContextValue {
  userName: string;
  login: (payload: AuthLoginPayload) => void;
  logout: () => Promise<void>;
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

function AppRoutes() {
  const [userName, setUserName] = useState(localStorage.getItem('usuarioLogado') || '');
  const [userRole, setUserRole] = useState(() => normalizeAccessLevel(localStorage.getItem(USER_ROLE_STORAGE_KEY) || 'editor'));
  const [userUtecScope, setUserUtecScope] = useState(localStorage.getItem(USER_UTEC_SCOPE_STORAGE_KEY) || '');
  const [userCanSeeAllUtecs, setUserCanSeeAllUtecs] = useState(() => localStorage.getItem(USER_VIEW_ALL_UTECS_STORAGE_KEY) === 'true');
  const [sessionChecked, setSessionChecked] = useState(false);
  const [newClubModalOpen, setNewClubModalOpen] = useState(false);
  const [newClubSaving, setNewClubSaving] = useState(false);
  const [newClubModalError, setNewClubModalError] = useState('');
  const resolvedUtecScope = userCanSeeAllUtecs ? '' : userUtecScope;
  const {
    clubes,
    loading,
    error,
    details,
    genderStats,
    detailsLoading,
    detailsError,
    loadClubes,
    loadClubDetails,
    saveClub,
    saveAluno,
    deleteAluno,
    saveEncontro,
    deleteEncontro,
    updateStatus,
  } = useClubes({
    userName,
    utecScope: resolvedUtecScope,
    canViewAllUtecs: userCanSeeAllUtecs,
  });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = getSessionToken();
      if (!userName || !token) {
        if (!cancelled) setSessionChecked(true);
        return;
      }

      const session = await validateSession();
      if (cancelled) return;

      if (!session?.sucesso) {
        clearSessionToken();
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem(USER_ROLE_STORAGE_KEY);
        localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
        localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
        setUserName('');
        setUserRole('editor');
        setUserUtecScope('');
        setUserCanSeeAllUtecs(false);
        navigate('/login', { replace: true });
        setSessionChecked(true);
        return;
      }

      if (session?.nome) setUserName(session.nome);
      if (session?.acesso) {
        const normalizedRole = normalizeAccessLevel(session.acesso);
        localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizedRole);
        setUserRole(normalizedRole);
      }

      const scope = resolveUserScope(session);
      localStorage.setItem(USER_UTEC_SCOPE_STORAGE_KEY, scope.utecScope);
      localStorage.setItem(USER_VIEW_ALL_UTECS_STORAGE_KEY, String(scope.verTodasUtecs));
      setUserUtecScope(scope.utecScope);
      setUserCanSeeAllUtecs(scope.verTodasUtecs);

      setSessionChecked(true);
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, userName]);

  useEffect(() => {
    function handleAuthExpired() {
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
      localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
      setUserName('');
      setUserRole('editor');
      setUserUtecScope('');
      setUserCanSeeAllUtecs(false);
      navigate('/login', { replace: true });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [navigate]);

  const normalizedRole = normalizeAccessLevel(userRole);
  const allowCreateClub = canCreateClub(normalizedRole);
  const utecOptions = useMemo(() => buildUtecOptions(clubes, userCanSeeAllUtecs, resolvedUtecScope), [clubes, resolvedUtecScope, userCanSeeAllUtecs]);

  useEffect(() => {
    if (userName && sessionChecked) {
      loadClubes();
    }
  }, [userName, sessionChecked, loadClubes, resolvedUtecScope, userCanSeeAllUtecs]);

  const auth = useMemo<AuthContextValue>(() => ({
    userName,
    login: ({ name, access, tipoUsuario, utec, verTodasUtecs }: AuthLoginPayload) => {
      localStorage.setItem('usuarioLogado', name);
      localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizeAccessLevel(access));
      const scope = resolveUserScope({ nome: name, tipo_usuario: tipoUsuario, utec, ver_todas_utecs: verTodasUtecs });
      localStorage.setItem(USER_UTEC_SCOPE_STORAGE_KEY, scope.utecScope);
      localStorage.setItem(USER_VIEW_ALL_UTECS_STORAGE_KEY, String(scope.verTodasUtecs));
      setUserName(name);
      setUserRole(normalizeAccessLevel(access));
      setUserUtecScope(scope.utecScope);
      setUserCanSeeAllUtecs(scope.verTodasUtecs);
      setSessionChecked(true);
      navigate('/dashboard', { replace: true });
    },
    logout: async () => {
      await logoutSession();
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_UTEC_SCOPE_STORAGE_KEY);
      localStorage.removeItem(USER_VIEW_ALL_UTECS_STORAGE_KEY);
      setUserName('');
      setUserRole('editor');
      setUserUtecScope('');
      setUserCanSeeAllUtecs(false);
      setSessionChecked(true);
      navigate('/login', { replace: true });
    },
  }), [navigate, userName]);

  function openNewClubModal() {
    if (!allowCreateClub) return;
    setNewClubModalError('');
    setNewClubModalOpen(true);
  }

  async function handleCreateClub(form: ClubFormValues) {
    setNewClubSaving(true);
    setNewClubModalError('');
    try {
      const result = await saveClub({ acao: 'salvar_clube', ...form, status: 'pendente' });
      if (result?.sucesso) {
        setNewClubModalOpen(false);
        await loadClubes();
        return;
      }

      setNewClubModalError(getActionError(result, 'Não foi possível salvar o clube.'));
    } catch {
      setNewClubModalError('Não foi possível salvar o clube.');
    } finally {
      setNewClubSaving(false);
    }
  }

  if (!sessionChecked && userName) {
    return null;
  }

  if (!userName) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPageRoute userName={userName} onLogin={auth.login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={(
            <DashboardPage
              userName={auth.userName}
              allowCreateClub={allowCreateClub}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              clubes={clubes}
              genderStats={genderStats}
              loading={loading}
              error={error}
            />
          )}
        />
        <Route
          path="/clubes"
          element={(
            <ClubsPanelPage
              userName={auth.userName}
              allowCreateClub={allowCreateClub}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              clubes={clubes}
              loading={loading}
              error={error}
            />
          )}
        />
        <Route path="/clubes/novo" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/clubes/:clubId/editar"
          element={(
            <ClubFormPage
              userRole={normalizedRole}
              clubes={clubes}
              utecOptions={utecOptions as never[]}
              utecScope={resolvedUtecScope}
              canViewAllUtecs={userCanSeeAllUtecs}
              onSaveClub={saveClub}
            />
          )}
        />
        <Route
          path="/clubes/:clubId"
          element={(
            <ClubDetailPage
              userName={auth.userName}
              userRole={normalizedRole}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              clubes={clubes}
              details={details}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              onLoadDetails={loadClubDetails}
              onRefresh={loadClubes}
              onSaveAluno={saveAluno}
              onDeleteAluno={deleteAluno}
              onSaveEncontro={saveEncontro}
              onDeleteEncontro={deleteEncontro}
              onUpdateStatus={updateStatus}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ClubFormModal
        key={newClubModalOpen ? 'new-open' : 'new-closed'}
        open={newClubModalOpen}
        title="Adicionar Novo Clube"
        utecOptions={utecOptions as never[]}
        lockedUtec={resolvedUtecScope}
        showUtecPlaceholder={userCanSeeAllUtecs}
        onClose={() => setNewClubModalOpen(false)}
        onSubmit={handleCreateClub}
        saving={newClubSaving}
        error={newClubModalError}
      />
    </>
  );
}

function getActionError(response: ApiBaseResponse | unknown, fallback: string): string {
  if (!response || typeof response !== 'object') return fallback;
  const result = response as ApiBaseResponse;
  return String(result.erro || result.mensagem || result.message || fallback);
}

function buildUtecOptions(clubes: Array<{ utec?: string; nomeUtec?: string }>, canViewAllUtecs: boolean, utecScope: string): UtecOption[] {
  const normalize = (value: unknown) => String(value || '').trim().toUpperCase();
  const normalizeKey = (value: unknown) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

  if (canViewAllUtecs) {
    const options = new Map<string, UtecOption>();

    clubes.forEach((clube) => {
      const value = normalize(clube.utec);
      if (!value) return;

      const nome = String(clube.nomeUtec || '').trim();
      const label = nome || 'UTEC sem nome';
      const key = normalizeKey(value);
      if (!options.has(key)) {
        options.set(key, { value, label });
      }
    });

    return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }

  const scopedValue = normalize(utecScope);
  if (!scopedValue) return [];

  const scopedClub = clubes.find((clube) => normalizeKey(clube.utec) === normalizeKey(scopedValue));
  const value = scopedClub?.utec ? normalize(scopedClub.utec) : scopedValue;
  const labelBase = scopedClub?.nomeUtec ? String(scopedClub.nomeUtec).trim() : 'UTEC sem nome';

  return [{ value, label: labelBase }];
}

export default App;
