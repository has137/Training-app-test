/* Core: data, helpers, icons, storage (local first, cloud sync when the Claude viewer offers it). */
var DATA = JSON.parse(document.getElementById('azm-program').textContent);
var EX = DATA.exercises;
FIG.setPoses(JSON.parse(document.getElementById('azm-figures').textContent));

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function pad(n) { return String(n).padStart(2, '0'); }
function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today() { return dstr(new Date()); }
function parseD(s) { var p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); }
function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function daysAgo(s) { return daysBetween(s, today()); }
function agoText(s) { var n = daysAgo(s); if (n <= 0) return 'اليوم'; if (n === 1) return 'أمس'; if (n === 2) return 'قبل يومين'; if (n <= 10) return 'قبل ' + n + ' أيام'; return 'قبل ' + n + ' يوماً'; }
var AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function fmtDate(s, withDay) { var d = parseD(s); return (withDay === false ? '' : AR_DAYS[d.getDay()] + ' ') + d.getDate() + ' ' + AR_MONTHS[d.getMonth()]; }
function shortDate(s) { var d = parseD(s); return d.getDate() + '/' + (d.getMonth() + 1); }
function weekStart(s) { var d = parseD(s), back = (d.getDay() + 1) % 7; d.setDate(d.getDate() - back); return dstr(d); } // weeks start on Saturday
function fmtN(n) { if (n == null || isNaN(n)) return '—'; return String(Math.round(n * 10) / 10); }
function normDigits(s) { return String(s == null ? '' : s).replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x0660; }).replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x06F0; }).replace(/[٫,]/g, '.').trim(); }
function num(s) { var t = normDigits(s); if (t === '') return null; var v = parseFloat(t); return isFinite(v) ? v : null; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + pad(sec % 60); }
function secText(sec) { if (sec < 60) return sec + ' ث'; if (sec % 60 === 0) return (sec / 60) + ' د'; return mmss(sec) + ' د'; }
function repText(r) { return r[0] === r[1] ? String(r[0]) : r[0] + '–' + r[1]; }
function plural(n, one, two, few, many) { if (n === 1) return one; if (n === 2) return two; if (n >= 3 && n <= 10) return n + ' ' + few; return n + ' ' + many; }
function typeOf(exId) { var e = EX[exId]; return e ? e.t : 'strength'; }
function ytUrl(q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }

var ICONS = {
  today: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  library: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  progress: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  joints: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M3.5 12h5l1-2 2 4.5 2-7 1.5 4.5h5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  play: '<path class="f" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>',
  pause: '<rect class="f" x="6" y="4" width="4.5" height="16" rx="1.5"/><rect class="f" x="13.5" y="4" width="4.5" height="16" rx="1.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  swap: '<path d="M17 3l4 4-4 4"/><path d="M21 7H8"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h13"/>',
  skip: '<path d="M18 5 8 12l10 7z"/><path d="M5 5v14"/>',
  reorder: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  more: '<circle class="f" cx="5" cy="12" r="1.8"/><circle class="f" cx="12" cy="12" r="1.8"/><circle class="f" cx="19" cy="12" r="1.8"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>', chevU: '<path d="m6 15 6-6 6 6"/>',
  timer: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
  strength: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
  boxing: '<path d="M8 12V7.5A4.5 4.5 0 0 1 12.5 3h1A5.5 5.5 0 0 1 19 8.5v5a4.5 4.5 0 0 1-4.5 4.5H10a2 2 0 0 1-2-2z"/><path d="M8 10.5H6.5A2.5 2.5 0 0 0 4 13a3.5 3.5 0 0 0 4 3.5"/><path d="M9.5 18v3h7.5v-3"/><path d="M12 8.5h4"/>',
  conditioning: '<path d="M6 3v5M18 3v5"/><path d="M6 8c0 8 2.5 12 6 12s6-4 6-12"/>',
  readiness: '<path d="M13 2 4 14h8l-1 8 9-12h-8z"/>',
  mobility: '<circle cx="12" cy="4.5" r="2"/><path d="M4 9.5l8 1.5 8-1.5"/><path d="M12 11v4l-4 6M12 15l4 6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  scale: '<rect x="3" y="4" width="18" height="17" rx="4"/><path d="M8.5 9a3.5 3.5 0 0 1 7 0"/><path d="M12 9l1.5-2"/>',
  tape: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>', down: '<path d="M12 5v14M5 12l7 7 7-7"/>', eq: '<path d="M5 9h14M5 15h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  share: '<path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M12 3v13M7 8l5-5 5 5"/>',
  ext: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M19 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flip: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  body: '<circle cx="12" cy="4.5" r="2.2"/><path d="M8 9h8l-1 6h-6z"/><path d="M9.5 15l-1 6M14.5 15l1 6M8 9l-3 5M16 9l3 5"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>'
};
function I(name, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }
var LOGO = '<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="28" fill="#0E1116"/><path d="M24 30 46 74" stroke="#4C86FF" stroke-width="15" stroke-linecap="round"/><path d="M72 30 50 74" stroke="#FF6A3D" stroke-width="15" stroke-linecap="round"/><circle cx="48" cy="22" r="9" fill="#3DD47A"/></svg>';

/* ---------- storage ---------- */
var LS = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var KEY = 'azm.v1';
function defaults() {
  return {v: 1, onboarded: false, u: 0,
    profile: {name: '', age: 22, sex: 'm', weight: 96, height: null, bf: null, smm: 33, days: 4, minutes: 60,
      equip: {db: true, bench: true, bar: true, band: true, bag: true, rope: true}, maxDb: 20, dbStep: 2.5, dbList: '', parq: null},
    settings: {theme: 'auto', sound: true},
    prog: {start: null, weekAdj: 0, deloadUntil: null, ret: null, lesson: null, seen: {}},
    ladders: {pullup: 1, pushup: 1}, exState: {}, slotSwap: {},
    ankle: {phase: 2, crit: {}, since: null, intake: {}},
    rope: {level: 0}, roundAdj: {},
    sessions: [], body: [], tests: [], pain: [], deleted: [],
    active: null};
}
function migrate(s) {
  var d = defaults();
  if (!s || typeof s !== 'object') return d;
  for (var k in d) if (s[k] == null) s[k] = d[k];
  ['profile', 'settings', 'prog', 'ankle', 'rope'].forEach(function (k) { for (var j in d[k]) if (s[k][j] == null && d[k][j] != null) s[k][j] = d[k][j]; });
  for (var q in d.profile.equip) if (s.profile.equip[q] == null) s.profile.equip[q] = true;
  return s;
}
var S = migrate(LS.get(KEY, null));
var saveTimer = null;
function save(now) {
  S.u = Date.now();
  clearTimeout(saveTimer);
  if (now) { LS.set(KEY, S); Cloud.queue(); return; }
  saveTimer = setTimeout(function () { LS.set(KEY, S); Cloud.queue(); }, 250);
}
window.addEventListener('pagehide', function () { LS.set(KEY, S); });
document.addEventListener('visibilitychange', function () { if (document.hidden) LS.set(KEY, S); });

/* Cloud sync inside the Claude viewer: one core document plus one document per month of sessions,
   all under the viewer's private path. Records merge by their own update time. */
var Cloud = (function () {
  var st = {status: 'off', col: null, timer: null, busy: false};
  function monthKey(sess) { return 's-' + String(sess.date || '').slice(0, 7); }
  function coreBody() {
    var o = {}; ['v', 'onboarded', 'u', 'profile', 'settings', 'prog', 'ladders', 'exState', 'slotSwap', 'ankle', 'rope', 'roundAdj', 'body', 'tests', 'pain', 'deleted'].forEach(function (k) { o[k] = S[k]; });
    return JSON.parse(JSON.stringify(o));
  }
  function mergeList(a, b, key) {
    var m = {}; (a || []).concat(b || []).forEach(function (r) { var k = r[key || 'id']; if (k == null) return; if (!m[k] || (r.u || 0) > (m[k].u || 0)) m[k] = r; });
    return Object.keys(m).map(function (k) { return m[k]; });
  }
  async function init() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    st.status = 'connecting';
    try {
      var db = await window.claude.use('db'), user = await window.claude.use('user');
      if (!db || !user) { st.status = 'off'; App.refreshCloud(); return; }
      var id = await user.id();
      if (!id) { st.status = 'off'; App.refreshCloud(); return; }
      st.col = db.collection('data/users/' + id);
      var snap = await st.col.get();
      var core = null, sess = [];
      snap.docs.forEach(function (d) { var b = d.data(); if (!b) return; if (d.id === 'core') core = b; else if (d.id.indexOf('s-') === 0) sess = sess.concat(b.list || []); });
      var changed = false;
      if (core && (core.u || 0) > (S.u || 0)) {
        var keep = {sessions: S.sessions, active: S.active};
        for (var k in core) S[k] = core[k];
        S = migrate(S); S.sessions = keep.sessions; S.active = keep.active; changed = true;
      } else if (core) {
        S.body = mergeList(S.body, core.body, 'date'); S.tests = mergeList(S.tests, core.tests); S.pain = mergeList(S.pain, core.pain);
        S.deleted = Array.from(new Set((S.deleted || []).concat(core.deleted || [])));
      }
      var before = S.sessions.length;
      S.sessions = mergeList(S.sessions, sess).filter(function (x) { return S.deleted.indexOf(x.id) < 0; });
      if (S.sessions.length !== before) changed = true;
      st.status = 'on';
      LS.set(KEY, S);
      await push();
      if (changed) App.render();
      App.refreshCloud();
    } catch (e) { st.status = 'error'; App.refreshCloud(); }
  }
  async function push() {
    if (!st.col || st.busy) return;
    st.busy = true;
    try {
      await st.col.doc('core').set(coreBody());
      var months = {};
      S.sessions.forEach(function (s) { var k = monthKey(s); (months[k] = months[k] || []).push(s); });
      for (var k in months) await st.col.doc(k).set({list: JSON.parse(JSON.stringify(months[k]))});
      st.status = 'on';
    } catch (e) { st.status = 'error'; }
    st.busy = false;
    App.refreshCloud();
  }
  function queue() { if (!st.col) return; clearTimeout(st.timer); st.timer = setTimeout(push, 1500); }
  return {init: init, queue: queue, status: function () { return st.status; }};
})();

/* ---------- sound + wake lock ---------- */
var Sound = (function () {
  var ctx = null;
  function unlock() { try { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} }
  function tone(freq, dur, when, vol) {
    if (!ctx || !S.settings.sound) return;
    try {
      var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  return {
    unlock: unlock,
    tick: function () { tone(880, 0.12); },
    go: function () { tone(660, 0.18); tone(990, 0.35, 0.18); buzz([60, 40, 60]); },
    end: function () { tone(990, 0.2); tone(740, 0.2, 0.22); tone(520, 0.45, 0.44); buzz([200, 80, 200]); },
    warn: function () { tone(1200, 0.08); tone(1200, 0.08, 0.14); }
  };
})();
var Wake = (function () {
  var lock = null, want = false;
  async function on() { want = true; try { if ('wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', function () { lock = null; }); } } catch (e) { lock = null; } }
  function off() { want = false; try { if (lock) lock.release(); } catch (e) {} lock = null; }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && want) on(); });
  return {on: on, off: off};
})();
document.addEventListener('pointerdown', function () { Sound.unlock(); }, {once: true, capture: true});
