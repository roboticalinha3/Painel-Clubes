import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = process.argv[2] || 'scripts/clubes.example.json';
const fullPath = path.resolve(process.cwd(), inputPath);
const raw = await fs.readFile(fullPath, 'utf8');
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  console.error('Arquivo invalido: precisa ser um array JSON.');
  process.exit(1);
}

const required = ['nome', 'escola', 'utec', 'prof', 'estag', 'dias', 'horario', 'categoria'];
const issues = [];
const duplicateMap = new Map();

for (const [index, row] of data.entries()) {
  const line = index + 1;

  for (const field of required) {
    if (!String(getField(row, field) ?? '').trim()) {
      issues.push(`LINHA ${line}: CAMPO VAZIO -> ${field}`);
    }
  }

  const categoria = String(row?.categoria ?? '').trim().toUpperCase();
  if (categoria !== 'FINAIS' && categoria !== 'CLUBES ANOS FINAIS') {
    issues.push(`LINHA ${line}: CATEGORIA FORA DO PADRAO -> ${row?.categoria ?? ''}`);
  }

  const key = [row?.nome, row?.escola, row?.utec, row?.horario]
    .map((item) => String(item ?? '').trim().toUpperCase())
    .join('|');

  if (duplicateMap.has(key)) {
    issues.push(`LINHA ${line}: POSSIVEL DUPLICADO DA LINHA ${duplicateMap.get(key)}`);
  } else {
    duplicateMap.set(key, line);
  }
}

console.log(`TOTAL: ${data.length}`);
console.log(`PROBLEMAS: ${issues.length}`);

if (issues.length) {
  for (const issue of issues) {
    console.log(issue);
  }
  process.exit(2);
}

console.log('VALIDACAO OK.');

function getField(row, field) {
  const aliases = {
    prof: ['prof', 'professor', 'professores', 'Prof', 'Professor', 'Professores', 'Professores(as)', 'Professor(es)'],
    estag: ['estag', 'estagiario', 'estagiário', 'estagiarios', 'estagiários', 'Estag', 'Estagiario', 'Estagiário', 'Estagiarios', 'Estagiários', 'Estagiários(as)'],
  };

  const keys = aliases[field] || [field];
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}
