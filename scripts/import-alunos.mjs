import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw3W32H-3G90jQEvne21SQURKAkEFhY2TZnuiY4Xor7JrG_iGwGatlqc6t1q8vfinH6/exec';
const API_URL = process.env.VITE_API_URL || DEFAULT_API_URL;
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Uso: npm run import:alunos -- caminho/para/alunos.json');
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), inputPath);
const raw = await fs.readFile(absolutePath, 'utf8');
const alunos = JSON.parse(raw);

if (!Array.isArray(alunos)) {
  console.error('O arquivo precisa conter um array JSON de alunos.');
  process.exit(1);
}

let imported = 0;
let failed = 0;

for (const [index, aluno] of alunos.entries()) {
  const idClube = String(firstDefined(aluno, ['id_clube', 'idClube', 'ID_Clube', 'ID Clube']) || '').trim();
  const nome = upper(firstDefined(aluno, ['nome', 'Nome']));
  const matricula = upper(firstDefined(aluno, ['matricula', 'Matricula', 'Matrícula'])) || 'S/ MATRICULA';

  if (!idClube || !nome) {
    failed += 1;
    console.error(`[${index + 1}] Falhou: registro sem id_clube ou nome.`);
    continue;
  }

  const payload = {
    acao: 'salvar_aluno',
    id_clube: idClube,
    matricula,
    nome,
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
      console.error(`[${index + 1}] Falhou: ${nome}`);
      continue;
    }

    imported += 1;
    console.log(`[${index + 1}] Inserido: ${nome}`);
  } catch (error) {
    failed += 1;
    console.error(`[${index + 1}] Erro em ${nome}: ${error.message}`);
  }
}

console.log(`\nImportacao concluida. Sucesso: ${imported}. Falhas: ${failed}.`);

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
