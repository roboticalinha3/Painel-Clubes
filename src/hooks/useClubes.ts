import { useCallback, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
import type { ApiBaseResponse, ApiRequestPayload } from '../services/api';
import { normalizeAluno, normalizeClube, normalizeEncontro } from '../utils/clubes';
import type { Aluno, Clube, Encontro } from '../utils/clubes';

type RawRecord = Record<string, unknown>;

export interface ClubeComAlunos extends Clube {
  alunos: number;
}

export interface ClubDetails {
  alunos: Aluno[];
  encontros: Encontro[];
}

interface RowsPayload extends RawRecord {
  dados?: unknown[];
  data?: unknown[];
  rows?: unknown[];
  itens?: unknown[];
}

export interface UseClubesResult {
  loading: boolean;
  error: string;
  clubes: ClubeComAlunos[];
  details: ClubDetails;
  detailsLoading: boolean;
  detailsError: string;
  loadClubes: () => Promise<void>;
  loadClubDetails: (clubId: string) => Promise<ClubDetails | null>;
  saveClub: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
  saveAluno: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
  deleteAluno: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
  saveEncontro: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
  deleteEncontro: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
  updateStatus: (payload: ApiRequestPayload) => Promise<ApiBaseResponse>;
}

export function useClubes(): UseClubesResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clubes, setClubes] = useState<ClubeComAlunos[]>([]);
  const [details, setDetails] = useState<ClubDetails>({ alunos: [], encontros: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const loadClubes = useCallback(async () => {
    setLoading(true);
    setError('');
    debugLog('Iniciando loadClubes');

    try {
      const clubesRaw = await apiGet<unknown>({ acao: 'listar_clubes', _t: Date.now() });
      const clubesNorm = Array.isArray(clubesRaw) ? clubesRaw.map(normalizeClube) : [];
      debugLog('Clubes carregados', {
        total: clubesNorm.length,
        amostraIds: clubesNorm.slice(0, 5).map((clube) => clube.id),
      });

      const clubesComAlunos: ClubeComAlunos[] = [];
      for (const clube of clubesNorm) {
        if (!clube?.id) {
          debugWarn('Clube sem ID detectado', { nome: clube.nome, escola: clube.escola });
          clubesComAlunos.push({ ...clube, alunos: resolveAlunoCount(clube) });
          continue;
        }

        const alunosCount = await fetchAlunoCountByClubId(clube.id);
        if (alunosCount === null) {
          debugWarn('Falha ao carregar alunos do clube', { id: clube.id, nome: clube.nome });
        }
        clubesComAlunos.push({
          ...clube,
          alunos: alunosCount ?? resolveAlunoCount(clube),
        });
      }

      debugLog('Contagem final de alunos por clube (amostra)', clubesComAlunos.slice(0, 8).map((clube) => ({
        id: clube.id,
        nome: clube.nome,
        alunos: clube.alunos,
      })));
      setClubes(clubesComAlunos);
    } catch (err) {
      console.error(err);
      debugError('Erro em loadClubes', err);
      setError('Erro ao carregar os clubes.');
    } finally {
      setLoading(false);
      debugLog('loadClubes finalizado');
    }
  }, []);

  const loadClubDetails = useCallback(async (clubId: string): Promise<ClubDetails | null> => {
    if (!clubId) return null;

    setDetailsLoading(true);
    setDetailsError('');
    setDetails({ alunos: [], encontros: [] });

    try {
      const [alunosRaw, encontrosRaw] = await Promise.all([
        apiGet<unknown>({ acao: 'listar_alunos', id_clube: clubId, _t: Date.now() }),
        apiGet<unknown>({ acao: 'listar_encontros', id_clube: clubId, _t: Date.now() }),
      ]);

      const nextDetails: ClubDetails = {
        alunos: extractRows(alunosRaw).map(normalizeAluno),
        encontros: extractRows(encontrosRaw).map(normalizeEncontro),
      };
      debugLog('Detalhes do clube carregados', {
        clubId,
        alunos: nextDetails.alunos.length,
        encontros: nextDetails.encontros.length,
      });
      setDetails(nextDetails);
      return nextDetails;
    } catch (err) {
      console.error(err);
      debugError('Erro em loadClubDetails', { clubId, err });
      setDetailsError('Erro ao carregar detalhes do clube.');
      return null;
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const saveClub = useCallback(async (payload: ApiRequestPayload) => {
    return apiPost<ApiBaseResponse>(payload);
  }, []);

  const saveAluno = useCallback(async (payload: ApiRequestPayload) => apiPost<ApiBaseResponse>(payload), []);
  const deleteAluno = useCallback(async (payload: ApiRequestPayload) => apiPost<ApiBaseResponse>(payload), []);
  const saveEncontro = useCallback(async (payload: ApiRequestPayload) => apiPost<ApiBaseResponse>(payload), []);
  const deleteEncontro = useCallback(async (payload: ApiRequestPayload) => apiPost<ApiBaseResponse>(payload), []);
  const updateStatus = useCallback(async (payload: ApiRequestPayload) => apiPost<ApiBaseResponse>(payload), []);

  return {
    loading,
    error,
    clubes,
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
  };
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as RowsPayload;
  if (Array.isArray(data.dados)) return data.dados;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.itens)) return data.itens;
  return [];
}

function resolveAlunoCount(clube: ClubeComAlunos, alunosPorClube: Record<string, number> = {}): number {
  if (typeof clube.alunos === 'number' && Number.isFinite(clube.alunos)) {
    return clube.alunos;
  }

  const clubId = String(clube.id || '').trim();
  return clubId ? (alunosPorClube[clubId] || 0) : 0;
}

async function fetchAlunoCountByClubId(clubId: string, maxAttempts = 2): Promise<number | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const alunosRaw = await apiGet<unknown>({ acao: 'listar_alunos', id_clube: clubId, _t: Date.now() });
      const total = extractRows(alunosRaw).length;
      debugLog('listar_alunos ok', { clubId, attempt, total });
      return total;
    } catch (err) {
      debugWarn('listar_alunos falhou', { clubId, attempt, maxAttempts, err });
      if (attempt === maxAttempts) return null;
    }
  }

  return null;
}

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const fromStorage = window.localStorage.getItem('debugPainelClubes') === '1';
    const fromQuery = window.location.search.includes('debugClubes=1');
    return fromStorage || fromQuery;
  } catch {
    return false;
  }
}

function debugLog(message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;
  if (data === undefined) {
    console.log('[PainelClubes][debug]', message);
    return;
  }
  console.log('[PainelClubes][debug]', message, data);
}

function debugWarn(message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;
  if (data === undefined) {
    console.warn('[PainelClubes][warn]', message);
    return;
  }
  console.warn('[PainelClubes][warn]', message, data);
}

function debugError(message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;
  if (data === undefined) {
    console.error('[PainelClubes][error]', message);
    return;
  }
  console.error('[PainelClubes][error]', message, data);
}
