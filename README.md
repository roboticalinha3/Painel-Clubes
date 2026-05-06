# Painel de Clubes CETEC (React)

Aplicacao frontend em React + Vite para login, dashboard e gestao de clubes com integracao via Apps Script.

## Requisitos

- Node.js 20+
- npm

## Comandos

```bash
npm install
npm run dev
npm run build
```

## API

A URL da API pode ser definida de duas formas:

- `src/config.js` (padrao do projeto)
- `.env` com `VITE_API_URL`

Exemplo:

```bash
VITE_API_URL=https://script.google.com/macros/s/AKfycbw3W32H-3G90jQEvne21SQURKAkEFhY2TZnuiY4Xor7JrG_iGwGatlqc6t1q8vfinH6/exec
```

## Estrutura principal

- `src/pages`: rotas de Login, Dashboard, Clubes e Detalhes
- `src/components`: sidebar, dashboard e modais
- `src/services/api.js`: comunicacao com backend
- `src/hooks/useClubes.js`: estado e operacoes de clubes
- `src/styles/styles.css`: base visual e design system
- `src/styles/legacy.css`: layout do painel e responsividade

## Observacoes

- O projeto usa graficos com `react-chartjs-2` / `chart.js`.
- O app possui metadados para instalacao em mobile (manifest + icones em `public`).

## Geradores de Listagem UTEC

Para gerar listagens de escolas por UTEC na planilha, copie os arquivos correspondentes para o Apps Script:

- **Anos Iniciais**: `scripts/listagem-utec.js` → opcao `Painel de Clubes > Gerar listagem UTEC`
- **Anos Finais**: `scripts/listagem-utec-finais.js` → opcao `Painel de Clubes > Gerar listagem UTEC - Finais`

Se a aba de origem tiver outro nome, ajuste `SOURCE_SHEET_NAMES` no topo de cada arquivo.
