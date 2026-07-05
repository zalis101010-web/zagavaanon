// app.js — логика публичной страницы Anonymous Inbox

// ---------------------------------------------------------------------------
// 1. Фон: звёздное небо + лёгкая дышащая сетка (canvas)
// ---------------------------------------------------------------------------
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], grid = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 110; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.0002 + 0.00005,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const cols = 9, rows = 6;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      grid.push({ cx: c / cols, cy: r / rows, phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.001 + 0.0003 });
    }
  }

  let t = 0;
  function draw() {
    t += 0.008;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W * .5, H * .45, 0, W * .5, H * .5, W * .75);
    bg.addColorStop(0, '#141414');
    bg.addColorStop(0.55, '#090909');
    bg.addColorStop(1, '#020202');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    [[0.25, 0.6, 0.35], [0.72, 0.3, 0.28], [0.5, 0.8, 0.2]].forEach(([nx, ny, nr]) => {
      const g = ctx.createRadialGradient(W * nx, H * ny, 0, W * nx, H * ny, W * nr);
      g.addColorStop(0, 'rgba(60,60,60,0.16)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const n = grid[r * (cols + 1) + c];
        const ox = Math.sin(t * n.speed * 600 + n.phase) * 0.012;
        const oy = Math.cos(t * n.speed * 600 + n.phase) * 0.012;
        c === 0 ? ctx.moveTo((n.cx + ox) * W, (n.cy + oy) * H) : ctx.lineTo((n.cx + ox) * W, (n.cy + oy) * H);
      }
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const n = grid[r * (cols + 1) + c];
        const ox = Math.sin(t * n.speed * 600 + n.phase) * 0.012;
        const oy = Math.cos(t * n.speed * 600 + n.phase) * 0.012;
        r === 0 ? ctx.moveTo((n.cx + ox) * W, (n.cy + oy) * H) : ctx.lineTo((n.cx + ox) * W, (n.cy + oy) * H);
      }
      ctx.stroke();
    }
    ctx.restore();

    stars.forEach((s) => {
      const p = 0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.5 * p;
      ctx.fillStyle = '#dddddd';
      ctx.shadowColor = '#aaaaaa';
      ctx.shadowBlur = s.r * 3;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ---------------------------------------------------------------------------
// 2. Частицы на сплэш-экране
// ---------------------------------------------------------------------------
(function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  for (let i = 0; i < 35; i++) {
    const s = document.createElement('span');
    const sz = 1 + Math.random() * 3;
    s.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;animation-duration:${4 + Math.random() * 8}s;animation-delay:${Math.random() * 8}s`;
    c.appendChild(s);
  }
})();

// ---------------------------------------------------------------------------
// 3. Сплэш → главный экран + запуск музыки
// ---------------------------------------------------------------------------
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function startSite() {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('main').classList.add('visible');

  const aud = document.getElementById('bgMusic');
  aud.volume = 0.5;
  aud.play().catch(() => {
    // Файла music.mp3 может не быть — это нормально, просто тихо продолжаем без звука
  });

  aud.addEventListener('loadedmetadata', () => {
    document.getElementById('npTotal').textContent = fmt(aud.duration || 0);
  });
  aud.addEventListener('timeupdate', () => {
    if (!aud.duration) return;
    document.getElementById('npCurrent').textContent = fmt(aud.currentTime);
    document.getElementById('npFill').style.width = (aud.currentTime / aud.duration * 100) + '%';
  });
}

document.getElementById('startBtn').addEventListener('click', startSite);

document.getElementById('npToggle').addEventListener('click', () => {
  const aud = document.getElementById('bgMusic');
  const btn = document.getElementById('npToggle');
  if (aud.paused) {
    aud.play().catch(() => {});
    btn.textContent = '❚❚';
  } else {
    aud.pause();
    btn.textContent = '▶';
  }
});

// ---------------------------------------------------------------------------
// 4. Форма отправки сообщения
// ---------------------------------------------------------------------------
const form = document.getElementById('sendForm');
const textarea = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const sendBtn = document.getElementById('sendBtn');
const statusBox = document.getElementById('statusBox');
const toast = document.getElementById('toast');

const MAX_LEN = 2000;

textarea.addEventListener('input', () => {
  charCount.textContent = `${textarea.value.length} / ${MAX_LEN}`;
});

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status-box ${type || ''}`.trim();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = textarea.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  sendBtn.classList.add('loading');
  setStatus('', '');

  try {
    const res = await fetch('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Что-то пошло не так');
    }

    textarea.value = '';
    charCount.textContent = `0 / ${MAX_LEN}`;
    setStatus('✓ Delivered', 'ok');
    showToast('Message sent anonymously');
  } catch (err) {
    setStatus(err.message, 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.classList.remove('loading');
  }
});
