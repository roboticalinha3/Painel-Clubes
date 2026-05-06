import { useCallback, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
import type { ApiBaseResponse, ApiRequestPayload } from '../services/api';
import { normalizeAluno, normalizeClube, normalizeEncontro } from '../utils/clubes';
import type { Aluno, Clube, Encontro } from '../utils/clubes';
import { normalizeUtecScope } from '../utils/permissions';

type RawRecord = Record<string, unknown>;

export interface ClubeComAlunos extends Clube {
  alunos: number;
}

export interface ClubDetails {
  alunos: Aluno[];
  encontros: Encontro[];
}

export interface GenderStats {
  masculino: number;
  feminino: number;
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
  genderStats: GenderStats;
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

interface UseClubesOptions {
  userName?: string;
  utecScope?: string;
  canViewAllUtecs?: boolean;
}

export function useClubes(options: UseClubesOptions = {}): UseClubesResult {
  const {
    userName = '',
    utecScope: explicitScope = '',
    canViewAllUtecs = false,
  } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clubes, setClubes] = useState<ClubeComAlunos[]>([]);
  const [details, setDetails] = useState<ClubDetails>({ alunos: [], encontros: [] });
  const [genderStats, setGenderStats] = useState<GenderStats>({ masculino: 0, feminino: 0 });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const utecScope = canViewAllUtecs ? '' : normalizeUtecScope(explicitScope || userName);

  const loadClubes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [clubesRaw, alunosGlobalRaw, alunosDetalhesRaw] = await Promise.all([
        apiGet<unknown>({ acao: 'listar_clubes', _t: Date.now() }),
        apiGet<unknown>({ acao: 'listar_alunos', _t: Date.now() }),
        apiGet<unknown>({ acao: 'listar_alunos_detalhes', _t: Date.now() }),
      ]);
      const clubesNorm = Array.isArray(clubesRaw) ? clubesRaw.map(normalizeClube) : [];
      const clubesVisiveis = filterClubesByUtec(clubesNorm, utecScope);
      const alunosRows = extractRows(alunosGlobalRaw);
      const alunosDetalhesRows = extractRows(alunosDetalhesRaw);
      const clubIdByName = clubesNorm.reduce<Record<string, string>>((acc, clube) => {
        const clubId = String(clube.id || '').trim();
        const nomeKey = normalizeTextRef(clube.nome);
        if (!clubId || !nomeKey) return acc;
        acc[nomeKey] = clubId;
        return acc;
      }, {});

      const clubeIdByVisibleId = clubesVisiveis.reduce<Record<string, boolean>>((acc, clube) => {
        const clubId = normalizeIdRef(clube.id);
        if (clubId) acc[clubId] = true;
        return acc;
      }, {});

      const clubesComAlunos = buildClubesComAlunos(clubesVisiveis, alunosRows, clubIdByName);
      setClubes(clubesComAlunos);
      setGenderStats(buildGenderStats(alunosDetalhesRows, clubIdByName, clubeIdByVisibleId));
    } catch (err) {
      console.error(err);
      setGenderStats({ masculino: 0, feminino: 0 });
      setError('Erro ao carregar os clubes.');
    } finally {
      setLoading(false);
    }
  }, [utecScope]);

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
  }, [utecScope]);

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

function buildGenderStats(rows: unknown[], clubIdByName: Record<string, string> = {}, allowedClubIds: Record<string, boolean> = {}): GenderStats {
  return rows.reduce<GenderStats>((acc, row) => {
    const clubName = extractAlunoClubName(row);
    const clubId = normalizeTextRef(clubName) ? clubIdByName[normalizeTextRef(clubName)] || '' : '';
    if (Object.keys(allowedClubIds).length > 0 && (!clubId || !allowedClubIds[normalizeIdRef(clubId)])) {
      return acc;
    }

    const sexo = extractSexo(row);
    if (sexo === 'M') acc.masculino += 1;
    if (sexo === 'F') acc.feminino += 1;
    return acc;
  }, { masculino: 0, feminino: 0 });
}

function buildClubesComAlunos(clubes: Clube[], alunosRows: unknown[], clubeIdByName: Record<string, string>): ClubeComAlunos[] {
  if (!clubes.length) return [];

  const alunosGlobal = alunosRows.map(normalizeAluno);
  const alunosByClubId = alunosGlobal.reduce<Record<string, number>>((acc, aluno) => {
    const clubId = normalizeIdRef(aluno.idClube);
    if (!clubId) return acc;
    acc[clubId] = (acc[clubId] || 0) + 1;
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

  return clubes.map((clube): ClubeComAlunos => {
    const clubId = normalizeIdRef(clube.id);
    const alunosFallback = typeof clube.alunos === 'number' && Number.isFinite(clube.alunos) ? clube.alunos : 0;
    return {
      ...clube,
      alunos: clubId
        ? (alunosByClubId[clubId] || alunosByClubName[clubId] || alunosFallback)
        : alunosFallback,
    };
  });
}

function filterClubesByUtec(clubes: Clube[], utecScope: string): Clube[] {
  if (!utecScope) return clubes;
  return clubes.filter((clube) => normalizeIdRef(clube.utec) === normalizeIdRef(utecScope));
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

function extractSexo(row: unknown): 'M' | 'F' | '' {
  if (!row || typeof row !== 'object') return '';
  const data = row as Record<string, unknown>;

  const direct = data.SEXO ?? data.sexo ?? data.Sexo;
  if (direct !== undefined && direct !== null) {
    const value = String(direct).trim().toUpperCase();
    if (value === 'M' || value === 'MASCULINO') return 'M';
    if (value === 'F' || value === 'FEMININO') return 'F';
  }

  const normalizedEntries = Object.entries(data).map(([key, value]) => ({
    key: normalizeTextRef(key),
    value,
  }));

  const match = normalizedEntries.find((entry) => entry.key === 'sexo');
  if (!match) return '';

  const text = String(match.value ?? '').trim().toUpperCase();
  if (text === 'M' || text === 'MASCULINO') return 'M';
  if (text === 'F' || text === 'FEMININO') return 'F';
  return '';
}
