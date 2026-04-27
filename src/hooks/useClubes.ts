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
      const [clubesRaw, alunosGlobalRaw] = await Promise.all([
        apiGet<unknown>({ acao: 'listar_clubes', _t: Date.now() }),
        apiGet<unknown>({ acao: 'listar_alunos', _t: Date.now() }),
      ]);
      const clubesNorm = Array.isArray(clubesRaw) ? clubesRaw.map(normalizeClube) : [];
      const alunosRows = extractRows(alunosGlobalRaw);
      const alunosGlobal = alunosRows.map(normalizeAluno);

      if (alunosGlobal.length > 0) {
        const alunosByClubId = alunosGlobal.reduce<Record<string, number>>((acc, aluno) => {
          const clubId = normalizeIdRef(aluno.idClube);
          if (!clubId) return acc;
          acc[clubId] = (acc[clubId] || 0) + 1;
          return acc;
        }, {});

        const clubeIdByName = clubesNorm.reduce<Record<string, string>>((acc, clube) => {
          const clubId = String(clube.id || '').trim();
          const nomeKey = normalizeTextRef(clube.nome);
          if (!clubId || !nomeKey) return acc;
          acc[nomeKey] = clubId;
          return acc;
        }, {});

        const alunosByClubName = alunosRows.reduce<Record<string, number>>((acc, row) => {
          const nomeClube = extractAlunoClubName(row);
          const nomeKey = normalizeTextRef(nomeClube);
          const clubId = nomeKey ? clubeIdByName[nomeKey] : '';
          if (!clubId) return acc;
          acc[clubId] = (acc[clubId] || 0) + 1;
          return acc;
        }, {});

        const clubesComAlunos = clubesNorm.map((clube): ClubeComAlunos => {
          const clubId = normalizeIdRef(clube.id);
          const alunosFallback = typeof clube.alunos === 'number' && Number.isFinite(clube.alunos) ? clube.alunos : 0;
          return {
            ...clube,
            alunos: clubId
              ? (alunosByClubId[clubId] || alunosByClubName[clubId] || alunosFallback)
              : alunosFallback,
          };
        });

        setClubes(clubesComAlunos);
        return;
      }

      const clubesComAlunos = await Promise.all(
        clubesNorm.map(async (clube): Promise<ClubeComAlunos> => {
          const alunosFallback = typeof clube.alunos === 'number' && Number.isFinite(clube.alunos) ? clube.alunos : 0;
          const clubId = String(clube?.id || '').trim();
          if (!clubId) return { ...clube, alunos: alunosFallback };

          try {
            const alunosRaw = await apiGet<unknown>({ acao: 'listar_alunos', id_clube: clubId, _t: Date.now() });
            const alunosCount = extractRows(alunosRaw).length;
            return {
              ...clube,
              alunos: alunosCount > 0 ? alunosCount : alunosFallback,
            };
          } catch {
            return {
              ...clube,
              alunos: alunosFallback,
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
        alunos: extractRows(alunosRaw).map(normalizeAluno),
        encontros: extractRows(encontrosRaw).map(normalizeEncontro),
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

  // Fallback tolerante para respostas com chaves em maiusculo/misto (ex.: DADOS, DATA).
  const knownKeys = new Set(['dados', 'data', 'rows', 'itens', 'items', 'resultado', 'result']);
  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(String(key || '').trim().toLowerCase())) continue;
    if (Array.isArray(value)) return value;
  }

  // Ultimo fallback: se houver apenas uma propriedade array, usa ela.
  const firstArray = Object.values(data).find((value) => Array.isArray(value));
  if (Array.isArray(firstArray)) return firstArray;

  return [];
}

function normalizeIdRef(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  if (!normalized) return '';
  if (/^\d+$/.test(normalized)) return normalized.replace(/^0+(?=\d)/, '');
  return normalized;
}

function normalizeTextRef(value: unknown): string {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function extractAlunoClubName(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const data = row as Record<string, unknown>;

  const aliases = [
    'CLUBE',
    'clube',
    'NOME_CLUBE',
    'nome_clube',
    'Nome Clube',
    'NOME DO CLUBE',
    'nome do clube',
    'CLUBE_NOME',
    'clube_nome',
  ];

  for (const key of aliases) {
    const current = data[key];
    if (current !== undefined && current !== null && String(current).trim() !== '') {
      return String(current);
    }
  }

  const normalizedEntries = Object.entries(data).map(([key, value]) => ({
    key: normalizeTextRef(key),
    value,
  }));
  const normalizedAliases = aliases.map((item) => normalizeTextRef(item));

  for (const alias of normalizedAliases) {
    const match = normalizedEntries.find((entry) => entry.key === alias);
    if (!match) continue;
    if (match.value !== undefined && match.value !== null && String(match.value).trim() !== '') {
      return String(match.value);
    }
  }

  return '';
}
