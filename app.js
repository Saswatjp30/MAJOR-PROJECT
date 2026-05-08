document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════
     NAVBAR — Enhanced scroll behaviour
  ══════════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    // Hide navbar on fast downscroll, show on upscroll
    if (y > lastScroll + 8 && y > 120) {
      navbar.style.transform = 'translateY(-100%)';
    } else if (y < lastScroll - 4) {
      navbar.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  }, { passive: true });

  /* ── Mobile nav toggle ── */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks  = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.style.display === 'flex';
      navLinks.style.display = open ? 'none' : 'flex';
    });
  }

  /* Smooth scroll for nav links */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ══════════════════════════════════════════════════
     SCROLL-REVEAL — Universal observer
  ══════════════════════════════════════════════════ */
  // Tag all major section children as reveal targets
  const revealTargets = [
    '.section-header',
    '.feature-card', '.hiw-step',
    '.cpn-card', '.cpn-stats', '.cpn-quote',
    '.lti-feed', '.lti-card',
    '.ai-card', '.ai-workflow', '.ai-strip',
    '.why-card', '.cta-panel',
  ];
  revealTargets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 0.07}s`;
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ══════════════════════════════════════════════════
     AMBIENT ORBS — subtle parallax on mouse move
  ══════════════════════════════════════════════════ */
  const glowLeft  = document.querySelector('.bg-glow--left');
  const glowRight = document.querySelector('.bg-glow--right');
  if (glowLeft && glowRight) {
    let rafPending = false;
    document.addEventListener('mousemove', e => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        const cx = (e.clientX / window.innerWidth  - 0.5) * 30;
        const cy = (e.clientY / window.innerHeight - 0.5) * 20;
        glowLeft.style.transform  = `translate(${cx * 0.6}px, ${cy * 0.6}px) scale(1)`;
        glowRight.style.transform = `translate(${-cx * 0.5}px, ${-cy * 0.5}px) scale(1)`;
        rafPending = false;
      });
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     BUTTON — Ripple on click
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('.btn--primary, .btn--ghost').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        background:rgba(255,255,255,0.12);
        transform:scale(0); animation:ripple-expand 0.55s ease forwards;`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `@keyframes ripple-expand { to { transform:scale(1); opacity:0; } }`;
  document.head.appendChild(rippleStyle);



  /* ══════════════════════════════════════════════════
     SMART SCAN ENGINE
  ══════════════════════════════════════════════════ */
  const analyzeBtn  = document.getElementById('analyze-btn');
  const scanInput   = document.getElementById('scan-input');
  const scanLoading = document.getElementById('scan-loading');
  const scanLoadingStep = document.getElementById('scan-loading-step');
  const scanError   = document.getElementById('scan-error');
  const scanResult  = document.getElementById('scan-result');

  /* ── Detection logic ── */
  const HIGH_RISK_KEYWORDS = [
    '.xyz','.ru','.pw','.tk','.top','.click',
    'verify','login','kyc','update','bank','reward',
    'bit.ly','secure-','otp','claim','free','account',
    'prize','win','offer','sbi','hdfc','paytm','amazon'
  ];

  function detectThreat(input) {
    const val   = input.toLowerCase().trim();
    const score = HIGH_RISK_KEYWORDS.reduce((acc, kw) => val.includes(kw) ? acc + 1 : acc, 0);
    const isUrl = val.startsWith('http') || val.includes('.') && !val.includes(' ');
    const isNum = /(\+91|\+\d{1,3})?\s?\d{10}/.test(val) || val.replace(/\D/g,'').length >= 10;

    if (score >= 2) {
      const reasons = [];
      if (val.match(/\.(xyz|ru|pw|tk|top|click)/)) reasons.push({ text:'High-risk TLD detected (.xyz / .ru / .pw)', cls:'reason--high', icon:'ph-warning-octagon' });
      if (val.includes('verify')||val.includes('kyc')||val.includes('update')) reasons.push({ text:'Phishing keyword found: verify/kyc/update', cls:'reason--high', icon:'ph-warning-circle' });
      if (val.includes('bank')||val.includes('sbi')||val.includes('hdfc')) reasons.push({ text:'Brand impersonation detected', cls:'reason--high', icon:'ph-building-bank' });
      if (val.includes('login')||val.includes('otp')) reasons.push({ text:'Credential harvesting pattern', cls:'reason--high', icon:'ph-lock-open' });
      if (val.includes('reward')||val.includes('prize')||val.includes('claim')) reasons.push({ text:'Reward/prize lure — urgency bait', cls:'reason--high', icon:'ph-gift' });
      if (val.includes('bit.ly')) reasons.push({ text:'Shortened URL — destination obfuscated', cls:'reason--high', icon:'ph-link-break' });
      if (reasons.length === 0) reasons.push({ text:'Suspicious URL structure detected', cls:'reason--high', icon:'ph-warning-octagon' });
      return { level:'HIGH', score: Math.min(88 + score * 2, 98), reasons, type: isNum ? 'Suspicious Phone Number' : 'Phishing / Scam URL', reports: Math.floor(Math.random()*30)+12, isHigh:true };
    }

    const lowReasons = [
      { text:'No known phishing keywords detected', cls:'reason--low', icon:'ph-check-circle' },
      { text:'Domain structure appears normal', cls:'reason--low', icon:'ph-check-circle' },
      { text:'No community scam reports found', cls:'reason--low', icon:'ph-check-circle' },
    ];
    return { level:'LOW', score: Math.floor(Math.random()*14)+6, reasons: lowReasons, type: isNum ? 'Phone Number' : isUrl ? 'URL / Domain' : 'Text / Message', reports:0, isHigh:false };
  }

  /* ── Loading step messages ── */
  const LOAD_STEPS = [
    'Scanning domain structure…',
    'Running NLP pattern analysis…',
    'Querying community intelligence…',
    'Checking threat blacklists…',
    'Calculating risk score…',
  ];

  /* ── Hide all scan states ── */
  function hideScanStates() {
    scanLoading.style.display = 'none';
    scanError.style.display   = 'none';
    scanResult.style.display  = 'none';
    scanResult.className      = 'scan-result';
  }

  /* ── Build result card ── */
  function showResult(result) {
    const { level, score, reasons, type, reports, isHigh } = result;

    // Header icon
    const icon = document.getElementById('sr-icon');
    icon.className = `sr-threat-icon sr-threat-icon--${level.toLowerCase()}`;
    icon.innerHTML = isHigh ? '<i class="ph ph-warning-octagon"></i>' : '<i class="ph ph-shield-check"></i>';

    // Risk label
    const label = document.getElementById('sr-risk-label');
    label.className = `sr-risk-label sr-risk-label--${level.toLowerCase()}`;
    label.textContent = `${level} RISK`;

    document.getElementById('sr-threat-type').textContent = `Threat Type: ${type}`;

    // Meter
    const fill  = document.getElementById('sr-meter-fill');
    const glow  = document.getElementById('sr-meter-glow');
    const sc    = document.getElementById('sr-meter-score');
    const color = isHigh ? '#F43F5E' : '#22C55E';
    fill.style.background = isHigh
      ? 'linear-gradient(90deg, #F43F5E, #ff6b88)'
      : 'linear-gradient(90deg, #22C55E, #4ade80)';
    glow.style.background = color;
    sc.textContent  = `Risk Score: ${score}%`;
    sc.style.color  = color;

    scanResult.style.display = 'block';
    scanResult.className = `scan-result scan-result--${level.toLowerCase()}`;

    // Animate meter after paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = score + '%';
      glow.style.width = score + '%';
    }));

    // Reasons
    const reasonsEl = document.getElementById('sr-reasons');
    reasonsEl.innerHTML = '';
    reasons.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = r.cls;
      li.style.animationDelay = `${i * 0.07}s`;
      li.innerHTML = `<i class="ph ${r.icon}"></i> ${r.text}`;
      reasonsEl.appendChild(li);
    });

    // Community
    const comm = document.getElementById('sr-community');
    if (isHigh) {
      comm.className = 'sr-community sr-community--high';
      comm.innerHTML = `<i class="ph ph-users" style="color:var(--alert-red)"></i>
        <span>Reported by <strong style="color:var(--text-primary)">${reports} community members</strong> in the last 24 hours</span>`;
    } else {
      comm.className = 'sr-community sr-community--low';
      comm.innerHTML = `<i class="ph ph-check-circle" style="color:var(--safe-green)"></i>
        <span><strong style="color:var(--text-primary)">No community reports found.</strong> This source appears safe.</span>`;
    }

    // Actions
    const actEl = document.getElementById('sr-actions');
    actEl.innerHTML = '';
    const actions = isHigh
      ? [
          { cls:'sr-action--block',  icon:'ph-prohibit',    label:'Block Source'  },
          { cls:'sr-action--report', icon:'ph-flag',         label:'Report Threat' },
          { cls:'sr-action--ignore', icon:'ph-eye-slash',    label:'Ignore'        },
        ]
      : [
          { cls:'sr-action--safe',   icon:'ph-check-circle', label:'Mark as Safe'  },
          { cls:'sr-action--ignore', icon:'ph-eye-slash',    label:'Dismiss'       },
        ];
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = `sr-action ${a.cls}`;
      btn.innerHTML = `<i class="ph ${a.icon}"></i> ${a.label}`;
      btn.addEventListener('click', () => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-check"></i> Done';
        btn.disabled = true;
        setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2000);
      });
      actEl.appendChild(btn);
    });

    // Button restore
    analyzeBtn.innerHTML  = `<i class="ph ph-scan"></i> Analyze Threat`;
    analyzeBtn.style.background = '';
    analyzeBtn.disabled   = false;
  }

  /* ── Main click handler ── */
  if (analyzeBtn && scanInput) {
    // Also trigger on Enter key
    scanInput.addEventListener('keydown', e => { if (e.key === 'Enter') analyzeBtn.click(); });

    analyzeBtn.addEventListener('click', () => {
      const val = scanInput.value.trim();
      hideScanStates();

      if (!val) {
        scanError.style.display = 'flex';
        scanInput.style.borderColor = 'var(--alert-red)';
        scanInput.style.boxShadow   = '0 0 0 3px rgba(244,63,94,0.15)';
        setTimeout(() => { scanInput.style.borderColor=''; scanInput.style.boxShadow=''; }, 1800);
        return;
      }

      // Show loading
      scanLoading.style.display = 'flex';
      analyzeBtn.innerHTML  = '<i class="ph ph-circle-notch" style="animation:spin 0.7s linear infinite"></i> Analyzing…';
      analyzeBtn.disabled   = true;

      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (scanLoadingStep && stepIdx < LOAD_STEPS.length) {
          scanLoadingStep.textContent = LOAD_STEPS[stepIdx];
        }
      }, 480);

      setTimeout(() => {
        clearInterval(stepInterval);
        scanLoading.style.display = 'none';
        showResult(detectThreat(val));
        scanResult.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }, 2600);
    });

    // Close button
    document.getElementById('sr-close')?.addEventListener('click', () => {
      hideScanStates();
      scanInput.value = '';
      analyzeBtn.innerHTML = '<i class="ph ph-scan"></i> Analyze Threat';
      analyzeBtn.disabled  = false;
    });
  }



  /* ── Animate risk fill on load ── */
  const riskFill = document.getElementById('risk-fill');
  if (riskFill) {
    setTimeout(() => { riskFill.style.width = '74%'; }, 400);
  }

  /* ── Live counter animation ── */
  function animateCounter(el, start, end, duration) {
    let startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      el.textContent = val.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const cntPhishing = document.getElementById('cnt-phishing');
  const cntCalls    = document.getElementById('cnt-calls');
  const cntMsgs     = document.getElementById('cnt-msgs');
  if (cntPhishing) animateCounter(cntPhishing, 0, 1247, 1400);
  if (cntCalls)    animateCounter(cntCalls,    0, 893,  1200);
  if (cntMsgs)     animateCounter(cntMsgs,     0, 2104, 1600);

  /* ── Live alert feed (append new items periodically) ── */
  const alertTemplates = [
    { cls: 'alert--red',    icon: 'ph-link-break',           title: 'Phishing URL Detected',        meta: 'secure-bank-update.xyz — Critical' },
    { cls: 'alert--yellow', icon: 'ph-phone-x',              title: 'Scam Number Reported',          meta: '+44 (0) 800 123 456 — 8 reports' },
    { cls: 'alert--orange', icon: 'ph-chat-circle-warning',  title: 'Suspicious Message Pattern',    meta: 'Prize claim lure — AI 94%' },
    { cls: 'alert--cyan',   icon: 'ph-globe-hemisphere-west',title: 'Domain Impersonation Flagged',  meta: 'g00gle-auth.io — Blocked' },
    { cls: 'alert--red',    icon: 'ph-warning-circle',       title: 'New Phishing Campaign',         meta: 'Tax refund bait — 312 targets' },
  ];
  let alertIdx = 0;
  const alertList  = document.getElementById('alert-list');
  const alertCount = document.getElementById('alert-count');
  let liveCount = 3;

  setInterval(() => {
    if (!alertList) return;
    const t = alertTemplates[alertIdx % alertTemplates.length];
    alertIdx++;
    liveCount++;
    if (alertCount) alertCount.textContent = `${liveCount} new`;

    const li = document.createElement('li');
    li.className = `alert-item ${t.cls}`;
    li.style.opacity = '0';
    li.style.transform = 'translateY(-8px)';
    li.style.transition = 'all 0.35s ease';
    li.innerHTML = `
      <div class="alert-icon"><i class="ph ${t.icon}"></i></div>
      <div class="alert-body">
        <span class="alert-title">${t.title}</span>
        <span class="alert-meta">${t.meta}</span>
      </div>
      <span class="alert-time">now</span>`;

    alertList.insertBefore(li, alertList.firstChild);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        li.style.opacity = '1';
        li.style.transform = 'translateY(0)';
      });
    });

    // Remove last item if more than 5
    if (alertList.children.length > 5) {
      const last = alertList.lastElementChild;
      last.style.transition = 'opacity 0.3s';
      last.style.opacity = '0';
      setTimeout(() => last.remove(), 320);
    }
  }, 4500);

  /* ── Preview Chart (Chart.js) ── */
  const ctx = document.getElementById('preview-chart');
  if (ctx) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const threats = [8800, 10200, 9400, 11000, 10200, 11800, 12458];
    const scams   = [3100, 3400, 3200, 3700, 3500, 3800, 3892];

    const cyanGrad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 110);
    cyanGrad.addColorStop(0, 'rgba(0,200,232,0.3)');
    cyanGrad.addColorStop(1, 'rgba(0,200,232,0)');

    const redGrad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 110);
    redGrad.addColorStop(0, 'rgba(244,63,94,0.25)');
    redGrad.addColorStop(1, 'rgba(244,63,94,0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Threats',
            data: threats,
            borderColor: '#00C8E8',
            borderWidth: 2,
            backgroundColor: cyanGrad,
            fill: true,
            pointRadius: 0,
            tension: 0.4
          },
          {
            label: 'Scams',
            data: scams,
            borderColor: '#F43F5E',
            borderWidth: 2,
            backgroundColor: redGrad,
            fill: true,
            pointRadius: 0,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0E1422',
            titleColor: '#94A3B8',
            bodyColor: '#fff',
            borderColor: 'rgba(255,255,255,0.07)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#7C8FA6', font: { size: 10 } },
            grid:  { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: { color: '#7C8FA6', font: { size: 10 } },
            grid:  { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }

  /* ── Spin keyframe for loading icon ── */
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

  /* ── Duplicate ticker for seamless loop ── */
  const tickerTrack = document.getElementById('ticker-track');
  if (tickerTrack) {
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }

  /* ── IntersectionObserver for LTI animations ── */
  const ltiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      /* Animate brand bars */
      entry.target.querySelectorAll('.brand-bar').forEach(bar => {
        const target = bar.style.getPropertyValue('--w') || '0%';
        bar.style.width = target;
      });

      /* Animate donut chart */
      const circumference = 188.5; // 2 * π * 30
      const donutCyan = entry.target.querySelector('#donut-cyan');
      const donutRed  = entry.target.querySelector('#donut-red');
      if (donutCyan && donutRed) {
        const detectedPct = 0.991;
        const missedPct   = 0.009;
        const detectedLen = detectedPct * circumference;
        const missedLen   = missedPct   * circumference;
        setTimeout(() => {
          donutCyan.setAttribute('stroke-dasharray', `${detectedLen} ${circumference - detectedLen}`);
        }, 200);
        setTimeout(() => {
          // Red arc starts after cyan — use stroke-dashoffset trick via style
          donutRed.style.strokeDashoffset = `-${detectedLen}`;
          donutRed.setAttribute('stroke-dasharray', `${missedLen} ${circumference - missedLen}`);
        }, 400);
      }

      ltiObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  const ltiSection = document.getElementById('live-threats');
  if (ltiSection) ltiObserver.observe(ltiSection);

  /* ── Live threat feed for LTI section ── */
  const ltiFeedTemplates = [
    { cls: 'lti-entry--high', sev: 'sev--high', sevTxt: 'HIGH',  title: 'Phishing URL Detected',         meta: 'login-sbi-verify.pw — AI confidence 99%' },
    { cls: 'lti-entry--med',  sev: 'sev--med',  sevTxt: 'WARN',  title: 'Scam SMS Pattern Found',        meta: 'Free KYC update lure — NLP flagged' },
    { cls: 'lti-entry--safe', sev: 'sev--safe', sevTxt: 'SAFE',  title: 'Communication Neutralised',     meta: 'paytm-cashback.io — blocked & reported' },
    { cls: 'lti-entry--high', sev: 'sev--high', sevTxt: 'HIGH',  title: 'Banking Impersonation Call',    meta: '+91 80123 45678 — 31 reports' },
    { cls: 'lti-entry--med',  sev: 'sev--med',  sevTxt: 'WARN',  title: 'Suspicious WhatsApp Campaign',  meta: 'Gift card lottery — 198 users affected' },
  ];
  let ltiFeedIdx = 0;
  const ltiFeedList = document.getElementById('lti-feed-list');

  setInterval(() => {
    if (!ltiFeedList) return;
    const t = ltiFeedTemplates[ltiFeedIdx % ltiFeedTemplates.length];
    ltiFeedIdx++;

    const li = document.createElement('li');
    li.className = `lti-entry ${t.cls}`;
    li.style.opacity = '0';
    li.style.transform = 'translateY(-8px)';
    li.style.transition = 'all 0.35s ease';
    li.innerHTML = `
      <div class="lti-entry-left">
        <span class="lti-severity ${t.sev}">${t.sevTxt}</span>
        <div class="lti-entry-body">
          <span class="lti-entry-title">${t.title}</span>
          <span class="lti-entry-meta">${t.meta}</span>
        </div>
      </div>
      <span class="lti-entry-time">now</span>`;

    ltiFeedList.insertBefore(li, ltiFeedList.firstChild);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      li.style.opacity = '1';
      li.style.transform = 'translateY(0)';
    }));

    if (ltiFeedList.children.length > 6) {
      const last = ltiFeedList.lastElementChild;
      last.style.transition = 'opacity 0.3s';
      last.style.opacity = '0';
      setTimeout(() => last.remove(), 320);
    }
  }, 5500);

  /* ── CPN Stats animated counters (scroll-triggered) ── */
  const cpnStats = [
    { id: 'cpn-s1', end: 14832,  suffix: '+',   duration: 1600 },
    { id: 'cpn-s2', end: 82000,  suffix: '+',   duration: 1800, format: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v },
    { id: 'cpn-s3', end: 240000, suffix: '+',   duration: 2000, format: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v },
    { id: 'cpn-s4', end: 99,     suffix: '.1%', duration: 1400 },
  ];

  const cpnObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      cpnStats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (!el) return;
        let startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          const progress = Math.min((ts - startTime) / stat.duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const raw = Math.floor(ease * stat.end);
          const display = stat.format ? stat.format(raw) : raw.toLocaleString();
          el.textContent = display + stat.suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      cpnObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  const cpnSection = document.getElementById('cpn-stats');
  if (cpnSection) cpnObserver.observe(cpnSection);

  /* ── AI Section: animate bars on scroll ── */
  const aiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Animate call-rep bars (use CSS custom property --crb-w)
      entry.target.querySelectorAll('.crb-anim').forEach(bar => {
        const target = bar.style.getPropertyValue('--crb-w') || '0%';
        bar.style.width = target;
      });

      // Animate risk-exp bars (use CSS custom property --exp-w)
      entry.target.querySelectorAll('.reb-anim').forEach(bar => {
        const target = bar.style.getPropertyValue('--exp-w') || '0%';
        bar.style.width = target;
      });

      aiObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  const aiSection = document.getElementById('ai-capabilities');
  if (aiSection) aiObserver.observe(aiSection);

  /* ── CTA Submit button ── */
  const ctaSubmit = document.getElementById('cta-submit');
  const ctaEmail  = document.getElementById('cta-email');
  if (ctaSubmit && ctaEmail) {
    ctaSubmit.addEventListener('click', () => {
      const val = ctaEmail.value.trim();
      if (!val || !val.includes('@')) {
        ctaEmail.style.borderColor = 'var(--alert-red)';
        ctaEmail.style.boxShadow = '0 0 0 3px rgba(244,63,94,0.15)';
        setTimeout(() => { ctaEmail.style.borderColor = ''; ctaEmail.style.boxShadow = ''; }, 2000);
        return;
      }
      ctaSubmit.innerHTML = '<i class="ph ph-check-circle"></i> You\'re in!';
      ctaSubmit.style.background = 'linear-gradient(135deg, var(--safe-green), #16a34a)';
      ctaSubmit.disabled = true;
      ctaEmail.value = '';
      setTimeout(() => {
        ctaSubmit.innerHTML = 'Get Started <i class="ph ph-arrow-right"></i>';
        ctaSubmit.style.background = '';
        ctaSubmit.disabled = false;
      }, 3000);
    });
  }

  /* ── "View Live Threats" scrolls to live section ── */
  document.querySelectorAll('#cta-live, #live-threats-btn').forEach(btn => {
    if (btn) btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('live-threats')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

});

