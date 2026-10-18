/* Round timer: segments (ready, work, rest) timed from Date.now(), state kept in S.active.rt. */
var Rounds = (function () {
  var isOn = false, tick = null, ctx = null, mem = null;
  function build(rp) {
    var segs = [{k: 'ready', dur: 10, t: 'استعد', d: rp.intro || ''}];
    for (var i = 0; i < rp.rounds; i++) {
      if (rp.segs) rp.segs.forEach(function (sg) { var e = EX[sg.ex]; segs.push({k: 'work', dur: sg.sec, round: i, t: e.n, d: e.s, ex: sg.ex}); });
      else { var it = rp.items[i] || rp.items[i % rp.items.length]; segs.push({k: 'work', dur: rp.len, round: i, t: it.t, d: it.d, kk: it.k, bursts: rp.bursts}); }
      if (i < rp.rounds - 1 && rp.rest) segs.push({k: 'rest', dur: rp.rest, round: i, t: 'راحة', d: 'تنفّس بعمق من الأنف وامشِ ببطء. اشرب ماء إذا احتجت.'});
    }
    return segs;
  }
  function state() { return ctx.standalone ? mem : S.active && S.active.rt; }
  function persist() { if (!ctx.standalone) save(); }
  function open(step) {
    var a = S.active;
    if (!a.rt || a.rt.stepId !== step.id) a.rt = {stepId: step.id, idx: 0, t0: Date.now(), paused: true, left: 10};
    ctx = {step: step, plan: step.plan, segs: build(step.plan), standalone: false};
    show();
  }
  function openStandalone(plan, onDone) {
    mem = {idx: 0, t0: Date.now(), paused: true, left: 10};
    ctx = {plan: plan, segs: build(plan), standalone: true, onDone: onDone};
    show();
  }
  function resume() { if (S.active && S.active.rt) { var st = Workout.steps().filter(function (s) { return s.id === S.active.rt.stepId; })[0]; if (st) open(st); } }
  function show() { isOn = true; Sound.unlock(); Wake.on(); var el = $('#rt'); el.hidden = false; render(true); clearInterval(tick); tick = setInterval(loop, 200); }
  function leftOf(rt, seg) { return rt.paused ? (rt.left != null ? rt.left : seg.dur) : seg.dur - (Date.now() - rt.t0) / 1000; }
  function loop() {
    var rt = state(); if (!rt || !isOn) { clearInterval(tick); return; }
    var changed = false;
    while (!rt.paused && rt.idx < ctx.segs.length) {
      var seg = ctx.segs[rt.idx], left = leftOf(rt, seg);
      var whole = Math.ceil(left);
      if (seg.k === 'work' && whole === 10 && seg.dur > 20 && rt.warned !== rt.idx) { rt.warned = rt.idx; Sound.warn(); }
      if (seg.k !== 'work' && whole <= 3 && whole >= 1 && rt.ticked !== rt.idx + ':' + whole) { rt.ticked = rt.idx + ':' + whole; Sound.tick(); }
      if (left > 0) break;
      rt.t0 = rt.t0 + seg.dur * 1000; rt.idx++; changed = true;
      var nx = ctx.segs[rt.idx];
      if (!nx) { finish(); return; }
      if (nx.k === 'work') Sound.go(); else Sound.end();
    }
    if (changed) { persist(); render(); } else update();
  }
  function roundsDoneCount(rt) {
    var n = 0; for (var i = 0; i < Math.min(rt.idx, ctx.segs.length); i++) { var s = ctx.segs[i]; if (s.k === 'work' && (!ctx.segs[i + 1] || ctx.segs[i + 1].round !== s.round || ctx.segs[i + 1].k !== 'work')) n = s.round + 1; }
    return n;
  }
  function render(first) {
    var rt = state(), segs = ctx.segs, seg = segs[Math.min(rt.idx, segs.length - 1)], rp = ctx.plan;
    var left = Math.max(0, leftOf(rt, seg)), work = seg.k === 'work';
    var nx = segs[rt.idx + 1], nextTxt = nx ? (nx.k === 'rest' ? 'التالي: راحة ' + secText(nx.dur) : 'التالي: ' + (rp.segs ? nx.t : 'الجولة ' + (nx.round + 1) + ' · ' + nx.t)) : 'التالي: النهاية';
    var label = seg.k === 'ready' ? 'استعد' : (rp.segs ? 'الجولة ' + (seg.round + 1) + ' من ' + rp.rounds : (rp.key === 'rope' ? 'الفترة ' : 'الجولة ') + (seg.round + 1) + ' من ' + rp.rounds);
    var h = '<div class="rt-in ty-' + rp.type + '"><div class="wo-top"><button class="icon-btn" data-act="rt-close" aria-label="إغلاق المؤقت">' + I('close') + '</button><div class="row-m" style="text-align:center"><span class="row-t" style="font-size:16px">' + esc(rp.n) + '</span></div><button class="icon-btn ghost" data-act="term" data-k="round" aria-label="ما هي الجولة؟">' + I('info') + '</button></div>';
    h += '<section class="rt-stage ' + (work ? 'work' : seg.k) + '" aria-live="polite"><div class="rt-k"><span>' + esc(label) + '</span><span class="tag">' + (work ? esc(seg.kk || DATA.types[rp.type].short) : seg.k === 'rest' ? 'راحة' : 'تحضير') + '</span></div>' +
      '<div class="rt-time" id="rt-time" role="timer">' + mmss(left) + '</div><div class="rt-bar"><i id="rt-bar" style="width:' + (100 * (1 - left / seg.dur)).toFixed(1) + '%"></i></div>' +
      '<div class="rt-dots">' + Array.from({length: rp.rounds}, function (_, i) { var c = seg.round > i || (seg.round === i && seg.k === 'rest') ? 'done' : (seg.round === i && work ? 'cur' : ''); return '<i class="' + c + '"></i>'; }).join('') + '</div></section>';
    h += '<div class="rt-info">' + (seg.ex ? '<div style="display:flex;gap:12px;align-items:center">' + figEl(EX[seg.ex].fig, 'thumb lg', EX[seg.ex].pm, true) + '<h3>' + esc(seg.t) + '</h3></div>' : '<h3>' + esc(seg.t) + '</h3>') + '<p>' + esc(seg.d) + '</p><p class="rt-next">' + esc(nextTxt) + '</p></div>';
    h += '<div class="rt-ctrl"><button class="rt-side" data-act="rt-prev" aria-label="المقطع السابق">' + I('chevR') + '</button><button class="rt-play' + (rt.paused ? ' paused' : '') + '" data-act="rt-toggle" aria-label="' + (rt.paused ? 'تشغيل' : 'إيقاف مؤقت') + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="direction:ltr">' + (rt.paused ? ICONS.play : ICONS.pause) + '</svg></button><button class="rt-side" data-act="rt-next" aria-label="المقطع التالي">' + I('chevL') + '</button></div></div>';
    var el = $('#rt'); el.innerHTML = h; el.className = 'rt-wrap';
    App.mountFigs(el);
  }
  function update() {
    var rt = state(), seg = ctx.segs[rt.idx]; if (!seg) return;
    var left = Math.max(0, leftOf(rt, seg)), t = $('#rt-time'), b = $('#rt-bar');
    if (t) t.textContent = mmss(left); if (b) b.style.width = (100 * (1 - left / seg.dur)).toFixed(1) + '%';
  }
  function finish() {
    var rt = state(); var n = ctx.plan.rounds; Sound.end();
    close(true, n);
    App.toast('انتهت الجولات. أحسنت!');
  }
  function close(done, count) {
    var rt = state(); var n = count != null ? count : roundsDoneCount(rt);
    if (!done && rt && !rt.paused) { rt.left = Math.max(0, leftOf(rt, ctx.segs[Math.min(rt.idx, ctx.segs.length - 1)])); rt.paused = true; }
    isOn = false; clearInterval(tick); Wake.off();
    var el = $('#rt'); el.hidden = true; el.innerHTML = '';
    if (ctx.standalone) { if (n > 0 && ctx.onDone) ctx.onDone(n); mem = null; return; }
    if (done && S.active) S.active.rt = null;
    if (n > 0) Workout.roundsDone(ctx.step, n); else { save(); Workout.render(); }
    if (S.active) Wake.on();
  }
  Actions['rt-toggle'] = function () {
    var rt = state(), seg = ctx.segs[rt.idx];
    if (rt.paused) { rt.t0 = Date.now() - (seg.dur - (rt.left != null ? rt.left : seg.dur)) * 1000; rt.paused = false; rt.left = null; if (seg.k === 'work') Sound.go(); }
    else { rt.left = Math.max(0, leftOf(rt, seg)); rt.paused = true; }
    persist(); render();
  };
  Actions['rt-next'] = function () { var rt = state(); if (rt.idx >= ctx.segs.length - 1) { finish(); return; } rt.idx++; rt.t0 = Date.now(); if (rt.paused) rt.left = ctx.segs[rt.idx].dur; persist(); render(); };
  Actions['rt-prev'] = function () { var rt = state(); rt.idx = Math.max(0, rt.idx - (leftOf(rt, ctx.segs[rt.idx]) > ctx.segs[rt.idx].dur - 3 ? 1 : 0)); rt.t0 = Date.now(); if (rt.paused) rt.left = ctx.segs[rt.idx].dur; persist(); render(); };
  Actions['rt-close'] = function () {
    var rt = state(), n = roundsDoneCount(rt);
    if (rt.idx === 0 || ctx.standalone) { close(false); return; }
    App.confirm({title: 'إيقاف المؤقت؟', text: 'أنهيت ' + n + ' من ' + ctx.plan.rounds + '. يُحفظ ما أنهيته، ويمكنك المتابعة لاحقاً من نفس النقطة.', ok: 'أوقف واحفظ', cancel: 'تابع'}).then(function (y) { if (y) close(false, n); });
  };
  return {open: open, openStandalone: openStandalone, isOpen: function () { return isOn; }, resume: resume};
})();
