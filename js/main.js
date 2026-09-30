/* ===================================================================
   Master Thesis Webpage - Interactive JavaScript
   Author: Sean Pribadi (Pusan National University - AI Convergence)
   Topic: Ultra-Low SNR LoRa Receiver Pipeline with Machine Learning
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReadingProgress();
  initHeaderScroll();
  initTableOfContents();
  initMobileMenu();
  initAbstractTabs();
  initLightbox();
  initSnrSimulator();
  initSotaFilter();
  initCitationModal();
  initMathRendering();
});

/* -------------------------------------------------------------
   1. Theme Management (Dark / Light Mode)
------------------------------------------------------------- */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('thesis_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('thesis_theme', next);
      updateThemeIcon(next);
      drawChirpSimulation(); // Redraw canvas with new palette
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  } else {
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  }
}

/* -------------------------------------------------------------
   2. Reading Progress Bar & Header State
------------------------------------------------------------- */
function initReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  });
}

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* -------------------------------------------------------------
   3. Table of Contents & ScrollSpy
------------------------------------------------------------- */
function initTableOfContents() {
  const tocLinks = document.querySelectorAll('.toc-item a');
  const sections = document.querySelectorAll('.article-section');

  if (sections.length === 0 || tocLinks.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          const item = link.parentElement;
          if (link.getAttribute('href') === `#${id}`) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px'
  });

  sections.forEach(section => observer.observe(section));
}

/* -------------------------------------------------------------
   4. Mobile Menu
------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('mobile-open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('mobile-open');
      });
    });
  }
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

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetLang}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

/* -------------------------------------------------------------
   6. Image Lightbox with Zoom & Pan
------------------------------------------------------------- */
let currentZoom = 1;
let isPanning = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const modalTitle = document.getElementById('lightbox-title');
  const zoomInBtn = document.getElementById('lightbox-zoom-in');
  const zoomOutBtn = document.getElementById('lightbox-zoom-out');
  const resetBtn = document.getElementById('lightbox-reset');
  const closeBtn = document.getElementById('lightbox-close');
  const body = document.querySelector('.lightbox-body');

  if (!modal || !modalImg) return;

  // Open Lightbox on figure image or figure container click
  document.querySelectorAll('.figure-img-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const img = wrap.querySelector('.figure-img');
      const container = wrap.closest('.figure-container');
      const title = container ? container.querySelector('.figure-tag')?.innerText || 'Figure Detail' : 'Figure Detail';

      if (img) {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        if (modalTitle) modalTitle.innerText = `${title}: ${img.alt || 'High Resolution Diagram'}`;
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
  if (resetBtn) resetBtn.addEventListener('click', () => {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateImgTransform();
  });

  if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(currentZoom + 0.35, 4.0);
    updateImgTransform();
  });

  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(currentZoom - 0.35, 0.75);
    updateImgTransform();
  });

  // Pan interaction
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

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });

    // Mouse wheel zoom
    body.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      currentZoom = Math.min(Math.max(0.6, currentZoom + delta), 4.5);
      updateImgTransform();
    }, { passive: false });
  }

  // Keyboard support (ESC to exit)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeCitationModal();
    }
  });

  // Background click to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === body) {
      closeLightbox();
    }
  });
}

/* -------------------------------------------------------------
   7. Interactive LoRa Chirp & SNR Simulator (Canvas + Web Audio)
------------------------------------------------------------- */
let audioCtx = null;
let chirpOsc = null;
let chirpGain = null;

function initSnrSimulator() {
  const slider = document.getElementById('snr-slider');
  const sfSelect = document.getElementById('sf-select');
  const snrVal = document.getElementById('snr-display-val');
  const statusBadge = document.getElementById('snr-regime-badge');
  const conventionalStatus = document.getElementById('conventional-status');
  const mlStatus = document.getElementById('ml-status');
  const playBtn = document.getElementById('play-chirp-btn');

  if (!slider) return;

  const updateSim = () => {
    const snr = parseFloat(slider.value);
    const sf = parseInt(sfSelect.value);
    if (snrVal) snrVal.innerText = `${snr > 0 ? '+' : ''}${snr.toFixed(1)} dB`;

    // Semtech nominal limits
    const limits = {
      7: -7.5,
      8: -10.0,
      9: -12.5,
      10: -15.0,
      11: -17.5,
      12: -20.0
    };
    const limit = limits[sf] || -7.5;

    // Evaluate regime
    if (snr >= limit + 2) {
      statusBadge.className = 'sim-status status-normal';
      statusBadge.innerText = 'Standard LoRa Region (High SNR)';
      if (conventionalStatus) conventionalStatus.innerText = '✅ 100% Success (Standard Dechirp)';
      if (mlStatus) mlStatus.innerText = 'Optimal (Standard Processing)';
    } else if (snr >= limit) {
      statusBadge.className = 'sim-status status-limit';
      statusBadge.innerText = 'Demodulation Limit Border';
      if (conventionalStatus) conventionalStatus.innerText = '⚠️ Degraded (~40-70% Packet Loss)';
      if (mlStatus) mlStatus.innerText = 'High Confidence Boost';
    } else {
      statusBadge.className = 'sim-status status-ultralow';
      statusBadge.innerText = '🚨 Ultra-Low SNR Region (Below Limit)';
      if (conventionalStatus) conventionalStatus.innerText = '❌ FAILED (100% Missed / Lost Sync)';
      if (mlStatus) mlStatus.innerText = '✅ Rescued via Proposed Neural Sync & C-RAN';
    }

    drawChirpSimulation(snr, sf);
  };

  slider.addEventListener('input', updateSim);
  sfSelect.addEventListener('change', updateSim);
  window.addEventListener('resize', () => drawChirpSimulation());

  // Audio preview toggle
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      toggleChirpAudio(parseFloat(slider.value));
    });
  }

  // Initial draw
  updateSim();
}

function drawChirpSimulation(snr = -5, sf = 7) {
  const canvas = document.getElementById('chirp-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;

  // Background
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  ctx.fillStyle = isLight ? '#f8fafc' : '#080c14';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Calculate noise amplitude based on SNR (dB = 10 * log10(P_sig / P_noise))
  // Linear noise power ratio:
  const snrLinear = Math.pow(10, snr / 10);
  const signalAmp = 45;
  const noiseAmp = signalAmp / Math.sqrt(Math.max(snrLinear, 0.001));

  // 1. Draw Noise Scatter / Background
  const noiseCount = Math.min(2500, Math.floor(w * (noiseAmp / 12)));
  ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.35)' : 'rgba(148, 163, 184, 0.25)';
  for (let i = 0; i < noiseCount; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    const nsize = Math.random() * 2 + 0.5;
    ctx.fillRect(nx, ny, nsize, nsize);
  }

  // 2. Draw Chirp Trajectory (Upchirp frequency ramp)
  ctx.save();
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.shadowBlur = snr > -10 ? 12 : 3;
  ctx.shadowColor = '#38bdf8';
  ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';

  // Chirp sweeps from bottom (f_min) to top (f_max) across width
  const marginX = 20;
  const marginY = 20;
  const chirpW = w - marginX * 2;
  const chirpH = h - marginY * 2;

  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const cx = marginX + t * chirpW;
    // Linear chirp instantaneous frequency ramp
    let cy = (h - marginY) - t * chirpH;

    // Add noise disturbance if SNR is low
    if (noiseAmp > 20) {
      cy += (Math.random() - 0.5) * Math.min(noiseAmp * 0.4, 25);
    }

    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();

  // Labels
  ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.fillText('f_max (B/2)', marginX, marginY - 4);
  ctx.fillText('f_min (-B/2)', marginX, h - 6);
  ctx.fillText('CSS Upchirp Symbol [0]', w - 160, h - 6);
}

function toggleChirpAudio(snr) {
  const btn = document.getElementById('play-chirp-btn');
  if (!btn) return;

  if (chirpOsc) {
    chirpOsc.stop();
    chirpOsc.disconnect();
    chirpOsc = null;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Listen Chirp Tone`;
    return;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    chirpOsc = audioCtx.createOscillator();
    chirpGain = audioCtx.createGain();

    const now = audioCtx.currentTime;
    chirpOsc.type = 'sawtooth';
    // Frequency ramp up (400 Hz to 2400 Hz) to simulate chirp
    chirpOsc.frequency.setValueAtTime(400, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(2400, now + 0.35);

    // Fade in and out
    chirpGain.gain.setValueAtTime(0.01, now);
    chirpGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(audioCtx.destination);

    chirpOsc.start(now);
    chirpOsc.stop(now + 0.36);

    btn.innerHTML = `🔊 Playing Chirp...`;

    chirpOsc.onended = () => {
      chirpOsc = null;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Listen Chirp Tone`;
    };
  } catch (e) {
    console.warn('Web Audio not allowed or failed:', e);
    showToast('Audio playback not supported in this browser.');
  }
}

/* -------------------------------------------------------------
   8. SOTA Filter & Search
------------------------------------------------------------- */
function initSotaFilter() {
  const filterBtns = document.querySelectorAll('.sota-filter-btn');
  const cards = document.querySelectorAll('.sota-card');
  const searchInput = document.getElementById('sota-search');

  if (filterBtns.length === 0 || cards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      applyFilterAndSearch(filter, searchInput ? searchInput.value.toLowerCase() : '');
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeBtn = document.querySelector('.sota-filter-btn.active');
      const filter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
      applyFilterAndSearch(filter, e.target.value.toLowerCase());
    });
  }

  function applyFilterAndSearch(filter, search) {
    cards.forEach(card => {
      const cat = card.getAttribute('data-category') || '';
      const text = card.innerText.toLowerCase();

      const matchesCat = (filter === 'all') || (cat.includes(filter));
      const matchesSearch = !search || text.includes(search);

      if (matchesCat && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

/* -------------------------------------------------------------
   9. Citation Modal & Copy BibTeX
------------------------------------------------------------- */
function initCitationModal() {
  const openBtns = document.querySelectorAll('.open-citation-modal');
  const modal = document.getElementById('citation-modal');
  const closeBtn = document.getElementById('close-citation-btn');
  const copyBtn = document.getElementById('copy-bibtex-btn');
  const bibtexContent = document.getElementById('bibtex-code');

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) modal.classList.add('active');
    });
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
        showToast('✅ BibTeX citation copied to clipboard!');
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
          copyBtn.innerText = 'Copy BibTeX';
        }, 2000);
      });
    });
  }

  // Handle individual reference copy buttons
  document.querySelectorAll('.copy-ref-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const refItem = btn.closest('.ref-item');
      const text = refItem ? refItem.querySelector('.ref-text')?.innerText : '';
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Citation copied!');
        });
      }
    });
  });
}

function closeCitationModal() {
  const modal = document.getElementById('citation-modal');
  if (modal) modal.classList.remove('active');
}

/* -------------------------------------------------------------
   10. Toast Feedback Helper
------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/* -------------------------------------------------------------
   11. Mathematical Formula Rendering (KaTeX Auto-Render)
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

  // Attempt render immediately
  if (!tryRender()) {
    // If KaTeX CDN is still downloading, retry on window load
    window.addEventListener('load', () => {
      tryRender();
    });
    // Fallback polling up to 2 seconds
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryRender() || attempts > 10) {
        clearInterval(interval);
      }
    }, 200);
  }
}
