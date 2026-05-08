/* ════════════════════════════════════════════════
   THREAT FEED — threat-feed.js
════════════════════════════════════════════════ */

/* ── Threat data ──────────────────────────────── */
const THREATS = [
  { id:1,  type:'url',     source:'sbi-kyc-update.xyz',                preview:'sbi-kyc-update.xyz',          risk:'high',   reason:'Brand impersonation + suspicious domain',  time:'2 min ago',  status:'active',   reports:47,  confidence:'99%', explanation:'Domain registered 3 days ago, mimics SBI branding, contains phishing form harvesting OTP credentials. Redirects through 5 proxy hops.', community:true },
  { id:2,  type:'call',    source:'+91 98765 43210',                   preview:'+91 98765 43210',              risk:'high',   reason:'Reported by 28 users · TRAI impersonation', time:'5 min ago',  status:'reported', reports:28,  confidence:'97%', explanation:'Number flagged across 3 cities. Caller impersonates TRAI officials demanding immediate KYC update under threat of disconnection.', community:true },
  { id:3,  type:'message', source:'"Your account will be blocked…"',   preview:'Your account will be blocked…', risk:'high',   reason:'Urgency keywords + phishing URL',          time:'8 min ago',  status:'blocked',  reports:62,  confidence:'98%', explanation:'SMS contains urgency bait ("blocked", "immediately"), impersonates HDFC Bank, and includes a link to a credential-harvesting page.', community:false },
  { id:4,  type:'url',     source:'paytm-cashback-offer.in',           preview:'paytm-cashback-offer.in',      risk:'high',   reason:'Typosquatting + fake cashback lure',       time:'12 min ago', status:'blocked',  reports:19,  confidence:'96%', explanation:'Domain closely mimics paytm.com using typosquatting technique. Offers fake Rs.500 cashback to harvest payment details.', community:false },
  { id:5,  type:'call',    source:'+91 80000 12345',                   preview:'+91 80000 12345',              risk:'medium', reason:'Unusual call pattern from VoIP number',    time:'15 min ago', status:'active',   reports:8,   confidence:'74%', explanation:'VoIP number with short burst calling pattern typical of auto-dialer scam operations. Geographic mismatch detected.', community:true },
  { id:6,  type:'message', source:'"Congratulations! You won Rs 10L…"',preview:'Congratulations! You won Rs…', risk:'high',   reason:'Lottery scam pattern detected',            time:'18 min ago', status:'reported', reports:34,  confidence:'99%', explanation:'Classic lottery scam message. Requests processing fee before releasing winnings. Sender ID spoofed as a government entity.', community:true },
  { id:7,  type:'url',     source:'amazon-prime-renewal-india.net',    preview:'amazon-prime-renewal-india.net',risk:'high',   reason:'Amazon brand abuse + credential harvesting',time:'22 min ago', status:'blocked',  reports:53,  confidence:'98%', explanation:'Fake Amazon Prime renewal page collecting card numbers. SSL certificate is self-signed. Domain registered 1 day ago via anonymous registrar.', community:false },
  { id:8,  type:'call',    source:'+91 70012 98765',                   preview:'+91 70012 98765',              risk:'low',    reason:'Single report — needs verification',       time:'25 min ago', status:'active',   reports:1,   confidence:'42%', explanation:'Only one community report. Calling pattern does not strongly indicate scam activity. Monitor for further reports.', community:true },
  { id:9,  type:'message', source:'"Your PAN card is suspended…"',     preview:'Your PAN card is suspended…',  risk:'high',   reason:'IT Dept impersonation · urgency bait',     time:'30 min ago', status:'blocked',  reports:81,  confidence:'99%', explanation:'Impersonates Income Tax Department. Claims PAN suspension unless immediate verification is done. Links to phishing portal collecting Aadhaar + PAN data.', community:true },
  { id:10, type:'url',     source:'hdfc-bank-kyc-update.ru',           preview:'hdfc-bank-kyc-update.ru',      risk:'high',   reason:'.ru TLD + HDFC impersonation',             time:'35 min ago', status:'blocked',  reports:38,  confidence:'97%', explanation:'Russian domain (.ru) impersonating HDFC Bank. Contains replica of HDFC login page. Flagged by 38 users, multiple redirects detected.', community:false },
  { id:11, type:'call',    source:'+91 95432 11111',                   preview:'+91 95432 11111',              risk:'medium', reason:'Repeated calls · potential harassment',    time:'38 min ago', status:'reported', reports:11,  confidence:'68%', explanation:'Multiple calls reported within a short window from same number. Pattern consistent with pressure-selling or harassment scam.', community:true },
  { id:12, type:'message', source:'"Free job offer — work from home"', preview:'Free job offer — work from home',risk:'medium', reason:'Job scam keywords · suspicious URL',      time:'42 min ago', status:'active',   reports:14,  confidence:'81%', explanation:'Contains work-from-home job offer with unrealistic salary promises. Links to a third-party form harvesting personal and banking information.', community:false },
  { id:13, type:'url',     source:'bit.ly/free-jio-data-2026',        preview:'bit.ly/free-jio-data-2026',    risk:'medium', reason:'Shortened URL · potential redirect chain', time:'47 min ago', status:'active',   reports:6,   confidence:'65%', explanation:'Shortened URL redirecting to a Jio impersonation page offering free data. Redirect chain obscures the final destination.', community:true },
  { id:14, type:'call',    source:'+91 99001 87654',                   preview:'+91 99001 87654',              risk:'low',    reason:'Low risk — 2 reports only',               time:'52 min ago', status:'active',   reports:2,   confidence:'35%', explanation:'Very few community reports. Insufficient evidence for high-risk classification. Continue monitoring.', community:false },
  { id:15, type:'message', source:'"Your SBI OTP is 837621…"',         preview:'Your SBI OTP is 837621…',     risk:'high',   reason:'OTP phishing · SBI impersonation',        time:'58 min ago', status:'verified', reports:29,  confidence:'99%', explanation:'Message designed to trick user into revealing OTP by creating a false sense of legitimacy. Sender ID spoofed as official SBI short code.', community:true },
];

/* ── State ────────────────────────────────────── */
let activeFilter   = 'all';
let selectedId     = null;
let liveInterval   = null;
let newThreatIdx   = 0;

/* ── Live new-threat templates ────────────────── */
const LIVE_TEMPLATES = [
  { type:'url',     source:'icici-account-verify.xyz', risk:'high',   reason:'New phishing domain · ICICI impersonation', status:'active', reports:3,  confidence:'94%', explanation:'Newly registered domain mimicking ICICI Bank. Phishing form detected on homepage.' },
  { type:'call',    source:'+91 97650 33210',           risk:'medium', reason:'Community flagged — 5 reports',             status:'reported',reports:5, confidence:'71%', explanation:'Growing report count. Calling pattern resembles automated scam dialer.' },
  { type:'message', source:'"Click here to claim reward…"', risk:'high', reason:'Reward bait + URL harvesting',            status:'active', reports:9, confidence:'96%', explanation:'Reward lure message with urgency trigger. Linked URL collects bank credentials.' },
];

/* ── Utilities ────────────────────────────────── */
function typeIcon(type) {
  return type === 'url' ? 'ph-link-break' : type === 'call' ? 'ph-phone-slash' : 'ph-chat-circle-warning';
}
function typeLabelClass(type) {
  return type === 'url' ? 'type--url' : type === 'call' ? 'type--call' : 'type--message';
}
function riskClass(risk) {
  return risk === 'high' ? 'risk--high' : risk === 'medium' ? 'risk--medium' : 'risk--low';
}
function riskScore(risk) {
  return risk === 'high' ? Math.floor(Math.random()*10)+90 : risk === 'medium' ? Math.floor(Math.random()*20)+55 : Math.floor(Math.random()*25)+15;
}
function riskColor(risk) {
  return risk === 'high' ? 'var(--alert-red)' : risk === 'medium' ? 'var(--warn-yellow)' : 'var(--safe-green)';
}
function statusClass(s) {
  return s === 'blocked' ? 'status--blocked' : s === 'reported' ? 'status--reported' : s === 'verified' ? 'status--verified' : 'status--active';
}

/* ── Render feed ──────────────────────────────── */
function filtered() {
  return THREATS.filter(t => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'call')      return t.type === 'call';
    if (activeFilter === 'url')       return t.type === 'url';
    if (activeFilter === 'message')   return t.type === 'message';
    if (activeFilter === 'high')      return t.risk === 'high';
    if (activeFilter === 'community') return t.community;
    return true;
  });
}

function buildRow(t, prepend=false) {
  const row = document.createElement('div');
  row.className = `tf-row${selectedId===t.id?' tf-row--selected':''}${prepend?' tf-row--new':''}`;
  row.dataset.id = t.id;
  row.innerHTML = `
    <span class="tf-type-badge ${typeLabelClass(t.type)}">
      <i class="ph ${typeIcon(t.type)}"></i> ${t.type.toUpperCase()}
    </span>
    <span class="tf-source">${t.preview}</span>
    <span class="tf-risk ${riskClass(t.risk)}">${t.risk.toUpperCase()}</span>
    <span class="tf-reason">${t.reason}</span>
    <span class="tf-time">${t.time}</span>
    <span class="tf-status ${statusClass(t.status)}">${t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span>
  `;
  row.addEventListener('click', () => selectThreat(t.id));
  return row;
}

function renderFeed() {
  const list = filtered();
  document.getElementById('feed-count').textContent = list.length;
  const body = document.getElementById('tf-feed-body');
  body.innerHTML = '';
  list.forEach(t => body.appendChild(buildRow(t)));
}

/* ── Select threat → detail panel ────────────── */
function selectThreat(id) {
  selectedId = id;
  const t = THREATS.find(x => x.id === id);
  if (!t) return;

  // Highlight row
  document.querySelectorAll('.tf-row').forEach(r => r.classList.remove('tf-row--selected'));
  const row = document.querySelector(`.tf-row[data-id="${id}"]`);
  if (row) row.classList.add('tf-row--selected');

  // Show detail content
  document.getElementById('tf-detail-placeholder').style.display = 'none';
  const content = document.getElementById('tf-detail-content');
  content.style.display = 'flex';

  // Populate
  const score = riskScore(t.risk);
  document.getElementById('det-type-badge').className = `tf-type-badge ${typeLabelClass(t.type)}`;
  document.getElementById('det-type-badge').innerHTML = `<i class="ph ${typeIcon(t.type)}"></i> ${t.type.toUpperCase()}`;
  document.getElementById('det-time').textContent = t.time;
  document.getElementById('det-source').textContent = t.source;

  const fill = document.getElementById('det-risk-fill');
  fill.style.background = riskColor(t.risk);
  fill.style.width = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = 'width 0.8s cubic-bezier(0.4,0,0.2,1)';
    fill.style.width = score + '%';
  }));

  document.getElementById('det-risk-score').textContent = score + ' / 100';
  document.getElementById('det-risk-score').style.color = riskColor(t.risk);
  document.getElementById('det-risk-level').textContent = t.risk.toUpperCase() + ' RISK';
  document.getElementById('det-risk-level').style.color = riskColor(t.risk);

  document.getElementById('det-explanation').textContent = t.explanation;
  document.getElementById('det-reports').textContent = t.reports;
  document.getElementById('det-reports').style.color = riskColor(t.risk);
  document.getElementById('det-confidence').textContent = t.confidence;
  document.getElementById('det-confidence').style.color = 'var(--accent-cyan)';

  // Reset action buttons
  document.querySelectorAll('.tf-action').forEach(b => b.disabled = false);
  document.querySelectorAll('.tf-action').forEach(b => {
    const orig = b.innerHTML;
    b.addEventListener('click', () => {
      b.innerHTML = '<i class="ph ph-check"></i> Done';
      b.style.opacity = '0.7';
      setTimeout(() => { b.innerHTML = orig; b.style.opacity = ''; }, 2000);
    }, { once: true });
  });
}

/* ── Filters ──────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('.tf-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-filter').forEach(b => b.classList.remove('tf-filter--active'));
      btn.classList.add('tf-filter--active');
      activeFilter = btn.dataset.filter;
      renderFeed();
    });
  });
}

/* ── Live feed injection ──────────────────────── */
function startLiveFeed() {
  liveInterval = setInterval(() => {
    const tpl = LIVE_TEMPLATES[newThreatIdx % LIVE_TEMPLATES.length];
    newThreatIdx++;
    const newId = Date.now();
    const newEntry = {
      id: newId, ...tpl,
      time: 'just now',
      community: Math.random() > 0.5,
    };
    THREATS.unshift(newEntry);
    // Keep list manageable
    if (THREATS.length > 30) THREATS.pop();

    renderFeed();
    updateLastTime();
  }, 8000);
}

/* ── Summary bar animations ───────────────────── */
function animateSumBars() {
  document.querySelectorAll('.tf-sum-fill').forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.width = target;
    }));
  });
}

/* ── Animated counters for summary cards ──────── */
function animateCounter(id, end, suffix='') {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 1400;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(ease * end);
    el.textContent = val.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Refresh button ───────────────────────────── */
function initRefresh() {
  const btn = document.getElementById('refresh-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite"></i> Refreshing…';
    btn.disabled = true;
    setTimeout(() => {
      renderFeed();
      updateLastTime();
      btn.innerHTML = '<i class="ph ph-arrows-counter-clockwise"></i> Refresh';
      btn.disabled = false;
    }, 1200);
  });
}

/* ── Update last-update time ──────────────────── */
function updateLastTime() {
  const el = document.getElementById('last-update-time');
  if (el) el.textContent = 'just now';
}

/* ── Navbar scroll ────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

/* ── Spin keyframe ────────────────────────────── */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform:rotate(360deg); } }`;
document.head.appendChild(spinStyle);

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFilters();
  renderFeed();
  animateSumBars();

  // Animate summary counters
  animateCounter('sum-high',  2847);
  animateCounter('sum-calls', 1203);
  animateCounter('sum-urls',  7214);
  animateCounter('sum-msgs',  3892);

  initRefresh();
  startLiveFeed();

  // Auto-select first entry for demo
  setTimeout(() => selectThreat(1), 400);
});
