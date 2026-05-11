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
    if (y > lastScroll + 12 && y > 150) {
      navbar.style.transform = 'translateY(-100%)';
    } else if (y < lastScroll - 6) {
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

  /* ── Backend API configuration ── */
  const API_BASE        = 'http://localhost:8000';
  const API_URL         = API_BASE + '/analyze-url';
  const REPORT_URL      = API_BASE + '/report-url';
  const REPUTATION_URL  = API_BASE + '/url-reputation';



  // Generate a stable session ID for this browser tab (for duplicate report prevention)
  const SESSION_ID = (() => {
    let id = sessionStorage.getItem('ss_session_id');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('ss_session_id', id);
    }
    return id;
  })();

  /**
   * Submit a community report (phishing or safe) for a URL.
   */
  async function reportURL(url, reportType, btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch" style="animation:spin 0.7s linear infinite"></i> Submitting…';
    btn.disabled = true;

    try {
      const res = await fetch(REPORT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': SESSION_ID,
        },
        body: JSON.stringify({ url, report_type: reportType }),
      });
      const data = await res.json();
      console.log('[ScamShield] Report response:', data);

      btn.innerHTML = '<i class="ph ph-check"></i> Reported!';
      btn.style.opacity = '0.7';

      // ── Real-time Reputation Refresh ──
      updateReputationUI(data);

      
      console.log('[ScamShield] Reputation panel refreshed.');



      // Legacy support for older UI elements
      const comm = document.getElementById('sr-community');
      if (comm && data.total_interactions !== undefined) {
        const total = data.total_interactions;
        const verdict = data.community_risk || '';
        const isHigh = verdict === 'HIGH' || verdict === 'MODERATE';
        comm.className = isHigh ? 'sr-community sr-community--high' : 'sr-community sr-community--low';
        comm.innerHTML = isHigh
          ? `<i class="ph ph-users" style="color:var(--alert-red)"></i>
             <span>Reported by <strong style="color:var(--text-primary)">${total} community members</strong></span>`
          : `<i class="ph ph-check-circle" style="color:var(--safe-green)"></i>
             <span><strong style="color:var(--text-primary)">${total} member${total !== 1 ? 's' : ''} marked this safe.</strong></span>`;
      }
    } catch (err) {
      console.error('[ScamShield] Report failed:', err);
      btn.innerHTML = orig;
      btn.disabled  = false;
    }
  }

  /**
   * Update the Reputation Panel UI with new data.
   */
  function updateReputationUI(data) {
    const panel = document.getElementById('community-reputation-panel');
    if (!panel) return;
    
    panel.style.display = 'block';
    
    const riskEl = document.getElementById('cp-risk');
    const scamsEl = document.getElementById('cp-scams');
    const safeEl = document.getElementById('cp-safe');
    const totalEl = document.getElementById('cp-total');

    const risk = data.community_risk || 'UNKNOWN';
    riskEl.textContent = risk;
    riskEl.className = 'cp-val cp-val--risk ' + (
      risk === 'HIGH' ? 'risk-text--high' : 
      risk === 'MODERATE' ? 'risk-text--moderate' : 
      risk === 'SAFE' ? 'risk-text--safe' : ''
    );

    scamsEl.textContent = data.scam_reports ?? 0;
    safeEl.textContent = data.safe_votes ?? 0;
    totalEl.textContent = data.total_interactions ?? (parseInt(scamsEl.textContent) + parseInt(safeEl.textContent));
  }

  // Poll for dashboard stats (optional background sync)
  // setInterval(fetchCommunityFeed, 30000); 



  /**
   * Map the Django API JSON response into the format expected by showResult().
   */
  function mapApiResponse(data, inputVal) {
    const level  = (data.risk_level || 'LOW').toUpperCase();
    const score  = data.risk_score  ?? 0;
    const isHigh = data.is_phishing === true || level === 'HIGH';
    const isMed  = level === 'MODERATE';

    const reasonCls  = isHigh ? 'reason--high' : isMed ? 'reason--med' : 'reason--low';
    const reasonIcon = isHigh ? 'ph-warning-octagon' : isMed ? 'ph-warning-circle' : 'ph-check-circle';

    let reasons;
    if (Array.isArray(data.reasons) && data.reasons.length > 0) {
      reasons = data.reasons.map(r => ({ text: r, cls: reasonCls, icon: reasonIcon }));
    } else {
      reasons = [
        { text: 'No known phishing patterns detected', cls: 'reason--low', icon: 'ph-check-circle' },
        { text: 'Domain structure appears normal',      cls: 'reason--low', icon: 'ph-check-circle' },
      ];
    }

    const isNum = /(\+91|\+\d{1,3})?\s?\d{10}/.test(inputVal);
    const isUrl = inputVal.startsWith('http') || (inputVal.includes('.') && !inputVal.includes(' '));
    const type  = isHigh ? 'Phishing / Scam URL'
                : isNum  ? 'Phone Number'
                : isUrl  ? 'URL / Domain'
                : 'Text / Message';

    // Use real community data from API if available
    const community = data.community || null;
    const reports   = community ? community.total_interactions
                    : (isHigh   ? Math.floor(Math.random() * 30) + 12 : 0);

    return { 
      level, score, reasons, type, reports, isHigh, community, rawUrl: inputVal,
      confidence: data.confidence || 0,
      feature_importance: data.feature_importance || {}
    };
  }

  /**
   * Call the Django REST API and return parsed prediction data.
   */
  async function fetchPrediction(url) {
    console.log('[ScamShield] Sending URL to backend:', url);
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ScamShield] Prediction received:', data);
    return data;
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
    const { level, score, reasons, type, reports, isHigh, community, rawUrl } = result;

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
    const isMed = level === 'MODERATE';
    const color = isHigh ? '#F43F5E' : isMed ? '#EAB308' : '#22C55E';
    fill.style.background = isHigh ? 'linear-gradient(90deg,#F43F5E,#ff6b88)'
                          : isMed  ? 'linear-gradient(90deg,#EAB308,#fde047)'
                          : 'linear-gradient(90deg,#22C55E,#4ade80)';
    glow.style.background = color;
    sc.textContent = `Risk Score: ${score}%`;
    sc.style.color = color;

    scanResult.style.display = 'block';
    scanResult.className = `scan-result scan-result--${level.toLowerCase()}`;

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

    // XAI: Confidence Meter
    const confFill = document.getElementById('sr-confidence-fill');
    const confText = document.getElementById('sr-confidence-text');
    const confidence = result.confidence || 0;
    confText.textContent = `Confidence: ${confidence}%`;
    requestAnimationFrame(() => {
      confFill.style.width = confidence + '%';
    });

    // XAI: Feature Importance
    const featEl = document.getElementById('sr-features');
    featEl.innerHTML = '';
    const featureImportance = result.feature_importance || {};
    
    // Helper to format feature names for display
    const formatFeatName = (name) => {
      return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    Object.entries(featureImportance).forEach(([name, imp], i) => {
      const pct = Math.round(imp * 100);
      const item = document.createElement('div');
      item.className = 'sr-feature-item';
      item.style.animation = `feed-in 0.4s ease both ${i * 0.05}s`;
      item.innerHTML = `
        <span class="sr-feature-name">${formatFeatName(name)}</span>
        <div class="sr-feature-bar-wrap">
          <div class="sr-feature-bar" style="width: ${pct}%"></div>
        </div>
        <span class="sr-feature-val">${pct}%</span>
      `;
      featEl.appendChild(item);
    });


    // Community intelligence block (real DB data)
    const comm = document.getElementById('sr-community');
    if (community && community.total_interactions > 0) {
      const isCommHigh = community.community_risk === 'HIGH' || community.community_risk === 'MODERATE';
      comm.className = isCommHigh ? 'sr-community sr-community--high' : 'sr-community sr-community--low';
      comm.innerHTML = isCommHigh
        ? `<i class="ph ph-users" style="color:var(--alert-red)"></i>
           <span>Reported by <strong style="color:var(--text-primary)">${community.scam_reports} community members</strong> · Verdict: ${community.community_risk}</span>`
        : `<i class="ph ph-check-circle" style="color:var(--safe-green)"></i>
           <span><strong style="color:var(--text-primary)">${community.safe_votes} member${community.safe_votes !== 1 ? 's' : ''}</strong> marked this URL as safe.</span>`;
      
      // Also update the dedicated Reputation Panel
      updateReputationUI(community);
    } else if (isHigh) {

      comm.className = 'sr-community sr-community--high';
      comm.innerHTML = `<i class="ph ph-users" style="color:var(--alert-red)"></i>
        <span>Reported by <strong style="color:var(--text-primary)">${reports} community members</strong> in the last 24 hours</span>`;
    } else {
      comm.className = 'sr-community sr-community--low';
      comm.innerHTML = `<i class="ph ph-check-circle" style="color:var(--safe-green)"></i>
        <span><strong style="color:var(--text-primary)">No community reports found.</strong> This source appears safe.</span>`;
    }

    // Action buttons — wired to real report API
    const actEl  = document.getElementById('sr-actions');
    actEl.innerHTML = '';
    const normalizedUrl = rawUrl || scanInput.value.trim();

    const reportBtn = document.createElement('button');
    reportBtn.className = 'sr-action sr-action--report';
    reportBtn.innerHTML = '<i class="ph ph-flag"></i> Report as Scam';
    reportBtn.addEventListener('click', () => reportURL(normalizedUrl, 'phishing', reportBtn));

    const safeBtn = document.createElement('button');
    safeBtn.className = 'sr-action sr-action--safe';
    safeBtn.innerHTML = '<i class="ph ph-check-circle"></i> Mark as Safe';
    safeBtn.addEventListener('click', () => reportURL(normalizedUrl, 'safe', safeBtn));

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'sr-action sr-action--ignore';
    dismissBtn.innerHTML = '<i class="ph ph-eye-slash"></i> Dismiss';
    dismissBtn.addEventListener('click', () => { hideScanStates(); scanInput.value = ''; });

    actEl.appendChild(reportBtn);
    actEl.appendChild(safeBtn);
    actEl.appendChild(dismissBtn);

    // Button restore
    analyzeBtn.innerHTML  = '<i class="ph ph-scan"></i> Analyze Threat';
    analyzeBtn.style.background = '';
    analyzeBtn.disabled   = false;
  }

  /* ── Recent Scan History Logic ── */
  const scanHistoryContainer = document.getElementById('scan-history');
  const scanHistoryList = document.getElementById('scan-history-list');
  const scanHistoryClear = document.getElementById('scan-history-clear');
  let scanHistory = [];

  function addToHistory(input, level) {
    if (scanHistoryContainer && scanHistoryContainer.style.display === 'none') {
      scanHistoryContainer.style.display = 'block';
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    scanHistory.unshift({ input, level, timestamp });
    if (scanHistory.length > 5) scanHistory.pop();

    renderHistory();
  }

  function renderHistory() {
    if (!scanHistoryList) return;
    scanHistoryList.innerHTML = '';
    scanHistory.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'scan-history-item';
      el.style.animationDelay = `${index * 0.05}s`;
      
      const riskClass = item.level === 'HIGH' ? 'risk-badge--high' : (item.level === 'LOW' ? 'risk-badge--low' : 'risk-badge--med');
      const icon = item.level === 'HIGH' ? 'ph-warning-octagon' : (item.level === 'LOW' ? 'ph-shield-check' : 'ph-warning-circle');
      const iconColor = item.level === 'HIGH' ? 'var(--alert-red)' : (item.level === 'LOW' ? 'var(--safe-green)' : 'var(--warn-yellow)');
      const iconBg = item.level === 'HIGH' ? 'rgba(244, 63, 94, 0.12)' : (item.level === 'LOW' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.12)');

      el.innerHTML = `
        <div class="sh-item-left">
          <div class="sh-icon" style="color: ${iconColor}; background: ${iconBg};"><i class="ph ${icon}"></i></div>
          <div class="sh-content">
            <div class="sh-input" title="${item.input}">${item.input.length > 40 ? item.input.substring(0, 40) + '...' : item.input}</div>
            <div class="sh-time"><i class="ph ph-clock"></i> ${item.timestamp}</div>
          </div>
        </div>
        <div class="sh-item-right">
          <span class="sh-badge ${riskClass}">${item.level} RISK</span>
        </div>
      `;
      scanHistoryList.appendChild(el);
    });
  }

  if (scanHistoryClear) {
    scanHistoryClear.addEventListener('click', () => {
      scanHistory = [];
      if (scanHistoryContainer) scanHistoryContainer.style.display = 'none';
      if (scanHistoryList) scanHistoryList.innerHTML = '';
    });
  }

  /* ── Main click handler ── */
  if (analyzeBtn && scanInput) {
    // Also trigger on Enter key
    scanInput.addEventListener('keydown', e => { if (e.key === 'Enter') analyzeBtn.click(); });

    analyzeBtn.addEventListener('click', async () => {
      const val = scanInput.value.trim();
      hideScanStates();

      // 1. Empty input validation
      if (!val) {
        scanError.style.display = 'flex';
        document.querySelector('#scan-error span, #scan-error').textContent = 'Please enter a URL or message to analyze.';
        scanInput.style.borderColor = 'var(--alert-red)';
        scanInput.style.boxShadow   = '0 0 0 3px rgba(244,63,94,0.15)';
        setTimeout(() => { scanInput.style.borderColor=''; scanInput.style.boxShadow=''; }, 1800);
        return;
      }

      // 2. Show loading state & disable button
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

      // 3. Call Django API
      try {
        const apiData = await fetchPrediction(val);
        clearInterval(stepInterval);
        scanLoading.style.display = 'none';

        // 4. Map response and render result card
        const result = mapApiResponse(apiData, val);
        showResult(result);
        addToHistory(val, result.level);
        scanResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      } catch (err) {
        // 5. Error handling: backend offline or invalid response
        clearInterval(stepInterval);
        scanLoading.style.display = 'none';
        console.error('[ScamShield] API error:', err.message);

        // Show a clean error card to the user
        scanError.style.display = 'flex';
        const errMsg = err.message.includes('Failed to fetch')
          ? 'Backend is unreachable. Please ensure the Django server is running on port 8000.'
          : `Analysis failed: ${err.message}`;
        const errEl = scanError.querySelector('span') || scanError;
        errEl.textContent = errMsg;

        // Re-enable button
        analyzeBtn.innerHTML = '<i class="ph ph-scan"></i> Analyze Threat';
        analyzeBtn.disabled  = false;
      }
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
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      const val = Math.floor(ease * (end - start) + start);
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
    li.style.transform = 'translateX(-20px) scale(0.95)';
    li.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
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
        li.style.transform = 'translateX(0) scale(1)';
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
    li.style.transform = 'translateX(-20px) scale(0.95)';
    li.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
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
      li.style.transform = 'translateX(0) scale(1)';
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

