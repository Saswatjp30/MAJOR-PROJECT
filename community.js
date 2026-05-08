/* ════════════════════════════════════════════════
   COMMUNITY REPORTS — community.js
════════════════════════════════════════════════ */

/* ── Report data ──────────────────────────────── */
const REPORTS = [
  { id:1,  type:'call',    source:'+91 98765 43210', preview:'+91 98765 43210',                  reports:81,  risk:'high',   status:'verified',  time:'2 min ago',  community:true  },
  { id:2,  type:'url',     source:'sbi-kyc-update.xyz',preview:'sbi-kyc-update.xyz',             reports:47,  risk:'high',   status:'ai',        time:'5 min ago',  community:false },
  { id:3,  type:'message', source:'"Your account is blocked, verify now…"',preview:'Your account is blocked…', reports:62, risk:'high', status:'verified', time:'9 min ago', community:true },
  { id:4,  type:'url',     source:'paytm-cashback-offer.in',preview:'paytm-cashback-offer.in',   reports:34,  risk:'high',   status:'flagged',   time:'14 min ago', community:true  },
  { id:5,  type:'call',    source:'+91 80001 22233', preview:'+91 80001 22233',                  reports:19,  risk:'medium', status:'review',    time:'18 min ago', community:true  },
  { id:6,  type:'message', source:'"Congratulations! You have won…"',preview:'Congratulations! You have won…', reports:29, risk:'high', status:'verified', time:'22 min ago', community:true },
  { id:7,  type:'url',     source:'amazon-prime-renew.net',preview:'amazon-prime-renew.net',     reports:53,  risk:'high',   status:'ai',        time:'27 min ago', community:false },
  { id:8,  type:'call',    source:'+91 70000 98877', preview:'+91 70000 98877',                  reports:8,   risk:'medium', status:'review',    time:'31 min ago', community:true  },
  { id:9,  type:'message', source:'"Your PAN is suspended…"',preview:'Your PAN is suspended…',  reports:77,  risk:'high',   status:'verified',  time:'36 min ago', community:true  },
  { id:10, type:'url',     source:'hdfc-kyc-verify.ru',preview:'hdfc-kyc-verify.ru',             reports:38,  risk:'high',   status:'flagged',   time:'41 min ago', community:false },
  { id:11, type:'call',    source:'+91 95432 11111', preview:'+91 95432 11111',                  reports:11,  risk:'medium', status:'review',    time:'45 min ago', community:true  },
  { id:12, type:'message', source:'"Free job offer — work from home…"',preview:'Free job offer — work from home…', reports:14, risk:'medium', status:'review', time:'50 min ago', community:false },
  { id:13, type:'url',     source:'icici-login-secure.in',preview:'icici-login-secure.in',       reports:22,  risk:'high',   status:'ai',        time:'55 min ago', community:false },
  { id:14, type:'call',    source:'+91 99001 45678', preview:'+91 99001 45678',                  reports:3,   risk:'low',    status:'review',    time:'1 hr ago',   community:true  },
  { id:15, type:'message', source:'"Click here to claim reward…"',preview:'Click here to claim reward…', reports:17, risk:'medium', status:'flagged', time:'1 hr ago', community:true },
];

/* ── State ────────────────────────────────────── */
let activeTab = 'all';
let selectedType = 'call';

/* ── Utilities ────────────────────────────────── */
function typeIcon(type) {
  return type==='url' ? 'ph-link-break' : type==='call' ? 'ph-phone-slash' : 'ph-chat-circle-warning';
}
function typeLabelClass(type) {
  return type==='url' ? 'type--url' : type==='call' ? 'type--call' : 'type--message';
}
function riskClass(risk) {
  return risk==='high' ? 'risk--high' : risk==='medium' ? 'risk--medium' : 'risk--low';
}
function statusClass(s) {
  return s==='verified' ? 'stat--verified' : s==='review' ? 'stat--review' : s==='flagged' ? 'stat--flagged' : 'stat--ai';
}
function statusLabel(s) {
  return s==='verified' ? '✓ Verified' : s==='review' ? '⏳ Under Review' : s==='flagged' ? '⚑ Flagged' : '⚡ AI Detected';
}

/* ── Filter ───────────────────────────────────── */
function filtered() {
  return REPORTS.filter(r => {
    if (activeTab === 'all')      return true;
    if (activeTab === 'call')     return r.type === 'call';
    if (activeTab === 'url')      return r.type === 'url';
    if (activeTab === 'message')  return r.type === 'message';
    if (activeTab === 'verified') return r.status === 'verified';
    return true;
  });
}

/* ── Build row ────────────────────────────────── */
function buildRow(r) {
  const row = document.createElement('div');
  row.className = 'cm-row';
  row.dataset.id = r.id;
  row.innerHTML = `
    <span class="cm-type-badge ${typeLabelClass(r.type)}">
      <i class="ph ${typeIcon(r.type)}"></i> ${r.type.toUpperCase()}
    </span>
    <span class="cm-source">${r.preview}</span>
    <span class="cm-reports">${r.reports}<br><span>reports</span></span>
    <span class="cm-risk ${riskClass(r.risk)}">${r.risk.toUpperCase()}</span>
    <span class="cm-status ${statusClass(r.status)}">${statusLabel(r.status)}</span>
    <span class="cm-time">${r.time}</span>
  `;
  return row;
}

/* ── Render feed ──────────────────────────────── */
function renderFeed() {
  const body = document.getElementById('cm-feed-body');
  body.innerHTML = '';
  filtered().forEach((r,i) => {
    const row = buildRow(r);
    row.style.animationDelay = `${i * 0.04}s`;
    body.appendChild(row);
  });
}

/* ── Tabs ─────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.cm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cm-tab').forEach(t => t.classList.remove('cm-tab--active'));
      tab.classList.add('cm-tab--active');
      activeTab = tab.dataset.tab;
      renderFeed();
    });
  });
}

/* ── Type selector buttons in form ───────────── */
function initTypeButtons() {
  const typeIcons = { call: 'ph-phone', url: 'ph-link-break', message: 'ph-chat-circle-warning' };
  const typePlaceholders = {
    call: '+91 XXXXX XXXXX',
    url: 'https://suspicious-url.com',
    message: 'Paste the scam message text…'
  };
  const typeLabels = { call: 'Phone Number', url: 'Phishing URL', message: 'Message Text' };

  document.querySelectorAll('.cm-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cm-type-btn').forEach(b => b.classList.remove('cm-type-btn--active'));
      btn.classList.add('cm-type-btn--active');
      selectedType = btn.dataset.type;

      const icon  = document.getElementById('cm-src-icon');
      const input = document.getElementById('cm-src-input');
      const label = document.getElementById('cm-src-label');
      if (icon)  icon.className  = `ph ${typeIcons[selectedType]} cm-input-icon`;
      if (input) input.placeholder = typePlaceholders[selectedType];
      if (label) label.textContent = typeLabels[selectedType];
      input.focus();
    });
  });
}

/* ── Submit report ────────────────────────────── */
function initForm() {
  const btn     = document.getElementById('cm-submit-btn');
  const srcInput = document.getElementById('cm-src-input');
  const success  = document.getElementById('cm-success');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const val = srcInput?.value.trim();
    if (!val) {
      srcInput.style.borderColor = 'var(--alert-red)';
      srcInput.style.boxShadow   = '0 0 0 3px rgba(244,63,94,0.12)';
      setTimeout(() => { srcInput.style.borderColor=''; srcInput.style.boxShadow=''; }, 2000);
      return;
    }

    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.7s linear infinite"></i> Submitting…';
    btn.disabled  = true;

    setTimeout(() => {
      // Add entry to feed
      const newEntry = {
        id: Date.now(), type: selectedType,
        source: val, preview: val.length > 32 ? val.slice(0,32)+'…' : val,
        reports: 1, risk: 'medium', status: 'review', time: 'just now', community: true,
      };
      REPORTS.unshift(newEntry);
      renderFeed();

      // Show success
      success.style.display = 'flex';
      srcInput.value = '';
      btn.innerHTML  = '<i class="ph ph-paper-plane-tilt"></i> Submit Report';
      btn.disabled   = false;
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    }, 1200);
  });
}

/* ── Animated counters ────────────────────────── */
function animateCounter(id, end) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1600;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now-start)/duration, 1);
    const ease = 1 - Math.pow(1-p, 3);
    el.textContent = Math.floor(ease * end).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Online count flicker ─────────────────────── */
function startOnlineFlicker() {
  const el = document.getElementById('online-count');
  if (!el) return;
  let base = 2841;
  setInterval(() => {
    base += Math.floor(Math.random()*5) - 2;
    if (base < 2800) base = 2800;
    if (base > 2900) base = 2900;
    el.textContent = base.toLocaleString();
  }, 3500);
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

/* ── Spin keyframe ────────────────────────────── */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin{to{transform:rotate(360deg);}}`;
document.head.appendChild(spinStyle);

/* ── Scroll-reveal ────────────────────────────── */
function initReveal() {
  document.querySelectorAll('.cm-stat-card,.cm-side-card,.cm-report-form').forEach((el,i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.55s ease ${i*0.06}s, transform 0.55s ease ${i*0.06}s`;
    setTimeout(() => { el.style.opacity='1'; el.style.transform='translateY(0)'; }, 100);
  });
}

/* ── Risk bar animation ───────────────────────── */
function animateRiskBars() {
  document.querySelectorAll('.cm-risk-bar-fill').forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
      bar.style.width = target;
    }));
  });
}

/* ── Init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initTabs();
  initTypeButtons();
  initForm();
  renderFeed();
  initReveal();
  animateRiskBars();

  // Stat counters
  animateCounter('cs-verified', 48291);
  animateCounter('cs-members',  12847);
  animateCounter('cs-calls',    19402);
  animateCounter('cs-urls',     7214);

  startOnlineFlicker();
});
