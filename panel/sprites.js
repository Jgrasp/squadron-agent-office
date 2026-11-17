const TW = 40, TH = 20, TZ = 22, PX = 2.6;
const P = (x, y, z = 0) => [(x - y) * TW / 2, (x + y) * TH / 2 - z * TZ];
const f1 = (n) => n.toFixed(1);
const pts = (a) => a.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" style="fill:${fill}" ${extra}/>`;
const mix = (c, pct, base) => `color-mix(in srgb, ${c} ${pct}%, ${base})`;
function box(x, y, z, w, d, h, top, left, right) {
  return poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left)
    + poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right)
    + poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
}
const onX = (x, y0, y1, z0, z1, f, e = '') => poly([P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1)], f, e);
const onY = (y, x0, x1, z0, z1, f, e = '') => poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], f, e);

const LOOKS = [
  ['#3b2a20', '#e2b493', '#4e7a8c', '#2c3440'], ['#c9893f', '#f0c9a8', '#7c5a8a', '#2f2a36'], ['#1e1a18', '#a8714f', '#6c8a5a', '#33302c'],
  ['#8a3b25', '#efc6a6', '#9a6a4a', '#2b2f3a'], ['#5a4535', '#d9a582', '#56606e', '#24272e'], ['#2a2420', '#c48d68', '#4f6f6a', '#30343c'],
  ['#d8c7a0', '#f2d2b6', '#b0884f', '#2a2d33'], ['#4a3020', '#d29a74', '#5a7a9a', '#2c2c34'], ['#1e1a18', '#9c6848', '#a0526e', '#2a2a30'],
  ['#6b4a2e', '#e8bf9c', '#8a5a6a', '#2a2d33'], ['#b5651d', '#f1cfb0', '#3f6b8a', '#2a2a2e'], ['#2b1d16', '#7a4e36', '#c7a24a', '#2f2b28'],
];

const UPF = ['...hhhh...', '..hhhhhh..', '..hssssh..', '..sesses..', '..ssssss..', '...ssss...', '..tttttt..', '.tttttttt.', '.tttttttt.', '.sttttttts', '.s.tttt.s.'];
const UPB = ['...hhhh...', '..hhhhhh..', '..hhhhhh..', '..hhhhhh..', '...hhhh...', '...ssss...', '..tttttt..', '.tttttttt.', '.tttttttt.', '.sttttttts', '.s.tttt.s.'];
const HEAD_F3 = ['...hhhh...', '..hhhhhhh.', '..sssshhh.', '..esesshh.', '..sssssh..', '...ssss...'];
const HEAD_B3 = ['...hhhh...', '..hhhhhhh.', '..hhhhhhh.', '..hhhhhhs.', '...hhhhh..', '....sss...'];
const BODY = ['..tttttt..', '.tttttttt.', '.tttttttt.', '.sttttttts', '.s.tttt.s.'];
const BODY_SWING = { a: ['..tttttt..', '.tttttttt.', 'stttttttt.', 's.ttttttts', '...tttt..s'], b: ['..tttttt..', '.tttttttt.', '.tttttttts', 'stttttttts', 's..tttt...'] };
const LEG = { s: ['...pppp...', '...pppp...', '...p..p...', '...p..p...', '..kk..kk..'], a: ['...pppp...', '...pppp...', '..pp..p...', '..p....p..', '.kk....kk.'], b: ['...pppp...', '...pppp...', '...p.pp...', '....pp....', '....kk....'] };
const LEG3 = { s: ['...pppp...', '...pppp...', '...p..p...', '...p..p...', '..kk.kk...'], a: ['...pppp...', '...pppp...', '..pp..pp..', '.pp....pp.', 'kk.....kk.'], b: ['...pppp...', '...pppp...', '...ppp....', '....pp....', '...kk.....'] };
const SIT_LEGS = ['.spppppps.', '.pppppppp.', '.k......k.'];
const SEAT3 = ['..tttttt..', 'sstttttt..', '.ttttttt..', '.ttttttt..', '.ppppppp..'];

const POSES = {
  stand: [...UPF, ...LEG.s], fa: [...UPF, ...LEG.a], fb: [...UPF, ...LEG.b], ba: [...UPB, ...LEG.a], bb: [...UPB, ...LEG.b], backStand: [...UPB, ...LEG.s],
  f3: [...HEAD_F3, ...BODY, ...LEG3.s], f3a: [...HEAD_F3, ...BODY_SWING.a, ...LEG3.a], f3b: [...HEAD_F3, ...BODY_SWING.b, ...LEG3.b],
  b3: [...HEAD_B3, ...BODY, ...LEG3.s], b3a: [...HEAD_B3, ...BODY_SWING.b, ...LEG3.a], b3b: [...HEAD_B3, ...BODY_SWING.a, ...LEG3.b],
  type3: [...HEAD_B3, ...SEAT3],
  type3b: [...HEAD_B3, '..tttttt..', '.sstttttt.', '.ttttttt..', '.ttttttt..', '.ppppppp..'],
  stretch3: ['.s.hhhh...', '.thhhhhhh.', '..hhhhhhh.', '..hhhhhhs.', '...hhhhh..', '....sss...', '..tttttt..', '.tttttttt.', '.ttttttt..', '.ttttttt..', '.ppppppp..'],
  slump3: ['..........', '..........', '..........', '..hhhhh...', '.hhhhhhh..', 'sshhhhhs..', 'tttttttt..', '.ttttttt..', '.ttttttt..', '.ttttttt..', '.ppppppp..'],
  raise: ['...hhhh..s', '..hhhhhh.s', '..hssssh.s', '..sesses.t', '..ssssss.t', '...ssss.tt', '..ttttttt.', '.tttttttt.', '.tttttttt.', '.sttttttt.', '.s.tttt...', ...LEG.s],
  wave1: ['s..hhhh..s', 's.hhhhhh.s', 't.hssssh.t', 't.sesses.t', 't.ssssss.t', 'tt.ssss.tt', '.tttttttt.', '.tttttttt.', '..tttttt..', '..tttttt..', '..tttttt..', ...LEG.s],
  wave2: ['.s.hhhh.s.', '.thhhhhht.', '.thssssht.', 't.sesses.t', 't.ssssss.t', 'tt.ssss.tt', '.tttttttt.', '.tttttttt.', '..tttttt..', '..tttttt..', '..tttttt..', ...LEG.s],
  shrug: ['...hhhh...', '..hhhhhh..', '..hssssh..', '..sesses..', 's.ssssss.s', 'tt.ssss.tt', '.tttttttt.', '.tttttttt.', '..tttttt..', '..tttttt..', '..tttttt..', ...LEG.s],
  sit: [...UPF.slice(0, 10), ...SIT_LEGS],
  read: [...UPF.slice(0, 8), '.tBBWWBBt.', '.sBWWWWBs.', ...SIT_LEGS],
  phone: [...UPF.slice(0, 9), '.sttFGtts.', ...SIT_LEGS],
  mug: [...UPF.slice(0, 9), '.sttttttMM', '.s.tttt.MM', ...LEG.s],
  padF: [...UPF.slice(0, 9), '.sttttttsR', '.s.tttt.RR', ...LEG.s],
  padFs: [...UPF.slice(0, 5), '...ssss.RR', '..ttttttRR', '.tttttttD.', '.tttttttt.', '.stttttt..', '.s.tttt...', ...LEG.s],
  padB: [...UPB.slice(0, 9), 'Rsttttttts', 'RR.tttt.s.', ...LEG.s],
  padBs: [...UPB.slice(0, 5), 'RR.ssss...', 'RRtttttt..', '.Dtttttttt', '.tttttttt.', '..ttttttts', '...tttt.s.', ...LEG.s],
  arcade: [...HEAD_B3, '..tttttt..', 'sstttttt..', '.tttttttt.', '.sttttttt.', '...tttt...', ...LEG3.s],
  water: [...HEAD_F3, '..tttttt..', '.tttttttt.', '.tttttttt.', 'Ctttttttt.', 'CCtttt..s.', ...LEG3.s],
  throw1: [...HEAD_F3, '..tttttt..', '.ttttttttt', '.tttttttts', '.tttttttt.', '..tttt....', ...LEG3.a],
  throw2: ['s..hhhh...', 's.hhhhhhh.', 't.sssshhh.', 't.esesshh.', 'tt.ssssh..', '.t.ssss...', '..tttttt..', '.tttttttt.', '.tttttttt.', '.tttttttt.', '..tttt....', ...LEG3.a],
  lie: ['..hhh...........', '.hhsss.ttttt....', '.hssss.tttttpppp', '..sss.sttttspppk', '.......ttttt...k'],
  sun: ['..hhh...........', '.hhOOs.ttttt....', '.hssss.tttttpppp', '..sss.sttttspppk', '.......ttttt...k'],
};
const PROPS = { k: '#1b1714', e: '#1b1714', B: '#c9533d', W: '#efe8dc', F: '#20242c', G: '#9ad6cb', M: '#f5efe6', R: '#c94a3a', D: '#7a5236', O: '#14161c', C: '#5f8f5a', Y: '#d9c27a', N: '#8a5a3a' };
const HAT = ['...YYYY...', '..YNNNNY..', 'YYYYYYYYYY'];
const FLAT = new Set(['lie', 'sun']);
const poseHeight = (pose) => (FLAT.has(pose) ? 22 : POSES[pose].length * PX);

function statusIcon(s, x, y, r = 4) {
  if (s === 'working') return `<path d="M${x + r} ${y} A${r} ${r} 0 1 1 ${x} ${y - r}" fill="none" style="stroke:var(--ok-text)" stroke-width="1.6" stroke-linecap="round"/>`;
  if (s === 'waiting') return `<circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--accent)"/>`;
  if (s === 'done') return `<path d="M${x - r} ${y} l${r * 0.7} ${r * 0.8} l${r * 1.4} -${r * 1.7}" fill="none" style="stroke:var(--ok-text)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (s === 'error') return `<path d="M${x - r * 0.8} ${y - r * 0.8} l${r * 1.6} ${r * 1.6} M${x + r * 0.8} ${y - r * 0.8} l-${r * 1.6} ${r * 1.6}" style="stroke:var(--err-text)" stroke-width="1.6" stroke-linecap="round"/>`;
  if (s === 'archived') return `<rect x="${x - r}" y="${y - r * 0.6}" width="${r * 2}" height="${r * 1.5}" rx="1" fill="none" style="stroke:var(--text-dim)" stroke-width="1.3"/><path d="M${x - r * 1.15} ${y - r * 0.6} h${r * 2.3} M${x - r * 0.4} ${y + 0.1} h${r * 0.8}" style="stroke:var(--text-dim)" stroke-width="1.3"/>`;
  return `<rect x="${x - r * 0.75}" y="${y - r * 0.75}" width="${r * 1.5}" height="${r * 1.5}" rx="1" style="fill:var(--text-dim)"/>`;
}
const iconSvg = (s) => `<svg width="12" height="12" viewBox="-6 -6 12 12">${statusIcon(s, 0, 0, 4)}</svg>`;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function shortName(name, max = 22) {
  const m = name.match(KEY);
  if (m) {
    const rest = m[2].trim();
    return { key: m[1], rest: rest ? cut(rest, Math.max(8, max - m[1].length - 1)) : '' };
  }
  return { key: null, rest: cut(name, max) };
}
function cut(s, max) {
  if (s.length <= max) return s;
  const sp = s.lastIndexOf(' ', max - 1);
  return s.slice(0, sp > max * 0.55 ? sp : max - 1).replace(/[\s:,·-]+$/, '') + '…';
}
function wrap(s, width, lines) {
  const out = [];
  let cur = '';
  s.split(/\s+/).forEach((w) => {
    if ((cur + ' ' + w).trim().length > width && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  });
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] = cut(out[lines - 1] + ' …', width); }
  return out;
}
const CH = 6.25;
function tagBox(status, lines, x, y0, keyLen) {
  const waiting = status === 'waiting', w = Math.max(...lines.map((l) => l.length)) * CH + 24, h = 6 + lines.length * 12.5;
  const fg = waiting ? 'var(--ink)' : (status === 'done' || status === 'interrupted' || status === 'archived' ? 'var(--text-muted)' : 'var(--text)');
  const bx = -w / 2, by = y0 - h;
  let g = `<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="3" style="fill:${waiting ? 'var(--accent)' : 'var(--surface-1)'};stroke:${waiting ? 'none' : 'var(--border)'}" fill-opacity="${waiting ? 1 : 0.94}"/>`;
  g += waiting ? `<circle cx="${bx + 9}" cy="${by + 9}" r="3.2" style="fill:var(--ink)"/>` : statusIcon(status, bx + 9, by + 9, 3.4);
  lines.forEach((l, i) => {
    const ty = by + 12.6 + i * 12.5;
    if (i === 0 && keyLen) g += `<text x="${bx + 18}" y="${ty}" font-family="DM Mono, monospace" font-size="10.5" font-weight="700" style="fill:${fg}">${esc(l.slice(0, keyLen))}<tspan font-weight="${waiting ? 700 : 400}">${esc(l.slice(keyLen))}</tspan></text>`;
    else g += `<text x="${bx + 18}" y="${ty}" font-family="DM Mono, monospace" font-size="10.5" font-weight="${waiting ? 700 : 400}" style="fill:${fg}">${esc(l)}</text>`;
  });
  return g;
}
const KEY = /^\s*\[?([A-Z][A-Z0-9]+-\d+)\]?\s*[:·-]?\s*(.*)$/;
function nameTag(name, status) {
  const s = shortName(name), m = name.match(KEY);
  const short = s.key ? (s.rest ? `${s.key} ${s.rest}` : s.key) : s.rest;
  const clean = m ? `${m[1]} ${m[2]}`.trim() : name;
  return `<g class="short">${tagBox(status, [short], 0, -3, s.key ? s.key.length : 0)}</g><g class="full">${tagBox(status, wrap(clean, 30, 2), 0, -3, m ? m[1].length : 0)}</g>`;
}

const GLYPH = {
  '!': (y) => `<text x="0" y="${y + 14}" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="14" style="fill:var(--ink)">!</text>`,
  '?': (y) => `<text x="0" y="${y + 14}" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="13" style="fill:var(--text)">?</text>`,
  '+': (y) => `<path d="M0 ${y + 4.5} v10 M-5 ${y + 9.5} h10" style="stroke:var(--ink)" stroke-width="2.2" stroke-linecap="round"/>`,
  x: (y) => `<path d="M-4 ${y + 5.5} l8 8 M4 ${y + 5.5} l-8 8" style="stroke:var(--ink)" stroke-width="2.2" stroke-linecap="round"/>`,
  mail: (y) => `<rect x="-6" y="${y + 5}" width="12" height="8.5" rx="1" fill="none" style="stroke:var(--ink)" stroke-width="1.4"/><path d="M-6 ${y + 5} L0 ${y + 10} L6 ${y + 5}" fill="none" style="stroke:var(--ink)" stroke-width="1.4"/>`,
  plug: (y) => `<g transform="translate(0 ${y + 9.5})" fill="none" style="stroke:var(--ink)" stroke-width="1.5" stroke-linecap="round"><path d="M-2.5 -6 v3 M2.5 -6 v3 M-4.5 -3 h9 v2.5 a4.5 4 0 0 1 -9 0z M0 3.5 v3"/></g>`,
  lock: (y) => `<g transform="translate(0 ${y + 10})"><rect x="-4.5" y="-1.5" width="9" height="7" rx="1" style="fill:var(--ink)"/><path d="M-2.6 -1.5 v-2.2 a2.6 2.6 0 0 1 5.2 0 v2.2" fill="none" style="stroke:var(--ink)" stroke-width="1.5"/></g>`,
  hourglass: (y) => `<g transform="translate(0 ${y + 9.5})" fill="none" style="stroke:var(--text)" stroke-width="1.4" stroke-linecap="round"><path d="M-4 -5.5 h8 M-4 5.5 h8 M-3 -5.5 C-3 -1 3 1 3 5.5 M3 -5.5 C3 -1 -3 1 -3 5.5"/><path d="M-1.6 4.5 h3.2" style="stroke:var(--accent-link)" stroke-width="1.6"/></g>`,
  retry: (y) => `<g transform="translate(0 ${y + 9.5})"><g class="spin" fill="none" style="stroke:var(--text)" stroke-width="1.6" stroke-linecap="round"><path d="M4.5 0 A4.5 4.5 0 1 1 1.4 -4.3"/><path d="M0.2 -6.4 L2 -4.2 L-0.4 -2.6"/></g></g>`,
  wifi: (y) => `<g transform="translate(0 ${y + 10})" fill="none" style="stroke:var(--ink)" stroke-width="1.5" stroke-linecap="round"><path d="M-6 -2 Q0 -8 6 -2 M-3.5 1 Q0 -2.5 3.5 1"/><circle cx="0" cy="3.6" r="0.9" style="fill:var(--ink)"/><path d="M-6 -6 L6 5.5"/></g>`,
  z: (y) => '',
};
const BUBBLES = {
  waiting: ['var(--accent)', '!', true], error: ['var(--err-text)', 'x', true], crash: ['var(--err-text)', 'x', true], mcp: ['var(--err-text)', 'plug', true],
  denied: ['var(--err-text)', 'lock', true], panic: ['var(--err-text)', '!', true], offline: ['var(--err-text)', 'wifi', true], locked: ['var(--err-text)', 'lock', true],
  confused: ['var(--surface-3)', '?', false], retry: ['var(--surface-3)', 'retry', false], hourglass: ['var(--surface-3)', 'hourglass', false],
  mail: ['var(--text)', 'mail', false], plus: ['var(--ok-text)', '+', false], cheer: ['var(--ok-text)', '!', false],
};
function bubble(kind, txt, t) {
  const y = -50, live = t !== undefined;
  const ph = (p, off) => (((t - off) % p) + p) % p / p;
  const fade = (p, peak, top = 1) => (p < peak ? p / peak * top : top * (1 - (p - peak) / (1 - peak)));
  if (!kind) return '';
  if (kind === 'zzz') {
    if (!live) return `<g font-family="DM Sans, sans-serif" font-weight="700" style="fill:var(--text-muted)"><text class="rise1" x="6" y="-26" font-size="11">z</text><text class="rise2" x="6" y="-26" font-size="13">z</text><text class="rise3" x="6" y="-26" font-size="15">z</text></g>`;
    return `<g font-family="DM Sans, sans-serif" font-weight="700" style="fill:var(--text-muted)">${[11, 13, 15].map((fs, k) => { const p = ph(2.4, k * 0.8); return `<text x="${f1(6 + p * 10)}" y="${f1(-26 - p * 26)}" font-size="${fs}" opacity="${fade(p, 0.15).toFixed(2)}">z</text>`; }).join('')}</g>`;
  }
  if (kind === 'steam') {
    if (!live) return `<g style="stroke:var(--text-muted)" fill="none" stroke-width="1.2" stroke-linecap="round"><path class="steam" d="M10 -6 q3 -4 0 -8 q-3 -4 0 -8"/></g>`;
    const p = ph(1.8, 0);
    return `<g style="stroke:var(--text-muted)" fill="none" stroke-width="1.2" stroke-linecap="round" opacity="${fade(p, 0.4, 0.8).toFixed(2)}"><path d="M10 ${f1(-2 - p * 14)} q3 -4 0 -8 q-3 -4 0 -8"/></g>`;
  }
  if (kind === 'sweat') {
    if (!live) return `<path class="sweat" d="M10 3 q2.6 4 0 6 q-2.6 -2 0 -6z" style="fill:#7fa6d6"/>`;
    const p = ph(1.4, 0);
    return `<path d="M10 ${f1(3 + p * 10)} q2.6 4 0 6 q-2.6 -2 0 -6z" style="fill:#7fa6d6" opacity="${fade(p, 0.2).toFixed(2)}"/>`;
  }
  if (kind === 'notes') {
    if (!live) return `<g font-family="DM Sans, sans-serif" font-weight="700" style="fill:var(--text-muted)"><text class="rise1" x="8" y="-30" font-size="11">♪</text><text class="rise3" x="2" y="-30" font-size="12">♫</text></g>`;
    return `<g font-family="DM Sans, sans-serif" font-weight="700" style="fill:var(--text-muted)">${[[8, 11, '♪', 0], [2, 12, '♫', 1.6]].map(([x, fs, g, d]) => { const p = ph(2.4, d); return `<text x="${f1(x + p * 10)}" y="${f1(-30 - p * 26)}" font-size="${fs}" opacity="${fade(p, 0.15).toFixed(2)}">${g}</text>`; }).join('')}</g>`;
  }
  if (kind === 'cloud') {
    const drops = [[-5, 0], [2, 0.3], [8, 0.6]].map(([x, d]) => {
      if (!live) return `<line class="drop" x1="${x}" y1="13" x2="${x - 1}" y2="16"/>`;
      const p = ph(0.9, d);
      return `<line x1="${x}" y1="${f1(13 + p * 9)}" x2="${x - 1}" y2="${f1(16 + p * 9)}" opacity="${(1 - p).toFixed(2)}"/>`;
    }).join('');
    return `<g transform="translate(0 ${y + 4})"><g style="fill:#8b8f99"><circle cx="-6" cy="4" r="6"/><circle cx="2" cy="1" r="8"/><circle cx="9" cy="5" r="5"/><rect x="-10" y="4" width="22" height="6" rx="3"/></g><g style="stroke:#7fa6d6" stroke-width="1.5" stroke-linecap="round">${drops}</g></g>`;
  }
  if (kind === 'chat') {
    const w = Math.max(20, (txt || '').length * 7 + 10);
    return `<g><rect x="${-w / 2}" y="${y}" width="${w}" height="19" rx="4" style="fill:var(--surface-3)"/><path d="M-3 ${y + 19} l3 4 l3 -4z" style="fill:var(--surface-3)"/><text x="0" y="${y + 13.5}" text-anchor="middle" font-family="DM Sans, sans-serif" font-weight="700" font-size="12" style="fill:var(--text)">${txt}</text></g>`;
  }
  const [fill, glyph, hop] = BUBBLES[kind];
  return `<g class="${hop ? 'hop' : ''}"><rect x="-10" y="${y}" width="20" height="19" rx="4" style="fill:${fill}"/><path d="M-3 ${y + 19} l3 4 l3 -4z" style="fill:${fill}"/>${GLYPH[glyph](y)}</g>`;
}

function extras(kind, t) {
  if (kind === 'rod') {
    const sway = Math.sin(t * 1.3) * 2, bob = Math.sin(t * 2.4) * 0.8;
    return `<path d="M9 -16 L30 ${f1(-38 + sway)}" style="stroke:#7a5236" stroke-width="1.6" stroke-linecap="round"/><path d="M30 ${f1(-38 + sway)} Q38 ${f1(-12 + sway)} 40 ${f1(19 + bob)}" fill="none" style="stroke:rgba(235,230,220,0.7)" stroke-width="0.7"/><ellipse cx="40" cy="21" rx="${f1(4 + bob)}" ry="1.6" fill="none" style="stroke:rgba(200,230,240,0.6)" stroke-width="0.8"/><circle cx="40" cy="${f1(20 + bob)}" r="1.6" style="fill:#c94a3a"/>`;
  }
  if (kind === 'cue') { const k = Math.max(0, Math.sin(t * 2.2)) * 5; return `<path d="M${f1(-2 + k)} -13 L${f1(-30 + k)} -27" style="stroke:#c9a86a" stroke-width="1.6" stroke-linecap="round"/><path d="M${f1(-27 + k)} -25.5 L${f1(-30 + k)} -27" style="stroke:#e9e4dc" stroke-width="1.8"/>`; }
  if (kind === 'cue2') return `<path d="M9 2 L11 -38" style="stroke:#c9a86a" stroke-width="1.6" stroke-linecap="round"/><path d="M10.8 -35 L11 -38" style="stroke:#e9e4dc" stroke-width="1.8"/>`;
  if (kind === 'can') return `<g style="stroke:#7fa6d6" stroke-width="1.3" stroke-linecap="round"><line class="drop" x1="-17" y1="-12" x2="-18" y2="-9"/><line class="drop" x1="-20" y1="-11" x2="-21" y2="-8"/><line class="drop" x1="-14" y1="-11" x2="-15" y2="-8"/></g>`;
  return '';
}
