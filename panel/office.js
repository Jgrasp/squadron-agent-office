const WH = 3, LOW = 1.1, SPEED = 2.8, HALL_Y = 9;
const C = {
  floor: '#6b4a34', floorLine: '#5c3f2c', corridor: '#4a3a30', runner: '#5e4a3c',
  wallL: '#4a4048', wallR: '#564b52', wallEdge: '#2e272c', cap: '#6a5e66', base: '#2a2226', facade: '#4f454c', facadeCap: '#655961',
  board: '#e9e4dc', boardFrame: '#8d8a86', notes: ['#f4d06f', '#9ad6cb', '#f59e8c', '#b8d98c'],
  deskTop: '#d8d2c8', deskL: '#a8a196', deskR: '#bcb5aa', mon: '#24242a', monSide: '#1a1a1f', kb: '#3a3a42', chair: '#2a2a30',
  sofa: '#5c5258', sofaDark: '#463e43', pot: '#b36a4a', potDark: '#8e5238', leaf: '#5f8f5a', leafDark: '#4a7347', ink: '#1b1714',
  door: '#6a4a36', web: 'rgba(235,230,220,0.6)', grass: '#3d5530', grassDark: '#34492a', tuft: '#4f6b3a', gravel: '#7d7060', sand: '#b39a6c',
  trunk: '#6a4830', water: '#3f6f8a', waterLight: '#4f86a3',
  pave: '#5f5a55', paveLine: '#544f4a', curb: '#7a746c', road: '#34333a', lane: '#cfc9be',
};

let GROUPS = [], PROJ = {};

const Z = [], DOORS = [], LOUNGES = [], SHARED = {};
let layoutSeed = 0, LW = 44, BOT = 17, SPX = 45;
const CENTERS = ['pp', 'pool', 'meet'], EASTS = ['arcade', 'foot', 'shelf'];
const tierOf = (n) => (n === 0 ? 'closet' : n === 1 ? 'booth' : n <= 3 ? 'small' : n <= 10 ? 'medium' : n <= 19 ? 'large' : 'open');
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hashOf = (seed, key) => { let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b); for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 0x5bd1e995) ^ (h >>> 13); h = Math.imul(h ^ (h >>> 15), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
const rngFor = (seed, key) => mulberry(hashOf(seed, key));
const order = (seed, keys) => [...keys].sort((a, b) => hashOf(seed, a) - hashOf(seed, b));
const zoneById = (id) => Z.find((z) => z.id === id);
const gidOf = (p) => (SHARED[p] ? gidOf(SHARED[p][0]) : GROUPS.some((g) => g.id === PROJ[p].group) ? PROJ[p].group : 'none');
const byGroup = (seed, keys) => [...keys].sort((a, b) => (hashOf(seed, 'g:' + gidOf(a)) - hashOf(seed, 'g:' + gidOf(b))) || (hashOf(seed, a) - hashOf(seed, b)));
const roomOf = (p) => Z.find((z) => z.p === p || z.parts?.some((o) => o.p === p));
function loungeOf(p) {
  const r = roomOf(p), cx = r ? (r.x0 + r.x1) / 2 : 0, cy = r ? r.y0 : 0, d = (z) => Math.hypot((z.x0 + z.x1) / 2 - cx, (z.y0 - cy) * 3);
  return LOUNGES.reduce((m, z) => (d(z) < d(m) ? z : m)).id;
}
const rs = (id, p) => (id.startsWith('lounge.') ? loungeOf(p) + id.slice(6) : id);
const lift = (c) => { const n = parseInt(c.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l < 0.42 ? mix(c, 45, '#e9e4dc') : c; };
const FACADE = '#4f454c';

const CW = 3, BAND = 18, LOBBY_D = 6;
const tierU = (u) => (SHARED[u] ? 'shared' : u.startsWith('lounge:') ? 'lounge' : tierOf(PROJ[u].n));
const rowsFor = (u) => ({ lounge: ['t'], open: ['t'], shared: ['b'], small: ['b'], booth: ['b'] })[tierU(u)] || ['t', 'b'];
function baseW(u) {
  const t = tierU(u);
  if (t === 'lounge') return 11;
  if (t === 'shared') return +(2.1 + SHARED[u].reduce((m, p) => m + (PROJ[p].n > 1 ? 2 : 1), 0) * 2.3).toFixed(1);
  return { open: 15, large: 11.5, medium: 9, small: 5, booth: 4.5 }[t];
}
function roomSpec(seed, u, row, w) {
  const R = rngFor(seed, u + ':' + row), t = tierU(u), between = (lo, hi) => +(lo + R() * Math.max(0, hi - lo)).toFixed(1);
  if (t === 'lounge') return { type: 'lounge', door: { edge: 's', at: 8 } };
  if (t === 'shared') {
    const parts = SHARED[u].map((p) => ({ p, n: PROJ[p].n > 1 ? 2 : 1 })), D = parts.reduce((m, o) => m + o.n, 0);
    return { parts, desks: { wall: 'n', n: D }, door: { edge: 'n', at: +(0.5 + D * 2.3 + 0.7).toFixed(1) } };
  }
  if (t === 'small') return { p: u, desks: { wall: 'w', n: 2, v0: 0.9 }, bean: true, door: { edge: 'n', at: 4 } };
  if (t === 'booth') return { p: u, desks: { wall: 'n', n: 1, u0: 0.4 }, door: { edge: 'n', at: 3.4 } };
  if (t === 'open') {
    const aisle = 0.5 + 3 * 2.3 + 0.35;
    return { p: u, desks: { wall: 'n', n: 4, island: 3 }, sofa: { u: w - 3.8, v: 6.0 }, door: { edge: 's', at: between(aisle + 0.8, w - 4.4) }, board: w - (0.5 + 4 * 2.3) >= 2.6 ? 0.5 + 4 * 2.3 + 0.2 : null };
  }
  const n = t === 'large' ? 4 : 3, end = 0.5 + n * 2.3;
  if (row === 'b') return { p: u, desks: { wall: 'n', n }, sofa: { u: 0.6, v: 3.7 }, door: { edge: 'n', at: +(end + 0.7).toFixed(1) } };
  return { p: u, desks: { wall: 'n', n }, sofa: { u: 0.6, v: 3.7 }, door: { edge: 's', at: between(4.6, w - 1.1) }, board: w - end >= 2.6 ? end - 0.3 : null };
}

function generateLayout(seed) {
  Z.length = 0; DOORS.length = 0; LOUNGES.length = 0;
  Object.keys(SHARED).forEach((k) => delete SHARED[k]);
  const r2 = (v) => Math.round(v * 100) / 100;
  const zone = (id, x0, y0, x1, y1, o = {}) => { [x0, y0, x1, y1] = [x0, y0, x1, y1].map(r2); const z = { id, x0, y0, x1, y1, w: r2(x1 - x0), d: r2(y1 - y0), type: 'room', ...o }; Z.push(z); return z; };
  const live = Object.keys(PROJ).filter((p) => !PROJ[p].archived && PROJ[p].n > 0);
  const groups = {};
  live.forEach((p) => (groups[gidOf(p)] ||= []).push(p));
  const gids = order(seed, Object.keys(groups).map((g) => 'g:' + g)).map((k) => k.slice(2));
  const cands = gids.map((g) => order(seed, groups[g].filter((p) => PROJ[p].n <= 3)));
  const chosen = gids.map((g, i) => cands[i].length >= 2 && hashOf(seed, 'share:' + g) % 2 === 0);
  if (!chosen.some(Boolean)) { const i = cands.findIndex((c) => c.length >= 2); if (i >= 0) chosen[i] = true; }
  const units = {};
  gids.forEach((g, i) => {
    let list = [...groups[g]];
    if (chosen[i]) {
      const parts = cands[i].slice(0, cands[i].length >= 3 && hashOf(seed, 'three:' + g) % 2 ? 3 : 2), key = 'share:' + parts.join('+');
      SHARED[key] = parts;
      list = list.filter((p) => !parts.includes(p)).concat(key);
    }
    units[g] = list;
  });
  const wsum = (l) => l.reduce((t, u) => t + baseW(u), 0);
  const total = gids.reduce((t, g) => t + wsum(units[g]), 0) + 11;
  const nB = total > 46 ? 4 : 2, nL = live.length >= 7 && nB === 4 ? 2 : 1;
  const blocks = Array.from({ length: nB }, (_, k) => ({ band: k >> 1, side: k % 2 ? 'E' : 'W', units: [], w: 0 }));
  const put = (b, list) => { b.units.push(...list); b.w += wsum(list); };
  put(blocks[hashOf(seed, 'L0') % 2], ['lounge:0']);
  if (nL > 1) put(blocks[2 + (hashOf(seed, 'L1') % 2)], ['lounge:1']);
  [...gids].sort((p, q) => wsum(units[q]) - wsum(units[p])).forEach((g) => put(blocks.reduce((m, o) => (o.w < m.w ? o : m)), units[g]));
  blocks.forEach((b) => {
    if (b.units.length) return;
    const donor = blocks.filter((o) => o.units.filter((u) => !u.startsWith('lounge')).length > 1).sort((p, q) => q.w - p.w)[0];
    if (!donor) return;
    const u = donor.units.filter((x) => !x.startsWith('lounge')).pop();
    donor.units.splice(donor.units.indexOf(u), 1); donor.w -= baseW(u); put(b, [u]);
  });
  blocks.forEach((b) => {
    b.t = []; b.b = [];
    [...b.units].sort((p, q) => baseW(q) - baseW(p)).forEach((u) => {
      const ok = rowsFor(u), r = ok.length === 1 ? ok[0] : wsum(b.t) <= wsum(b.b) ? 't' : 'b';
      b[r].push(u);
    });
    if (!b.b.length && b.t.length > 1) { const u = [...b.t].reverse().find((x) => rowsFor(x).includes('b')); if (u) { b.t.splice(b.t.indexOf(u), 1); b.b.push(u); } }
    if (!b.t.length && b.b.length > 1) { const u = [...b.b].reverse().find((x) => rowsFor(x).includes('t')); if (u) { b.b.splice(b.b.indexOf(u), 1); b.t.push(u); } }
    b.t = byGroup(seed, b.t.filter((u) => !u.startsWith('lounge'))).concat(b.t.filter((u) => u.startsWith('lounge')));
    if (b.t.some((u) => u.startsWith('lounge'))) { const l = b.t.pop(); b.t.splice(hashOf(seed, l) % (b.t.length + 1), 0, l); }
    b.b = byGroup(seed, b.b);
  });
  blocks.forEach((b) => { b.W = Math.max(wsum(b.t), wsum(b.b), 9); });
  const sideW = (side) => Math.max(0, ...blocks.filter((b) => b.side === side).map((b) => b.W));
  const WW = sideW('W'), WE = sideW('E');
  LW = WW + CW + WE; SPX = WW + CW / 2; BOT = (nB / 2) * BAND;
  const h = hashOf(seed, 'lounge');
  zone('vN', -1, -1, LW + 1, 0, { type: 'void' });
  zone('vW', -1, 0, 0, BOT, { type: 'void' });
  const span = (side, w) => (side === 'W' ? [WW - w, WW] : [WW + CW, WW + CW + w]);
  const strip = (side, xa, xb, y0, y1, fill) => {
    if (side === 'W' && xa > 0) zone(`v-${y0}-${side}`, 0, y0, xa, y1, { type: 'void' });
    fill();
    if (side === 'E' && xb < LW) zone(`v-${y0}-${side}`, xb, y0, LW, y1, { type: 'void' });
  };
  const rowZones = (b, r) => {
    const list = b[r], natural = wsum(list), width = list.length && b.W - natural <= 3.5 ? b.W : natural, y0 = b.band * BAND + (r === 't' ? 0 : 11), d = r === 't' ? 8 : 7;
    const [xa, xb] = span(b.side, width);
    strip(b.side, xa, xb, y0, y0 + d, () => {
      let x = xa;
      list.forEach((u, i) => {
        const bw = baseW(u), w = i === list.length - 1 ? +(xb - x).toFixed(2) : +(bw + (width - natural) * bw / natural).toFixed(1);
        const o = roomSpec(seed, u, r, w);
        const id = u.startsWith('lounge:') ? 'lounge-' + u.slice(7) : SHARED[u] ? 'share-' + SHARED[u].join('-') : u;
        const z = zone(id, x, y0, x + w, y0 + d, { band: b.band + 1, hy: b.band * BAND + 9.5, ...o });
        if (u.startsWith('lounge:')) {
          const k = +u.slice(7);
          Object.assign(z, { main: k === 0, center: CENTERS[(h + k) % 3], east: EASTS[((h >>> 8) + k * 2) % 3], rug: ['#3f5a6e', '#6e4a5a', '#5a6a44', '#6a5a3e'][((h >>> 4) + k) % 4], sofaTint: ['#a8705a', '#5a7a8a', '#8a7a4a', '#7a5a8a'][((h >>> 12) + k * 3) % 4] });
          if (k === 0) z.wall = { x0: x + 0.6, x1: x + 8.2, z0: 0.55, z1: 2.8 };
          LOUNGES.push(z);
        }
        x += w;
      });
    });
  };
  const column = (side) => {
    blocks.filter((b) => b.side === side).forEach((b) => {
      const y0 = b.band * BAND, [xa, xb] = span(side, b.W);
      rowZones(b, 't');
      strip(side, xa, xb, y0 + 8, y0 + 11, () => zone(`hall-${b.band}${side}`, xa, y0 + 8, xb, y0 + 11, { type: 'hall', band: b.band + 1, hy: y0 + 9.5 }));
      rowZones(b, 'b');
    });
  };
  column('W');
  for (let k = 0; k < nB / 2; k++) {
    const y0 = k * BAND, last = k === nB / 2 - 1;
    zone(`spine-${k}t`, WW, y0, WW + CW, y0 + 8, { type: 'hall', band: 0, spine: true });
    zone(`cross-${k}`, WW, y0 + 8, WW + CW, y0 + 11, { type: 'hall', band: k + 1, hy: y0 + 9.5 });
    zone(`spine-${k}b`, WW, y0 + 11, WW + CW, y0 + BAND, { type: 'hall', band: 0, spine: true });
  }
  column('E');
  zone('vE', LW, 0, LW + 1, BOT, { type: 'void' });
  const lx0 = Math.max(0, SPX - 5.5), lx1 = Math.min(LW, SPX + 5.5);
  if (lx0 > -1) zone('vSL', -1, BOT, lx0, BOT + LOBBY_D, { type: 'void' });
  const lobby = zone('lobby', lx0, BOT, lx1, BOT + LOBBY_D, { type: 'lobby', band: 0 });
  zone('vSR', lx1, BOT, LW + 1, BOT + LOBBY_D, { type: 'void' });
  zone('vS', -1, BOT + LOBBY_D, LW + 1, BOT + LOBBY_D + 1, { type: 'void' });
  LOUNGES.sort((p, q) => (q.main ? 1 : 0) - (p.main ? 1 : 0));
  Z.forEach((z) => { z.building = z.type !== 'void'; z.col = z.p ? PROJ[z.p].color : '#8d8590'; });
  Z.forEach((z) => {
    if (!z.door) return;
    const { edge, at } = z.door, w = 1.3;
    const d = edge === 's' ? { axis: 'y', pos: z.y1, c: z.x0 + at } : edge === 'n' ? { axis: 'y', pos: z.y0, c: z.x0 + at } : { axis: 'x', pos: z.x1, c: z.y0 + at };
    Object.assign(d, { a: d.c - w / 2, b: d.c + w / 2, open: 0, fill: mix(z.col, 35, C.door), room: z });
    d.cx = d.axis === 'y' ? d.c : d.pos; d.cy = d.axis === 'y' ? d.pos : d.c;
    DOORS.push(d);
  });
  DOORS.push({ axis: 'y', pos: BOT + LOBBY_D, c: SPX, a: SPX - 1.1, b: SPX + 1.1, open: 0, fill: 'rgba(150,190,210,0.45)', cx: SPX, cy: BOT + LOBBY_D, main: true, room: lobby });
  DOORS.forEach((d, n) => { d.id = 'door-' + n; d.owner = Z.find((z) => (d.axis === 'y' ? z.y0 === d.pos && z.x0 <= d.c && d.c < z.x1 : z.x0 === d.pos && z.y0 <= d.c && d.c < z.y1)); });
}

const SPOTS = {};
const addSpot = (id, o) => { SPOTS[id] = { id, z: 0, bias: 0, access: [], ...o }; };

function buildSpots() {
  Z.forEach((z) => {
    const { x0, y0, x1, y1 } = z;
    if (z.type === 'lounge') {
      z.lane = { axis: 'h', at: y0 + 5.0 };
      const L = (x) => [x, y0 + 5.0];
      const s = (k, x, y, kind, o = {}) => addSpot(`${z.id}.${k}`, { room: z, x: x0 + x, y: y0 + y, kind, access: [L(x0 + x)], ...o });
      if (z.center === 'pp') { s('pp1', 2.75, 3.1, 'pp1', { mirror: true }); s('pp2', 6.65, 3.1, 'pp2'); }
      if (z.center === 'pool') { s('pool1', 4.4, 4.35, 'pool', { mirror: true }); s('pool2', 6.9, 3.3, 'poolw'); }
      if (z.center === 'meet') {
        [3.7, 4.8, 5.9].forEach((u, k) => s('m' + k, u, 4.15, 'meet', { pose: 'type3', mirror: true, z: 0.45 }));
        s('m3', 2.5, 3.05, 'meet', { pose: 'sit', mirror: true, z: 0.42 });
        s('m4', 7.1, 3.05, 'meet', { pose: 'type3', z: 0.45 });
      }
      if (z.east === 'arcade') s('arcade', 10.25, 4.25, 'arcade', { mirror: true });
      if (z.east === 'foot') { s('foot1', 8.85, 2.7, 'foot', { pose: 'f3', access: [[x0 + 7.65, y0 + 2.7], [x0 + 7.65, y0 + 5]] }); s('foot2', 8.85, 4.75, 'foot', { pose: 'arcade', mirror: true }); }
      s('coffee', 9.0, 1.7, 'coffee');
      s('chat1', 5.3, 6.5, 'chat', { mirror: true });
      s('chat2', 6.4, 6.5, 'chat');
      [0.7, 2.1].forEach((u, k) => s('sofa' + k, 0.8 + u, 6.35, 'sofa', { z: 0.42, bias: 0.6, access: [[x0 + 0.8 + u, y0 + 7.3], [x0 + 4.1, y0 + 7.3], L(x0 + 4.1)] }));
    }
    if (z.type === 'room' && z.desks) {
      const { wall, n, island = 0 } = z.desks;
      const owners = z.parts ? z.parts.flatMap((o) => Array(o.n).fill(o.p)) : Array(n + island).fill(z.p);
      const nth = (p) => Object.values(SPOTS).filter((o) => o.kind === 'desk' && o.p === p).length;
      if (wall === 'n') {
        const laneY = y0 + (island ? 5.7 : 2.7), aisle = x0 + (z.desks.u0 ?? 0.5) + island * 2.3 + 0.35;
        z.lane = { axis: 'h', at: laneY };
        const via = (x) => (island ? [[x, y0 + 2.7], [aisle, y0 + 2.7], [aisle, laneY]] : [[x, y0 + 2.7]]);
        for (let k = 0; k < n + island; k++) {
          const isl = k >= n, kk = isl ? k - n : k, by = y0 + (isl ? 3.0 : 0), u = x0 + (z.desks.u0 ?? 0.5) + kk * 2.3, p = owners[k], i = nth(p);
          const id = `${p}.desk${i}`, acc = (x) => (isl ? [[x, laneY]] : via(x));
          addSpot(id, { room: z, p, x: u + 0.9, y: by + 1.62, z: 0.5, kind: 'desk', wall, mirror: true, k, stand: `${p}.stand${i}`, access: acc(u + 0.9), box: [u, by] });
          addSpot(`${p}.stand${i}`, { room: z, p, x: u + 2.05, y: by + 1.95, kind: 'stand', desk: id, access: acc(u + 2.05) });
        }
      } else {
        z.lane = { axis: 'v', at: x0 + 2.6 };
        for (let k = 0; k < n; k++) {
          const v = y0 + (z.desks.v0 ?? 0.9) + k * 2.3, p = owners[k], i = nth(p);
          const id = `${p}.desk${i}`;
          addSpot(id, { room: z, p, x: x0 + 1.62, y: v + 0.9, z: 0.5, kind: 'desk', wall, mirror: false, k, stand: `${p}.stand${i}`, access: [[x0 + 2.6, v + 0.9]], box: [x0, v] });
          addSpot(`${p}.stand${i}`, { room: z, p, x: x0 + 1.95, y: v + 2.05, kind: 'stand', desk: id, access: [[x0 + 2.6, v + 2.05]] });
        }
      }
      if (z.sofa) {
        const sx = x0 + z.sofa.u, sy = y0 + z.sofa.v, out = [[sx + 3.1, sy + 1.5], [sx + 3.1, z.lane.at]];
        addSpot(`${z.p}.sofa0`, { room: z, x: sx + 0.7, y: sy + 0.55, z: 0.42, bias: 0.6, kind: 'sofa', access: [[sx + 0.7, sy + 1.5], ...out] });
        addSpot(`${z.p}.sofa1`, { room: z, x: sx + 2.1, y: sy + 0.55, z: 0.42, bias: 0.6, kind: 'sofa', access: [[sx + 2.1, sy + 1.5], ...out] });
        addSpot(`${z.p}.lie`, { room: z, x: sx + 1.4, y: sy + 0.55, z: 0.42, bias: 0.6, kind: 'lie', access: [[sx + 1.4, sy + 1.5], ...out] });
      }
      if (z.bean) addSpot(`${z.p}.bean`, { room: z, x: x0 + 3.8, y: y1 - 1.4, z: 0.22, bias: 0.4, kind: 'bean', access: [[x0 + 2.6, y1 - 1.4]] });
    }
    if (z.lane) {
      const dr = z.door, ln = z.lane;
      const hy = z.hy;
      if (dr.edge === 's') { const x = x0 + dr.at; z.out = [[x, ln.at], [x, y1 - 0.4], [x, y1 + 0.5], [x, hy]]; }
      else if (dr.edge === 'n') { const x = x0 + dr.at; z.out = ln.axis === 'h' ? [[x, ln.at], [x, y0 + 0.4], [x, y0 - 0.5], [x, hy]] : [[ln.at, y0 + 0.4], [x, y0 + 0.4], [x, y0 - 0.5], [x, hy]]; }
      else { const y = y0 + dr.at; z.out = [[ln.at, y], [x1 - 0.4, y], [x1 + 0.5, y], [x1 + 0.5, hy]]; }
    }
  });
  Z.filter((z) => z.type === 'hall' || z.type === 'lobby').forEach((z) => { z.out = []; });
  const lobby = zoneById('lobby'), gate = BOT + LOBBY_D;
  addSpot('exit', { room: lobby, x: SPX, y: gate + 0.8, kind: 'stand', access: [[SPX, gate - 1.0]] });
  addSpot('entry', { room: lobby, x: SPX, y: gate + 0.8, kind: 'stand', access: [[SPX, gate - 1.0]] });
}

const lastOf = (s) => (s.access.length ? s.access[s.access.length - 1] : [s.x, s.y]);
function pathBetween(from, to) {
  const rev = (l) => [...l].reverse(), pts = [[from.x, from.y], ...from.access], fa = from.room, ta = to.room;
  if (fa !== ta) pts.push(...fa.out, ...(fa.band !== ta.band ? [...(fa.band ? [[SPX, fa.hy]] : []), ...(ta.band ? [[SPX, ta.hy]] : [])] : []), ...rev(ta.out));
  pts.push(...rev(to.access), [to.x, to.y]);
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.01);
}

function edgeSegments(z, side) {
  const out = [];
  Z.forEach((o) => {
    if (o === z) return;
    if (side === 'n' && o.y1 === z.y0) { const a = Math.max(z.x0, o.x0), b = Math.min(z.x1, o.x1); if (b > a) out.push({ a, b, o }); }
    if (side === 'w' && o.x1 === z.x0) { const a = Math.max(z.y0, o.y0), b = Math.min(z.y1, o.y1); if (b > a) out.push({ a, b, o }); }
  });
  return out.sort((p, q) => p.a - q.a);
}
function minus(a, b, gaps) {
  const o = [];
  let s = a;
  gaps.filter((g) => g.b > a && g.a < b).sort((p, q) => p.a - q.a).forEach((g) => { if (g.a > s) o.push([s, g.a]); s = Math.max(s, g.b); });
  if (s < b) o.push([s, b]);
  return o;
}
function wallRun(side, pos, a, b, h, face, cap, edge, z) {
  let w = '';
  if (side === 'n') {
    w += onY(pos, a, b, 0, h, face) + onY(pos, a, b, 0, 0.2, C.base);
    w += poly([P(b, pos - 0.25, 0), P(b, pos, 0), P(b, pos, h), P(b, pos - 0.25, h)], edge);
    w += poly([P(a, pos - 0.25, h), P(b, pos - 0.25, h), P(b, pos, h), P(a, pos, h)], cap);
  } else {
    w += onX(pos, a, b, 0, h, face) + onX(pos, a, b, 0, 0.2, C.base);
    w += poly([P(pos - 0.25, b, 0), P(pos, b, 0), P(pos, b, h), P(pos - 0.25, b, h)], edge);
    w += poly([P(pos - 0.25, a, h), P(pos, a, h), P(pos, b, h), P(pos - 0.25, b, h)], cap);
  }
  return w;
}
function wallsOf(z) {
  let w = '';
  const inner = { n: mix(z.col, z.type === 'hall' ? 8 : 30, C.wallR), w: mix(z.col, z.type === 'hall' ? 6 : 24, C.wallL), cap: mix(z.col, 55, C.cap), edge: mix(z.col, 15, C.wallEdge) };
  const outer = { n: FACADE, w: mix(FACADE, 85, '#000'), cap: mix(FACADE, 70, '#9a8e96'), edge: C.wallEdge };
  ['n', 'w'].forEach((side) => {
    const pos = side === 'n' ? z.y0 : z.x0;
    const gaps = DOORS.filter((d) => d.owner === z && d.axis === (side === 'n' ? 'y' : 'x'));
    edgeSegments(z, side).forEach(({ a, b, o }) => {
      let h = 0;
      if (z.building) { if (!o.building) h = WH; else if (!(o.p && o.p === z.p) && !(['hall', 'lobby'].includes(z.type) && ['hall', 'lobby'].includes(o.type))) h = LOW; }
      else if (o.building) h = LOW;
      if (!h) return;
      const ext = !z.building || !o.building, sh = z.building ? inner : outer;
      const room = ['hall', 'lobby'].includes(z.type) ? o : ['hall', 'lobby'].includes(o.type) ? z : null;
      const glazed = h === LOW && room && (room.type === 'room' || room.type === 'lounge') && hashOf(layoutSeed, 'glass:' + room.id) % 2 === 0;
      minus(a, b, gaps).forEach(([s, e]) => {
        if (glazed) { w += wallRun(side, pos, s, e, 0.45, sh[side], sh.cap, sh.edge, z) + glassWall(side, pos, s, e); return; }
        w += wallRun(side, pos, s, e, h, sh[side], sh.cap, sh.edge, z);
        if (ext && h === WH) w += z.type === 'lobby' && side === 'w' ? slats(pos, s, e) : windows(side, pos, s, e, z);
        if (ext && h === LOW) w += glassBand(side, pos, s, e);
      });
    });
    gaps.forEach((d) => {
      const frame = d.main ? '#3a2c24' : mix(d.room.col, 40, '#3a2c24');
      if (side === 'n') {
        w += box(d.a - 0.12, pos - 0.12, 0, 0.12, 0.12, 2.0, frame, frame, frame) + box(d.b, pos - 0.12, 0, 0.12, 0.12, 2.0, frame, frame, frame) + onY(pos, d.a - 0.12, d.b + 0.12, 1.85, 2.0, frame);
      } else {
        w += box(pos - 0.12, d.a - 0.12, 0, 0.12, 0.12, 2.0, frame, frame, frame) + box(pos - 0.12, d.b, 0, 0.12, 0.12, 2.0, frame, frame, frame) + onX(pos, d.a - 0.12, d.b + 0.12, 1.85, 2.0, frame);
      }
      w += `<g id="${d.id}"></g>`;
    });
  });
  return w;
}

function windows(side, pos, a, b, z) {
  const face = side === 'n' ? (u0, u1, z0, z1, f) => onY(pos, u0, u1, z0, z1, f) : (u0, u1, z0, z1, f) => onX(pos, u0, u1, z0, z1, f);
  const block = [];
  if (side === 'n' && z.board != null) block.push([z.x0 + z.board - 0.3, z.x0 + z.board + 2.3]);
  if (side === 'n' && z.wall) block.push([z.wall.x0 - 0.4, z.wall.x1 + 0.4]);
  let out = '', u = a + 0.5;
  while (u + 1.5 <= b - 0.4) {
    const c = block.find(([p, q]) => u < q && u + 1.5 > p);
    if (c) { u = c[1] + 0.2; continue; }
    const m = u + 0.75;
    out += face(u - 0.07, u + 1.57, 1.03, 2.57, '#2e272c') + face(u, u + 1.5, 1.1, 2.5, '#2c4656') + face(u, u + 1.5, 1.85, 2.5, '#36566a')
      + face(u + 0.18, u + 0.38, 1.25, 2.35, 'rgba(255,255,255,0.10)') + face(m - 0.035, m + 0.035, 1.1, 2.5, '#2e272c') + face(u - 0.1, u + 1.6, 1.0, 1.08, '#6a5e66');
    u += 2.4;
  }
  return out;
}
function glassWall(side, pos, a, b) {
  const face = side === 'n' ? (u0, u1, z0, z1, f) => onY(pos - 0.12, u0, u1, z0, z1, f) : (u0, u1, z0, z1, f) => onX(pos - 0.12, u0, u1, z0, z1, f);
  let out = face(a, b, 0.45, 1.92, 'rgba(160,200,220,0.2)') + face(a, b, 1.86, 1.94, '#3a3238') + face(a, b, 0.45, 0.52, '#3a3238');
  const n = Math.max(1, Math.round((b - a) / 1.3));
  for (let k = 0; k <= n; k++) { const u = a + (b - a) * k / n; out += face(Math.max(a, u - 0.035), Math.min(b, u + 0.035), 0.45, 1.94, '#3a3238'); }
  return out + face(a + 0.1, a + 0.22, 0.9, 1.7, 'rgba(255,255,255,0.12)');
}
function slats(pos, a, b) {
  let out = onX(pos, a, b, 0, WH, '#7a5a40');
  for (let u = a + 0.15; u < b - 0.1; u += 0.32) out += onX(pos, u, u + 0.16, 0.05, WH - 0.05, '#a07a56');
  return out;
}
function glassBand(side, pos, a, b) {
  const face = side === 'n' ? (u0, u1, z0, z1, f) => onY(pos - 0.12, u0, u1, z0, z1, f) : (u0, u1, z0, z1, f) => onX(pos - 0.12, u0, u1, z0, z1, f);
  let out = face(a, b, LOW, LOW + 0.85, 'rgba(150,190,210,0.16)') + face(a, b, LOW + 0.8, LOW + 0.88, '#3a3238');
  for (let u = a + 1.4; u < b - 0.2; u += 1.4) out += face(u - 0.035, u + 0.035, LOW, LOW + 0.85, '#3a3238');
  return out + face(a, a + 0.07, LOW, LOW + 0.88, '#3a3238') + face(b - 0.07, b, LOW, LOW + 0.88, '#3a3238');
}
function plant(x, y, big = 1) {
  const [cx, cy] = P(x + 0.3, y + 0.3, 0.7);
  return box(x, y, 0, 0.6, 0.6, 0.7, C.potDark, C.pot, C.potDark)
    + `<ellipse cx="${cx - 7}" cy="${cy - 10 * big}" rx="10" ry="${13 * big}" fill="${C.leafDark}"/><ellipse cx="${cx + 6}" cy="${cy - 14 * big}" rx="9" ry="${15 * big}" fill="${C.leaf}"/><ellipse cx="${cx}" cy="${cy - 24 * big}" rx="7" ry="${12 * big}" fill="${C.leaf}"/>`;
}
const ON_Y = '1 0.5 0 1';

function floorOf(z) {
  const { x0, y0, x1, y1 } = z;
  const quad = [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  if (!z.building) return '';
  if (z.type === 'lobby') {
    let s = poly(quad, '#8a8278');
    for (let i = Math.ceil(x0 + 0.01); i < x1; i++) { const a = P(i, y0), b = P(i, y1); s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#7d756c"/>`; }
    for (let j = Math.ceil(y0 + 0.01); j < y1; j++) { const a = P(x0, j), b = P(x1, j); s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#7d756c"/>`; }
    s += poly([P(SPX - 1.4, y1 - 1.6), P(SPX + 1.4, y1 - 1.6), P(SPX + 1.4, y1 - 0.2), P(SPX - 1.4, y1 - 0.2)], '#3a3436') + poly([P(SPX - 0.6, y0), P(SPX + 0.6, y0), P(SPX + 0.6, y1 - 1.6), P(SPX - 0.6, y1 - 1.6)], 'rgba(90,70,60,0.35)');
    return s + `<polygon class="falert" points="${pts(quad)}" style="fill:#e0443a"/>`;
  }
  let s = poly(quad, z.type === 'hall' ? C.corridor : mix(z.col, z.type === 'lounge' ? 5 : 8, C.floor));
  if (z.type === 'hall') { const ix = z.spine ? 0.45 : 0, iy = z.spine || z.id.startsWith('cross') ? 0 : 0.45; s += poly([P(x0 + ix, y0 + iy), P(x1 - ix, y0 + iy), P(x1 - ix, y1 - iy), P(x0 + ix, y1 - iy)], C.runner); }
  else {
    for (let i = Math.ceil(x0 + 0.01); i < x1; i++) { const a = P(i, y0), b = P(i, y1); s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${C.floorLine}"/>`; }
    for (let j = Math.ceil(y0 + 0.01); j < y1; j++) { const a = P(x0, j), b = P(x1, j); s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${C.floorLine}"/>`; }
  }
  if (z.type === 'lounge') for (let i = x0; i < x1; i++) for (let j = y0; j < y1; j++) if ((i + j) % 2) s += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], 'rgba(0,0,0,0.12)');
  if (z.parts) {
    let u = x0 + 0.3;
    z.parts.forEach((o, i) => {
      const u1 = i === z.parts.length - 1 ? x1 : u + o.n * 2.3, q = [P(u, y0), P(u1, y0), P(u1, y1), P(u, y1)];
      s += `<polygon points="${pts(q)}" style="fill:${PROJ[o.p].color}" opacity="0.12"/>`;
      o.u0 = u; o.u1 = u1;
      u = u1;
    });
  }
  s += `<polygon class="falert" points="${pts(quad)}" style="fill:#e0443a"/>`;
  return s;
}
const SCR = {};
function screenGroup(id, bgPts, lines) {
  SCR[id] = (st) => {
    const bg = { err: '#2a1716', off: '#1a1a1f' }[st] || '#14202a', ln = { on: 'var(--ok-text)', wait: 'var(--accent-link)', err: 'var(--err-text)', retry: 'var(--text-dim)' }[st];
    return `<polygon points="${bgPts}" style="fill:${bg}"/>` + (ln ? lines.map(([a, b]) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" style="stroke:${ln}" stroke-width="2.2"/>`).join('') : '');
  };
  return `<g id="${id}">${SCR[id]('off')}</g>`;
}
function deskSvg(s, z) {
  const [bx, by] = s.box, scr = `scr-${s.id.replace('.', '-')}`;
  let g = '';
  if (s.wall === 'n') {
    const sy = by + 0.27;
    g += box(bx, by + 0.15, 0, 1.8, 0.9, 0.95, C.deskTop, C.deskL, C.deskR);
    g += box(bx + 0.8, by + 0.3, 0.95, 0.2, 0.12, 0.18, C.monSide, C.mon, C.monSide);
    g += box(bx + 0.2, by + 0.25, 1.13, 1.4, 0.12, 0.85, C.monSide, C.mon, C.monSide);
    g += screenGroup(scr, pts([P(bx + 0.28, sy + 0.1, 1.2), P(bx + 1.52, sy + 0.1, 1.2), P(bx + 1.52, sy + 0.1, 1.9), P(bx + 0.28, sy + 0.1, 1.9)]), [0.35, 0.65, 0.45, 0.8, 0.3].map((len, n) => { const zz = 1.78 - n * 0.13, x = bx + 0.38 + (n % 3 === 1 ? 0.12 : 0); return [P(x, sy + 0.1, zz), P(x + len, sy + 0.1, zz)]; }));
    g += box(bx + 0.45, by + 0.62, 0.95, 0.9, 0.25, 0.04, C.kb, C.kb, C.kb);
    return [{ d: bx + by + 1.5, s: g }, { d: s.x + s.y - 0.05, s: box(bx + 0.6, by + 1.35, 0, 0.6, 0.55, 0.5, C.chair, C.chair, C.chair) }];
  }
  const sx = bx + 0.27;
  g += box(bx + 0.15, by, 0, 0.9, 1.8, 0.95, C.deskTop, C.deskL, C.deskR);
  g += box(bx + 0.3, by + 0.8, 0.95, 0.12, 0.2, 0.18, C.monSide, C.monSide, C.mon);
  g += box(bx + 0.25, by + 0.2, 1.13, 0.12, 1.4, 0.85, C.monSide, C.monSide, C.mon);
  g += screenGroup(scr, pts([P(sx + 0.1, by + 0.28, 1.2), P(sx + 0.1, by + 1.52, 1.2), P(sx + 0.1, by + 1.52, 1.9), P(sx + 0.1, by + 0.28, 1.9)]), [0.35, 0.65, 0.45, 0.8, 0.3].map((len, n) => { const zz = 1.78 - n * 0.13, y = by + 0.38 + (n % 3 === 1 ? 0.12 : 0); return [P(sx + 0.1, y, zz), P(sx + 0.1, y + len, zz)]; }));
  g += box(bx + 0.62, by + 0.45, 0.95, 0.25, 0.9, 0.04, C.kb, C.kb, C.kb);
  return [{ d: bx + by + 1.5, s: g }, { d: s.x + s.y - 0.05, s: box(bx + 1.35, by + 0.6, 0, 0.55, 0.6, 0.5, C.chair, C.chair, C.chair) }];
}
function sofaItems(x, y, tint) {
  return [
    { d: x + y + 1.8, s: box(x, y, 0, 2.8, 0.85, 0.42, C.sofa, C.sofaDark, C.sofa) + box(x, y, 0.42, 2.8, 0.25, 0.7, mix(tint, 25, C.sofa), mix(tint, 18, C.sofaDark), C.sofa) + box(x, y, 0.42, 0.22, 0.85, 0.28, C.sofa, C.sofaDark, C.sofa) },
    { d: x + y + 3.7, s: box(x + 2.58, y, 0.42, 0.22, 0.85, 0.28, C.sofa, C.sofaDark, C.sofa) },
  ];
}

function roomItems(z) {
  const items = [], it = (d, s) => items.push({ d, s });
  const { x0, y0, x1, y1 } = z;
  if (z.desks) Object.values(SPOTS).filter((s) => s.room === z && s.kind === 'desk').forEach((s) => items.push(...deskSvg(s, z)));
  if (z.sofa) items.push(...sofaItems(x0 + z.sofa.u, y0 + z.sofa.v, z.col));
  if (z.bean) it(x0 + 3.8 + y1 - 1.4 - 0.2, box(x0 + 3.3, y1 - 1.9, 0, 1, 1, 0.22, mix(z.col, 40, '#6e4654'), mix(z.col, 25, '#5a3a46'), mix(z.col, 32, '#64404e')));
  if (z.type === 'room' && z.desks?.wall === 'n') it(x1 + y1 - 1.2, plant(x1 - 0.9, y1 - 0.9));
  if (z.type === 'lobby') {
    const wood = ['#b88a5e', '#946a46', '#a67b52'], front = ['#2c2a2e', '#2c2a2e', '#2c2a2e'], cx = x0 + 3.4, cy = y0 + 1.4;
    it(x0 + 2.4 + y0 + 2.5, box(x0 + 1.95, y0 + 2.3, 0, 0.56, 0.5, 0.42, C.chair, C.chair, C.chair));
    it(cx + cy + 2.6, box(cx, cy, 0, 0.7, 2.8, 1.05, ...wood) + box(cx + 0.7, cy + 0.5, 0.2, 0.04, 1.8, 0.7, ...front) + box(cx - 2.2, cy + 2.8, 0, 2.9, 0.7, 1.05, ...wood) + box(cx - 1.8, cy + 3.5, 0.2, 2.2, 0.04, 0.7, ...front)
      + box(cx - 0.05, cy + 0.6, 1.05, 0.12, 0.7, 0.55, C.monSide, C.monSide, C.mon) + box(cx + 0.1, cy + 2.1, 1.05, 0.3, 0.3, 0.25, '#e9e4dc', '#c9c2b6', '#d8d2c8') + `<ellipse cx="${f1(P(cx + 0.25, cy + 2.25, 1.5)[0])}" cy="${f1(P(cx + 0.25, cy + 2.25, 1.5)[1])}" rx="7" ry="9" fill="${C.leaf}"/>`);
    const chair = (x, y) => box(x, y, 0, 0.8, 0.8, 0.45, '#5c5258', '#463e43', '#544a50') + box(x, y, 0.45, 0.8, 0.2, 0.45, '#6a5e66', '#564b52', '#5c5258');
    it(x1 - 2.6 + y0 + 2.4, chair(x1 - 3.2, y0 + 1.6) + chair(x1 - 1.6, y0 + 1.6) + box(x1 - 2.3, y0 + 2.7, 0, 0.6, 0.6, 0.45, ...wood));
    it(x1 + y0 + 1.2, plant(x1 - 0.9, y0 + 0.3));
    it(x0 + y1 - 0.4, plant(x0 + 0.3, y1 - 1.0, 0.9));
  }
  if (z.parts) z.parts.slice(1).forEach((o) => it(o.u0 + y0 + 2.2, box(o.u0 - 0.05, y0 + 0.1, 0, 0.1, 2.1, 0.75, mix(PROJ[o.p].color, 30, '#6a5e66'), mix(PROJ[o.p].color, 25, '#564b52'), mix(PROJ[o.p].color, 35, '#7a6e76'))));
  if (z.type === 'room' && z.desks?.wall === 'w' && z.d >= 6) it(x1 + y1 - 1.2, plant(x1 - 0.9, y1 - 0.9, 0.8));
  if (z.type === 'lounge') {
    const dark = ['#2a2a30', '#2a2a30', '#2a2a30'], wood = ['#7a5236', '#5e3f2a', '#6a4830'];
    it(x0 + y0 + 10.3, box(x0 + 8.4, y0 + 0.25, 0, 2.2, 0.8, 0.95, '#c9c2b6', '#9e978c', '#b8b1a5') + box(x0 + 8.7, y0 + 0.35, 0.95, 0.7, 0.55, 0.8, '#2c2c33', '#2c2c33', '#24242a') + box(x0 + 9.8, y0 + 0.45, 0.95, 0.22, 0.22, 0.25, '#f5efe6', '#d8d0c4', '#e8e0d4'));
    if (z.center !== 'meet') it(x0 + y0 + 3.9, `<polygon points="${pts([P(x0 + 2.3, y0 + 1.9), P(x0 + 7.4, y0 + 1.9), P(x0 + 7.4, y0 + 4.6), P(x0 + 2.3, y0 + 4.6)])}" style="fill:${z.rug}" opacity="0.5"/>`);
    if (z.center === 'pp') {
      let t = box(x0 + 3.45, y0 + 2.55, 0, 0.15, 0.15, 0.7, ...dark) + box(x0 + 5.8, y0 + 3.5, 0, 0.15, 0.15, 0.7, ...dark);
      t += box(x0 + 3.3, y0 + 2.4, 0.7, 2.8, 1.4, 0.08, '#2f6b5a', '#24524a', '#2a5e50');
      const la = P(x0 + 3.3, y0 + 3.1, 0.79), lb = P(x0 + 6.1, y0 + 3.1, 0.79);
      t += `<line x1="${f1(la[0])}" y1="${f1(la[1])}" x2="${f1(lb[0])}" y2="${f1(lb[1])}" stroke="#e9e4dc" stroke-width="0.8"/>` + onX(x0 + 4.7, y0 + 2.35, y0 + 3.85, 0.78, 0.98, 'rgba(233,228,220,0.75)');
      it(x0 + y0 + 6.8, t);
    }
    if (z.center === 'pool') {
      const tx = x0 + 3.2, ty = y0 + 2.35;
      let t = [[0.15, 0.15], [2.7, 0.15], [0.15, 1.2], [2.7, 1.2]].map(([u, v]) => box(tx + u, ty + v, 0, 0.18, 0.18, 0.62, ...wood)).join('');
      t += box(tx, ty, 0.62, 3.0, 1.5, 0.16, '#6a4830', '#5a3c28', '#64432e') + poly([P(tx + 0.14, ty + 0.14, 0.79), P(tx + 2.86, ty + 0.14, 0.79), P(tx + 2.86, ty + 1.36, 0.79), P(tx + 0.14, ty + 1.36, 0.79)], '#2f6b4a');
      [[0.2, 0.2], [1.5, 0.15], [2.8, 0.2], [0.2, 1.3], [1.5, 1.35], [2.8, 1.3]].forEach(([u, v]) => { const [px, py] = P(tx + u, ty + v, 0.79); t += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="2.6" ry="1.4" fill="#141110"/>`; });
      [[1.9, 0.7, '#f4d06f'], [2.05, 0.55, '#c94a3a'], [2.05, 0.85, '#3f6f8a'], [2.2, 0.7, '#1b1714'], [2.2, 0.45, '#9ad6cb'], [0.9, 0.75, '#f5efe6']].forEach(([u, v, c]) => { const [px, py] = P(tx + u, ty + v, 0.84); t += `<circle cx="${f1(px)}" cy="${f1(py)}" r="2" style="fill:${c}"/>`; });
      it(x0 + y0 + 6.8, t);
    }
    if (z.center === 'meet') {
      const tx = x0 + 3.0, ty = y0 + 2.55;
      it(x0 + y0 + 6.2, [[0.2, 0.2], [3.2, 0.2], [0.2, 0.65], [3.2, 0.65]].map(([u, v]) => box(tx + u, ty + v, 0, 0.15, 0.15, 0.7, ...dark)).join('') + box(tx, ty, 0.7, 3.6, 1.0, 0.1, '#8e6a48', '#6e5036', '#7e5e40')
        + [0.6, 1.7, 2.9].map((u, k) => box(tx + u, ty + 0.25, 0.8, 0.5, 0.35, 0.02, C.notes[k], C.notes[k], C.notes[k])).join('') + box(tx + 1.55, ty + 0.4, 0.8, 0.5, 0.2, 0.25, '#2c2c33', '#24242a', '#2c2c33'));
      const seat = (x, y) => box(x - 0.28, y - 0.25, 0, 0.56, 0.5, 0.42, C.chair, C.chair, C.chair);
      [3.7, 4.8, 5.9].forEach((u) => it(x0 + u + y0 + 4.15 - 0.05, seat(x0 + u, y0 + 4.3) + box(x0 + u - 0.28, y0 + 4.5, 0.42, 0.56, 0.1, 0.5, C.chair, C.chair, C.chair)));
      it(x0 + 2.5 + y0 + 3.05 - 0.05, seat(x0 + 2.5, y0 + 3.05) + box(x0 + 2.12, y0 + 2.8, 0.42, 0.1, 0.5, 0.5, C.chair, C.chair, C.chair));
      it(x0 + 7.1 + y0 + 3.05 - 0.05, seat(x0 + 7.15, y0 + 3.05) + box(x0 + 7.33, y0 + 2.8, 0.42, 0.1, 0.5, 0.5, C.chair, C.chair, C.chair));
    }
    if (z.east === 'arcade') it(x0 + y0 + 13.6, box(x0 + 9.85, y0 + 2.95, 0, 0.8, 0.6, 1.75, '#3a2f55', '#2b2240', '#33284a') + `<polygon class="arcade-scr" points="${pts([P(x0 + 9.95, y0 + 3.55, 1.05), P(x0 + 10.55, y0 + 3.55, 1.05), P(x0 + 10.55, y0 + 3.55, 1.55), P(x0 + 9.95, y0 + 3.55, 1.55)])}" style="fill:#ffffff"/>`);
    if (z.east === 'foot') {
      const tx = x0 + 8.0, ty = y0 + 3.3;
      let t = [[0.05, 0.05], [1.5, 0.05], [0.05, 0.75], [1.5, 0.75]].map(([u, v]) => box(tx + u, ty + v, 0, 0.15, 0.15, 0.55, ...wood)).join('');
      t += box(tx, ty, 0.55, 1.7, 0.9, 0.32, '#3a5a8a', '#2c466e', '#34507c') + poly([P(tx + 0.08, ty + 0.08, 0.87), P(tx + 1.62, ty + 0.08, 0.87), P(tx + 1.62, ty + 0.82, 0.87), P(tx + 0.08, ty + 0.82, 0.87)], '#2f6b4a');
      [0.3, 0.65, 1.05, 1.4].forEach((u, k) => { const a = P(tx + u, ty - 0.3, 0.95), b = P(tx + u, ty + 1.2, 0.95); t += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#c9c2b6" stroke-width="1"/>` + [0.25, 0.45, 0.65].map((v) => { const [px, py] = P(tx + u, ty + v, 0.95); return `<rect x="${f1(px - 1)}" y="${f1(py - 3)}" width="2" height="4" style="fill:${k % 2 ? '#c94a3a' : '#e9e4dc'}"/>`; }).join(''); });
      it(x0 + y0 + 12.2, t);
    }
    if (z.east === 'shelf') it(x0 + y0 + 13.2, box(x0 + 10.2, y0 + 2.4, 0, 0.6, 2.2, 1.8, '#6e5640', '#5a4634', '#644e3a') + [0.45, 0.95, 1.45].map((hh, k) => box(x0 + 10.15, y0 + 2.5 + k * 0.15, hh - 0.35, 0.05, 1.9 - k * 0.3, 0.32, C.notes[k], C.notes[(k + 1) % 4], C.notes[(k + 2) % 4])).join(''));
    items.push(...sofaItems(x0 + 0.8, y0 + 5.8, z.sofaTint));
    it(x0 + y0 + 17.2, plant(x0 + 10.2, y0 + 6.8));
    it(x0 + y0 + 1.2, plant(x0 + 0.25, y0 + 0.3));
  }
  return items;
}

const MEASURE = document.createElement('canvas').getContext('2d');
function doorPlates(d) {
  const r = d.room, names = r.parts ? r.parts.map((o) => o.p) : [r.p], max = (r.w - 0.3) * 20;
  MEASURE.font = '500 9.5px "DM Mono"';
  return names.map((p, k) => {
    let name = PROJ[p].name;
    while (MEASURE.measureText(name).width + 12 > max && name.length > 4) name = name.slice(0, -2).replace(/[\s\-·]+$/, '') + '…';
    const wpx = MEASURE.measureText(name).width + 12, wu = wpx / 20, u0 = Math.max(r.x0 + 0.15, Math.min(r.x1 - 0.15 - wu, d.c - wu / 2));
    const [x, y] = P(u0, d.pos + 0.03, 2.72 + k * 0.66), col = PROJ[p].color, ink = lift(col) === col ? C.ink : '#f1ece4';
    return `<g transform="matrix(${ON_Y} ${f1(x)} ${f1(y)})"><rect x="0" y="0" width="${f1(wpx)}" height="13.4" rx="2" style="fill:${col}"/><text x="6" y="9.6" font-family="DM Mono, monospace" font-size="9.5" font-weight="500" style="fill:${ink}">${esc(name)}</text></g>`;
  }).join('');
}
function boardOnWall(z) {
  const q = (u0, u1, z0, z1, f) => onY(z.y0, z.x0 + u0, z.x0 + u1, z0, z1, f);
  let w = q(z.board, z.board + 2.0, 1.5, 2.75, C.boardFrame) + q(z.board + 0.1, z.board + 1.9, 1.6, 2.65, C.board);
  for (let k = 0; k < 4; k++) { const nx = z.board + 0.25 + (k % 2) * 0.8, nz = 2.3 - Math.floor(k / 2) * 0.45; w += q(nx, nx + 0.4, nz, nz + 0.28, C.notes[k]); }
  return w;
}

function wallFrame(B) {
  const W = B.wall, [x, y] = P(W.x0, B.y0, W.z1), wl = (W.x1 - W.x0) * 20, hl = (W.z1 - W.z0) * 22;
  return onY(B.y0, W.x0 - 0.12, W.x1 + 0.12, W.z0 - 0.1, W.z1 + 0.1, '#1d1a1e')
    + `<g class="wall" transform="matrix(${ON_Y} ${f1(x)} ${f1(y)})"><rect x="0" y="0" width="${wl}" height="${hl}" rx="1.2" style="fill:#0c1013"/><g id="wallScreen-${B.id}"></g></g>`;
}
let app, world, baseL, zonesL, tagsL, wallReg = {};
const REG = {}, KEEP = ['falert', 'arcade-scr'];
const toPixi = (markup, res = 3) => svgToPixi(markup, { reg: REG, keep: KEEP, res });
const clear = (c) => c.removeChildren().forEach((o) => o.destroy({ children: true }));
const mkBall = (r, col, alpha) => { const o = new PIXI.Container(); o.sh = o.addChild(new PIXI.Graphics().ellipse(0, 0, r, r * 0.45).fill({ color: 0, alpha })); o.dot = o.addChild(new PIXI.Graphics().circle(0, 0, r).fill(col)); return o; };
async function buildScene(step) {
  baseL.isRenderGroup = true;
  tagsL.isRenderGroup = true;
  for (const z of Z) {
    baseL.addChild(toPixi(floorOf(z)));
    let walls = wallsOf(z);
    if (z.p && z.y0 === 0 && z.board) walls += boardOnWall(z);
    DOORS.filter((d) => d.owner === z && !d.main && (d.room.p || d.room.parts)).forEach((d) => { walls += doorPlates(d); });
    if (z.type === 'lounge') {
      if (z.wall) walls += wallFrame(z);
      z.ball = mkBall(2.2, 0xf5efe6, 0.35);
    }
    const c = new PIXI.Container({ sortableChildren: true });
    const w = c.addChild(toPixi(walls, 4));
    w.zIndex = -1e9;
    const items = z.building ? roomItems(z) : [];
    items.forEach((o) => { const it = c.addChild(toPixi(o.s)); it.zIndex = o.d; });
    z.ds = items.map((o) => o.d).sort((p, q) => p - q);
    c.isRenderGroup = true;
    zonesL.addChild(c);
    z.c = c;
    if (z.p) await step(tr('stepOffice', PROJ[z.p].name));
    else if (z.parts) await step(tr('stepShared', z.parts.map((o) => PROJ[o.p].name).join(', ')));
    else if (z.type === 'lounge') await step(tr('stepLounge'));
  }

  const lb = zoneById('lobby');
  RECEP = { x: lb.x0 + 2.4, y: lb.y0 + 2.75, c: new PIXI.Container(), key: '', look: LOOKS[hashOf(layoutSeed, 'reception') % LOOKS.length] };
  RECEP.spr = RECEP.c.addChild(new PIXI.Sprite());
  (REG['.falert'] || []).forEach((o) => { o.alpha = 0; });
}

function zoneAt(x, y) {
  return Z.find((z) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) || Z[0];
}
function place(o, x, y, d) {
  const z = zoneAt(x, y), ds = z.ds;
  if (o.parent !== z.c) z.c.addChild(o);
  let lo = 0, hi = ds.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (ds[m] <= d) lo = m + 1; else hi = m; }
  const zi = (lo ? ds[lo - 1] : -1e8) + 1e-3;
  if (o.zIndex !== zi) o.zIndex = zi;
}

const BUSY = ['working', 'waiting', 'error'];
const LOUNGE_KEYS = ['pp1', 'pp2', 'pool1', 'pool2', 'foot1', 'foot2', 'm0', 'm1', 'm3', 'm2', 'm4', 'arcade', 'coffee', 'chat1', 'chat2', 'sofa0', 'sofa1'];
const AG = {};
let A = {}, AL = [], selId = null, cam = { tx: 0, ty: 0, s: 1 }, sim = { t: 0 }, dirty = true;
const nameOf = (ag) => (ag.name || '').trim() || tr('newAgent');
const lookOf = (id) => LOOKS[hashOf(7, id) % LOOKS.length];
const shown = (a) => !a.hidden && a.inAt == null;

function spotFree(id, me) {
  const sp = SPOTS[id];
  if (!sp) return false;
  const holds = (sid) => AL.some((o) => o !== me && !o.gone && (o.path ? o.target === sid : o.spot === sid));
  if (holds(id)) return false;
  const pre = id.split('.')[0];
  if (sp.kind === 'lie') return !holds(`${pre}.sofa0`) && !holds(`${pre}.sofa1`);
  if (sp.kind === 'sofa') return !holds(`${pre}.lie`);
  if (sp.kind === 'desk') return !AL.some((o) => o !== me && !o.gone && o.desk === id);
  return true;
}
function freeDesk(a) {
  if (a.desk && !AL.some((o) => o !== a && !o.gone && o.desk === a.desk)) return a.desk;
  return Object.values(SPOTS).find((s) => s.kind === 'desk' && s.p === a.project && spotFree(s.id, a))?.id || null;
}
function restSpot(a) {
  const p = a.project, L = roomOf(p) ? loungeOf(p) : null;
  const own = [`${p}.sofa0`, `${p}.sofa1`, `${p}.lie`, `${p}.bean`].filter((id) => SPOTS[id]);
  const inLounge = AL.filter((o) => o !== a && !o.gone && o.project === p && SPOTS[o.path ? o.target : o.spot]?.room?.type === 'lounge').length;
  const lounge = L && inLounge < 2 ? order(hashOf(layoutSeed, a.id), LOUNGE_KEYS).map((k) => `${L}.${k}`).filter((id) => SPOTS[id]) : [];
  const desks = Object.values(SPOTS).filter((s) => s.kind === 'desk' && s.p === p).map((s) => s.id);
  const prefs = [own, lounge, desks], k = hashOf(layoutSeed, 'rest:' + a.id) % 3;
  for (const list of [...prefs.slice(k), ...prefs.slice(0, k)]) {
    const id = list.find((sid) => spotFree(sid, a));
    if (id) return id;
  }
  return null;
}

function newActor(ag) {
  const a = { id: ag.id, project: ag.project, phase: (hashOf(3, ag.id) % 450) / 100, look: lookOf(ag.id), x: 0, y: 0, spot: 'entry', desk: null };
  sync(a, ag);
  a.c = new PIXI.Container();
  a.body = a.c.addChild(new PIXI.Container());
  a.halo = a.body.addChild(new PIXI.Sprite());
  a.halo.tint = color('var(--text)').c;
  a.halo.alpha = 0;
  a.spr = a.body.addChild(new PIXI.Sprite());
  a.ex = a.body.addChild(new PIXI.Container());
  a.tag = tagsL.addChild(new PIXI.Container());
  a.tag.scale.set(1 / cam.s);
  a.nt = a.tag.addChild(new PIXI.Container());
  a.bb = a.tag.addChild(new PIXI.Container());
  A[a.id] = a;
  AL = Object.values(A);
  drawTag(a);
  return a;
}
function sync(a, ag) {
  a.status = ag.status; a.name = nameOf(ag); a.tool = ag.tool || null; a.waitKind = ag.waiting || null; a.err = ag.status === 'error' || ag.error === 'mcp' ? ag.error || 'crash' : null;
  a.sad = !!PROJ[a.project]?.idle && !BUSY.includes(ag.status);
  a.tagKey = a.name + a.status;
}
function placeAt(a, spotId) {
  const s = SPOTS[spotId];
  a.spot = spotId; a.x = s.x; a.y = s.y; a.path = null;
  a.desk = s.kind === 'desk' ? spotId : s.kind === 'stand' ? s.desk : a.status === 'done' || a.status === 'interrupted' ? null : a.desk;
  a.act = ['sofa', 'bean'].includes(s.kind) ? [null, 'read', 'phone'][hashOf(layoutSeed, 'act:' + a.id) % 3] : null;
}
function homeFor(a) {
  if (BUSY.includes(a.status)) {
    const d = freeDesk(a);
    if (!d) return null;
    a.desk = d;
    return a.status === 'waiting' ? SPOTS[d].stand : d;
  }
  return restSpot(a);
}
function destroyActor(a) {
  a.gone = true;
  a.c.destroy({ children: true });
  a.tag.destroy({ children: true });
  delete A[a.id];
  AL = Object.values(A);
  if (selId === a.id) closeInspector();
  dirty = true;
}

function makeActors(intro) {
  AL.forEach((a) => { a.c.destroy({ children: true }); a.tag.destroy({ children: true }); });
  A = {}; AL = [];
  const list = Object.values(AG).filter((ag) => roomOf(ag.project));
  const busy = list.filter((ag) => BUSY.includes(ag.status)).sort((p, q) => hashOf(layoutSeed, p.id) - hashOf(layoutSeed, q.id));
  const rest = list.filter((ag) => !BUSY.includes(ag.status)).sort((p, q) => q.since - p.since);
  [...busy, ...rest].forEach((ag) => {
    const a = newActor(ag), home = homeFor(a);
    if (!home) return destroyActor(a);
    placeAt(a, home);
  });
  if (intro) {
    const e = SPOTS.entry, ids = order(layoutSeed, AL.map((a) => a.id)), step = Math.min(0.3, 6 / Math.max(1, ids.length));
    ids.forEach((id, k) => { const a = A[id]; a.home = a.spot; a.inAt = 0.3 + k * step; a.spot = 'entry'; a.x = e.x; a.y = e.y; });
  }
}
function drawTag(a) {
  clear(a.nt);
  const reg = {};
  a.nt.addChild(svgToPixi(nameTag(a.name, a.status), { reg, keep: ['short', 'full'], bitmap: true }));
  a.short = reg['.short'][0]; a.full = reg['.full'][0];
  a.drawn = a.tagKey;
  tagVis(a);
}
function tagVis(a) {
  const far = cam.s < 1.35, near = cam.s >= 1.9, calm = a.status !== 'waiting' && a.status !== 'error';
  a.nt.alpha = +!(far && calm);
  a.short.alpha = +!near; a.full.alpha = +near;
}

function walk(a, spotId, done, speed = SPEED) {
  const from = { ...(SPOTS[a.spot] || SPOTS.entry), x: a.x, y: a.y }, pts = pathBetween(from, SPOTS[spotId]);
  const len = pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  a.path = { pts, seg: 0, f: 0, done, speed: Math.max(speed, len / 9) };
  a.target = spotId;
}
function cancelVisit(a) {
  a.bubble = null; a.after = null; a.wait = 0;
  if (a.home && a.inAt == null) a.home = null;
  delete SPOTS['_visit_' + a.id];
}
function goTo(a, spotId) {
  const s = SPOTS[spotId];
  a.desk = s.kind === 'desk' ? spotId : s.kind === 'stand' ? s.desk : null;
  if (a.spot === spotId && !a.path) return placeAt(a, spotId);
  walk(a, spotId, () => { placeAt(a, spotId); refreshUI(); }, a.sad ? SPEED * 0.55 : SPEED);
}
function visit(a, targetId, kind, onArrive) {
  const t = A[targetId] ? SPOTS[A[targetId].path ? A[targetId].target : A[targetId].spot] : SPOTS[targetId];
  if (!t?.room?.lane || a.path || a.after || a.inAt != null) { onArrive && onArrive(); return; }
  const home = a.spot, L = lastOf(t), lane = t.room.lane, vid = '_visit_' + a.id;
  const [vx, vy] = lane.axis === 'h' ? [L[0] + 0.7, L[1]] : [L[0], L[1] + 0.7];
  SPOTS[vid] = { id: vid, room: t.room, x: vx, y: vy, z: 0, bias: 0, kind: 'visit', access: [] };
  walk(a, vid, () => {
    a.spot = vid; a.bubble = kind; a.wait = 2.2;
    onArrive && onArrive();
    a.after = () => { a.bubble = null; delete SPOTS[vid]; if (SPOTS[home]) walk(a, home, () => { a.spot = home; }); };
  });
}
function leave(a) {
  cancelVisit(a);
  a.status = 'archived'; a.desk = null; a.act = null; a.leaving = true;
  a.tagKey = a.name + a.status;
  if (a.inAt != null) return destroyActor(a);
  walk(a, 'exit', () => destroyActor(a));
}

function arrive(ag, by) {
  const a = newActor(ag), home = homeFor(a);
  if (!home) return destroyActor(a);
  const src = by && A[by] && shown(A[by]) && !A[by].leaving ? A[by] : null;
  if (src && BUSY.includes(a.status)) {
    placeAt(a, home);
    a.hidden = true;
    visit(src, home, 'plus', () => { a.hidden = false; a.cheer = 1.2; dirty = true; });
    return;
  }
  const e = SPOTS.entry;
  a.spot = 'entry'; a.x = e.x; a.y = e.y;
  goTo(a, home);
}
function transition(a, prev) {
  cancelVisit(a);
  if (a.inAt != null) { a.home = homeFor(a) || a.home; return; }
  if (BUSY.includes(a.status)) {
    const d = freeDesk(a);
    if (!d) return destroyActor(a);
    a.desk = d;
    goTo(a, a.status === 'waiting' ? SPOTS[d].stand : d);
    if (prev === 'error' || (G.mode !== 'ok' && a.status === 'working')) a.cheer = 0;
    return;
  }
  const at = SPOTS[a.path ? a.target : a.spot];
  if (at && (at.kind === 'desk' || at.kind === 'stand' || at.kind === 'visit')) {
    const r = restSpot(a);
    if (!r) return destroyActor(a);
    goTo(a, r);
  }
}
function applyAgent(ag) {
  const prev = AG[ag.id];
  if (ag.archived) {
    delete AG[ag.id];
    if (A[ag.id] && !A[ag.id].leaving) leave(A[ag.id]);
    return;
  }
  AG[ag.id] = ag;
  if (!ready) return;
  const a = A[ag.id];
  if (!a) {
    if (!roomOf(ag.project) || (!BUSY.includes(ag.status) && prev)) return;
    arrive(ag, prev ? null : ag.by);
    return;
  }
  if (a.leaving) return;
  const before = a.status;
  sync(a, ag);
  if (before !== a.status) transition(a, before);
  if (a.drawn !== a.tagKey && !a.gone) drawTag(a);
  dirty = true;
}
function applySnapshot(list) {
  const seen = new Set(list.map((ag) => ag.id));
  Object.keys(AG).forEach((id) => { if (!seen.has(id)) applyAgent({ ...AG[id], archived: true }); });
  list.forEach(applyAgent);
}
function message(from, to) {
  const a = A[from];
  if (!ready || !a || !A[to] || !shown(a) || a.leaving || A[to].leaving) return;
  visit(a, to, 'mail');
}

let G = { mode: 'ok', api: 'ok', u5: null, uw: null, retry: 0 };
const USAGE = { value: null };
const hhmm = (ms) => new Date(ms).toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' });
const wday = (ms) => new Date(ms).toLocaleDateString(LANG, { weekday: 'short' }).replace(/\.$/, '');
function globalState() {
  const u = USAGE.value;
  if (!u) return { mode: 'ok', api: 'unknown', u5: null, uw: null, retry: 0, since: '' };
  const u5 = u.five_hour ? u.five_hour.utilization : null, uw = u.seven_day ? u.seven_day.utilization : null;
  const api = u.api === 'signed_out' ? 'signed_out' : u.api;
  const mode = ['outage', 'offline', 'signed_out'].includes(api) ? 'alert' : u5 >= 1 || uw >= 1 ? 'limit' : api === 'overloaded' ? 'retry' : u5 >= 0.9 ? 'high' : u5 >= 0.75 ? 'warm' : 'ok';
  return {
    mode, api, u5, uw, retry: u.retries || 0, since: u.since ? hhmm(u.since) : '',
    r5: u.five_hour?.resets_at ? hhmm(u.five_hour.resets_at) : '', rw: u.seven_day?.resets_at ? wday(u.seven_day.resets_at) : '',
  };
}

function counts(list) {
  const n = { working: 0, waiting: 0, error: 0 };
  list.forEach((a) => { if (n[a.status] != null) n[a.status]++; });
  return n;
}
const visibleActors = () => AL.filter((a) => !a.hidden && !a.leaving);
let uiKey = '';
function refreshUI() {
  const vis = visibleActors(), n = counts(vis), np = Object.keys(PROJ).length;
  const key = [np, vis.length, n.working, n.waiting, n.error].join();
  if (key === uiKey) return;
  uiKey = key;
  document.getElementById('statusbar').innerHTML = `<span>${tr('projects', np)}</span><span>${tr('agents', vis.length)}</span><span>${tr('working', n.working)}</span><span class="w">${tr('waitingYou', n.waiting)}</span><span class="${n.error ? 'e' : ''}">${tr('errors', n.error)}</span><span class="live">${tr('live')}</span>`;
  if (selRoom) inspectRoom(selRoom.z, null, null);
}
function refreshScreens(mode) {
  Object.values(SPOTS).filter((s) => s.kind === 'desk').forEach((s) => {
    const id = `scr-${s.id.replace('.', '-')}`, el = REG[id];
    if (!el) return;
    const a = AL.find((x) => x.desk === s.id && !x.hidden && !x.leaving && BUSY.includes(x.status) && !x.path);
    let st = !a ? 'off' : a.status === 'working' ? 'on' : a.status === 'waiting' ? 'wait' : a.status === 'error' ? 'err' : 'off';
    if (st === 'on' && mode === 'alert') st = 'err';
    if (st === 'on' && mode === 'limit') st = 'off';
    if (st === 'on' && mode === 'retry') st = 'retry';
    if (el.st !== st) { el.st = st; clear(el); el.addChild(toPixi(SCR[id](st))); dirty = true; }
  });
}
const WALL_W = 7.6 * 20, WALL_H = 2.25 * 22;
const idleN = () => Object.values(PROJ).filter((p) => p.idle).length;
function wallKey(g) {
  const n = counts(visibleActors());
  return [g.mode, g.api, g.u5 == null ? '-' : Math.round(g.u5 * 100), g.uw == null ? '-' : Math.round(g.uw * 100), g.retry, g.r5, g.rw, g.since, n.working, n.waiting, n.error, idleN()].join();
}
function drawWall(g, B) {
  const n = counts(visibleActors());
  const pc = (u) => (u == null ? '—' : `${Math.round(Math.min(u, 1) * 100)} %`);
  const lvl = (u) => (u >= 0.9 ? 'var(--err-text)' : u >= 0.75 ? 'var(--accent)' : 'var(--ok-text)');
  const api = { ok: ['var(--ok-text)', tr('w_ok')], unknown: ['var(--text-dim)', tr('w_unknown')], overloaded: ['var(--text)', tr('w_overloaded', g.retry)], outage: ['var(--err-text)', tr('w_outage')], offline: ['var(--err-text)', tr('w_offline')], signed_out: ['var(--err-text)', tr('w_signed_out')] }[g.api] || ['var(--text-dim)', g.api];
  const limitTxt = g.uw >= 1 ? tr('w_limitW') : g.u5 >= 1 ? tr('w_limit5') : null;
  const head = limitTxt ? ['var(--err-text)', limitTxt] : api;
  const txt = (x, y, size, fill, s, extra = '') => `<text x="${x}" y="${y}" font-family="DM Sans, sans-serif" font-size="${size}" style="fill:${fill}" ${extra}>${esc(s)}</text>`;
  const mono = (x, y, size, fill, s, extra = '') => `<text x="${x}" y="${y}" font-family="DM Mono, monospace" font-size="${size}" style="fill:${fill}" ${extra}>${esc(s)}</text>`;
  const bar = (y, u) => `<rect x="30" y="${y}" width="58" height="3.6" rx="1.8" style="fill:#262c31"/>` + (u == null ? '' : `<rect x="30" y="${y}" width="${f1(58 * Math.min(u, 1))}" height="3.6" rx="1.8" style="fill:${lvl(u)}"/>`);
  const reset = (u, at) => (!at ? '' : u >= 1 ? tr('w_resets', at) : `↺ ${at}`);
  const frame = g.mode === 'alert' || g.mode === 'limit' || g.mode === 'high' ? 'var(--err-text)' : '#2c3338';
  const big = { outage: [tr('w_bigOutage'), tr('w_bigOutage2', g.since)], offline: [tr('w_bigOffline'), tr('w_bigOffline2', g.since)], signed_out: [tr('w_bigSigned'), tr('w_bigSigned2')] }[g.api];
  let s = `<rect x="0.5" y="0.5" width="${WALL_W - 1}" height="${WALL_H - 1}" rx="1.2" fill="none" style="stroke:${frame}" stroke-width="${g.mode === 'alert' ? 1.6 : 0.8}" class="${g.mode === 'alert' ? 'alarm' : ''}"/>`;
  s += `<g opacity="${big ? 0.25 : 1}">`;
  s += txt(5, 9, 5.2, 'var(--text-dim)', tr('w_claude'), 'font-weight="700" letter-spacing="0.8"');
  s += `<circle cx="${f1(WALL_W - 6 - head[1].length * 2.75 - 4)}" cy="7.3" r="1.7" style="fill:${head[0]}"/>` + txt(WALL_W - 5, 9, 5.4, head[0], head[1], 'text-anchor="end" font-weight="600"');
  s += txt(5, 20, 5, 'var(--text-muted)', tr('w_session')) + bar(16.6, g.u5) + mono(92, 20, 5, g.u5 >= 1 ? 'var(--err-text)' : 'var(--text)', pc(g.u5)) + mono(WALL_W - 5, 20, 4.2, g.u5 >= 1 ? 'var(--err-text)' : 'var(--text-dim)', reset(g.u5, g.r5), 'text-anchor="end"');
  s += txt(5, 30, 5, 'var(--text-muted)', tr('w_week')) + bar(26.6, g.uw) + mono(92, 30, 5, g.uw >= 1 ? 'var(--err-text)' : 'var(--text)', pc(g.uw)) + mono(WALL_W - 5, 30, 4.2, g.uw >= 1 ? 'var(--err-text)' : 'var(--text-dim)', reset(g.uw, g.rw), 'text-anchor="end"');
  s += `<line x1="5" y1="35" x2="${WALL_W - 5}" y2="35" style="stroke:#22282c" stroke-width="0.5"/>`;
  let x = 5;
  [[tr('w_working', n.working), 'var(--text)'], [tr('w_waiting', n.waiting), 'var(--accent-link)'], [tr('w_error', n.error), n.error ? 'var(--err-text)' : 'var(--text-dim)'], [tr('w_idle', idleN()), 'var(--text-dim)']].forEach(([t, c]) => { s += mono(f1(x), 43.5, 4.6, c, t); x += t.length * 2.77 + 6; });
  s += '</g>';
  if (big) s += `<g>${txt(WALL_W / 2, 24, 9.5, 'var(--err-text)', big[0], 'text-anchor="middle" font-weight="700" letter-spacing="0.6" class="alarm"')}${mono(WALL_W / 2, 34, 4.6, 'var(--text)', big[1], 'text-anchor="middle"')}</g>`;
  const el = REG['wallScreen-' + B.id];
  wallReg[B.id] = {};
  clear(el);
  el.addChild(svgToPixi(s, { reg: wallReg[B.id], keep: ['alarm'], res: 10 }));
  document.getElementById('wallDot').className = 'dot ' + (g.mode === 'alert' ? 'alert' : g.mode === 'limit' || g.mode === 'high' ? 'high' : g.mode === 'warm' ? 'warm' : '');
  dirty = true;
}

function applyMode(g) {
  const prev = G.mode;
  G = g;
  const al = g.mode === 'alert';
  (REG['.falert'] || []).forEach((o) => { o.alpha = +al; });
  Z.forEach(tintZone);
  if ((prev === 'alert' && !al) || (prev === 'limit' && g.mode !== 'limit')) AL.forEach((a) => { if (a.status === 'working' && shown(a)) a.cheer = 1.6; });
  dirty = true;
}
function tintZone(z) {
  if (!z.c) return;
  z.c.tint = z.building && G.mode === 'limit' ? 0xb4b2b8 : 0xffffff;
}
function stepActor(a, dt) {
  if (a.inAt != null && !a.path && sim.t >= a.inAt) { const home = a.home; a.inAt = null; a.home = null; a.spot = 'entry'; walk(a, home, () => { placeAt(a, home); refreshUI(); }); }
  if (a.path) {
    const p = a.path;
    let move = dt * p.speed;
    while (move > 0 && p.seg < p.pts.length - 1) {
      const [x0, y0] = p.pts[p.seg], [x1, y1] = p.pts[p.seg + 1];
      const len = Math.hypot(x1 - x0, y1 - y0), left = len * (1 - p.f);
      if (move >= left) { move -= left; p.seg++; p.f = 0; } else { p.f += move / len; move = 0; }
    }
    if (p.seg >= p.pts.length - 1) {
      const [x, y] = p.pts[p.pts.length - 1];
      a.x = x; a.y = y; a.path = null; a.spot = a.target; p.done && p.done();
    } else {
      const [x0, y0] = p.pts[p.seg], [x1, y1] = p.pts[p.seg + 1];
      a.x = x0 + (x1 - x0) * p.f; a.y = y0 + (y1 - y0) * p.f; a.dir = [x1 - x0, y1 - y0];
    }
  }
  if (a.wait > 0) { a.wait -= dt; if (a.wait <= 0 && a.after) { const f = a.after; a.after = null; f(); } }
  if (a.cheer > 0) a.cheer -= dt;
}
const ALERT_BUBBLE = { outage: 'panic', offline: 'offline', signed_out: 'locked' };
function decide(a, s) {
  const mode = G.mode, t = sim.t;
  let pose = 'stand', mirror = !!s.mirror, z = s.z || 0, bub = null, txt = null, extra = null, dx = 0, dy = 0, typing = false;
  if (a.cheer > 0) {
    pose = Math.floor(a.cheer / 0.2) % 2 ? 'wave1' : 'wave2'; bub = 'cheer'; mirror = false;
    if (s.kind === 'desk') { z = 0; s.wall === 'n' ? (dy = 0.45) : (dx = 0.45); }
    z += Math.abs(Math.sin(a.cheer * 7)) * 0.3;
    return { pose, mirror, z, bub, dx, dy };
  }
  switch (s.kind) {
    case 'desk':
      if (a.sad) { pose = 'slump3'; bub = 'cloud'; break; }
      if (a.status === 'error') { pose = a.err === 'crash' ? 'slump3' : 'type3'; bub = a.err === 'mcp' ? 'mcp' : a.err === 'api' ? 'denied' : 'crash'; break; }
      pose = 'type3';
      if (a.status === 'working') {
        if (mode === 'alert') { pose = G.api === 'outage' ? (Math.floor((t + a.phase) / 0.22) % 2 ? 'wave1' : 'wave2') : 'shrug'; bub = ALERT_BUBBLE[G.api]; mirror = false; z = 0; s.wall === 'n' ? (dy = 0.45) : (dx = 0.45); }
        else if (mode === 'limit') { pose = 'stretch3'; bub = 'hourglass'; }
        else if (mode === 'retry') bub = 'retry';
        else { typing = true; if (mode === 'high') bub = 'sweat'; }
        if (a.err === 'mcp' && !bub) bub = 'mcp';
      }
      break;
    case 'stand': {
      pose = 'raise'; mirror = false;
      if (a.status === 'waiting') {
        bub = 'waiting';
        const ph = (t + a.phase) % 4.5;
        if (ph < 0.7) z += Math.abs(Math.sin(ph / 0.7 * Math.PI * 2)) * 0.32;
        else if (ph > 2.3 && ph < 3.4) pose = Math.floor(ph / 0.17) % 2 ? 'wave1' : 'wave2';
      } else pose = 'f3';
      break;
    }
    case 'sofa': case 'bean': pose = a.sad ? 'sit' : a.act === 'read' ? 'read' : a.act === 'phone' ? 'phone' : 'sit'; break;
    case 'lie': pose = 'lie'; bub = 'zzz'; break;
    case 'pp1': case 'pp2': {
      const u = (t % 1.3) / 1.3, bx = u < 0.5 ? u * 2 : 2 - u * 2, near = s.kind === 'pp1';
      const partner = AL.some((o) => o !== a && !o.path && o.spot === `${s.room.id}.${near ? 'pp2' : 'pp1'}` && shown(o));
      pose = near ? (partner && bx < 0.12 ? 'padFs' : 'padF') : (partner && bx > 0.88 ? 'padBs' : 'padB');
      break;
    }
    case 'coffee': pose = 'mug'; bub = 'steam'; break;
    case 'pool': pose = 'arcade'; extra = 'cue'; break;
    case 'poolw': pose = 'b3'; extra = 'cue2'; break;
    case 'foot': pose = s.pose; z += Math.floor((t + a.phase) / 0.25) % 2 ? 0.03 : 0; break;
    case 'meet': {
      pose = s.pose; z = s.z;
      const seated = AL.filter((o) => !o.path && shown(o) && SPOTS[o.spot]?.kind === 'meet' && SPOTS[o.spot].room === s.room);
      if (seated.length > 1 && seated[Math.floor(t / 1.8) % seated.length] === a) { bub = 'chat'; txt = ['…', 'ok', '?', '+1'][Math.floor(t / 1.8) % 4]; }
      break;
    }
    case 'arcade': pose = 'arcade'; z += Math.floor(t / 0.3) % 2 ? 0.03 : 0; break;
    case 'chat': {
      pose = s.mirror ? 'f3' : 'b3';
      const other = AL.find((o) => o !== a && !o.path && shown(o) && SPOTS[o.spot]?.kind === 'chat' && SPOTS[o.spot].room === s.room);
      if (other) { const turn = Math.floor(t / 1.6) % 4, mine = s.id.endsWith('chat1') ? [0, 2] : [1, 3]; if (mine.includes(turn)) { bub = 'chat'; txt = ['…', '?', 'ha!', '…'][turn]; } }
      break;
    }
    case 'visit': pose = 'f3'; break;
  }
  if (s.kind !== 'desk' && a.sad) bub = 'cloud';
  if (mode === 'alert' && a.status === 'done' && !a.sad && s.kind !== 'lie') bub = 'confused';
  return { pose, mirror, z, bub, txt, extra, dx, dy, typing };
}

function renderActor(a) {
  const gone = !shown(a);
  if (a.wasGone !== gone) { a.wasGone = gone; a.c.alpha = +!gone; a.tag.alpha = +!gone; dirty = true; }
  if (gone) return;
  const s = SPOTS[a.spot] || {};
  let r;
  if (a.path) {
    const [ddx, ddy] = a.dir || [1, 1], front = ddx + ddy > 0;
    r = { pose: (front ? 'f3' : 'b3') + (Math.floor(sim.t / (a.sad ? 0.28 : 0.16)) % 2 ? 'a' : 'b'), mirror: ddx - ddy > 0, z: 0, bub: a.sad ? 'cloud' : a.bubble || null, dx: 0, dy: 0 };
  } else {
    r = decide(a, s);
    if (a.bubble) r.bub = a.bubble;
  }
  const hat = !!a.leaving;
  const key = r.pose + hat;
  if (a.pkey !== key) { a.pkey = key; const pt = poseTexture(a.look, r.pose, hat); a.spr.texture = pt.tex; a.spr.setFromMatrix(pt.m); }
  a.body.scale.x = r.mirror ? -1 : 1;
  const exk = r.extra ? r.extra + Math.round(sim.t * 4) : '';
  if (a.exk !== exk) { a.exk = exk; clear(a.ex); if (r.extra) a.ex.addChild(toPixi(extras(r.extra, sim.t))); }
  a.spr.tint = a.sad ? 0x8e8e98 : 0xffffff;
  const x = a.x + (r.dx || 0), y = a.y + (r.dy || 0);
  const [X, Y] = P(x, y, r.z + (r.typing && Math.floor(sim.t / 0.16) % 2 ? 0.05 : 0));
  const TY = P(x, y, r.z)[1];
  a.c.position.set(X, Y);
  const hk = r.pose + hat;
  if (selId === a.id && a.haloKey !== hk) { a.haloKey = hk; const o = outlineTexture(r.pose, hat); a.halo.texture = o.tex; a.halo.setFromMatrix(o.m); }
  const ha = selId === a.id ? Math.round((0.7 + 0.3 * Math.sin(performance.now() / 260)) * 10) / 10 : 0;
  a.halo.alpha = ha;
  a.depth = x + y + (a.path ? 0 : s.bias || 0);
  place(a.c, x, y, a.depth);
  a.tag.position.set(X, TY - poseHeight(r.pose));
  const calm = a.status !== 'waiting' && a.status !== 'error';
  if (a.calm !== calm) { a.calm = calm; tagVis(a); }
  const bkey = (r.bub || '') + (r.txt || '');
  if (a.bkey !== bkey) { a.bkey = bkey; clear(a.bb); a.breg = null; if (r.bub) { a.breg = {}; a.bb.addChild(svgToPixi(bubble(r.bub, r.txt), { reg: a.breg, keep: ANIM, bitmap: true })); } }
  const anim = a.breg && ANIM.some((k) => a.breg['.' + k]);
  if (anim) animateBubble(a.breg, sim.t);
  const flat = r.pose === 'lie' || r.pose === 'sun';
  a.bb.x = flat ? -16 : 0;
  const hop = r.bub && BUBBLES[r.bub]?.[2];
  a.bb.y = (flat ? 30 : 0) + (cam.s >= 1.9 && !flat ? -13 : 0) + (!flat ? (a.nt.alpha ? 8 : 28) : 0) - (hop ? Math.abs(Math.sin(sim.t * Math.PI / 1.1)) * 4 : 0);
  const sig = `${X.toFixed(1)},${Y.toFixed(1)},${key},${r.mirror},${exk},${bkey},${ha},${a.spr.tint},${a.bb.y.toFixed(1)},${a.nt.alpha}`;
  if (anim || sig !== a.sig) { a.sig = sig; dirty = true; }
}
let RECEP = null;
function renderReception() {
  if (!RECEP) return;
  const near = AL.some((a) => shown(a) && a.path && Math.hypot(a.x - (RECEP.x + 3.1), a.y - RECEP.y) < 2.2);
  if (near) RECEP.wave = 1.2; else RECEP.wave = Math.max(0, (RECEP.wave || 0) - 0.04);
  const pose = RECEP.wave > 0 ? (Math.floor(sim.t / 0.2) % 2 ? 'wave1' : 'wave2') : 'sit';
  if (RECEP.key === pose) return;
  RECEP.key = pose;
  const pt = poseTexture(RECEP.look, pose, false);
  RECEP.spr.texture = pt.tex; RECEP.spr.setFromMatrix(pt.m);
  RECEP.c.scale.x = -1;
  RECEP.c.position.set(...P(RECEP.x, RECEP.y, pose === 'sit' ? 0.42 : 0.1));
  place(RECEP.c, RECEP.x, RECEP.y, RECEP.x + RECEP.y);
  dirty = true;
}
function renderBall() {
  LOUNGES.forEach((z) => {
    const ball = z.ball, p1 = AL.find((a) => !a.path && shown(a) && a.spot === `${z.id}.pp1`), p2 = AL.find((a) => !a.path && shown(a) && a.spot === `${z.id}.pp2`);
    const on = !!(p1 && p2);
    if (ball.alpha !== +on) { ball.alpha = +on; dirty = true; }
    if (!on) return;
    const u = (sim.t % 1.3) / 1.3, f = u < 0.5 ? u * 2 : 2 - u * 2, x = z.x0 + 3.45 + f * 2.5, y = z.y0 + 3.1, h = Math.abs(Math.sin(f * Math.PI * 2)) * 0.55;
    ball.dot.position.set(...P(x, y, 0.8 + h)); ball.sh.position.set(...P(x, y, 0.79));
    place(ball, x, y, x + y + 0.05);
    dirty = true;
  });
}
function renderDoors(dt) {
  DOORS.forEach((d) => {
    const near = AL.some((a) => shown(a) && Math.hypot(a.x - d.cx, a.y - d.cy) < 1.6);
    d.open += ((near ? 1 : 0) - d.open) * Math.min(1, dt * 6);
    if (d.open < 0.005) d.open = 0;
    const key = d.open.toFixed(2);
    if (d.key === key) return;
    d.key = key;
    const H = 1.85, ang = d.open * 1.45, at = (u, v, z) => (d.axis === 'y' ? P(u, d.pos + v, z) : P(d.pos + v, u, z));
    const leaf = (hinge, sign, len) => {
      const u1 = hinge + sign * len * Math.cos(ang), v1 = len * Math.sin(ang), q = (t, z) => at(hinge + (u1 - hinge) * t, v1 * t, z);
      return poly([q(0, 0), q(1, 0), q(1, H), q(0, H)], d.fill) + poly([q(0.2, 1.05), q(0.8, 1.05), q(0.8, 1.65), q(0.2, 1.65)], 'rgba(255,255,255,0.22)')
        + `<circle cx="${f1(q(0.86, 0.95)[0])}" cy="${f1(q(0.86, 0.95)[1])}" r="1.6" style="fill:#d8d2c8"/>`;
    };
    const w = d.b - d.a;
    clear(REG[d.id]);
    REG[d.id].addChild(toPixi(w > 1.6 ? leaf(d.a, 1, w / 2) + leaf(d.b, -1, w / 2) : leaf(d.a, 1, w)));
    dirty = true;
  });
}

const stage = document.getElementById('stage');
let viewTimer = 0;
function applyCam() {
  world.position.set(cam.tx, cam.ty);
  world.scale.set(cam.s);
  AL.forEach((a) => { a.tag.scale.set(1 / cam.s); tagVis(a); });
  dirty = true;
  clearTimeout(viewTimer);
  viewTimer = setTimeout(saveView, 600);
}
function bounds(x0, y0, x1, y1, top = 3) {
  const c = [P(x0, y0, top), P(x1, y0, top), P(x0, y1), P(x1, y1)];
  return { X0: Math.min(...c.map((p) => p[0])), X1: Math.max(...c.map((p) => p[0])), Y0: Math.min(...c.map((p) => p[1])), Y1: Math.max(...c.map((p) => p[1])) };
}
function frameBox(b, animate = true, pad = 0.96, max = 4) {
  const r = stage.getBoundingClientRect(), w = r.width;
  const s = Math.max(0.35, Math.min(max, Math.min(w / (b.X1 - b.X0), r.height / (b.Y1 - b.Y0)) * pad));
  flyTo({ s, tx: w / 2 - s * (b.X0 + b.X1) / 2, ty: r.height / 2 - s * (b.Y0 + b.Y1) / 2 }, animate);
}
const fit = (animate) => frameBox(bounds(-1, -1, LW + 3, BOT + LOBBY_D + 1), animate, 1);
let fly = null;
function flyTo(target, animate = true) {
  if (!animate) { Object.assign(cam, target); applyCam(); return; }
  fly = { from: { ...cam }, to: target, t: 0 };
}
function focusPoint(x, y, z, s) {
  const r = stage.getBoundingClientRect(), [X, Y] = P(x, y, z);
  flyTo({ s, tx: r.width / 2 - s * X, ty: r.height / 2 - s * Y });
}
const focusWall = (B = LOUNGES[0]) => B && B.wall && focusPoint((B.wall.x0 + B.wall.x1) / 2, B.y0 + 0.4, (B.wall.z0 + B.wall.z1) / 2, 3.6);
function focusZone(z) {
  const pz = z.p ? Z.filter((o) => o.p === z.p) : [z];
  const x0 = Math.min(...pz.map((o) => o.x0)), y0 = Math.min(...pz.map((o) => o.y0)), x1 = Math.max(...pz.map((o) => o.x1)), y1 = Math.max(...pz.map((o) => o.y1));
  if (!z.building) return focusPoint((x0 + x1) / 2, (y0 + y1) / 2, 0, 1.3);
  frameBox(bounds(x0, y0, x1, y1), true, 0.8, 2.1);
}
function viewNow() {
  const r = stage.getBoundingClientRect();
  return { seed: layoutSeed, cx: (r.width / 2 - cam.tx) / cam.s, cy: (r.height / 2 - cam.ty) / cam.s, s: cam.s, sel: selId };
}
function restoreView(v) {
  const r = stage.getBoundingClientRect();
  flyTo({ s: v.s, tx: r.width / 2 - v.s * v.cx, ty: r.height / 2 - v.s * v.cy }, false);
}

const ACTS = { read: 'act_read', phone: 'act_phone', lie: 'act_lie', pp1: 'act_pp', pp2: 'act_pp', coffee: 'act_coffee', arcade: 'act_arcade', chat: 'act_chat', sofa: 'act_sofa', bean: 'act_bean', pool: 'act_pool', poolw: 'act_poolw', foot: 'act_foot', meet: 'act_meet', visit: 'act_visit' };
const insBox = document.getElementById('inspector'), root = document.getElementById('root');
let selRoom = null, insPos = null, insHtml = '', openFailed = null;
const swatch = (p) => `<div class="meta"><i style="background:${PROJ[p]?.color || 'var(--text-dim)'}"></i>${esc(PROJ[p]?.name || '')}</div>`;
function agentHtml(a) {
  const s = SPOTS[a.spot] || {};
  const doing = a.leaving ? tr('leaving') : a.path ? tr('walking') : a.sad ? tr('moping') : BUSY.includes(a.status) ? null : s.kind === 'desk' ? tr('idleDesk') : ACTS[a.act] || ACTS[s.kind] ? tr(ACTS[a.act] || ACTS[s.kind]) : null;
  let st = tr('st_' + a.status);
  if (a.status === 'waiting' && a.waitKind) st += ` · ${tr('w_' + a.waitKind)}`;
  if (a.err && (a.status === 'error' || a.err === 'mcp')) st += ` · ${tr('e_' + a.err)}`;
  const now = a.status === 'working' && a.tool ? `<dt>${tr('now')}</dt><dd><code>${esc(a.tool)}</code></dd>` : '';
  return `<h3>${iconSvg(a.status)}<span>${esc(a.name)}</span></h3>${swatch(a.project)}
    <dl><dt>${tr('status')}</dt><dd>${st}</dd>${now}${doing ? `<dt>${tr('doing')}</dt><dd>${doing}</dd>` : ''}</dl>
    ${openFailed === a.id ? `<p class="note">${tr('openFailed')}</p>` : ''}
    <div class="row">${a.leaving ? '' : `<button class="${a.status === 'waiting' ? 'btn-c' : 'btn-p'}" data-open="${esc(a.id)}">${tr('open')}</button>`}<button class="btn-s" data-close>${tr('close')}</button></div>`;
}
function roomHtml(z) {
  const ps = z.parts ? z.parts.map((o) => o.p) : [z.p];
  return ps.map((p) => {
    const mine = Object.values(AG).filter((ag) => ag.project === p), n = counts(mine);
    const drawn = AL.filter((a) => a.project === p && !a.leaving).length, hidden = Math.max(0, mine.length - drawn);
    const parts = ['working', 'waiting', 'error'].filter((k) => n[k]).map((k) => tr('c_' + k, n[k]));
    if (hidden) parts.push(tr('notShown', hidden));
    return `${swatch(p)}<dl><dt>${tr('thisWeek')}</dt><dd>${tr('weekAgents', PROJ[p]?.n || 0)}</dd>${parts.length ? `<dt>${tr('inRoom')}</dt><dd>${parts.join(' · ')}</dd>` : ''}</dl>`;
  }).join('') + `<div class="row"><button class="btn-s" data-close>${tr('close')}</button></div>`;
}
function showBox(html, cx, cy) {
  if (cx != null) {
    const pr = root.getBoundingClientRect();
    let left = cx - pr.left + 44, top = cy - pr.top - 100;
    if (left + 312 > pr.width) left = cx - pr.left - 344;
    left = Math.max(8, left);
    top = Math.max(52, Math.min(top, pr.height - 240));
    insPos = { left, top };
    insBox.style.left = left + 'px'; insBox.style.top = top + 'px';
  }
  if (html !== insHtml) { insHtml = html; insBox.innerHTML = html; }
  insBox.classList.add('on');
}
function inspect(id, cx, cy) {
  const a = A[id];
  if (!a) return;
  selRoom = null;
  if (selId !== id) openFailed = null;
  selId = id;
  showBox(agentHtml(a), cx, cy);
  saveView();
}
function inspectRoom(z, cx, cy) {
  selId = null; selRoom = { z };
  showBox(roomHtml(z), cx, cy);
}
function refreshInspector() {
  if (selId) { if (A[selId]) showBox(agentHtml(A[selId])); else closeInspector(); }
  else if (selRoom) { if (Z.includes(selRoom.z)) showBox(roomHtml(selRoom.z)); else closeInspector(); }
}
function closeInspector() {
  const had = selId;
  insBox.classList.remove('on');
  selId = null; selRoom = null; insHtml = ''; openFailed = null;
  dirty = true;
  if (had) saveView();
}

let drag = null;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.zoom')) return;
  drag = { x: e.clientX, y: e.clientY, tx: cam.tx, ty: cam.ty, moved: false };
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; stage.classList.add('drag'); fly = null; }
  if (drag.moved) { cam.tx = drag.tx + dx; cam.ty = drag.ty + dy; applyCam(); }
});
const floorAt = (e) => {
  const r = stage.getBoundingClientRect(), X = (e.clientX - r.left - cam.tx) / cam.s, Y = (e.clientY - r.top - cam.ty) / cam.s;
  return [(X / 20 + Y / 10) / 2, (Y / 10 - X / 20) / 2];
};
stage.addEventListener('pointerup', (e) => {
  const d = drag; drag = null; stage.classList.remove('drag');
  if (!d || d.moved || !ready) return;
  stage.releasePointerCapture(e.pointerId);
  const r = stage.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  const hit = AL.filter((a) => shown(a) && a.c.parent).sort((p, q) => q.depth - p.depth).find((a) => { const b = a.c.getBounds(); return px >= b.minX && px <= b.maxX && py >= b.minY && py <= b.maxY; });
  if (hit) return inspect(hit.id, e.clientX, e.clientY);
  const z = zoneAt(...floorAt(e));
  if (z && z.type === 'room' && (z.p || z.parts)) return inspectRoom(z, e.clientX, e.clientY);
  closeInspector();
});
stage.addEventListener('dblclick', (e) => {
  if (e.target.closest('.zoom') || !ready) return;
  const [x, y] = floorAt(e), lz = zoneAt(x, y);
  if (lz.wall && y < lz.y0 + 1.2) return focusWall(lz);
  focusZone(lz);
});
stage.addEventListener('wheel', (e) => {
  e.preventDefault(); fly = null;
  const r = stage.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const s = Math.max(0.35, Math.min(4, cam.s * Math.exp(-e.deltaY * 0.0015)));
  cam.tx = mx - (mx - cam.tx) * s / cam.s; cam.ty = my - (my - cam.ty) * s / cam.s; cam.s = s; applyCam();
}, { passive: false });
document.querySelector('.zoom').addEventListener('click', (e) => {
  const z = e.target.closest('button')?.dataset.z;
  if (!z || !ready) return;
  if (z === 'fit') return fit(true);
  if (z === 'wall') return focusWall();
  const r = stage.getBoundingClientRect(), s = Math.max(0.35, Math.min(4, cam.s * (z === 'in' ? 1.3 : 1 / 1.3)));
  flyTo({ s, tx: r.width / 2 - (r.width / 2 - cam.tx) * s / cam.s, ty: r.height / 2 - (r.height / 2 - cam.ty) * s / cam.s });
});
insBox.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return closeInspector();
  const open = e.target.closest('[data-open]');
  if (open) { saveView(); squadron.send({ type: 'show', id: open.dataset.open }); }
});

let last = performance.now(), lively = true, frameN = 0, onScreen = true, ready = false, constructing = false, posesReady = false;
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(stage);
const visible = () => onScreen && !document.hidden && stage.clientWidth > 0 && stage.clientHeight > 0;
function loop() {
  requestAnimationFrame((now) => { setTimeout(loop, lively ? 34 : 76); frame(now); });
}
function frame(now) {
  const rdt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!app || !ready || !visible()) return;
  if (fly) {
    fly.t = Math.min(1, fly.t + rdt / 0.6);
    const e = 1 - Math.pow(1 - fly.t, 3);
    ['tx', 'ty', 's'].forEach((k) => { cam[k] = fly.from[k] + (fly.to[k] - fly.from[k]) * e; });
    applyCam();
    if (fly.t >= 1) fly = null;
  }
  sim.t += rdt;
  const g = globalState();
  if (g.mode !== G.mode) applyMode(g); else G = g;
  const wk = wallKey(g);
  LOUNGES.filter((z) => z.wall).forEach((z) => { if (z.wkey !== wk) { z.wkey = wk; drawWall(g, z); } });
  AL.forEach((a) => stepActor(a, rdt));
  AL.forEach((a) => renderActor(a));
  if (frameN++ % 3 === 0) { refreshScreens(g.mode); refreshUI(); }
  if (frameN % 6 === 0 && insBox.classList.contains('on')) refreshInspector();
  renderBall();
  renderReception();
  const walking = AL.some((a) => a.path);
  if (walking || DOORS.some((d) => d.open > 0)) renderDoors(rdt);
  lively = walking || !!fly || !!drag || G.mode === 'alert' || DOORS.some((d) => d.open > 0);
  if (G.mode === 'alert') {
    const pulse = Math.round((0.14 + 0.41 * (0.5 - 0.5 * Math.cos(now / 1600 * Math.PI * 2))) * 20) / 20;
    (REG['.falert'] || []).forEach((o) => { if (o.alpha !== pulse) { o.alpha = pulse; dirty = true; } });
  }
  const blink = Math.floor(now / 350) % 2 ? 1 : 0.35;
  Object.values(wallReg).forEach((r) => (r['.alarm'] || []).forEach((o) => { if (o.alpha !== blink) { o.alpha = blink; dirty = true; } }));
  const tint = [0x9ad6cb, 0xf4d06f, 0xf59e8c][Math.floor(now / 400) % 3];
  (REG['.arcade-scr'] || []).forEach((o) => { if (o.tint !== tint) { o.tint = tint; dirty = true; } });
  checkRebuild(now);
  if (dirty) { dirty = false; app.render(); }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const newSeed = () => 1 + Math.floor(Math.random() * 9999);
const LAYS = { kept: [], start: null };
let layoutSig = '', wantRebuild = false, lastEventAt = 0;
const layoutSigOf = () => JSON.stringify([Object.values(PROJ).map((p) => [p.id, p.name, p.color, p.group, tierOf(p.n)]).sort(), GROUPS.map((g) => g.id).sort()]);
async function construct(seed, o = {}) {
  if (constructing) return;
  constructing = true; ready = false; wantRebuild = false;
  const ld = document.getElementById('loader'), t0 = performance.now();
  if (!o.veiled) {
    document.getElementById('ldSeed').textContent = tr('layoutN', seed);
    document.getElementById('ldStep').textContent = '';
    document.getElementById('ldFill').style.width = '0';
    ld.classList.toggle('quiet', !!o.quiet);
    ld.classList.add('on');
  }
  document.getElementById('layMenu').classList.remove('on');
  AL.forEach((a) => { a.c.destroy({ children: true }); a.tag.destroy({ children: true }); });
  A = {}; AL = [];
  [baseL, zonesL].forEach(clear);
  [REG, SPOTS, SCR, wallReg].forEach((r) => Object.keys(r).forEach((k) => delete r[k]));
  RECEP = null;
  let n = 0, total = 4;
  const step = async (label) => {
    n++;
    document.getElementById('ldStep').textContent = label;
    document.getElementById('ldFill').style.width = (n / total * 100).toFixed(0) + '%';
    await wait(o.veiled || o.quiet ? 0 : 16);
  };
  if (!posesReady) { total++; await step(tr('drawing')); warmPoses(LOOKS); posesReady = true; }
  layoutSeed = seed;
  generateLayout(seed);
  buildSpots();
  total += Z.filter((z) => z.p || z.parts || z.type === 'lounge').length;
  await step(tr('readingProjects', Object.keys(PROJ).length));
  await buildScene(step);
  await step(tr('doors'));
  sim.t = 0;
  G = { mode: 'ok' };
  makeActors(!!o.intro);
  LOUNGES.forEach((z) => { z.wkey = ''; });
  DOORS.forEach((d) => { d.key = null; });
  await step(tr('waking', AL.length));
  if (!o.keepCam) fit(false); else applyCam();
  layoutSig = layoutSigOf();
  uiKey = '';
  ready = true; constructing = false; dirty = true;
  refreshUI();
  showSeed();
  if (!o.veiled && !o.quiet) await wait(Math.max(0, 450 - (performance.now() - t0)));
  ld.classList.remove('on');
}
function checkRebuild(now) {
  if (!wantRebuild || constructing || fly || drag || now - lastEventAt < 1500 || AL.some((a) => a.path || a.inAt != null)) return;
  rebuild();
}
async function rebuild() {
  wantRebuild = false;
  const veil = document.getElementById('veil'), keep = selId, pos = insPos;
  veil.querySelector('p').textContent = '';
  veil.classList.add('on');
  await wait(450);
  await construct(layoutSeed, { veiled: true, keepCam: true });
  if (keep && A[keep]) { selId = keep; if (pos) { insBox.style.left = pos.left + 'px'; insBox.style.top = pos.top + 'px'; } refreshInspector(); } else closeInspector();
  await wait(250);
  veil.classList.remove('on');
}

function loungeLabel() {
  return LOUNGES.map((z) => tr(z.center)).join(' · ');
}
function showSeed() {
  const kept = LAYS.kept.some((o) => o.seed === layoutSeed);
  document.getElementById('seed').textContent = `#${layoutSeed}`;
  document.getElementById('layBtn').classList.toggle('kept', kept);
  document.getElementById('layMenu').innerHTML = `<div class="lm-h">${tr('atStart')}</div>
    <button class="lm-i" data-start="" aria-checked="${LAYS.start == null}"><i></i>${tr('newEachTime')}</button>
    ${LAYS.kept.map((o) => `<div class="lm-row"><button class="lm-i" data-start="${o.seed}" aria-checked="${LAYS.start === o.seed}"><i></i>#${o.seed}<span>${esc(o.label)}</span></button><button class="lm-x" data-del="${o.seed}" title="${esc(tr('forget'))}">×</button></div>`).join('')}
    <div class="lm-sep"></div>
    <button class="lm-i lm-keep" data-keep ${kept ? 'disabled' : ''}>${kept ? tr('kept', layoutSeed) : tr('keep', layoutSeed)}</button>`;
}
document.getElementById('layBtn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('layMenu').classList.toggle('on'); });
document.addEventListener('click', (e) => { if (!e.target.closest('#layMenu, #layBtn')) document.getElementById('layMenu').classList.remove('on'); });
document.getElementById('layMenu').addEventListener('click', (e) => {
  e.stopPropagation();
  const t = e.target.closest('button');
  if (!t || constructing) return;
  if (t.dataset.del) {
    const k = +t.dataset.del;
    LAYS.kept = LAYS.kept.filter((o) => o.seed !== k);
    if (LAYS.start === k) LAYS.start = null;
  } else if (t.hasAttribute('data-keep')) {
    LAYS.kept.push({ seed: layoutSeed, label: loungeLabel() });
    LAYS.start = layoutSeed;
  } else if (t.dataset.start != null) {
    LAYS.start = t.dataset.start === '' ? null : +t.dataset.start;
    if (LAYS.start != null && LAYS.start !== layoutSeed) { saveLayouts(); return construct(LAYS.start, { intro: true }).then(saveView); }
  }
  saveLayouts();
  showSeed();
});
document.getElementById('regen').addEventListener('click', () => { if (!constructing) construct(newSeed(), { intro: true }).then(saveView); });

async function initApp() {
  app = new PIXI.Application();
  await app.init({ preference: 'webgl', resizeTo: stage, backgroundAlpha: 0, antialias: false, autoStart: false, resolution: Math.min(2, devicePixelRatio || 1), autoDensity: true });
  PIXI.Ticker.system.stop();
  PIXI.Ticker.shared.stop();
  app.stage.eventMode = 'none';
  stage.prepend(app.canvas);
  world = app.stage.addChild(new PIXI.Container());
  baseL = world.addChild(new PIXI.Container());
  zonesL = world.addChild(new PIXI.Container());
  tagsL = world.addChild(new PIXI.Container());
  new ResizeObserver(() => { dirty = true; }).observe(stage);
  loop();
}
