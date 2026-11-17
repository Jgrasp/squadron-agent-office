const VARS = new Map();
const cssVar = (name) => {
  if (!VARS.has(name)) VARS.set(name, getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888888');
  return VARS.get(name);
};
const resolveVars = (s) => s.replace(/var\((--[\w-]+)\)/g, (m, v) => cssVar(v));
const COLORS = new Map();
const resetColors = () => { VARS.clear(); COLORS.clear(); };
const cctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
function color(str) {
  if (str == null || str === 'none' || str === 'transparent') return null;
  if (COLORS.has(str)) return COLORS.get(str);
  cctx.clearRect(0, 0, 1, 1);
  cctx.fillStyle = '#000';
  cctx.fillStyle = resolveVars(str);
  cctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cctx.getImageData(0, 0, 1, 1).data;
  const out = a ? { c: (r << 16) | (g << 8) | b, a: a / 255 } : null;
  COLORS.set(str, out);
  return out;
}

function parseTransform(s) {
  const m = new PIXI.Matrix(), re = /(\w+)\(([^)]*)\)/g;
  let x;
  while ((x = re.exec(s))) {
    const v = x[2].split(/[\s,]+/).filter(Boolean).map(Number), t = new PIXI.Matrix();
    if (x[1] === 'translate') t.translate(v[0], v[1] || 0);
    else if (x[1] === 'scale') t.scale(v[0], v[1] ?? v[0]);
    else if (x[1] === 'matrix') t.set(v[0], v[1], v[2], v[3], v[4], v[5]);
    else if (x[1] === 'skewY') t.set(1, Math.tan(v[0] * Math.PI / 180), 0, 1, 0, 0);
    else if (x[1] === 'skewX') t.set(1, 0, Math.tan(v[0] * Math.PI / 180), 1, 0, 0);
    else if (x[1] === 'rotate') t.rotate(v[0] * Math.PI / 180);
    m.append(t);
  }
  return m;
}

function readAttrs(el, inh) {
  const st = {};
  (el.getAttribute('style') || '').split(';').forEach((p) => { const i = p.indexOf(':'); if (i > 0) st[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  const g = (k) => st[k] ?? el.getAttribute(k);
  const fill = g('fill');
  return {
    fill: fill ?? inh.fill ?? '#000', explicitFill: fill != null || !!inh.explicitFill, stroke: g('stroke') ?? inh.stroke ?? null,
    sw: +(g('stroke-width') ?? inh.sw ?? 1), cap: g('stroke-linecap') ?? inh.cap ?? 'butt', join: g('stroke-linejoin') ?? inh.join ?? 'miter',
    fop: +(g('fill-opacity') ?? 1), font: g('font-family') ?? inh.font ?? 'DM Sans, sans-serif', size: +(g('font-size') ?? inh.size ?? 12),
    weight: String(g('font-weight') ?? inh.weight ?? '400'), ls: +(g('letter-spacing') ?? inh.ls ?? 0), anchor: g('text-anchor') ?? inh.anchor ?? 'start',
  };
}
const nums = (s) => (s || '').trim().split(/[\s,]+/).filter(Boolean).map(Number);

function drawShape(g, el, a) {
  const tag = el.tagName, n = (k) => +(el.getAttribute(k) || 0);
  const f = color(a.fill), s = a.stroke ? color(a.stroke) : null;
  const doFill = () => f && g.fill({ color: f.c, alpha: f.a * a.fop });
  const doStroke = () => s && g.stroke({ color: s.c, alpha: s.a, width: a.sw, cap: a.cap, join: a.join });
  if (tag === 'polygon') { g.poly(nums(el.getAttribute('points'))); doFill(); doStroke(); }
  else if (tag === 'polyline') { g.poly(nums(el.getAttribute('points')), false); doStroke(); }
  else if (tag === 'line') { g.moveTo(n('x1'), n('y1')).lineTo(n('x2'), n('y2')); doStroke(); }
  else if (tag === 'path') { g.path(new PIXI.GraphicsPath(el.getAttribute('d'))); if (a.explicitFill || !s) doFill(); doStroke(); }
  else if (tag === 'rect') { const rx = n('rx'); rx ? g.roundRect(n('x'), n('y'), n('width'), n('height'), rx) : g.rect(n('x'), n('y'), n('width'), n('height')); doFill(); doStroke(); }
  else if (tag === 'circle') { g.circle(n('cx'), n('cy'), n('r')); doFill(); doStroke(); }
  else if (tag === 'ellipse') { g.ellipse(n('cx'), n('cy'), n('rx'), n('ry')); doFill(); doStroke(); }
}

const METRICS = new Map();
function makeText(el, a, o) {
  const wrap = new PIXI.Container(), x = +(el.getAttribute('x') || 0), y = +(el.getAttribute('y') || 0);
  const parts = [...el.childNodes].map((nd) => (nd.nodeType === 3 ? { t: nd.textContent, a } : { t: nd.textContent, a: readAttrs(nd, a) })).filter((p) => p.t);
  let cx = 0;
  const list = parts.map((p) => {
    const fc = color(p.a.fill), sc = p.a.stroke ? color(p.a.stroke) : null;
    const style = { fontFamily: p.a.font, fontSize: p.a.size, fontWeight: p.a.weight, letterSpacing: p.a.ls, fill: fc ? fc.c : sc ? sc.c : 0 };
    if (sc) style.stroke = { color: sc.c, width: p.a.sw };
    let t;
    if (o.bitmap && !sc) {
      t = new PIXI.BitmapText({ text: p.t, style: { ...style, fill: 0xffffff } });
      t.tint = fc ? fc.c : 0;
    } else t = new PIXI.Text({ text: p.t, style, resolution: o.res || 3 });
    t.alpha = fc ? fc.a : sc ? sc.a : 1;
    const key = `${p.a.font}|${p.a.size}|${p.a.weight}`;
    if (!METRICS.has(key)) METRICS.set(key, PIXI.CanvasTextMetrics.measureText('M', new PIXI.TextStyle(style)).fontProperties);
    t.x = cx; t.y = -(METRICS.get(key).ascent || p.a.size * 0.8) - (sc ? p.a.sw / 2 : 0);
    cx += t.width - (sc ? p.a.sw : 0);
    wrap.addChild(t);
    return t;
  });
  const shift = a.anchor === 'middle' ? -cx / 2 : a.anchor === 'end' ? -cx : 0;
  list.forEach((t) => { t.x += x + shift; t.y += y; });
  return wrap;
}

function svgWalk(el, parent, inh, o, st = { gfx: null }) {
  const G = () => st.gfx ??= parent.addChild(new PIXI.Graphics());
  for (const ch of el.children) {
    const tag = ch.tagName, a = readAttrs(ch, inh);
    const keep = ch.id || (o.keep && [...ch.classList].some((c) => o.keep.includes(c)));
    const tf = ch.getAttribute('transform'), op = ch.getAttribute('opacity'), filter = ch.getAttribute('filter');
    if (tag === 'g' && !keep && !tf && op == null && !filter) { svgWalk(ch, parent, a, o, st); continue; }
    if (tag === 'g' || tag === 'text' || keep || tf || op != null || filter) {
      const c = new PIXI.Container();
      if (tf) c.setFromMatrix(parseTransform(tf));
      if (op != null) c.alpha = +op;
      if (filter) c.filters = [new PIXI.BlurFilter({ strength: 3, quality: 2 })];
      if (ch.id) o.reg[ch.id] = c;
      if (o.keep) [...ch.classList].forEach((cl) => { if (o.keep.includes(cl)) (o.reg['.' + cl] ??= []).push(c); });
      const dp = ch.getAttribute('data-p');
      if (dp) c.dataP = dp;
      parent.addChild(c);
      st.gfx = null;
      if (tag === 'g') svgWalk(ch, c, a, o);
      else if (tag === 'text') c.addChild(makeText(ch, a, o));
      else drawShape(c.addChild(new PIXI.Graphics()), ch, a);
      if (filter) c.cacheAsTexture({ resolution: o.res || 3 });
      continue;
    }
    drawShape(G(), ch, a);
  }
}

function svgToPixi(markup, o = {}) {
  o.reg ??= {};
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
  const root = new PIXI.Container();
  svgWalk(doc.documentElement, root, {}, o);
  return root;
}

PIXI.BitmapFontManager.defaultOptions.resolution = 2;
const ATLAS = { size: 1024, x: 0, y: 0, row: 0 };
function atlasSlot(w, h) {
  if (!ATLAS.cv) {
    ATLAS.cv = Object.assign(document.createElement('canvas'), { width: ATLAS.size, height: ATLAS.size });
    ATLAS.ctx = ATLAS.cv.getContext('2d');
    ATLAS.src = PIXI.Texture.from(ATLAS.cv).source;
    ATLAS.src.scaleMode = 'nearest';
  }
  if (ATLAS.x + w + 1 > ATLAS.size) { ATLAS.x = 0; ATLAS.y += ATLAS.row + 1; ATLAS.row = 0; }
  const r = { x: ATLAS.x, y: ATLAS.y };
  ATLAS.x += w + 1;
  ATLAS.row = Math.max(ATLAS.row, h);
  return r;
}
const TEX = new Map();
function poseTexture(look, pose, hat, defer = false) {
  const key = look.join() + pose + hat;
  if (TEX.has(key)) return TEX.get(key);
  const rows = POSES[pose], flat = FLAT.has(pose), w = rows[0].length;
  const top = rows.findIndex((r) => /[hs]/.test(r)), withHat = hat && !flat, extra = withHat ? Math.max(0, 2 - top) : 0, h = rows.length + extra;
  const { x, y } = atlasSlot(w, h), ctx = ATLAS.ctx;
  const [hair, skin, shirt, pants] = look, col = { h: hair, s: skin, t: shirt, p: pants, ...PROPS };
  const put = (r, j) => [...r].forEach((c, i) => { if (c === '.' || c === ' ') return; ctx.fillStyle = col[c]; ctx.fillRect(x + i, y + j, 1, 1); });
  rows.forEach((r, j) => put(r, j + extra));
  if (withHat) HAT.forEach((r, j) => put(r, top - 2 + j + extra));
  const tex = new PIXI.Texture({ source: ATLAS.src, frame: new PIXI.Rectangle(x, y, w, h) });
  if (!defer) ATLAS.src.update();
  const x0 = -w * PX / 2, y0 = -rows.length * PX - extra * PX;
  const out = { tex, m: flat ? new PIXI.Matrix(PX, 0.5 * PX, 0, PX, x0, 0.5 * x0 + y0 + 4) : new PIXI.Matrix(PX, 0, 0, PX, x0, y0) };
  TEX.set(key, out);
  return out;
}
const OUTLINES = new Map();
function outlineTexture(pose, hat) {
  const key = pose + hat;
  if (OUTLINES.has(key)) return OUTLINES.get(key);
  const rows = POSES[pose], flat = FLAT.has(pose), w = rows[0].length;
  const top = rows.findIndex((r) => /[hs]/.test(r)), withHat = hat && !flat, extra = withHat ? Math.max(0, 2 - top) : 0, h = rows.length + extra;
  const on = new Set(), mark = (r, j) => [...r].forEach((c, i) => { if (c !== '.' && c !== ' ') on.add(i + ',' + j); });
  rows.forEach((r, j) => mark(r, j + extra));
  if (withHat) HAT.forEach((r, j) => mark(r, top - 2 + j + extra));
  const { x, y } = atlasSlot(w + 2, h + 2), ctx = ATLAS.ctx;
  ctx.fillStyle = '#ffffff';
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    if (on.has(i + ',' + j)) continue;
    let near = false;
    for (let dj = -1; dj <= 1 && !near; dj++) for (let di = -1; di <= 1; di++) if (on.has(i + di + ',' + (j + dj))) { near = true; break; }
    if (near) ctx.fillRect(x + i + 1, y + j + 1, 1, 1);
  }
  ATLAS.src.update();
  const base = poseTexture(POSE_LOOK, pose, hat, true).m, m = base.clone();
  m.tx -= m.a + m.c; m.ty -= m.b + m.d;
  const out = { tex: new PIXI.Texture({ source: ATLAS.src, frame: new PIXI.Rectangle(x, y, w + 2, h + 2) }), m };
  OUTLINES.set(key, out);
  return out;
}
const POSE_LOOK = ['#000', '#000', '#000', '#000'];
function warmPoses(looks) {
  looks.forEach((look) => Object.keys(POSES).forEach((pose) => [false, true].forEach((hat) => poseTexture(look, pose, hat, true))));
  ATLAS.src.update();
}

const ANIM = ['rise1', 'rise2', 'rise3', 'steam', 'sweat', 'drop'];
const fade = (p, peak, top = 1) => (p < peak ? p / peak * top : top * (1 - (p - peak) / (1 - peak)));
const cyc = (t, period, delay) => ((((t - delay) % period) + period) % period) / period;
function animateBubble(r, t) {
  if (!r) return;
  [['.rise1', 0], ['.rise2', 0.8], ['.rise3', 1.6]].forEach(([k, d]) => (r[k] || []).forEach((o) => { const p = cyc(t, 2.4, d); o.position.set(10 * p, -26 * p); o.alpha = fade(p, 0.15); }));
  (r['.steam'] || []).forEach((o) => { const p = cyc(t, 1.8, 0); o.y = 4 - 14 * p; o.alpha = fade(p, 0.4, 0.8); });
  (r['.sweat'] || []).forEach((o) => { const p = cyc(t, 1.4, 0); o.y = 10 * p; o.alpha = fade(p, 0.2); });
  (r['.drop'] || []).forEach((o, i) => { const p = cyc(t, 0.9, 0.3 * i); o.y = 9 * p; o.alpha = 1 - p; });
}
