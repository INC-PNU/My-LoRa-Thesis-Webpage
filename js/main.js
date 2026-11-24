/* ===================================================================
   Master's Thesis Webpage - Interactive Logic
   Author: Sean Pribadi (Pusan National University)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReadingProgress();
  initHeaderScroll();
  initTableOfContents();
  initMobileMenu();
  initAbstractTabs();
  initResultTabs();
  initLightbox();
  initSnrSimulator();
  initSotaFilter();
  initCitationModal();
  initMathRendering();
});

/* -------------------------------------------------------------
   1. Theme Management (Light Default + Dark Toggle)
------------------------------------------------------------- */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('thesis_theme_v2') || 'light';

  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('thesis_theme_v2', next);
      updateThemeIcon(next);
      redrawCurrentSimulation();
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  } else {
    icon.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  }
}

/* -------------------------------------------------------------
   2. Reading Progress & Header State
------------------------------------------------------------- */
function initReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}

/* -------------------------------------------------------------
   3. Sticky Table of Contents ScrollSpy
------------------------------------------------------------- */
function initTableOfContents() {
  const tocLinks = document.querySelectorAll('.toc-item a');
  const sections = document.querySelectorAll('.article-section');
  if (!sections.length || !tocLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          link.parentElement.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-20% 0px -68% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* -------------------------------------------------------------
   4. Mobile Menu
------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('mobile-open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('mobile-open'));
  });
}

/* -------------------------------------------------------------
   5. Multilingual Abstract Tabs
------------------------------------------------------------- */
function initAbstractTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.getAttribute('data-tab');
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = document.getElementById(`tab-${targetLang}`);
      if (target) target.classList.add('active');
    });
  });
}

/* -------------------------------------------------------------
   6. Experimental Results Tab Switcher (Chapter IV)
------------------------------------------------------------- */
function initResultTabs() {
  const buttons = document.querySelectorAll('.result-tab-btn');
  const panels = document.querySelectorAll('.result-panel');
  if (!buttons.length || !panels.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-result-tab');
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      if (target === 'all') {
        panels.forEach(p => p.classList.add('active'));
      } else {
        panels.forEach(p => p.classList.toggle('active', p.id === target));
      }
    });
  });
}

/* -------------------------------------------------------------
   7. Image Lightbox with Zoom, Pan & Captions
------------------------------------------------------------- */
let currentZoom = 1;
let isPanning = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalTitle = document.getElementById('lightbox-title');
  const modalCaption = document.getElementById('lightbox-caption');
  const zoomInBtn = document.getElementById('lightbox-zoom-in');
  const zoomOutBtn = document.getElementById('lightbox-zoom-out');
  const resetBtn = document.getElementById('lightbox-reset');
  const closeBtn = document.getElementById('lightbox-close');
  const body = document.querySelector('.lightbox-body');

  if (!modal || !modalImg) return;

  document.querySelectorAll('.figure-img-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const img = wrap.querySelector('.figure-img');
      const container = wrap.closest('.figure-container');
      const tag = container?.querySelector('.figure-tag')?.innerText || 'Figure';
      const cap = container?.querySelector('.figure-caption')?.innerText || img?.alt || '';

      if (img) {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        if (modalTitle) modalTitle.innerText = `${tag} — ${img.alt || 'High-Resolution Figure'}`;
        if (modalCaption) modalCaption.innerText = cap;
        openLightbox();
      }
    });
  });

  function openLightbox() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateImgTransform();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateImgTransform() {
    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentZoom = 1;
      translateX = 0;
      translateY = 0;
      updateImgTransform();
    });
  }
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      currentZoom = Math.min(currentZoom + 0.35, 4.0);
      updateImgTransform();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      currentZoom = Math.max(currentZoom - 0.35, 0.75);
      updateImgTransform();
    });
  }

  if (body) {
    body.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn || e.target.closest('.lightbox-toolbar')) return;
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateImgTransform();
    });

    window.addEventListener('mouseup', () => { isPanning = false; });

    body.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      currentZoom = Math.min(Math.max(0.6, currentZoom + delta), 4.5);
      updateImgTransform();
    }, { passive: false });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeCitationModal();
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === body) closeLightbox();
  });
}

/* -------------------------------------------------------------
   8. Interactive Ultra-Low SNR & Denoise-then-Sync Lab
------------------------------------------------------------- */
let audioCtx = null;
let chirpOsc = null;
let chirpGain = null;

function seededRand(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function redrawCurrentSimulation() {
  const slider = document.getElementById('snr-slider');
  const sfSelect = document.getElementById('sf-select');
  const offsetChk = document.getElementById('offset-toggle');
  const denoiserChk = document.getElementById('denoiser-toggle');
  if (!slider) return;
  drawDualSimulation(
    parseFloat(slider.value),
    parseInt(sfSelect?.value || '7', 10),
    offsetChk ? offsetChk.checked : true,
    denoiserChk ? denoiserChk.checked : false
  );
}

function initSnrSimulator() {
  const slider = document.getElementById('snr-slider');
  const sfSelect = document.getElementById('sf-select');
  const offsetChk = document.getElementById('offset-toggle');
  const denoiserChk = document.getElementById('denoiser-toggle');
  const snrVal = document.getElementById('snr-display-val');
  const regimeBadge = document.getElementById('snr-regime-badge');
  const convStatus = document.getElementById('conventional-status');
  const syncStatus = document.getElementById('sync-status');
  const pmrStatus = document.getElementById('pmr-status');
  const playBtn = document.getElementById('play-chirp-btn');

  if (!slider) return;

  const limits = { 7: -7.5, 8: -10.0, 9: -12.5, 10: -15.0, 11: -17.5, 12: -20.0 };

  const updateSim = () => {
    const snr = parseFloat(slider.value);
    const sf = parseInt(sfSelect.value, 10);
    const hasOffset = offsetChk ? offsetChk.checked : true;
    const denoiserOn = denoiserChk ? denoiserChk.checked : false;

    if (snrVal) snrVal.innerText = `${snr > 0 ? '+' : ''}${snr.toFixed(1)} dB`;

    const limit = limits[sf] || -7.5;
    if (snr >= limit) {
      regimeBadge.className = 'sim-status status-normal';
      regimeBadge.innerText = 'Standard Region';
    } else if (snr >= -15.0) {
      regimeBadge.className = 'sim-status status-limit';
      regimeBadge.innerText = 'Below Demod Limit';
    } else {
      regimeBadge.className = 'sim-status status-ultralow';
      regimeBadge.innerText = 'Ultra-Low SNR Regime';
    }

    const simStats = drawDualSimulation(snr, sf, hasOffset, denoiserOn);

    if (convStatus) {
      if (snr >= limit && !hasOffset) {
        convStatus.innerText = 'Locked (Conventional OK)';
        convStatus.style.color = 'var(--accent-emerald)';
      } else if (!denoiserOn && snr <= -16) {
        convStatus.innerText = `False Peak @ Bin ${simStats.argmaxBin}`;
        convStatus.style.color = 'var(--accent-crimson)';
      } else if (denoiserOn && snr >= -20) {
        convStatus.innerText = `True Peak @ Bin ${simStats.trueBin}`;
        convStatus.style.color = 'var(--accent-emerald)';
      } else {
        convStatus.innerText = `Bin ${simStats.argmaxBin}`;
        convStatus.style.color = 'var(--accent-amber)';
      }
    }

    if (syncStatus) {
      if (denoiserOn && snr >= -19.5) {
        syncStatus.innerText = 'Denoise-then-Sync Locked';
        syncStatus.style.color = 'var(--accent-emerald)';
      } else if (!denoiserOn && hasOffset && snr <= -16.5) {
        syncStatus.innerText = 'Stage 2 Sync Breakdown';
        syncStatus.style.color = 'var(--accent-crimson)';
      } else if (snr >= -15.5) {
        syncStatus.innerText = 'Analytical Sync OK';
        syncStatus.style.color = 'var(--accent-blue)';
      } else {
        syncStatus.innerText = 'Submerged in AWGN';
        syncStatus.style.color = 'var(--accent-amber)';
      }
    }

    if (pmrStatus) {
      pmrStatus.innerText = `${simStats.pmr.toFixed(2)}× (${simStats.pmrDb >= 0 ? '+' : ''}${simStats.pmrDb.toFixed(1)} dB)`;
    }
  };

  slider.addEventListener('input', updateSim);
  if (sfSelect) sfSelect.addEventListener('change', updateSim);
  if (offsetChk) offsetChk.addEventListener('change', updateSim);
  if (denoiserChk) denoiserChk.addEventListener('change', updateSim);
  window.addEventListener('resize', () => redrawCurrentSimulation());

  if (playBtn) {
    playBtn.addEventListener('click', () => toggleChirpAudio(parseFloat(slider.value)));
  }

  updateSim();
}

function drawDualSimulation(snr = -19, sf = 7, hasOffset = true, denoiserOn = false) {
  drawSpectrogramPane(snr, sf, hasOffset, denoiserOn);
  return drawFftPane(snr, hasOffset, denoiserOn);
}

function drawSpectrogramPane(snr, sf, hasOffset, denoiserOn) {
  const canvas = document.getElementById('chirp-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';

  ctx.fillStyle = isLight ? '#f8fafc' : '#080c14';
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += w / 6) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += h / 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Noise intensity (dramatically suppressed when denoiser is ON)
  const effectiveSnr = denoiserOn ? Math.min(10, snr + 22) : snr;
  const snrLinear = Math.pow(10, effectiveSnr / 10);
  const noiseLevel = 1 / Math.sqrt(Math.max(snrLinear, 0.002));
  const noiseDots = Math.min(3200, Math.floor(noiseLevel * 240));

  ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.45)' : 'rgba(148, 163, 184, 0.42)';
  for (let i = 0; i < noiseDots; i++) {
    const nx = seededRand(i * 1.3 + snr) * w;
    const ny = seededRand(i * 2.7 + sf) * h;
    const sz = 1.2 + seededRand(i) * 1.4;
    ctx.fillRect(nx, ny, sz, sz);
  }

  // Chirp visibility alpha
  const chirpAlpha = denoiserOn
    ? 0.96
    : Math.max(0.14, Math.min(0.98, (snr + 24) / 20));

  const marginX = 16;
  const marginY = 22;
  const usableW = w - marginX * 2;
  const usableH = h - marginY * 2;
  const cfoShiftY = hasOffset ? -11 : 0;
  const stoShiftX = hasOffset ? 10 : 0;

  // Draw 3 preamble up-chirps + 1 SFD down-chirp
  const segW = usableW / 4.2;
  ctx.save();
  ctx.lineWidth = denoiserOn ? 3.2 : 2.8;
  ctx.lineCap = 'round';

  for (let c = 0; c < 3; c++) {
    ctx.strokeStyle = isLight
      ? `rgba(37, 99, 235, ${chirpAlpha})`
      : `rgba(56, 189, 248, ${chirpAlpha})`;
    const x0 = marginX + stoShiftX + c * segW;
    const x1 = x0 + segW * 0.92;
    ctx.beginPath();
    ctx.moveTo(x0, h - marginY + cfoShiftY);
    ctx.lineTo(x1, marginY + cfoShiftY);
    ctx.stroke();
  }

  // SFD Down-chirp
  ctx.strokeStyle = isLight
    ? `rgba(220, 38, 38, ${chirpAlpha})`
    : `rgba(248, 113, 113, ${chirpAlpha})`;
  const dx0 = marginX + stoShiftX + 3 * segW;
  const dx1 = dx0 + segW * 0.92;
  ctx.beginPath();
  ctx.moveTo(dx0, marginY + cfoShiftY);
  ctx.lineTo(dx1, h - marginY + cfoShiftY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
  ctx.font = '600 11px JetBrains Mono, monospace';
  ctx.fillText('Preamble Up-Chirps (Blue) + SFD Down-Chirp (Red)', 10, h - 7);
}

function drawFftPane(snr, hasOffset, denoiserOn) {
  const canvas = document.getElementById('fft-canvas');
  if (!canvas) return { trueBin: 42, argmaxBin: 42, pmr: 1, pmrDb: 0 };
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return { trueBin: 42, argmaxBin: 42, pmr: 1, pmrDb: 0 };

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';

  ctx.fillStyle = isLight ? '#f8fafc' : '#080c14';
  ctx.fillRect(0, 0, w, h);

  const N = 128;
  const trueBin = 42;
  const effSnr = denoiserOn ? Math.min(12.0, snr + 22.0) : snr;
  const snrLin = Math.pow(10, effSnr / 10);
  // Coherent FFT processing gain scaled across 128 bins
  const sigAmp = Math.sqrt(snrLin * 110);
  const mags = new Array(N);

  for (let k = 0; k < N; k++) {
    const noiseBase = 0.25 + 0.72 * seededRand(k * 7.13 + Math.round(snr * 2) * 3.1);
    const spikeBoost = (!denoiserOn && k === 101 && snr <= -15) ? 0.52 : 0;
    const dist = Math.abs(k - trueBin);
    const leak = hasOffset && !denoiserOn
      ? (dist === 0 ? 0.68 : dist === 1 ? 0.34 : 0)
      : (dist === 0 ? 1.0 : dist === 1 ? 0.25 : 0);
    mags[k] = noiseBase + spikeBoost + sigAmp * leak;
  }

  const maxVal = Math.max(...mags);
  const sorted = [...mags].sort((a, b) => a - b);
  const medianVal = sorted[Math.floor(N / 2)] || 1;
  let argmaxBin = 0;
  for (let k = 1; k < N; k++) {
    if (mags[k] > mags[argmaxBin]) argmaxBin = k;
  }

  const pmr = mags[trueBin] / medianVal;
  const pmrDb = 20 * Math.log10(Math.max(pmr, 0.01));

  // Grid
  ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let y = 20; y < h - 24; y += 35) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const padX = 16;
  const padTop = 24;
  const padBot = 24;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBot;

  // Plot FFT magnitude trace
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = denoiserOn
    ? (isLight ? '#059669' : '#34d399')
    : (isLight ? '#334155' : '#94a3b8');

  for (let k = 0; k < N; k++) {
    const px = padX + (k / (N - 1)) * plotW;
    const py = h - padBot - (mags[k] / maxVal) * plotH;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Highlight true bin 42
  const tx = padX + (trueBin / (N - 1)) * plotW;
  const ty = h - padBot - (mags[trueBin] / maxVal) * plotH;
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Highlight argmax if wrong
  if (argmaxBin !== trueBin) {
    const ax = padX + (argmaxBin / (N - 1)) * plotW;
    const ay = h - padBot - (mags[argmaxBin] / maxVal) * plotH;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
  ctx.font = '600 11px JetBrains Mono, monospace';
  ctx.fillText(`Bin 0`, padX, h - 7);
  ctx.fillText(`True Bin 42 | argmax: ${argmaxBin}`, w * 0.28, h - 7);
  ctx.fillText(`127`, w - 34, h - 7);

  return { trueBin, argmaxBin, pmr, pmrDb };
}

function toggleChirpAudio() {
  const btn = document.getElementById('play-chirp-btn');
  if (!btn) return;

  if (chirpOsc) {
    chirpOsc.stop();
    chirpOsc.disconnect();
    chirpOsc = null;
    btn.innerText = 'Listen Chirp';
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    chirpOsc = audioCtx.createOscillator();
    chirpGain = audioCtx.createGain();

    const now = audioCtx.currentTime;
    chirpOsc.type = 'sine';
    chirpOsc.frequency.setValueAtTime(420, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(2200, now + 0.35);

    chirpGain.gain.setValueAtTime(0.01, now);
    chirpGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(audioCtx.destination);
    chirpOsc.start(now);
    chirpOsc.stop(now + 0.36);

    btn.innerText = 'Playing...';
    chirpOsc.onended = () => {
      chirpOsc = null;
      btn.innerText = 'Listen Chirp';
    };
  } catch (e) {
    showToast('Audio playback unavailable in this browser.');
  }
}

/* -------------------------------------------------------------
   9. SOTA Filter & Search
------------------------------------------------------------- */
function initSotaFilter() {
  const filterBtns = document.querySelectorAll('.sota-filter-btn');
  const cards = document.querySelectorAll('.sota-card');
  const searchInput = document.getElementById('sota-search');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'), searchInput ? searchInput.value.toLowerCase() : '');
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeBtn = document.querySelector('.sota-filter-btn.active');
      const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
      applyFilter(filter, e.target.value.toLowerCase());
    });
  }

  function applyFilter(filter, search) {
    cards.forEach(card => {
      const cat = card.getAttribute('data-category') || '';
      const text = card.innerText.toLowerCase();
      const matchCat = filter === 'all' || cat.includes(filter);
      const matchSearch = !search || text.includes(search);
      card.style.display = matchCat && matchSearch ? 'flex' : 'none';
    });
  }
}

/* -------------------------------------------------------------
   10. Citation Modal & Copy Helpers
------------------------------------------------------------- */
function initCitationModal() {
  const openBtns = document.querySelectorAll('.open-citation-modal');
  const modal = document.getElementById('citation-modal');
  const closeBtn = document.getElementById('close-citation-btn');
  const copyBtn = document.getElementById('copy-bibtex-btn');
  const bibtexContent = document.getElementById('bibtex-code');

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => { if (modal) modal.classList.add('active'); });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (copyBtn && bibtexContent) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(bibtexContent.innerText.trim()).then(() => {
        showToast('BibTeX citation copied to clipboard.');
        copyBtn.innerText = 'Copied!';
        setTimeout(() => { copyBtn.innerText = 'Copy BibTeX'; }, 2000);
      });
    });
  }

  document.querySelectorAll('.copy-ref-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const refItem = btn.closest('.ref-item');
      const text = refItem?.querySelector('.ref-text')?.innerText;
      if (text) {
        navigator.clipboard.writeText(text).then(() => showToast('Reference copied to clipboard.'));
      }
    });
  });
}

function closeCitationModal() {
  const modal = document.getElementById('citation-modal');
  if (modal) modal.classList.remove('active');
}

function showToast(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

/* -------------------------------------------------------------
   11. KaTeX Math Auto-Render
------------------------------------------------------------- */
function initMathRendering() {
  const tryRender = () => {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
      return true;
    }
    return false;
  };

  if (!tryRender()) {
    window.addEventListener('load', () => tryRender());
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryRender() || attempts > 12) clearInterval(interval);
    }, 200);
  }
}
