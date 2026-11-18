const LANG = (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
const STR = {
  en: {
    open: 'The office is open', closed: 'The office is closed', openIt: 'Open the office', front: 'Bring to front',
    window: 'In its own window', never: 'Never opened', justNow: 'Closed just now', closedAgo: 'Closed {0}',
    empty: 'No project had an agent this week.', failed: 'Squadron did not open it: {0}',
    projects: ['project', 'projects'], agents: ['agent', 'agents'], working: ['working', 'working'], waiting: ['waiting for you', 'waiting for you'],
  },
  fr: {
    open: 'Le bureau est ouvert', closed: 'Le bureau est fermé', openIt: 'Ouvrir le bureau', front: 'Mettre au premier plan',
    window: 'Dans sa propre fenêtre', never: 'Jamais ouvert', justNow: 'Fermé à l’instant', closedAgo: 'Fermé {0}',
    empty: 'Aucun projet n’a eu d’agent cette semaine.', failed: 'Squadron ne l’a pas ouvert : {0}',
    projects: ['projet', 'projets'], agents: ['agent', 'agents'], working: ['au travail', 'au travail'], waiting: ['vous attend', 'vous attendent'],
  },
}[LANG];

const $ = (id) => document.getElementById(id);
const rtf = new Intl.RelativeTimeFormat(LANG, { numeric: 'auto' });
let last = null;

function ago(at) {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return STR.justNow;
  const [n, unit] = s < 3600 ? [Math.round(s / 60), 'minute'] : s < 86400 ? [Math.round(s / 3600), 'hour'] : [Math.round(s / 86400), 'day'];
  return STR.closedAgo.replace('{0}', rtf.format(-n, unit));
}

function chip(n, words) {
  const el = document.createElement('span');
  el.className = 'chip';
  const b = document.createElement('b');
  b.textContent = n;
  el.append(b, n === 1 ? words[0] : words[1]);
  return el;
}

function render(s) {
  last = s;
  const card = $('card');
  card.classList.add('ready');
  card.classList.toggle('open', s.open);
  card.classList.toggle('empty', !s.projects);
  $('state').textContent = s.open ? STR.open : STR.closed;
  const stats = $('stats');
  stats.replaceChildren();
  if (s.projects) {
    stats.append(chip(s.projects, STR.projects), chip(s.agents, STR.agents), chip(s.working, STR.working), chip(s.waiting, STR.waiting));
  } else {
    const t = document.createElement('span');
    t.className = 'empty-text';
    t.textContent = STR.empty;
    stats.append(t);
  }
  const btn = $('open');
  btn.textContent = s.open ? STR.front : STR.openIt;
  btn.classList.toggle('primary', !s.open);
  $('when').textContent = s.open ? STR.window : s.closed_at ? ago(s.closed_at) : STR.never;
  if (s.open) $('err').textContent = '';
}

$('open').addEventListener('click', () => {
  $('err').textContent = '';
  squadron.send({ type: 'open' });
});

squadron.on((m) => {
  if (m.type === 'status') render(m);
  else if (m.type === 'openFailed') $('err').textContent = STR.failed.replace('{0}', m.error);
});

setInterval(() => { if (last && !last.open) render(last); }, 30000);
squadron.send({ type: 'ready' });
