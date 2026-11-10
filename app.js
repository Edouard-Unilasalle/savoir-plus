'use strict';

/* =========================================================
   Savoir+ — un sujet par jour, des révisions espacées.
   Tout l'état est stocké sur le téléphone (localStorage).
   ========================================================= */

const DOMAIN_COLORS = {
  'Agriculture': '#9bd36a', 'Supply chain': '#4fc3f7', 'Économie': '#ffb84d', 'Finance': '#3ecf8e',
  'Droit': '#c9a7ff', 'Art': '#ff8fb1', 'Villes': '#7aa2ff', 'Livres': '#e8c07d', 'Philosophie': '#b39ddb',
  'Anecdotes': '#ffd54f', 'Culture française': '#6aa9ff', 'Culture du monde': '#ff8a65', 'Sciences': '#4dd0e1',
  'Histoire': '#d7a86e', 'Géopolitique': '#ef7d7d', 'Psychologie': '#f48fb1', 'Santé': '#80cbc4',
  'Technologie': '#90a4ff', 'Environnement': '#81c784',
};
const colorOf = d => DOMAIN_COLORS[d] || '#8b7bff';

const INTERVALS = [1, 3, 7, 21, 60]; // jours avant la prochaine révision, selon la « boîte »
const MAX_REVIEWS = 8;               // questions de révision max par jour
const LOW_STOCK = 5;                 // alerte quand il reste peu de sujets
const STORE_KEY = 'savoir.v1';

/* ---------- Dates (locales, format AAAA-MM-JJ) ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };

/* ---------- État ---------- */
function freshState() {
  return { completed: {}, srs: {}, activity: [], bonus: {} };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(freshState(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible : on repart de zéro */ }
  return freshState();
}
let state = loadState();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
function markActivity() {
  const t = today();
  if (!state.activity.includes(t)) { state.activity.push(t); save(); }
  renderStreak();
}
function streak() {
  const set = new Set(state.activity);
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function renderStreak() { $('#streak').textContent = `🔥 ${streak()}`; }

/* ---------- Contenu ---------- */
let INDEX = [];
const dayCache = new Map();
const fileOf = n => `content/days/day-${pad(n)}.json`;

async function loadIndex() {
  const r = await fetch('content/index.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('index introuvable');
  const j = await r.json();
  INDEX = (j.days || []).sort((a, b) => a.day - b.day);
}
async function loadDay(n) {
  if (dayCache.has(n)) return dayCache.get(n);
  const p = fetch(fileOf(n)).then(r => { if (!r.ok) throw new Error('sujet ' + n); return r.json(); });
  dayCache.set(n, p);
  return p;
}

/* ---------- Déblocage : un nouveau sujet par jour ---------- */
const isDone = n => !!state.completed[n];
const completedToday = () => Object.values(state.completed).filter(c => c.date === today()).length;
const allowedToday = () => 1 + (state.bonus[today()] || 0);
const nextTopic = () => INDEX.find(d => !isDone(d.day));
const canStartNext = () => !!nextTopic() && completedToday() < allowedToday();
const remaining = () => INDEX.filter(d => !isDone(d.day)).length;

/* ---------- Révisions espacées ---------- */
const key = (day, qi) => `${day}:${qi}`;
function dueReviews() {
  const t = today();
  return Object.entries(state.srs)
    .filter(([, v]) => v.due && v.due <= t)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .slice(0, MAX_REVIEWS)
    .map(([k]) => { const [day, qi] = k.split(':').map(Number); return { day, qi }; });
}
function grade(day, qi, ok) {
  const k = key(day, qi);
  const cur = state.srs[k] || { box: 0 };
  const box = ok ? cur.box + 1 : 0;
  state.srs[k] = box >= INTERVALS.length
    ? { box, due: null }                       // maîtrisée
    : { box, due: addDays(today(), INTERVALS[box]) };
  save();
}
const mastered = () => Object.values(state.srs).filter(v => v.due === null).length;

/* ---------- Petits utilitaires DOM ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function md(text) {
  return String(text || '').split(/\n{2,}/).map(p =>
    '<p>' + esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') + '</p>'
  ).join('');
}
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/* ---------- Cartes ---------- */
function cardHTML(c, topic) {
  const k = `<div class="card-kicker">${esc(topic.domain)}</div>`;
  switch (c.type) {
    case 'hook':
      return `<div class="card hook">${k}${c.title ? `<h2>${esc(c.title)}</h2>` : ''}<div class="body">${md(c.body)}</div></div>`;
    case 'figure':
      return `<div class="card figure">${k}<div class="value">${esc(c.value)}</div><div class="label">${esc(c.label)}</div><div class="body">${md(c.body)}</div></div>`;
    case 'quote':
      return `<div class="card quote">${k}<blockquote>${esc(c.quote)}</blockquote><cite>— ${esc(c.author)}</cite>${c.body ? `<div class="body">${md(c.body)}</div>` : ''}</div>`;
    case 'france':
      return `<div class="card france"><div class="card-kicker">${esc(c.title || 'Et en France ?')}</div><div class="body">${md(c.body)}</div></div>`;
    case 'takeaways':
      return `<div class="card takeaways"><div class="card-kicker">À retenir</div><h2>3 idées clés</h2><ol>${(c.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ol></div>`;
    default:
      return `<div class="card text">${k}${c.title ? `<h2>${esc(c.title)}</h2>` : ''}<div class="body">${md(c.body)}</div></div>`;
  }
}

function quizCard(q, label, onAnswer, prev) {
  const card = el(`<div class="card quiz">
    <div class="card-kicker">${esc(label)}</div>
    <p class="q">${esc(q.q)}</p>
    <div class="choices">${q.choices.map((ch, i) => `<button class="choice" data-i="${i}">${esc(ch)}</button>`).join('')}</div>
  </div>`);
  const reveal = picked => {
    const ok = picked === q.answer;
    card.querySelectorAll('.choice').forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('good');
      else if (i === picked) b.classList.add('bad');
    });
    card.appendChild(el(`<div class="explain"><b class="${ok ? 'ok' : 'ko'}">${ok ? 'Bonne réponse.' : 'Pas tout à fait.'}</b> ${esc(q.explain || '')}</div>`));
    return ok;
  };
  if (prev !== undefined) reveal(prev);
  card.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => {
    if (b.disabled) return;
    const i = Number(b.dataset.i);
    onAnswer(i, reveal(i));
  }));
  return card;
}

/* ---------- Carrousel horizontal + barres de progression ---------- */
function buildCarousel(page, nodes) {
  const bars = el(`<div class="bars">${nodes.map(() => '<i></i>').join('')}</div>`);
  const car = el('<div class="carousel"></div>');
  nodes.forEach(n => { const s = el('<div class="slot"></div>'); s.appendChild(n); car.appendChild(s); });
  page.append(bars, car);
  const counter = page.querySelector('.counter');
  const update = () => {
    const i = car.clientWidth ? Math.round(car.scrollLeft / car.clientWidth) : 0;
    bars.querySelectorAll('i').forEach((b, j) => b.classList.toggle('on', j <= i));
    if (counter) counter.textContent = `${i + 1}/${nodes.length}`;
  };
  car.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  // Toucher le bord droit / gauche d'une carte = carte suivante / précédente (comme les stories)
  car.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const r = car.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x > 0.72) car.scrollBy({ left: car.clientWidth, behavior: 'smooth' });
    else if (x < 0.28) car.scrollBy({ left: -car.clientWidth, behavior: 'smooth' });
  });
  update();
  return car;
}

/* ---------- Page « sujet » ---------- */
async function topicPage(meta, mode) {
  const t = await loadDay(meta.day);
  const color = colorOf(t.domain);
  const page = el(`<section class="page topic" id="day-${t.day}" style="--dc:${color}">
    <div class="page-label"><span><b>${esc(t.domain)}</b> · Sujet ${t.day}${mode === 'new' ? ' · aujourd\'hui' : ''}</span><span class="counter"></span></div>
  </section>`);

  const nCards = t.cards.length;
  const cover = el(`<div class="card cover">
    <div class="emoji">${esc(t.emoji || '📘')}</div>
    <div class="meta"><span class="chip">${esc(t.domain)}</span><span class="chip">${nCards} cartes · ${t.quiz.length} questions</span>${isDone(t.day) ? '<span class="chip">✓ terminé</span>' : ''}</div>
    <h1>${esc(t.title)}</h1>
    <p class="sub">${esc(t.subtitle || '')}</p>
    <div class="swipe-hint">Glisse vers la gauche →</div>
  </div>`);

  const answers = {};
  const end = el('<div class="card end"></div>');
  const renderEnd = () => {
    const total = t.quiz.length;
    const answered = Object.keys(answers).length;
    const score = Object.values(answers).filter(Boolean).length;
    const done = state.completed[t.day];
    let head;
    if (mode === 'new' && answered < total) {
      head = `<div class="card-kicker">Presque fini</div><h2>Réponds au quiz pour valider le sujet</h2><p class="note">Il te reste ${total - answered} question${total - answered > 1 ? 's' : ''}. Se tester est ce qui fait vraiment retenir.</p>`;
    } else if (mode === 'new') {
      head = `<div class="card-kicker">Sujet validé ✓</div><div class="score">${score}/${total}</div><h2>${score === total ? 'Parfait !' : score >= total / 2 ? 'Bien joué.' : 'Ça viendra en révision.'}</h2><p class="note">Ces questions reviendront demain, puis dans 3, 7, 21 et 60 jours.</p>`;
    } else {
      head = `<div class="card-kicker">Relecture</div><h2>${esc(t.title)}</h2>${done ? `<p class="note">Validé le ${parse(done.date).toLocaleDateString('fr-FR')} · score ${done.score}/${done.total}</p>` : ''}`;
    }
    end.innerHTML = head +
      `<div class="small-title">Sources</div><ul class="sources">${(t.sources || []).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>` +
      ((t.further || []).length ? `<div class="small-title">Pour aller plus loin</div><ul class="sources">${t.further.map(f => `<li>${f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener">` : ''}${esc(f.kind ? f.kind[0].toUpperCase() + f.kind.slice(1) + ' — ' : '')}${esc(f.label)}${f.url ? '</a>' : ''}</li>`).join('')}</ul>` : '');
  };

  const quizNodes = t.quiz.map((q, qi) => quizCard(q, `Quiz · ${qi + 1}/${t.quiz.length}`, (picked, ok) => {
    answers[qi] = ok;
    if (mode === 'new' && Object.keys(answers).length === t.quiz.length && !isDone(t.day)) completeTopic(t, answers);
    renderEnd();
  }));

  renderEnd();
  buildCarousel(page, [cover, ...t.cards.map(c => el(cardHTML(c, t))), ...quizNodes, end]);
  return page;
}

function completeTopic(t, answers) {
  const score = Object.values(answers).filter(Boolean).length;
  state.completed[t.day] = { date: today(), score, total: t.quiz.length };
  // Toutes les questions entrent en révision : demain, puis 3, 7, 21, 60 jours si on répond juste.
  t.quiz.forEach((_, qi) => { state.srs[key(t.day, qi)] = { box: 0, due: addDays(today(), INTERVALS[0]) }; });
  save();
  markActivity();
}

/* ---------- Page « révisions » ---------- */
async function reviewPage(items) {
  const page = el(`<section class="page review" style="--dc:#8b7bff">
    <div class="page-label"><span><b>Révisions</b> · ${items.length} question${items.length > 1 ? 's' : ''}</span><span class="counter"></span></div>
  </section>`);
  const intro = el(`<div class="card cover" style="--dc:#8b7bff">
    <div class="emoji">🔁</div>
    <h1>Révisions du jour</h1>
    <p class="sub">${items.length} question${items.length > 1 ? 's' : ''} sur des sujets passés. Se tester à intervalles espacés, c'est ce qui ancre les connaissances en mémoire longue.</p>
    <div class="swipe-hint">Glisse vers la gauche →</div>
  </div>`);
  const results = {};
  const end = el('<div class="card end"></div>');
  const renderEnd = () => {
    const n = Object.keys(results).length;
    const ok = Object.values(results).filter(Boolean).length;
    end.innerHTML = n < items.length
      ? `<div class="card-kicker">Révisions</div><h2>Encore ${items.length - n} question${items.length - n > 1 ? 's' : ''}</h2><p class="note">Une bonne réponse repousse la question plus loin ; une erreur la fait revenir demain.</p>`
      : `<div class="card-kicker">Révisions terminées ✓</div><div class="score">${ok}/${items.length}</div><h2>Bien.</h2><p class="note">Fais défiler vers le bas pour le sujet du jour ↓</p>`;
  };
  const nodes = [];
  for (const it of items) {
    const t = await loadDay(it.day);
    const q = t.quiz[it.qi];
    if (!q) continue;
    const node = quizCard(q, `${t.emoji || ''} ${t.domain} · ${t.title}`, (picked, ok) => {
      results[key(it.day, it.qi)] = ok;
      grade(it.day, it.qi, ok);
      if (Object.keys(results).length === items.length) markActivity();
      renderEnd();
    });
    node.style.setProperty('--dc', colorOf(t.domain));
    nodes.push(node);
  }
  renderEnd();
  buildCarousel(page, [intro, ...nodes, end]);
  return page;
}

/* ---------- Page « statut » (fin du jour / stock) ---------- */
function statusPage() {
  const left = remaining();
  const next = nextTopic();
  let body;
  if (!INDEX.length) {
    body = `<div class="big">📭</div><h2>Aucun contenu</h2><p>Le fichier content/index.json est vide.</p>`;
  } else if (!next) {
    body = `<div class="big">🏁</div><h2>Tu as tout lu !</h2><p>Les ${INDEX.length} sujets sont terminés. Les révisions continuent chaque jour.</p>
      <div class="warn">Pour recharger l'appli : demande à Claude de générer de nouveaux sujets.</div>`;
  } else if (!canStartNext()) {
    body = `<div class="big">🌙</div><h2>C'est tout pour aujourd'hui</h2><p>Le prochain sujet arrive demain. Laisser du temps entre deux sujets aide la mémoire à consolider.</p>
      <p>Plus bas : tes sujets déjà lus, à relire quand tu veux ↓</p>`;
  } else {
    body = `<div class="big">↓</div><h2>Ta bibliothèque</h2><p>Plus bas : les sujets déjà lus, à relire quand tu veux.</p>`;
  }
  const stock = next && left <= LOW_STOCK
    ? `<div class="warn">Plus que ${left} sujet${left > 1 ? 's' : ''} en stock. Pense à demander à Claude d'en générer de nouveaux.</div>` : '';
  return el(`<section class="page status"><div class="message">${body}
    <div class="stats">
      <div class="stat"><b>${Object.keys(state.completed).length}</b><span>sujets</span></div>
      <div class="stat"><b>${streak()}</b><span>jours d'affilée</span></div>
      <div class="stat"><b>${mastered()}</b><span>questions maîtrisées</span></div>
    </div>${stock}</div></section>`);
}

/* ---------- Fil principal ---------- */
let renderedOn = null;
async function render() {
  const feed = $('#feed');
  renderedOn = today();
  renderStreak();
  const pages = [];
  try {
    const due = dueReviews();
    if (due.length) pages.push(await reviewPage(due));
    const next = nextTopic();
    if (next && canStartNext()) pages.push(await topicPage(next, 'new'));
    pages.push(statusPage());
    const done = INDEX.filter(d => isDone(d.day)).sort((a, b) =>
      (state.completed[b.day].date + pad(b.day)).localeCompare(state.completed[a.day].date + pad(a.day)));
    for (const d of done) pages.push(await topicPage(d, 'reread'));
  } catch (e) {
    console.error(e);
    pages.push(el(`<section class="page"><div class="message"><div class="big">⚠️</div><h2>Impossible de charger le contenu</h2><p>${esc(e.message)}</p></div></section>`));
  }
  feed.replaceChildren(...pages);
  feed.scrollTop = 0;
}

/* ---------- Menu / bibliothèque ---------- */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

function openSheet() {
  const next = nextTopic();
  const domains = [...new Set(INDEX.map(d => d.domain))];
  $('#sheetContent').innerHTML = `
    <h3>Ma progression</h3>
    <div class="stats">
      <div class="stat"><b>${Object.keys(state.completed).length}/${INDEX.length}</b><span>sujets</span></div>
      <div class="stat"><b>${streak()}</b><span>jours d'affilée</span></div>
      <div class="stat"><b>${dueReviews().length}</b><span>révisions dues</span></div>
    </div>
    <div class="domains">${domains.map(d => `<span class="chip" style="color:${colorOf(d)}">${esc(d)}</span>`).join('')}</div>
    <h3>Tous les sujets</h3>
    <ul class="lib">${INDEX.map(d => {
      const c = state.completed[d.day];
      const isNext = next && next.day === d.day && canStartNext();
      const locked = !c && !isNext;
      return `<li class="${locked ? 'locked' : ''}" data-day="${d.day}" data-open="${locked ? '' : 1}">
        <span class="e">${esc(d.emoji || '📘')}</span>
        <span class="t"><b>${esc(d.title)}</b><span style="color:${colorOf(d.domain)}">${esc(d.domain)}</span></span>
        <span class="s">${c ? `✓ ${c.score}/${c.total}` : isNext ? 'aujourd\'hui' : '🔒'}</span></li>`;
    }).join('')}</ul>
    <div class="row-actions">
      ${next && !canStartNext() ? '<button class="btn ghost" id="moreBtn">Lire un sujet de plus aujourd\'hui</button>' : ''}
      ${installPrompt ? '<button class="btn" id="installBtn">Installer l\'appli</button>' : ''}
    </div>
    <p class="note" style="margin-top:16px">Stock : ${remaining()} sujet${remaining() > 1 ? 's' : ''} non lu${remaining() > 1 ? 's' : ''}. Ta progression est enregistrée sur ce téléphone uniquement.</p>
    <div class="row-actions"><button class="btn ghost" id="resetBtn">Réinitialiser ma progression</button></div>`;
  $('#sheet').hidden = false; $('#sheetBackdrop').hidden = false;

  $('#sheetContent').querySelectorAll('.lib li[data-open="1"]').forEach(li => li.addEventListener('click', () => {
    closeSheet();
    document.getElementById('day-' + li.dataset.day)?.scrollIntoView({ behavior: 'smooth' });
  }));
  $('#moreBtn')?.addEventListener('click', () => {
    state.bonus[today()] = (state.bonus[today()] || 0) + 1; save(); closeSheet(); render();
  });
  $('#installBtn')?.addEventListener('click', async () => { installPrompt.prompt(); installPrompt = null; closeSheet(); });
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Effacer toute ta progression (sujets lus, révisions, série) ? Cette action est définitive.')) {
      state = freshState(); save(); closeSheet(); render();
    }
  });
}
function closeSheet() { $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true; }

/* ---------- Démarrage ---------- */
async function start() {
  $('#menuBtn').addEventListener('click', openSheet);
  $('#sheetBackdrop').addEventListener('click', closeSheet);
  // Si l'appli reste ouverte d'un jour à l'autre, on rafraîchit au retour.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && renderedOn !== today()) render();
  });
  try { await loadIndex(); } catch (e) { INDEX = []; }
  await render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
start();
