/* Figure engine: poses are solved with two-bone IK and drawn as layered capsules.
   The working muscles are tinted with the training type's colour. Two-frame poses
   loop start ↔ end; still thumbnails show the start pose as a faint ghost. */
var FIG = (function () {
  var D = Math.PI / 180, UA = 27, FA = 25, TH = 38, SH = 38, FT = 11, G = 191;
  var POSES = {};
  function setPoses(p) { POSES = p; CACHE = {}; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function lerpP(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; }
  function ik(p, t, l1, l2, s) {
    var v = sub(t, p), d = len(v), ang = Math.atan2(v[1], v[0]);
    var dd = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
    var c = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd); c = Math.max(-1, Math.min(1, c));
    var aa = ang + s * Math.acos(c);
    var j = [p[0] + Math.cos(aa) * l1, p[1] + Math.sin(aa) * l1];
    var w = sub(t, j), wl = len(w) || 1;
    return [j, [j[0] + w[0] / wl * l2, j[1] + w[1] / wl * l2]];
  }
  function solve(P) {
    var hip = P.h;
    var sh = P.s || [hip[0] + Math.cos(P.t * D) * 48, hip[1] + Math.sin(P.t * D) * 48];
    var hd = P.hd;
    if (!hd) { var v = sub(sh, hip), l = len(v) || 1; hd = [sh[0] + v[0] / l * 13, sh[1] + v[1] / l * 13]; }
    var J = {v: P.v || 's', hip: hip, sh: sh, hd: hd, shn: P.shn || sh, shf: P.shf || sh, hpn: P.hpn || hip, hpf: P.hpf || hip,
      tn: P.tn == null ? (P.v === 'f' ? 20 : 0) : P.tn, tf: P.tf == null ? (P.v === 'f' ? 160 : 0) : P.tf, ov: {}, pp: P.pp || null};
    function leg(side) {
      var root = side === 'n' ? J.hpn : J.hpf, tgt = side === 'n' ? P.an : P.af, mid = side === 'n' ? P.kn2 : P.kf2;
      var s = side === 'n' ? (P.kn == null ? -1 : P.kn) : (P.kf == null ? -1 : P.kf);
      if (!tgt) tgt = [root[0], root[1] + 76];
      if (mid) { J.ov['k' + side] = 1; return [mid, tgt]; }
      if (P.fs) { J.ov['k' + side] = 2; return [lerpP(root, tgt, 0.5), tgt]; }
      return ik(root, tgt, TH, SH, s);
    }
    function arm(side) {
      var root = side === 'n' ? J.shn : J.shf, tgt = side === 'n' ? P.wn : P.wf, mid = side === 'n' ? P.en2 : P.ef2;
      var s = side === 'n' ? (P.en == null ? 1 : P.en) : (P.ef == null ? 1 : P.ef);
      if (!tgt) tgt = [root[0], root[1] + 52];
      if (mid) { J.ov['e' + side] = 1; return [mid, tgt]; }
      return ik(root, tgt, UA, FA, s);
    }
    var a = leg('n'); J.kn = a[0]; J.an = a[1];
    a = leg('f'); J.kf = a[0]; J.af = a[1];
    a = arm('n'); J.en = a[0]; J.wn = a[1];
    a = arm('f'); J.ef = a[0]; J.wf = a[1];
    J.sg = {kn: P.kn == null ? -1 : P.kn, kf: P.kf == null ? -1 : P.kf, en: P.en == null ? 1 : P.en, ef: P.ef == null ? 1 : P.ef};
    J.db = P.db || null; J.dbm = P.dbm || 'end'; J.nofloor = !!P.nofloor;
    return J;
  }
  var PTS = ['hip', 'sh', 'hd', 'shn', 'shf', 'hpn', 'hpf', 'kn', 'an', 'kf', 'af', 'en', 'wn', 'ef', 'wf'];
  function mix(A, B, u) {
    var J = {v: A.v, ov: {}, sg: A.sg, db: A.db, dbm: A.dbm, nofloor: A.nofloor, pp: u < 0.5 ? A.pp : B.pp};
    PTS.forEach(function (k) { J[k] = lerpP(A[k], B[k], u); });
    J.tn = lerp(A.tn, B.tn, u); J.tf = lerp(A.tf, B.tf, u);
    [['kn', 'hpn', 'an', TH, SH], ['kf', 'hpf', 'af', TH, SH], ['en', 'shn', 'wn', UA, FA], ['ef', 'shf', 'wf', UA, FA]].forEach(function (L) {
      if (A.ov[L[0]] || B.ov[L[0]]) return;
      var r = ik(J[L[1]], J[L[2]], L[3], L[4], A.sg[L[0]]); J[L[0]] = r[0]; J[L[2]] = r[1];
    });
    return J;
  }
  function f1(n) { return Math.round(n * 10) / 10; }
  function ln(a, b, w, c, extra) { return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke-width="' + w + '" class="' + c + '"' + (extra || '') + '/>'; }
  function seg(a, b, w, cls, hl) {
    // halo first so overlapping limbs stay readable, then the limb, then the tint
    var o = ln(a, b, w + 3.2, 'fh') + ln(a, b, w, cls);
    if (hl) o += ln(lerpP(a, b, 0.12), lerpP(a, b, 0.88), Math.max(3, w - 3.5), hl);
    return o;
  }
  function footSeg(a, ang, cls) { var e = [a[0] + Math.cos(ang * D) * FT, a[1] + Math.sin(ang * D) * FT]; return ln(a, e, 7.5, 'fh') + ln(a, e, 5, cls); }
  function dumbbell(p, ang, mode) {
    if (mode === 'end') return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="7" class="fdb"/><circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="2.6" class="fdbi"/>';
    var c = Math.cos(ang * D), s = Math.sin(ang * D), h = 9;
    var a = [p[0] - c * h, p[1] - s * h], b = [p[0] + c * h, p[1] + s * h];
    return ln(a, b, 3.4, 'fdbh') + ln([a[0] - c * 1.5, a[1] - s * 1.5], [a[0] + c * 3, a[1] + s * 3], 11, 'fdbp') + ln([b[0] - c * 3, b[1] - s * 3], [b[0] + c * 1.5, b[1] + s * 1.5], 11, 'fdbp');
  }
  function dbs(J) {
    if (!J.db) return '';
    function one(w, e) {
      var fa = Math.atan2(w[1] - e[1], w[0] - e[0]) / D;
      var ang = J.dbm === 'perp' ? fa + 90 : (J.dbm === 'v' ? 90 : 0);
      return dumbbell(w, ang, J.dbm === 'end' ? 'end' : 'len');
    }
    if (J.db === 'c') return one(lerpP(J.wn, J.wf, 0.5), lerpP(J.en, J.ef, 0.5));
    if (J.db === 'h') return dumbbell([J.hip[0], J.hip[1] - 8], 0, 'len');
    var out = '';
    if (J.db === 'f' || J.db === 'b') out += one(J.wf, J.ef);
    if (J.db === 'n' || J.db === 'b') out += one(J.wn, J.en);
    return out;
  }
  function body(J, ghost, hl) {
    hl = hl || {};
    var g = ghost ? ' gh' : '', fr = J.v === 'f', cn = 'fn' + g, cf = (fr ? 'fn' : 'ff') + g, o = '';
    var H = ghost ? null : 'fhl', HF = ghost ? null : 'fhl fhlf';
    // far leg, far arm (side view)
    o += seg(J.hpf, J.kf, 10, cf, hl.thighF && (fr ? H : HF)) + seg(J.kf, J.af, 8, cf, hl.shinF && (fr ? H : HF)) + footSeg(J.af, J.tf, cf);
    var farArm = seg(J.shf, J.ef, 8, cf, hl.uarmF && (fr ? H : HF)) + seg(J.ef, J.wf, 7, cf, hl.farmF && (fr ? H : HF)) + '<circle cx="' + f1(J.wf[0]) + '" cy="' + f1(J.wf[1]) + '" r="4" class="' + (fr ? 'fnf' : 'fff') + g + '"/>';
    if (!fr) o += farArm;
    // torso
    if (fr) {
      var poly = [J.shn, J.shf, J.hpf, J.hpn].map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ');
      o += '<polygon points="' + poly + '" class="fh" stroke-width="12" stroke-linejoin="round"/><polygon points="' + poly + '" class="ft' + g + '" stroke-width="9" stroke-linejoin="round"/>';
      if (!ghost && (hl.torsoU || hl.torsoL)) {
        var u0 = hl.torsoL ? 0.55 : 0.12, u1 = hl.torsoU ? 0.12 : 0.55;
        if (hl.torsoU && hl.torsoL) { u0 = 0.9; u1 = 0.1; }
        var a1 = lerpP(J.shn, J.hpn, u1), a2 = lerpP(J.shf, J.hpf, u1), b2 = lerpP(J.shf, J.hpf, u0), b1 = lerpP(J.shn, J.hpn, u0);
        o += '<polygon points="' + [a1, a2, b2, b1].map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ') + '" class="fhlp" stroke-width="4" stroke-linejoin="round"/>';
      }
    } else {
      o += ln(J.hip, J.sh, 19.2, 'fh') + ln(J.hip, J.sh, 16, cn);
      if (!ghost && hl.torsoU) o += ln(lerpP(J.hip, J.sh, 0.5), lerpP(J.hip, J.sh, 0.9), 10, 'fhl');
      if (!ghost && hl.torsoL) o += ln(lerpP(J.hip, J.sh, 0.12), lerpP(J.hip, J.sh, 0.5), 10, 'fhl');
    }
    var nk = lerpP(J.sh, J.hd, 0.45);
    o += ln(J.sh, nk, 7, cn);
    if (!ghost && hl.neck) o += ln(J.sh, nk, 4, 'fhl');
    o += '<circle cx="' + f1(J.hd[0]) + '" cy="' + f1(J.hd[1]) + '" r="10" class="fnf' + g + ' fhd"/>';
    if (!ghost && hl.hip) o += '<circle cx="' + f1(J.hip[0]) + '" cy="' + f1(J.hip[1]) + '" r="6" class="fhlc"/>';
    // near leg and arm
    o += seg(J.hpn, J.kn, 10, cn, hl.thighN && H) + seg(J.kn, J.an, 8, cn, hl.shinN && H) + footSeg(J.an, J.tn, cn);
    if (fr) o += farArm;
    o += seg(J.shn, J.en, 8, cn, hl.uarmN && H) + seg(J.en, J.wn, 7, cn, hl.farmN && H) + '<circle cx="' + f1(J.wn[0]) + '" cy="' + f1(J.wn[1]) + '" r="4" class="fnf' + g + '"/>';
    if (!ghost && hl.shoulder) {
      o += '<circle cx="' + f1(J.shn[0]) + '" cy="' + f1(J.shn[1]) + '" r="5.5" class="fhlc"/>';
      if (fr) o += '<circle cx="' + f1(J.shf[0]) + '" cy="' + f1(J.shf[1]) + '" r="5.5" class="fhlc"/>';
    }
    if (!ghost) o += dbs(J);
    return o;
  }
  function anchorOf(J, to) {
    if (Array.isArray(to)) return to;
    if (to === 'c') return lerpP(J.wn, J.wf, 0.5);
    return J[to] || J.wn;
  }
  function bands(list, J) {
    var o = '';
    (list || []).forEach(function (p) {
      if (p.k === 'band') {
        var a = p.from ? anchorOf(J, p.from) : p.a, b = anchorOf(J, p.to);
        var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4];
        o += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' Q ' + f1(m[0]) + ' ' + f1(m[1]) + ' ' + f1(b[0]) + ' ' + f1(b[1]) + '" class="fband"/>';
      }
    });
    (J.pp || []).forEach(function (p) {
      if (p.k === 'ropeArc') {
        var a = J.wn, b = J.wf, y = p.top ? Math.min(J.hd[1] - 26, 20) : 194;
        o += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' C ' + f1(a[0] + 18) + ' ' + y + ' ' + f1(b[0] - 18) + ' ' + y + ' ' + f1(b[0]) + ' ' + f1(b[1]) + '" class="frope"/>';
      }
    });
    return o;
  }
  function props(list, nofloor) {
    var o = '';
    if (!nofloor) o += '<line x1="6" y1="' + (G + 1) + '" x2="214" y2="' + (G + 1) + '" class="ffl" stroke-width="2"/>';
    (list || []).forEach(function (p) {
      if (p.k === 'bench') o += '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="8" rx="3" class="fp"/>' + ln([p.x + 7, p.y + 8], [p.x + 7, G], 4, 'fpl') + ln([p.x + p.w - 7, p.y + 8], [p.x + p.w - 7, G], 4, 'fpl');
      else if (p.k === 'incl') { o += '<polygon points="' + p.pts.map(function (q) { return q.join(','); }).join(' ') + '" class="fp"/>'; if (p.back) o += '<polygon points="' + p.back.map(function (q) { return q.join(','); }).join(' ') + '" class="fp"/>'; o += ln([p.pts[0][0] + 8, p.pts[2][1]], [p.pts[0][0] + 8, G], 4, 'fpl'); }
      else if (p.k === 'leg') o += ln(p.a, p.b, 4, 'fpl');
      else if (p.k === 'bar') o += ln([p.x1, p.y], [p.x2, p.y], 5, 'fpl') + (p.low ? '' : ln([p.x1, p.y], [p.x1, 0], 3, 'fpl') + ln([p.x2, p.y], [p.x2, 0], 3, 'fpl'));
      else if (p.k === 'wall') o += '<rect x="' + p.x + '" y="0" width="8" height="' + (G + 1) + '" class="fp"/>';
      else if (p.k === 'post') o += '<rect x="' + (p.x - 3) + '" y="' + (p.y || 10) + '" width="7" height="' + (p.h || (G + 1 - (p.y || 10))) + '" rx="2" class="fp"/>';
      else if (p.k === 'step') o += '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + (G + 1 - p.y) + '" rx="3" class="fp"/>';
      else if (p.k === 'ball') o += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '" class="fball"/>';
      else if (p.k === 'bag') o += ln([p.x + p.w / 2, 0], [p.x + p.w / 2, p.y], 2, 'fpl') + '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="11" class="fbag"/>';
      else if (p.k === 'arrow') o += '<path d="' + p.d + '" class="far" marker-end="url(#fah)"/>';
    });
    return o;
  }
  var DEFS = '<defs><marker id="fah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fahd"/></marker></defs>';
  function wrap(inner, label) { return '<svg viewBox="0 0 220 200" class="fig" role="img" aria-label="' + (label || '') + '">' + DEFS + inner + '</svg>'; }
  function solved(F) { if (!F._s) F._s = F.f.map(solve); return F._s; }
  function ease(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function holdOf(F, i) { return F.hold ? (F.hold[i] == null ? 0.5 : F.hold[i]) : (F.f && F.f.length > 2 ? 0.25 : 0.7); }
  function frameAt(F, t, speed) {
    var S = solved(F), n = S.length;
    if (n === 1) return S[0];
    var move = (F.f.length > 2 ? 0.42 : 0.9) / (speed || 1), tot = 0, i;
    for (i = 0; i < n; i++) tot += holdOf(F, i) + move;
    var tt = t % tot;
    for (i = 0; i < n; i++) {
      var h = holdOf(F, i);
      if (tt < h) return S[i];
      tt -= h;
      if (tt < move) return mix(S[i], S[(i + 1) % n], ease(tt / move));
      tt -= move;
    }
    return S[0];
  }
  // footwork diagrams (top view)
  function footShape(p, ang, cls) { return '<g transform="translate(' + f1(p[0]) + ' ' + f1(p[1]) + ') rotate(' + ang + ')"><rect x="-8" y="-17" width="16" height="34" rx="8" class="' + cls + '"/><circle cx="0" cy="-12" r="3" class="fdbi"/></g>'; }
  function feetSVG(F, label, t) {
    var fr = F.feet, n = fr.length, cur;
    if (t == null) cur = fr[n - 1];
    else {
      var hold = 0.6, move = 0.55, segL = hold + move, tt = t % (segL * n), i = Math.floor(tt / segL), r = tt - i * segL, A = fr[i], B = fr[(i + 1) % n];
      var w = r < hold ? 0 : ease((r - hold) / move);
      cur = {L: [0, 1, 2].map(function (k) { return lerp(A.L[k], B.L[k], w); }), R: [0, 1, 2].map(function (k) { return lerp(A.R[k], B.R[k], w); })};
    }
    var o = '<rect x="10" y="10" width="200" height="180" rx="16" class="fgrid"/>';
    o += '<text x="110" y="28" text-anchor="middle" class="flbl">الأمام</text>';
    if (t == null) fr.slice(0, n - 1).forEach(function (f) { o += footShape([f.L[0], f.L[1]], f.L[2], 'ffoot gh') + footShape([f.R[0], f.R[1]], f.R[2], 'ffoot gh'); });
    (F.p || []).forEach(function (p) { if (p.k === 'arrow') o += '<path d="' + p.d + '" class="far" marker-end="url(#fah)"/>'; });
    o += footShape([cur.L[0], cur.L[1]], cur.L[2], 'ffoot ld') + footShape([cur.R[0], cur.R[1]], cur.R[2], 'ffoot');
    o += '<text x="' + f1(cur.L[0] - 26) + '" y="' + f1(cur.L[1] + 4) + '" text-anchor="middle" class="flbl">أمامية</text><text x="' + f1(cur.R[0] + 28) + '" y="' + f1(cur.R[1] + 4) + '" text-anchor="middle" class="flbl">خلفية</text>';
    return wrap(o, label);
  }
  // muscle → highlighted body parts
  var MSEG = {quads: ['thighN', 'thighF'], hams: ['thighN', 'thighF'], adductors: ['thighN', 'thighF'], glutes: ['hip'], calves: ['shinN', 'shinF'],
    chest: ['torsoU'], lats: ['torsoU'], midback: ['torsoU'], traps: ['neck'], neck: ['neck'], abs: ['torsoL'], obliques: ['torsoL'], lowback: ['torsoL'],
    frontdelt: ['shoulder'], sidedelt: ['shoulder'], reardelt: ['shoulder'], biceps: ['uarmN', 'uarmF'], triceps: ['uarmN', 'uarmF'], forearms: ['farmN', 'farmF']};
  function hlFor(muscles) { var o = {}; (muscles || []).forEach(function (m) { (MSEG[m] || []).forEach(function (s) { o[s] = 1; }); }); return o; }
  var CACHE = {};
  function still(key, opts) {
    opts = opts || {};
    var ck = key + '|' + (opts.muscles || []).join(',');
    if (CACHE[ck]) return CACHE[ck];
    var F = POSES[key];
    if (!F) return wrap('', opts.label);
    if (F.feet) return (CACHE[ck] = feetSVG(F, opts.label));
    var S = solved(F), hl = hlFor(opts.muscles), last = S[S.length - 1];
    var o = props(F.p, S[0].nofloor);
    for (var i = 0; i < S.length - 1; i++) o += body(S[i], true);
    o += bands(F.p, last) + body(last, false, hl);
    return (CACHE[ck] = wrap(o, opts.label));
  }
  function frameSVG(F, t, hl) {
    if (F.feet) return feetSVG(F, '', t).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    var J = frameAt(F, t);
    return DEFS + props(F.p, J.nofloor) + bands(F.p, J) + body(J, false, hl);
  }
  var running = [];
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function mount(el, key, opts) {
    opts = opts || {};
    var F = POSES[key];
    if (!F) { el.innerHTML = wrap('', opts.label); return {stop: function () {}}; }
    var many = F.feet ? F.feet.length > 1 : F.f.length > 1;
    if (reduce || !many || opts.still) { el.innerHTML = still(key, opts); return {stop: function () {}}; }
    var hl = hlFor(opts.muscles);
    el.innerHTML = wrap(frameSVG(F, 0, hl), opts.label);
    var svg = el.firstChild, t0 = null, item = {on: true, el: el, paused: false};
    running.push(item);
    function step(ts) {
      if (!item.on) return;
      if (!el.isConnected) { item.on = false; return; }
      if (t0 == null) t0 = ts;
      if (!item.paused && !document.hidden) svg.innerHTML = frameSVG(F, (ts - t0) / 1000, hl);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return {stop: function () { item.on = false; }, pause: function (p) { item.paused = p; }};
  }
  function stopAll() { running.forEach(function (r) { r.on = false; }); running = []; }
  return {setPoses: setPoses, still: still, mount: mount, stopAll: stopAll, hlFor: hlFor, has: function (k) { return !!POSES[k]; }};
})();
