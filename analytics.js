/* ════════════════════════════════════════════════
   ANALYTICS DASHBOARD — analytics.js
════════════════════════════════════════════════ */

/* ── Chart.js global defaults ─────────────────── */
Chart.defaults.color = '#7C8FA6';
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

/* ── Range data sets ──────────────────────────── */
const DATA = {
  today: {
    detected: 2847, calls: 1203, urls: 7214, accuracy: '97.2',
    trend: {
      labels: ['00','02','04','06','08','10','12','14','16','18','20','22'],
      calls:   [12,8,5,20,45,80,110,95,130,105,88,62],
      urls:    [20,14,9,35,70,120,190,160,210,175,140,95],
      messages:[8,5,3,12,28,52,75,68,90,72,58,40],
    },
    stacked: {
      labels: ['00','02','04','06','08','10','12','14','16','18','20','22'],
      high:   [5,3,2,10,28,55,80,65,95,78,60,38],
      med:    [4,3,2,8,18,32,45,38,52,44,35,22],
      low:    [3,2,1,5,8,15,20,17,23,18,14,9],
    }
  },
  week: {
    detected: 18240, calls: 7819, urls: 44200, accuracy: '97.4',
    trend: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      calls:   [980,1100,1250,1050,1380,860,620],
      urls:    [3200,3800,4200,3600,5100,3200,2400],
      messages:[1200,1400,1600,1300,1900,1100,800],
    },
    stacked: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      high:   [600,720,880,700,980,600,420],
      med:    [280,320,380,300,420,240,180],
      low:    [100,120,140,110,160,80,60],
    }
  },
  month: {
    detected: 72400, calls: 29800, urls: 178000, accuracy: '97.1',
    trend: {
      labels: ['W1','W2','W3','W4'],
      calls:   [6200,7400,8100,8100],
      urls:    [32000,40000,48000,58000],
      messages:[8800,10200,12100,14200],
    },
    stacked: {
      labels: ['W1','W2','W3','W4'],
      high:   [8000,10000,12000,14000],
      med:    [3200,4200,5100,6000],
      low:    [1200,1600,2000,2400],
    }
  }
};

let activeRange = 'today';
let trendChart, donutChart, stackedChart;

/* ── Chart helpers ────────────────────────────── */
function makeGradient(ctx, color, alpha=0.3) {
  const g = ctx.createLinearGradient(0,0,0,220);
  g.addColorStop(0, color.replace(')',`,${alpha})`).replace('rgb','rgba'));
  g.addColorStop(1, color.replace(')',',0)').replace('rgb','rgba'));
  return g;
}

/* ── Trend Line Chart ─────────────────────────── */
function buildTrendChart(d) {
  const ctx = document.getElementById('chart-trend').getContext('2d');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Scam Calls', data: d.calls,
          borderColor: '#00C8E8', borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: '#00C8E8', tension: 0.4,
          fill: true, backgroundColor: (ctx2) => makeGradient(ctx2.chart.ctx, 'rgb(0,200,232)'),
        },
        {
          label: 'Phishing URLs', data: d.urls,
          borderColor: '#F43F5E', borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: '#F43F5E', tension: 0.4,
          fill: true, backgroundColor: (ctx2) => makeGradient(ctx2.chart.ctx, 'rgb(244,63,94)', 0.15),
        },
        {
          label: 'Scam Messages', data: d.messages,
          borderColor: '#8B5CF6', borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: '#8B5CF6', tension: 0.4,
          fill: true, backgroundColor: (ctx2) => makeGradient(ctx2.chart.ctx, 'rgb(139,92,246)', 0.12),
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 800 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: 'rgba(14,20,34,0.95)',
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        padding: 10, cornerRadius: 8,
      }},
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7C8FA6' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7C8FA6' }, beginAtZero: true }
      }
    }
  });
}

/* ── Donut Chart ──────────────────────────────── */
function buildDonutChart() {
  const ctx = document.getElementById('chart-donut').getContext('2d');
  if (donutChart) donutChart.destroy();
  const labels = ['Scam Calls','Phishing URLs','Scam Messages','Unknown'];
  const values = [31, 42, 21, 6];
  const colors = ['#00C8E8','#F43F5E','#8B5CF6','#EAB308'];
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels, datasets: [{
        data: values, backgroundColor: colors.map(c => c + '99'),
        borderColor: colors, borderWidth: 2, hoverBorderWidth: 3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(14,20,34,0.95)',
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          padding: 10, cornerRadius: 8,
          callbacks: { label: (item) => ` ${item.label}: ${item.parsed}%` }
        }
      }
    }
  });

  // Custom legend
  const legend = document.getElementById('donut-legend');
  legend.innerHTML = '';
  labels.forEach((l,i) => {
    legend.innerHTML += `
      <div class="an-donut-item">
        <span class="an-donut-dot" style="background:${colors[i]}"></span>
        ${l} <strong style="color:var(--text-primary);margin-left:3px">${values[i]}%</strong>
      </div>`;
  });
}

/* ── Brand Bars ───────────────────────────────── */
function buildBrandBars() {
  const brands = [
    { name:'SBI Bank', pct:38, color:'var(--alert-red)' },
    { name:'Amazon',   pct:29, color:'var(--warn-yellow)' },
    { name:'Paytm',    pct:18, color:'var(--accent-cyan)' },
    { name:'WhatsApp', pct:9,  color:'var(--safe-green)' },
    { name:'Google',   pct:6,  color:'var(--accent-purple)' },
  ];
  const list = document.getElementById('brand-list');
  list.innerHTML = '';
  brands.forEach(b => {
    const row = document.createElement('div');
    row.className = 'an-brand-row';
    row.innerHTML = `
      <span class="an-brand-name">${b.name}</span>
      <div class="an-brand-bar-wrap">
        <div class="an-brand-bar" data-w="${b.pct}" style="background:${b.color}"></div>
      </div>
      <span class="an-brand-pct" style="color:${b.color}">${b.pct}%</span>`;
    list.appendChild(row);
  });
  // Animate
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.an-brand-bar').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  }));
}

/* ── Stacked Bar Chart ────────────────────────── */
function buildStackedChart(d) {
  const ctx = document.getElementById('chart-stacked').getContext('2d');
  if (stackedChart) stackedChart.destroy();
  stackedChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        { label:'High',   data: d.high, backgroundColor:'rgba(244,63,94,0.75)',   borderRadius: 0 },
        { label:'Medium', data: d.med,  backgroundColor:'rgba(234,179,8,0.65)',   borderRadius: 0 },
        { label:'Low',    data: d.low,  backgroundColor:'rgba(34,197,94,0.55)',   borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(14,20,34,0.95)',
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          padding: 10, cornerRadius: 8,
        }
      },
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7C8FA6' } },
        y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7C8FA6' }, beginAtZero: true }
      }
    }
  });
}

/* ── Heatmap ──────────────────────────────────── */
function buildHeatmap() {
  const container = document.getElementById('an-heatmap');
  container.innerHTML = '';
  const peak = [0,0,0,0,0.1,0.2,0.15,0.3,0.6,0.8,0.9,0.95,1.0,0.85,0.75,0.7,0.8,0.75,0.6,0.45,0.3,0.2,0.1,0.05];
  peak.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'an-heat-cell';
    const r = Math.round(244 * val);
    const g = Math.round(200 - 137 * val);
    const b = Math.round(232 - 232 * val);
    cell.style.background = val < 0.05
      ? 'rgba(255,255,255,0.04)'
      : `rgba(${r},${g},${b},${0.15 + val * 0.75})`;
    cell.title = `${i.toString().padStart(2,'0')}:00 — Threat level: ${Math.round(val*100)}%`;
    container.appendChild(cell);
  });
  document.getElementById('heatmap-days').textContent = '00:00                                                           23:00';
}

/* ── Sparklines (mini SVG lines) ──────────────── */
function buildSparkline(id, data, color) {
  const container = document.getElementById(id);
  if (!container) return;
  const max = Math.max(...data);
  const w = 160; const h = 32;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - (v/max)*(h-4)}`).join(' ');
  container.innerHTML = `
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </svg>`;
}

/* ── Ring animation ───────────────────────────── */
function animateRings() {
  const circumference = 144.51;
  document.querySelectorAll('.an-ring-fill').forEach(ring => {
    const pct = parseInt(ring.dataset.pct, 10);
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
    }, 300);
  });
}

/* ── Perf bars animation ──────────────────────── */
function animatePerfBars() {
  document.querySelectorAll('.an-pbar-fill').forEach(bar => {
    const w = bar.dataset.w;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.width = w + '%';
    }));
  });
}

/* ── Animated counters ────────────────────────── */
function animateCounter(id, end, suffix='') {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now-start)/duration, 1);
    const ease = 1 - Math.pow(1-p,3);
    el.textContent = typeof end === 'string'
      ? (parseFloat(end) * ease).toFixed(1) + suffix
      : Math.floor(ease * end).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Range filter ─────────────────────────────── */
function updateRange(range) {
  activeRange = range;
  const d = DATA[range];
  animateCounter('as-detected', d.detected);
  animateCounter('as-calls',    d.calls);
  animateCounter('as-urls',     d.urls);
  animateCounter('as-accuracy', d.accuracy, '%');
  buildTrendChart(d.trend);
  buildStackedChart(d.stacked);

  const sparkData = {
    detected: d.trend.calls.map((v,i)=>v+d.trend.urls[i]+d.trend.messages[i]),
    calls:    d.trend.calls,
    urls:     d.trend.urls,
    accuracy: [97,97.1,97.3,97.0,97.4,97.2,97.5,97.1,97.3,97.4,97.2,97.2],
  };
  buildSparkline('spark-detected', sparkData.detected, '#00C8E8');
  buildSparkline('spark-calls',    sparkData.calls,    '#EAB308');
  buildSparkline('spark-urls',     sparkData.urls,     '#F43F5E');
  buildSparkline('spark-accuracy', sparkData.accuracy, '#22C55E');
}

/* ── Filters ──────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('.an-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.an-filter').forEach(b => b.classList.remove('an-filter--active'));
      btn.classList.add('an-filter--active');
      updateRange(btn.dataset.range);
    });
  });
}

/* ── Navbar scroll ────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    navbar.style.transform = (y > last+8 && y > 120) ? 'translateY(-100%)' : 'translateY(0)';
    last = y;
  }, { passive: true });
}

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFilters();
  updateRange('today');
  buildDonutChart();
  buildBrandBars();
  buildHeatmap();
  animateRings();
  animatePerfBars();
});
