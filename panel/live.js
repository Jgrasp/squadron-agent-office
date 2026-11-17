const PALETTE = ['#E08A5B', '#A78BFA', '#60A5FA', '#A3E635', '#ED8115', '#F472B6', '#FACC15', '#2DD4BF', '#F87171', '#38BDF8'];
const RAW = { projects: new Map(), groups: [] };
const DAY = 86400000;
let started = false, pending = [];

function hexColor(c, id) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c || '');
  if (!m) return PALETTE[hashOf(11, id) % PALETTE.length];
  const h = m[1];
  return '#' + (h.length === 3 ? [...h].map((x) => x + x).join('') : h.slice(0, 6));
}
function setData() {
  const byId = new Map(RAW.groups.map((g) => [g.id, g]));
  const rootOf = (id) => {
    let g = byId.get(id), n = 0;
    while (g && g.parent && byId.has(g.parent) && n++ < 32) g = byId.get(g.parent);
    return g ? g.id : '';
  };
  GROUPS = RAW.groups.filter((g) => !g.parent || !byId.has(g.parent)).map((g) => ({ id: g.id, name: g.name }));
  PROJ = {};
  const now = Date.now();
  RAW.projects.forEach((p) => {
    if (p.archived || !(p.week_agents > 0)) return;
    PROJ[p.id] = { id: p.id, name: p.name || '—', color: hexColor(p.color, p.id), group: p.group ? rootOf(p.group) : '', n: p.week_agents, idle: p.active > 0 && now - p.active > 3 * DAY };
  });
}
function setProjects(projects, groups) {
  if (projects) RAW.projects = new Map(projects.map((p) => [p.id, p]));
  if (groups) RAW.groups = groups;
  setData();
  if (ready && layoutSigOf() !== layoutSig) wantRebuild = true;
}
function saveView() {
  if (ready) squadron.send({ type: 'view', view: viewNow() });
}
function saveLayouts() {
  squadron.send({ type: 'layouts', layouts: { kept: LAYS.kept, start: LAYS.start } });
}

const THEME_VARS = ['--bg-main', '--surface-1', '--surface-2', '--surface-3', '--border', '--text', '--text-muted', '--text-dim', '--ink', '--accent', '--accent-link', '--ok-text', '--err-text'];
const themeKey = () => { const cs = getComputedStyle(document.documentElement); return THEME_VARS.map((v) => cs.getPropertyValue(v).trim()).join(); };
let theme = '';
async function themeReady() {
  for (let k = 0; k < 40 && !getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); k++) await wait(50);
  theme = themeKey();
}
async function fontsReady() {
  const faces = ['400 12px "DM Sans"', '500 12px "DM Sans"', '600 12px "DM Sans"', '700 12px "DM Sans"', '400 12px "DM Mono"', '500 12px "DM Mono"'];
  try { await Promise.all(faces.map((f) => document.fonts.load(f))); } catch {}
}
new MutationObserver(() => {
  const k = themeKey();
  if (k === theme) return;
  theme = k;
  resetColors();
  if (ready) wantRebuild = true;
}).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

function handle(m) {
  if (m.type === 'event') {
    lastEventAt = performance.now();
    const d = m.data || {};
    if (m.name === 'agent.status' || m.name === 'agent.started') applyAgent(d);
    else if (m.name === 'agent.archived') applyAgent({ ...d, archived: true });
    else if (m.name === 'agent.message') message(d.from, d.to);
    else if (m.name === 'usage') USAGE.value = d;
    else if (m.name === 'groups.changed') setProjects(null, d.groups || []);
    else if (m.name === 'project.removed') { RAW.projects.delete(d.id); setProjects(null, null); }
    else if (m.name.startsWith('project.')) { RAW.projects.set(d.id, d); setProjects(null, null); }
  } else if (m.type === 'agents') {
    lastEventAt = performance.now();
    applySnapshot(m.agents || []);
  } else if (m.type === 'projects') {
    setProjects(m.projects || [], m.groups || []);
  } else if (m.type === 'showFailed') {
    openFailed = selId;
    refreshInspector();
  }
}

async function start(m) {
  if (started) return;
  started = true;
  await themeReady();
  await fontsReady();
  setProjects(m.projects || [], m.groups || []);
  (m.agents || []).forEach((ag) => { if (!ag.archived) AG[ag.id] = ag; });
  USAGE.value = m.usage || null;
  if (m.layouts) Object.assign(LAYS, { kept: m.layouts.kept || [], start: m.layouts.start ?? null });
  const v = m.resume && m.view && m.view.seed ? m.view : null;
  await initApp();
  await construct(v ? v.seed : LAYS.start ?? newSeed(), { intro: !v, quiet: !!v });
  if (v) {
    restoreView(v);
    const a = v.sel && A[v.sel];
    if (a) {
      const r = stage.getBoundingClientRect(), [X, Y] = P(a.x, a.y, 1);
      inspect(a.id, r.left + cam.tx + X * cam.s, r.top + cam.ty + Y * cam.s);
    }
  }
  saveView();
  const queued = pending;
  pending = [];
  queued.forEach(handle);
}

document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = tr(el.dataset.t); });
document.querySelectorAll('[data-tt]').forEach((el) => { el.title = tr(el.dataset.tt); });
document.getElementById('layBtn').title = tr('layouts');
document.getElementById('regen').title = tr('newLayoutHint');
document.getElementById('ldStep').textContent = tr('readingProjects', '…');
squadron.on((m) => {
  if (!m || typeof m !== 'object') return;
  if (m.type === 'reload') return location.reload();
  if (m.type === 'init') return start(m);
  if (!started) pending.push(m);
  else handle(m);
});
squadron.send({ type: 'ready' });
