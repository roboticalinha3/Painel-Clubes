import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbysMIlnJNgAwtLSnIQ3GaUts8nxFZ5k1ekeaowT9Uc4zbhE5s21ixK5Twvo6KY4712C/exec';
const API_URL = process.env.VITE_API_URL || DEFAULT_API_URL;
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Uso: npm run import:clubes -- caminho/para/clubes.json');
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), inputPath);
const raw = await fs.readFile(absolutePath, 'utf8');
const clubs = JSON.parse(raw);

if (!Array.isArray(clubs)) {
  console.error('O arquivo precisa conter um array JSON de clubes.');
  process.exit(1);
}

let imported = 0;
let failed = 0;

for (const [index, club] of clubs.entries()) {
  const payload = {
    acao: 'salvar_clube',
    nome: upper(club.nome),
    escola: upper(club.escola),
    utec: upper(club.utec),
    prof: upper(firstDefined(club, ['prof', 'professor(a)', 'professores', 'Prof', 'Professor', 'Professores', 'Professores(as)', 'Professor(es)'])),
    estag: upper(firstDefined(club, ['estag', 'estagiario(a)', 'estagiário', 'estagiarios', 'estagiários', 'Estag', 'Estagiario', 'Estagiário', 'Estagiarios', 'Estagiários', 'Estagiários(as)'])),
    dias: upper(club.dias),
    horario: upper(club.horario),
    categoria: upper(club.categoria || 'CLUBES INICIAIS'),
    status: upper(club.status || 'pendente'),
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data?.sucesso) {
      failed += 1;
      console.error(`[${index + 1}] Falhou: ${payload.nome || 'CLUBE SEM NOME'}`);
      continue;
    }

    imported += 1;
    console.log(`[${index + 1}] Inserido: ${payload.nome || 'CLUBE SEM NOME'}`);
  } catch (error) {
    failed += 1;
    console.error(`[${index + 1}] Erro em ${payload.nome || 'CLUBE SEM NOME'}: ${error.message}`);
  }
}

console.log(`\nImportação concluída. Sucesso: ${imported}. Falhas: ${failed}.`);

function upper(value) {
  return String(value ?? '').trim().toUpperCase();
}

function firstDefined(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}
