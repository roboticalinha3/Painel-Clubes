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

    try {
      const clubesRaw = await apiGet<unknown>({ acao: 'listar_clubes', _t: Date.now() });
      const clubesNorm = Array.isArray(clubesRaw) ? clubesRaw.map(normalizeClube) : [];

      const clubesComAlunos = await Promise.all(
        clubesNorm.map(async (clube): Promise<ClubeComAlunos> => {
          if (!clube?.id) return { ...clube, alunos: 0 };

          try {
            const alunosRaw = await apiGet<unknown>({ acao: 'listar_alunos', id_clube: clube.id, _t: Date.now() });
            return {
              ...clube,
              alunos: extractRows(alunosRaw).length,
            };
          } catch {
            return {
              ...clube,
              alunos: 0,
            };
          }
        }),
      );

      setClubes(clubesComAlunos);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar os clubes.');
    } finally {
      setLoading(false);
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
        alunos: Array.isArray(alunosRaw) ? alunosRaw.map(normalizeAluno) : [],
        encontros: Array.isArray(encontrosRaw) ? encontrosRaw.map(normalizeEncontro) : [],
      };
      setDetails(nextDetails);
      return nextDetails;
    } catch (err) {
      console.error(err);
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
