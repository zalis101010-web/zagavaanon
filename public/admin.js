// admin.js — логика админ-панели Anonymous Inbox

// --- Тот же лёгкий звёздный фон, что и на главной странице -----------------
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 70; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      speed: Math.random() * 0.0006 + 0.0002,
      phase: Math.random() * Math.PI * 2,
    });
  }

  let t = 0;
  function draw() {
    t += 0.01;
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      const p = 0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase);
      ctx.globalAlpha = 0.25 + 0.55 * p;
      ctx.fillStyle = '#cfcfcf';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r * p, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Основная логика ---------------------------------------------------------

const adminWrap = document.getElementById('adminWrap');
const loginCard = document.getElementById('loginCard');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const inboxView = document.getElementById('inboxView');
const messagesList = document.getElementById('messagesList');
const msgCount = document.getElementById('msgCount');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function formatDate(isoLike) {
  // SQLite datetime('now') отдаёт формат "YYYY-MM-DD HH:MM:SS" (UTC)
  const d = new Date(isoLike.replace(' ', 'T') + 'Z');
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function renderMessages(items) {
  messagesList.innerHTML = '';
  msgCount.textContent = `${items.length} ${items.length === 1 ? 'сообщение' : 'сообщений'}`;

  if (items.length === 0) {
    messagesList.innerHTML = '<div class="empty-state">Пока пусто. Сообщения появятся здесь.</div>';
    return;
  }

  items.forEach((msg, i) => {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.style.animationDelay = `${Math.min(i, 10) * 0.04}s`;

    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = msg.text;

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatDate(msg.created_at);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', () => deleteMessage(msg.id, card));

    meta.appendChild(time);
    meta.appendChild(delBtn);
    card.appendChild(text);
    card.appendChild(meta);
    messagesList.appendChild(card);
  });
}

async function loadMessages() {
  const res = await fetch('/messages');
  if (res.status === 401) {
    showLogin();
    return;
  }
  const items = await res.json();
  renderMessages(items);
}

async function deleteMessage(id, cardEl) {
  cardEl.style.transition = 'opacity 0.25s, transform 0.25s';
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'translateX(12px)';

  const res = await fetch(`/messages/${id}`, { method: 'DELETE' });
  if (res.ok) {
    setTimeout(() => loadMessages(), 200);
    showToast('Сообщение удалено');
  }
}

function showLogin() {
  adminWrap.classList.remove('list-mode');
  loginCard.style.display = 'block';
  inboxView.style.display = 'none';
}

function showInbox() {
  adminWrap.classList.add('list-mode');
  loginCard.style.display = 'none';
  inboxView.style.display = 'block';
  loadMessages();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: passwordInput.value }),
  });

  if (!res.ok) {
    loginError.textContent = 'Неверный пароль';
    return;
  }

  passwordInput.value = '';
  showInbox();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

// При загрузке страницы проверяем, есть ли уже активная сессия
(async function init() {
  const res = await fetch('/api/session');
  const data = await res.json();
  if (data.isAdmin) {
    showInbox();
  } else {
    showLogin();
  }
})();
