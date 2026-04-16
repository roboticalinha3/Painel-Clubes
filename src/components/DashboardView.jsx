import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { statusKey } from '../utils/clubes';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
);

const ENCONTROS_META_PADRAO = 16;
const STATIC_GENDER_DISTRIBUTION = [52, 48];
const CHART_ANIMATION = { duration: 850, easing: 'easeOutQuart' };

export function DashboardView({ clubes }) {
  const analytics = buildAnalytics(clubes, clubes);
  const byCategoria = buildCategoria(clubes);
  const byStatus = buildStatusDistribuicao(clubes);
  const byUtec = buildUtec(clubes);
  const progressoEncontros = buildProgressoEncontros(clubes);
  const topAlunos = buildTopClubesPorAlunos(clubes);

  const kpis = {
    totalClubes: clubes.length,
    totalAlunos: clubes.reduce((sum, c) => sum + (c.alunos || 0), 0),
    totalEscolas: analytics.totalEscolas,
    conclusaoMedia: `${analytics.percentualMedioConclusao}%`,
  };

  const categoriaLabels = ['Iniciais', 'Mistos', 'Finais'];
  const categoriaValues = [byCategoria.iniciais, byCategoria.mistos, byCategoria.finais];
  const categoriaColors = ['#8B5CF6', '#4ECBD9', '#67BF4E'];
  const categoriaLegend = buildLegendData(categoriaLabels, categoriaValues, categoriaColors);

  const statusColors = ['#06B6D4', '#2563EB', '#22C55E'];
  const statusLegend = buildLegendData(byStatus.labels, byStatus.values, statusColors);

  const genderLabels = ['Meninos', 'Meninas'];
  const genderColors = ['#8B5CF6', '#4ECBD9'];
  const genderLegend = buildLegendData(genderLabels, analytics.generoData, genderColors);
  const genderRingData = genderLegend.map((item, index) => ({
    label: item.label,
    value: item.percentual,
    count: sanitizeNumber(analytics.generoData[index]),
    color: genderColors[index],
    rotation: [0, 10][index] ?? -90,
  }));

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pr-2">
      <section className="bi-dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi title="Total de clubes" value={kpis.totalClubes} icon="dashboard" iconClass="dashboard-kpi-icon-blue" />
          <Kpi title="Total de alunos" value={kpis.totalAlunos} icon="groups" iconClass="dashboard-kpi-icon-indigo" />
          <Kpi title="Escolas cadastradas" value={kpis.totalEscolas} icon="apartment" iconClass="dashboard-kpi-icon-blue-soft" />
          <Kpi title="Conclusão média (16 encontros)" value={kpis.conclusaoMedia} icon="monitoring" iconClass="dashboard-kpi-icon-green" />
        </div>

        <div className="bi-grid-top">
          <article className="bi-card bi-card-lg bi-ring-card">
            <h4 className="bi-title">Tipo de clubes</h4>
            <div className="bi-ring-content">
              <div className="bi-ring-legend">
                {categoriaLegend.map((item) => (
                  <div key={item.label} className="bi-ring-legend-row">
                    <span className="bi-ring-dot" style={{ backgroundColor: item.color }} />
                    <span className="bi-ring-label">{item.label}</span>
                    <span className="bi-ring-value">{item.percentual}%</span>
                  </div>
                ))}
              </div>
              <div className="bi-chart-lg bi-ring-chart">
              <Doughnut
                data={{
                  labels: categoriaLabels,
                  datasets: [{
                    data: categoriaValues,
                    backgroundColor: categoriaColors,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    spacing: 2,
                    hoverOffset: 2,
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  animation: CHART_ANIMATION,
                  cutout: '76%',
                  radius: '88%',
                  rotation: -90,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        title: (items) => {
                          const index = items?.[0]?.dataIndex ?? 0;
                          return categoriaLabels[index] || 'Tipo de clubes';
                        },
                        label: (item) => ` ${item.parsed} clubes`,
                      },
                    },
                  },
                }}
              />
              </div>
            </div>
          </article>

          <article className="bi-card bi-card-lg bi-ring-card">
            <h4 className="bi-title">Status dos clubes</h4>
            <div className="bi-ring-content">
              <div className="bi-ring-legend">
                {statusLegend.map((item) => (
                  <div key={item.label} className="bi-ring-legend-row">
                    <span className="bi-ring-dot" style={{ backgroundColor: item.color }} />
                    <span className="bi-ring-label">{item.label}</span>
                    <span className="bi-ring-value">{item.percentual}%</span>
                  </div>
                ))}
              </div>

              <div className="bi-chart-lg bi-ring-chart">
                <Doughnut
                  data={{
                    labels: byStatus.labels,
                    datasets: [{
                      data: byStatus.values,
                      backgroundColor: statusColors,
                      borderColor: 'transparent',
                      borderWidth: 0,
                      spacing: 0,
                      hoverOffset: 4,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    animation: CHART_ANIMATION,
                    cutout: '76%',
                    radius: '88%',
                    rotation: -90,
                    interaction: {
                      mode: 'nearest',
                      intersect: false,
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false,
                        callbacks: {
                          title: (items) => {
                            const index = items?.[0]?.dataIndex ?? 0;
                            return byStatus.labels[index] || 'Status';
                          },
                          label: (item) => ` ${item.parsed} clubes`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </article>

          <article className="bi-card bi-card-lg bi-ring-card">
            <h4 className="bi-title">Gênero dos alunos</h4>
            <div className="bi-ring-content bi-ring-content--stacked">
              <div className="bi-ring-legend">
                {genderLegend.map((item) => (
                  <div key={item.label} className="bi-ring-legend-row">
                    <span className="bi-ring-dot" style={{ backgroundColor: item.color }} />
                    <span className="bi-ring-label">{item.label}</span>
                    <span className="bi-ring-value">{item.percentual}%</span>
                  </div>
                ))}
              </div>

              <div className="bi-gender-rings" aria-label="Gráfico de gênero dos alunos">
                <Doughnut
                  data={{
                    labels: genderLabels,
                    datasets: genderRingData.map((item) => ({
                      label: item.label,
                      data: [item.value, Math.max(0, 100 - item.value)],
                      backgroundColor: [item.color, '#e8edf7'],
                      borderColor: '#f8fbff',
                      borderWidth: 4,
                      spacing: 2,
                      hoverOffset: 0,
                      rotation: item.rotation,
                      circumference: 360,
                      weight: 1,
                    })),
                  }}
                  options={{
                    maintainAspectRatio: false,
                    animation: CHART_ANIMATION,
                    cutout: '64%',
                    radius: '88%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        filter: (tooltipItem) => tooltipItem.dataIndex === 0,
                        callbacks: {
                          title: (items) => {
                            const datasetLabel = items?.[0]?.dataset?.label;
                            return datasetLabel || 'Gênero';
                          },
                          label: (tooltipItem) => {
                            const ring = genderRingData[tooltipItem.datasetIndex];
                            return ` ${ring?.count ?? 0} alunos`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </article>

          <article className="bi-card bi-card-lg bi-card-list bi-card-tall">
            <h4 className="bi-title">Top clubes 3 clubes com mais alunos</h4>
            <div className="bi-list bi-list-tall">
              {topAlunos.items.map((item) => (
                <div key={item.nome} className="bi-list-row">
                  <div className="bi-list-avatar">{item.nome.slice(0, 1)}</div>
                  <div className="bi-list-meta">
                    <p className="bi-list-name">{item.nome}</p>
                    <p className="bi-list-sub">{item.escola}</p>
                  </div>
                  <div className="bi-list-value">{item.alunos}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="bi-card bi-card-lg bi-utec-fill-card">
            <h4 className="bi-title">Clubes por UTEC</h4>
            <div className="bi-chart-lg">
              <Bar
                data={{
                  labels: byUtec.labels,
                  datasets: [{
                    data: byUtec.values,
                    backgroundColor: 'rgba(78,203,217,0.82)',
                    borderRadius: 8,
                    maxBarThickness: 24,
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  animation: CHART_ANIMATION,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: {
                        color: '#6b7280',
                        font: { size: 10, weight: '700' },
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        padding: 6,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(148,163,184,0.18)' },
                      ticks: { color: '#6b7280', font: { size: 10, weight: '700' }, precision: 0 },
                    },
                  },
                }}
              />
            </div>
          </article>

          <article className="bi-card bi-card-lg bi-escolas-utec-fill-card">
            <h4 className="bi-title">Progresso dos encontros</h4>
            <div className="bi-chart-lg">
              <Bar
                data={{
                  labels: progressoEncontros.labels,
                  datasets: [{
                    label: 'Clubes',
                    data: progressoEncontros.values,
                    backgroundColor: [
                      'rgba(148,163,184,0.72)',
                      'rgba(139,92,246,0.76)',
                      'rgba(78,203,217,0.78)',
                      'rgba(103,191,78,0.76)',
                    ],
                    borderRadius: 8,
                    maxBarThickness: 22,
                  }],
                }}
                options={{
                  maintainAspectRatio: false,
                  animation: CHART_ANIMATION,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          const idx = items?.[0]?.dataIndex ?? 0;
                          return progressoEncontros.labels[idx] || '';
                        },
                        label: (item) => ` ${item.parsed.y} clubes`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: { color: 'rgba(148,163,184,0.2)' },
                      ticks: { color: '#6b7280', font: { size: 10, weight: '700' }, maxRotation: 0, autoSkip: false },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(148,163,184,0.2)' },
                      ticks: { color: '#6b7280', font: { size: 10, weight: '700' }, precision: 0 },
                    },
                  },
                }}
              />
            </div>
          </article>
        </div>

      </section>
    </div>
  );
}

function Kpi({ title, value, icon, iconClass }) {
  return (
    <article className="dashboard-kpi-card dashboard-kpi-card--compact ui-surface-card">
      <div className={`dashboard-kpi-icon ${iconClass}`}>
        <span className="material-symbols-rounded">{icon}</span>
      </div>
      <div>
        <p className="dashboard-kpi-label">{title}</p>
        <p className="dashboard-kpi-value">{value}</p>
      </div>
    </article>
  );
}

function buildCategoria(clubes) {
  return clubes.reduce(
    (acc, clube) => {
      const cat = String(clube.categoria || '').toLowerCase();
      if (cat.includes('iniciais')) acc.iniciais += 1;
      else if (cat.includes('mistos')) acc.mistos += 1;
      else acc.finais += 1;
      return acc;
    },
    { iniciais: 0, mistos: 0, finais: 0 },
  );
}

function buildUtec(clubes) {
  const counts = clubes.reduce((acc, clube) => {
    const key = normalizeUtecKey(clube.utec);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topItems = ordered.slice(0, 6);
  const restTotal = ordered.slice(6).reduce((sum, [, value]) => sum + value, 0);

  if (restTotal > 0) {
    topItems.push(['Outras', restTotal]);
  }

  return {
    labels: topItems.map(([label]) => stripUtecPrefix(label)),
    values: topItems.map(([, value]) => value),
  };
}

function buildProgressoEncontros(clubes) {
  const faixas = [
    { label: '0 encontros', min: 0, max: 0 },
    { label: '1-5 encontros', min: 1, max: 5 },
    { label: '6-10 encontros', min: 6, max: 10 },
    { label: '11+ encontros', min: 11, max: Infinity },
  ];

  const counts = faixas.map((faixa) =>
    clubes.filter((clube) => {
      const encontros = sanitizeNumber(clube.encontrosFeitos);
      return encontros >= faixa.min && encontros <= faixa.max;
    }).length,
  );

  return {
    labels: faixas.map((faixa) => faixa.label),
    values: counts,
  };
}

function buildStatusDistribuicao(clubes) {
  const base = { pendente: 0, em_andamento: 0, concluido: 0 };
  for (const clube of clubes) {
    const key = statusKey(clube.status);
    if (base[key] !== undefined) base[key] += 1;
  }

  return {
    labels: ['Pendente', 'Em andamento', 'Concluído'],
    values: [base.pendente, base.em_andamento, base.concluido],
  };
}

function buildTopClubesPorAlunos(clubes) {
  const ordered = [...clubes]
    .map((clube) => ({
      nome: clube.nome || 'Clube',
      escola: normalizeEscolaKey(clube.escola),
      alunos: sanitizeNumber(clube.alunos),
    }))
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 3);

  return {
    items: ordered,
  };
}

function buildAnalytics(clubesFiltrados, todosClubes) {
  const totalEscolas = countUniqueEscolas(todosClubes);
  const totalClubesFiltrados = clubesFiltrados.length;
  const totalMetaGeral = totalClubesFiltrados * ENCONTROS_META_PADRAO;

  const totalEncontrosFeitos = clubesFiltrados.reduce((sum, clube) => sum + sanitizeNumber(clube.encontrosFeitos), 0);
  const percentualGlobalExecucao = totalMetaGeral ? Math.round((totalEncontrosFeitos / totalMetaGeral) * 100) : 0;

  const clubesIniciados = clubesFiltrados.filter((clube) => sanitizeNumber(clube.encontrosFeitos) > 0).length;
  const clubesNaoIniciados = Math.max(totalClubesFiltrados - clubesIniciados, 0);

  const percentualMedioConclusao = totalClubesFiltrados
    ? Math.round(clubesFiltrados.reduce((sum, clube) => sum + computePercentualConclusao(clube), 0) / totalClubesFiltrados)
    : 0;

  const generoAcumulado = clubesFiltrados.reduce(
    (acc, clube) => {
      acc.masculino += sanitizeNumber(clube.generoMasculino);
      acc.feminino += sanitizeNumber(clube.generoFeminino);
      acc.naoInformado += sanitizeNumber(clube.generoNaoInformado);
      return acc;
    },
    { masculino: 0, feminino: 0, naoInformado: 0 },
  );

  const possuiGeneroReal = generoAcumulado.masculino + generoAcumulado.feminino + generoAcumulado.naoInformado > 0;

  return {
    totalEscolas,
    percentualGlobalExecucao,
    clubesIniciados,
    clubesNaoIniciados,
    percentualMedioConclusao,
    generoData: possuiGeneroReal
      ? [generoAcumulado.masculino, generoAcumulado.feminino, generoAcumulado.naoInformado]
      : STATIC_GENDER_DISTRIBUTION,
  };
}

function normalizeUtecKey(value) {
  const text = String(value || '').trim();
  if (!text) return 'Sem UTEC';
  return text;
}

function stripUtecPrefix(value) {
  return String(value || '')
    .replace(/^UTEC\s*/i, '')
    .trim() || 'Sem UTEC';
}

function normalizeEscolaKey(value) {
  const text = String(value || '').trim();
  if (!text || text === '-') return 'Sem Escola';
  return text;
}

function countUniqueEscolas(clubes) {
  return new Set(clubes.map((clube) => normalizeEscolaKey(clube.escola))).size;
}

function sanitizeNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

function computePercentualConclusao(clube) {
  if (clube?.percentualConclusao !== undefined && clube?.percentualConclusao !== null) {
    const fromPercent = sanitizeNumber(clube.percentualConclusao);
    return Math.max(0, Math.min(100, Math.round(fromPercent)));
  }

  const encontrosFeitos = sanitizeNumber(clube?.encontrosFeitos);
  return Math.max(0, Math.min(100, Math.round((encontrosFeitos / ENCONTROS_META_PADRAO) * 100)));
}

function buildLegendData(labels, values, colors) {
  const total = values.reduce((acc, item) => acc + sanitizeNumber(item), 0);
  return labels.map((label, index) => {
    const value = sanitizeNumber(values[index]);
    const percentual = total ? Math.round((value / total) * 100) : 0;
    return {
      label,
      value,
      percentual,
      color: colors[index] || '#94a3b8',
    };
  });
}
