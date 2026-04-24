type RawRecord = Record<string, unknown>;

export interface Clube {
  id: string;
  nome: string;
  escola: string;
  utec: string;
  prof: string;
  estag: string;
  dias: string;
  horario: string;
  categoria: string;
  status: string;
  alunos?: number;
}

export interface Aluno {
  id: string;
  idClube: string;
  matricula: string;
  nome: string;
  dataRegistro: string;
}

export interface Encontro {
  id: string;
  idClube: string;
  modulo: string;
  assunto: string;
  data: string;
  status: string;
}

function asRecord(value: unknown): RawRecord {
  if (!value || typeof value !== 'object') return {};
  return value as RawRecord;
}

export function pickField(record: unknown, aliases: string[], fallback: unknown = ''): unknown {
  const safeRecord = asRecord(record);

  // 1) tentativa direta com os aliases informados
  for (const key of aliases) {
    const current = safeRecord[key];
    if (current !== undefined && current !== null && String(current).trim() !== '') {
      return current;
    }
  }

  // 2) fallback tolerante: ignora caixa, espacos, underscore e hifen
  const normalizedEntries = Object.entries(safeRecord).map(([key, value]) => ({
    key: normalizeLookupKey(key),
    value,
  }));

  for (const alias of aliases) {
    const normalizedAlias = normalizeLookupKey(alias);
    const match = normalizedEntries.find((entry) => entry.key === normalizedAlias);
    if (!match) continue;

    const current = match.value;
    if (current !== undefined && current !== null && String(current).trim() !== '') {
      return current;
    }
  }

  return fallback;
}

export function toUpperText(value: unknown, fallback = ''): string {
  const text = String(value ?? fallback).trim();
  return text ? text.toUpperCase() : String(fallback || '').toUpperCase();
}

export function statusKey(status: unknown): 'em_andamento' | 'concluido' | 'pendente' {
  const normalized = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'em_andamento' || normalized === 'em_andamento.') return 'em_andamento';
  if (normalized === 'concluido' || normalized === 'concluído') return 'concluido';
  return 'pendente';
}

function normalizeId(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeClube(raw: unknown): Clube {
  const alunos = parseOptionalNumber(
    pickField(raw, ['ALUNOS', 'Alunos', 'alunos', 'QTD_ALUNOS', 'QTD ALUNOS', 'Qtd Alunos', 'TOTAL_ALUNOS', 'Total Alunos'], ''),
  );

  return {
    id: normalizeId(pickField(raw, ['ID', 'id', 'ID_Clube', 'ID Clube', 'ID_CLUBE', 'IDCLUBE', 'id_clube', 'id clube', 'idclube'], '')),
    nome: toUpperText(pickField(raw, ['Nome', 'nome'], '-'), '-'),
    escola: toUpperText(pickField(raw, ['Escola', 'escola'], '-'), '-'),
    utec: toUpperText(pickField(raw, ['UTEC', 'utec'], '-'), '-'),
    prof: toUpperText(pickField(raw, ['Prof', 'Professor', 'Professores', 'Professores(as)', 'Professor(es)', 'prof', 'professor(a)', 'professores(as)'], '-'), '-'),
    estag: toUpperText(pickField(raw, ['Estag', 'Estagiario', 'Estagiário', 'Estagiarios', 'Estagiários', 'Estagiários(as)', 'estag', 'estagiario(a)', 'estagiário', 'estagiarios(as)'], '-'), '-'),
    dias: toUpperText(pickField(raw, ['Dias', 'dias'], '-'), '-'),
    horario: toUpperText(pickField(raw, ['Horario', 'Horário', 'horario'], '-'), '-'),
    categoria: toUpperText(pickField(raw, ['Categoria', 'categoria'], 'CLUBES INICIAIS'), 'CLUBES INICIAIS'),
    status: toUpperText(pickField(raw, ['Status', 'status'], 'PENDENTE'), 'PENDENTE'),
    alunos,
  };
}

export function normalizeAluno(raw: unknown): Aluno {
  return {
    id: normalizeId(pickField(raw, ['ID_Aluno', 'ID Aluno', 'id', 'ID'], '')),
    idClube: normalizeId(pickField(raw, ['ID_Clube', 'ID Clube', 'ID_CLUBE', 'IDCLUBE', 'id_clube', 'id clube', 'idclube'], '')),
    matricula: toUpperText(pickField(raw, ['Matricula', 'Matrícula', 'matricula'], ''), ''),
    nome: toUpperText(pickField(raw, ['Nome', 'nome'], '-'), '-'),
    dataRegistro: toUpperText(pickField(raw, ['Data_Registro', 'Data Registro', 'data_registro'], ''), ''),
  };
}

export function normalizeEncontro(raw: unknown): Encontro {
  return {
    id: normalizeId(pickField(raw, ['ID_Encontro', 'ID Encontro', 'id', 'ID'], '')),
    idClube: normalizeId(pickField(raw, ['ID_Clube', 'ID Clube', 'ID_CLUBE', 'IDCLUBE', 'id_clube', 'id clube', 'idclube'], '')),
    modulo: toUpperText(pickField(raw, ['Modulo', 'Módulo', 'modulo', 'Modlulo'], ''), ''),
    assunto: toUpperText(pickField(raw, ['Assunto', 'assunto'], '-'), '-'),
    data: toUpperText(pickField(raw, ['Data', 'data'], ''), ''),
    status: toUpperText(pickField(raw, ['Status', 'status'], 'A FAZER'), 'A FAZER'),
  };
}

export function parseShift(horario: unknown): 'MANHÃ' | 'TARDE' {
  const match = String(horario || '').match(/(\d{1,2})\s*:\s*\d{2}/);
  if (!match) return 'TARDE';
  const hour = Number(match[1]);
  if (Number.isNaN(hour)) return 'TARDE';
  return hour < 12 ? 'MANHÃ' : 'TARDE';
}

export function statusLabel(status: unknown): string {
  const key = statusKey(status);
  if (key === 'concluido') return 'CONCLUÍDO';
  if (key === 'em_andamento') return 'EM ANDAMENTO';
  return 'PENDENTE';
}

export function encontroStatusLabel(status: unknown): string {
  return String(status || '').trim().toUpperCase() === 'FEITO' ? 'FEITO' : 'A FAZER';
}

export function formatDateBR(dateValue: unknown): string {
  if (!dateValue) return '-';
  const date = new Date(String(dateValue));
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function normalizeLookupKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;

  const text = String(value).trim();
  if (!text) return undefined;

  const normalized = text.replace(/[.\s]/g, '').replace(',', '.');
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
