export const ACCESS_LEVELS = {
  ADMIN: 'administrador',
  EDITOR: 'editor',
  VIEWER: 'leitor',
} as const;

export type KnownAccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const USER_ROLE_STORAGE_KEY = 'usuarioPerfil';
export const USER_UTEC_SCOPE_STORAGE_KEY = 'usuarioEscopoUtec';
export const USER_VIEW_ALL_UTECS_STORAGE_KEY = 'usuarioVerTodasUtecs';

export interface UserScopeInfo {
  tipoUsuario: string;
  utecScope: string;
  verTodasUtecs: boolean;
}

export function normalizeAccessLevel(value: unknown): KnownAccessLevel | string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('admin')) return ACCESS_LEVELS.ADMIN;
  if (normalized.includes('leit') || normalized.includes('view') || normalized.includes('read')) return ACCESS_LEVELS.VIEWER;
  if (normalized.includes('edit') || normalized.includes('editor')) return ACCESS_LEVELS.EDITOR;
  if (normalized.includes('criar') || normalized.includes('cadast') || normalized.includes('create') || normalized.includes('add')) {
    return ACCESS_LEVELS.EDITOR;
  }
  if (normalized.includes('utec')) return ACCESS_LEVELS.EDITOR;
  if (normalized.includes('usu') || normalized.includes('user')) return ACCESS_LEVELS.EDITOR;
  if (!normalized) return ACCESS_LEVELS.EDITOR;
  return normalized;
}

export function accessLabel(value: unknown): string {
  const level = normalizeAccessLevel(value);
  if (level === ACCESS_LEVELS.ADMIN) return 'Administrador';
  if (level === ACCESS_LEVELS.VIEWER) return 'Leitor';
  return 'Editor';
}

export function canCreateClub(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canEditClub(value: unknown): boolean {
  return normalizeAccessLevel(value) === ACCESS_LEVELS.ADMIN;
}

export function canCreateAluno(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canCreateEncontro(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canUpdateStatus(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canDeleteAluno(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canDeleteEncontro(value: unknown): boolean {
  return normalizeAccessLevel(value) === ACCESS_LEVELS.ADMIN;
}

export function isUtecScopedUser(userName: unknown): boolean {
  return normalizeUtecScope(userName) !== '';
}

export function normalizeUtecScope(value: unknown): string {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toUpperCase();
}

export function resolveUserScope(session: unknown): UserScopeInfo {
  const record = session && typeof session === 'object' ? (session as Record<string, unknown>) : {};
  const tipoUsuario = normalizeTextValue(record.tipo_usuario ?? record.tipoUsuario ?? record.tipo ?? record.perfil);
  const verTodasUtecs = toBoolean(record.ver_todas_utecs ?? record.verTodasUtecs ?? record.todas_utecs ?? record.ver_todas_utechs);
  const utecFromPayload = normalizeUtecScope(
    record.utec ?? record.id_utec ?? record.utecId ?? record.escopo_utec ?? record.utecScope ?? '',
  );
  const fallbackFromName = normalizeUtecScope(record.nome_utec ?? record.nomeUtec ?? record.nome ?? record.name ?? '');
  const isGlobal = verTodasUtecs || tipoUsuario === 'global' || tipoUsuario === 'administrador' || normalizeAccessLevel(record.acesso) === ACCESS_LEVELS.ADMIN;

  return {
    tipoUsuario: tipoUsuario || (isGlobal ? 'global' : utecFromPayload || fallbackFromName ? 'utec' : ''),
    utecScope: isGlobal ? '' : utecFromPayload || fallbackFromName,
    verTodasUtecs: isGlobal,
  };
}

function normalizeTextValue(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = normalizeTextValue(value);
  return normalized === '1' || normalized === 'true' || normalized === 'sim' || normalized === 'yes' || normalized === 'y';
}
