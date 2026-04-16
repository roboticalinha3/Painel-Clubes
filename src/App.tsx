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
import { USER_ROLE_STORAGE_KEY, canCreateClub, normalizeAccessLevel } from './utils/permissions';

interface AuthLoginPayload {
  name: string;
  access: string;
  token?: string;
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
  const [userRole, setUserRole] = useState(() => normalizeAccessLevel(localStorage.getItem(USER_ROLE_STORAGE_KEY) || 'usuario'));
  const [sessionChecked, setSessionChecked] = useState(false);
  const [newClubModalOpen, setNewClubModalOpen] = useState(false);
  const [newClubSaving, setNewClubSaving] = useState(false);
  const [newClubModalError, setNewClubModalError] = useState('');
  const {
    clubes,
    loading,
    error,
    details,
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
  } = useClubes();
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
        setUserName('');
        setUserRole('usuario');
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
      setUserName('');
      setUserRole('usuario');
      navigate('/login', { replace: true });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [navigate]);

  const normalizedRole = normalizeAccessLevel(userRole);

  useEffect(() => {
    if (userName && sessionChecked) {
      loadClubes();
    }
  }, [userName, sessionChecked, loadClubes]);

  const auth = useMemo<AuthContextValue>(() => ({
    userName,
    login: ({ name, access }: AuthLoginPayload) => {
      localStorage.setItem('usuarioLogado', name);
      localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizeAccessLevel(access));
      setUserName(name);
      setUserRole(normalizeAccessLevel(access));
      setSessionChecked(true);
      navigate('/dashboard', { replace: true });
    },
    logout: async () => {
      await logoutSession();
      localStorage.removeItem('usuarioLogado');
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      setUserName('');
      setUserRole('usuario');
      setSessionChecked(true);
      navigate('/login', { replace: true });
    },
  }), [navigate, userName]);

  function openNewClubModal() {
    if (!canCreateClub(normalizedRole)) return;
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
              userRole={normalizedRole}
              onLogout={auth.logout}
              onOpenNewClubModal={openNewClubModal}
              clubes={clubes}
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
              userRole={normalizedRole}
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

export default App;
