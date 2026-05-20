/**
 * TechNova AI Support — Clean Professional Chatbot
 * Powered by Gemini AI · Voice Input · Theme Toggle
 */

/* ═══════════ PARTICLES ═══════════ */
(function initParticles() {
  const c = document.getElementById('particleCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let pts = [], w, h;

  function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
  function create() {
    return { x: Math.random()*w, y: Math.random()*h, s: Math.random()*1.5+0.5, dx: (Math.random()-0.5)*0.25, dy: (Math.random()-0.5)*0.25, o: Math.random()*0.3+0.1, hue: Math.random()>0.5?260:190 };
  }
  function init() { pts = Array.from({ length: Math.min(Math.floor(w*h/20000), 60) }, create); }

  function draw() {
    ctx.clearRect(0,0,w,h);
    for (const p of pts) {
      p.x += p.dx; p.y += p.dy;
      if (p.x<0) p.x=w; if (p.x>w) p.x=0;
      if (p.y<0) p.y=h; if (p.y>h) p.y=0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},70%,70%,${p.o})`;
      ctx.fill();
    }
    for (let i=0; i<pts.length; i++)
      for (let j=i+1; j<pts.length; j++) {
        const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
        if (d<110) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(99,102,241,${0.05*(1-d/110)})`; ctx.lineWidth=0.5; ctx.stroke(); }
      }
    requestAnimationFrame(draw);
  }

  resize(); init(); draw();
  addEventListener('resize', () => { resize(); init(); });
})();

/* ═══════════ DOM ═══════════ */
const $ = id => document.getElementById(id);
const dom = {
  messages: $('messagesContainer'),
  chatBody: $('chatBody'),
  input: $('userInput'),
  sendBtn: $('sendBtn'),
  clearBtn: $('clearBtn'),
  sidebar: $('sidebar'),
  menuBtn: $('menuBtn'),
  sidebarToggle: $('sidebarToggle'),
  micBtn: $('micBtn'),
  themeToggle: $('themeToggle'),
  toasts: $('toastContainer'),
  headerStatus: $('headerStatus'),
  aiStatus: $('aiStatus'),
};

/* ═══════════ STATE ═══════════ */
const state = { history: [], busy: false, aiEnabled: false };

/* ═══════════ INIT ═══════════ */
(async function init() {
  initTheme();
  initVoice();
  initListeners();
  renderWelcome();
  dom.input.focus();

  // Check if AI is available
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    state.aiEnabled = data.aiEnabled;
  } catch(e) {}

  // Welcome message
  setTimeout(() => {
    addBotMessage("Hi there! I'm **Nova**, your TechNova support assistant. Ask me anything about our products, pricing, shipping, or support — I'm here to help!");
  }, 800);
})();

/* ═══════════ SEND MESSAGE ═══════════ */
async function sendMessage(text) {
  if (state.busy || !text.trim()) return;
  const msg = text.trim();

  // Hide welcome
  const wc = $('welcomeCard');
  if (wc) wc.style.display = 'none';

  addUserMessage(msg);
  state.history.push({ role: 'user', text: msg });

  state.busy = true;
  dom.input.disabled = true;
  dom.sendBtn.disabled = true;

  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: state.history.slice(-20) })
    });

    const data = await res.json();
    hideTyping();

    const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
    addBotMessage(reply);
    state.history.push({ role: 'bot', text: reply });

  } catch (err) {
    hideTyping();
    addBotMessage("Sorry, I'm having trouble connecting. Please try again in a moment.");
  }

  state.busy = false;
  dom.input.disabled = false;
  dom.sendBtn.disabled = true;
  dom.input.focus();
}

/* ═══════════ RENDER MESSAGES ═══════════ */
function addBotMessage(text) {
  const row = el('div', 'message-row bot');
  row.innerHTML = `
    <div class="message-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div class="message-content">
      <div class="message-bubble"></div>
      <span class="message-time">Nova · ${timeNow()}</span>
    </div>`;
  dom.messages.appendChild(row);
  scrollDown();

  const bubble = row.querySelector('.message-bubble');
  const htmlContent = renderMd(text);
  let index = 0;
  let currentHtml = '';
  const speed = 10; // Speed of typing in milliseconds

  function type() {
    if (index >= htmlContent.length) {
      bubble.innerHTML = htmlContent; // Set final clean HTML (removes cursor)
      scrollDown();
      return;
    }

    // If we hit an HTML tag, skip over it and render it instantly
    if (htmlContent[index] === '<') {
      const tagEnd = htmlContent.indexOf('>', index);
      if (tagEnd !== -1) {
        currentHtml += htmlContent.slice(index, tagEnd + 1);
        index = tagEnd + 1;
        type(); // Call recursively immediately to not pause on tags
        return;
      }
    }

    // Append standard character
    currentHtml += htmlContent[index];
    bubble.innerHTML = currentHtml + '▊';
    index++;

    // Scroll down if close to bottom
    const container = dom.messages;
    const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 120;
    if (isNearBottom) {
      scrollDown();
    }

    setTimeout(type, speed);
  }

  type();
}

function addUserMessage(text) {
  const row = el('div', 'message-row user');
  row.innerHTML = `
    <div class="message-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <div class="message-content">
      <div class="message-bubble">${esc(text)}</div>
      <span class="message-time">${timeNow()}</span>
    </div>`;
  dom.messages.appendChild(row);
  scrollDown();
}

function showTyping() {
  const row = el('div', 'message-row bot');
  row.id = 'typingRow';
  row.innerHTML = `
    <div class="message-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div class="message-content">
      <div class="message-bubble"><div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>
    </div>`;
  dom.messages.appendChild(row);
  scrollDown();
}

function hideTyping() {
  const t = $('typingRow');
  if (t) t.remove();
}

function renderWelcome() {
  const card = el('div', 'welcome-card');
  card.id = 'welcomeCard';
  const chips = [
    ['🛍️', 'Products', 'Show me all your products'],
    ['💰', 'Pricing', 'What are your prices and deals?'],
    ['📦', 'Shipping', 'How does shipping work?'],
    ['📱', 'Phones', 'Compare your smartphones'],
    ['💻', 'Laptops', 'Which laptop should I get?'],
    ['📞', 'Support', 'How can I contact you?'],
  ];
  card.innerHTML = `
    <div class="welcome-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <h2>Welcome to TechNova</h2>
    <p>AI-powered support for all your electronics needs. Ask me anything!</p>
    <div class="welcome-features">
      ${chips.map(([icon, label, q]) => `<div class="feature-chip" onclick="ask('${q}')"><div class="feature-chip-icon">${icon}</div><div class="feature-chip-text">${label}</div></div>`).join('')}
    </div>`;
  dom.messages.appendChild(card);
}

/* ═══════════ HELPERS ═══════════ */
function ask(text) { dom.input.value = text; sendMessage(text); dom.input.value = ''; resize(); }
function clearChat() { dom.messages.innerHTML = ''; state.history = []; renderWelcome(); toast('Chat cleared'); }

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[•\-]\s(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_, h, r) => {
      const th = h.split('|').filter(c=>c.trim()).map(c=>`<th>${c.trim()}</th>`).join('');
      const tr = r.trim().split('\n').map(row => '<tr>'+row.split('|').filter(c=>c.trim()).map(c=>`<td>${c.trim()}</td>`).join('')+'</tr>').join('');
      return `<table class="msg-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
    })
    .replace(/\n/g, '<br>');
}

function el(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function timeNow() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function scrollDown() { requestAnimationFrame(() => { dom.chatBody.scrollTop = dom.chatBody.scrollHeight; }); }
function toast(msg, ms=2500) {
  const t = el('div','toast'); t.textContent = msg; dom.toasts.appendChild(t);
  setTimeout(() => { t.classList.add('exit'); setTimeout(() => t.remove(), 300); }, ms);
}
function resize() { dom.input.style.height = 'auto'; dom.input.style.height = Math.min(dom.input.scrollHeight, 120)+'px'; }

/* ═══════════ THEME ═══════════ */
function initTheme() {
  if (localStorage.getItem('technova-theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
  dom.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('technova-theme', next);
    toast(next === 'light' ? '☀️ Light mode' : '🌙 Dark mode');
  });
}

/* ═══════════ VOICE ═══════════ */
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    dom.micBtn.style.display = 'none'; // Hide if browser doesn't support it
    return;
  }

  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  let active = false;
  let silenceTimer = null;

  function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (active) {
        toast('Speech recognition timed out');
        stopListening(false); // Stop without sending since they stopped talking
      }
    }, 8000); // 8 seconds of absolute silence auto-stops
  }

  rec.onstart = () => {
    active = true;
    dom.micBtn.classList.add('recording');
    dom.input.placeholder = '🎙️ Listening... Speak now';
    toast('Microphone listening...');
    resetSilenceTimer();
  };

  rec.onresult = e => {
    resetSilenceTimer();
    let interim = '';
    let final = '';

    for (let i = 0; i < e.results.length; ++i) {
      if (e.results[i].isFinal) {
        final += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }

    if (final || interim) {
      dom.input.value = (final + ' ' + interim).trim();
      dom.sendBtn.disabled = !dom.input.value.trim();
      resize();
    }
  };

  rec.onend = () => {
    if (active) {
      stopListening(true);
    }
  };

  rec.onerror = e => {
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      toast(`Voice error: ${e.error}`);
    }
    stopListening(false);
  };

  function startListening() {
    dom.input.value = '';
    rec.start();
  }

  function stopListening(shouldSend = true) {
    active = false;
    clearTimeout(silenceTimer);
    rec.abort(); // Force stop SpeechRecognition
    dom.micBtn.classList.remove('recording');
    dom.input.placeholder = 'Ask Nova anything...';
    
    const text = dom.input.value.trim();
    if (shouldSend && text) {
      sendMessage(text);
      dom.input.value = '';
      dom.sendBtn.disabled = true;
      resize();
    }
  }

  dom.micBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (active) {
      stopListening(true); // Send what was spoken
    } else {
      startListening();
    }
  });
}

/* ═══════════ LISTENERS ═══════════ */
function initListeners() {
  // Input
  dom.input.addEventListener('input', () => { resize(); dom.sendBtn.disabled = !dom.input.value.trim(); });
  dom.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (dom.input.value.trim()) { sendMessage(dom.input.value); dom.input.value = ''; dom.sendBtn.disabled = true; resize(); } }
  });
  dom.sendBtn.addEventListener('click', () => { if (dom.input.value.trim()) { sendMessage(dom.input.value); dom.input.value = ''; dom.sendBtn.disabled = true; resize(); } });

  // Clear
  dom.clearBtn.addEventListener('click', clearChat);

  // Quick replies
  document.querySelectorAll('.quick-reply-btn').forEach(b => b.addEventListener('click', () => ask(b.dataset.q)));

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      b.classList.add('active');
      ask(b.dataset.q);
      if (innerWidth <= 768) closeSidebar();
    });
  });

  // Mobile sidebar
  let overlay = null;
  dom.menuBtn.addEventListener('click', () => {
    dom.sidebar.classList.add('open');
    if (!overlay) { overlay = el('div','sidebar-overlay active'); overlay.addEventListener('click', closeSidebar); document.body.appendChild(overlay); }
  });

  function closeSidebar() {
    dom.sidebar.classList.remove('open');
    if (overlay) { overlay.remove(); overlay = null; }
  }
  dom.sidebarToggle.addEventListener('click', closeSidebar);
  window.closeSidebar = closeSidebar;
}
