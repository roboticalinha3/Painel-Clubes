import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw3W32H-3G90jQEvne21SQURKAkEFhY2TZnuiY4Xor7JrG_iGwGatlqc6t1q8vfinH6/exec';
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
    prof: upper(club.prof),
    estag: upper(club.estag),
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