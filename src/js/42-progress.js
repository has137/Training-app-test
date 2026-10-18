/* Progress: week volume map, exercise charts, body measures, tests, history. */
var PROG = {seg: 'week', ex: null};
function chart(pts, o) {
  o = o || {};
  if (!pts.length) return '';
  var W = 340, H = o.h || 150, L = 34, R = 44, T = 14, B = 26;
  var ys = pts.map(function (p) { return p.y; }).concat((o.raw || []).map(function (p) { return p.y; }));
  var mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys);
  if (mn === mx) { mn -= 1; mx += 1; }
  var pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
  var t0 = parseD(pts[0].date).getTime(), t1 = parseD(pts[pts.length - 1].date).getTime();
  (o.raw || []).forEach(function (p) { var t = parseD(p.date).getTime(); if (t < t0) t0 = t; if (t > t1) t1 = t; });
  if (t1 === t0) { t0 -= 86400000 * 3; t1 += 86400000 * 3; }
  function X(d) { return L + (parseD(d).getTime() - t0) / (t1 - t0) * (W - L - R); }
  function Y(v) { return T + (1 - (v - mn) / (mx - mn)) * (H - T - B); }
  var h = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || '') + '">';
  for (var i = 0; i < 3; i++) { var v = mn + (mx - mn) * (i + 0.5) / 3, y = Y(v); h += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="lbl" x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + fmtN(v) + '</text>'; }
  (o.raw || []).forEach(function (p) { h += '<circle class="raw" cx="' + X(p.date).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="2.5"/>'; });
  var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.date).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join(' ');
  if (pts.length > 1) h += '<path class="area" d="' + d + ' L' + X(pts[pts.length - 1].date).toFixed(1) + ' ' + (H - B) + ' L' + X(pts[0].date).toFixed(1) + ' ' + (H - B) + ' Z"/><path class="line" d="' + d + '"/>';
  pts.forEach(function (p, i) { var last = i === pts.length - 1; h += '<circle class="dot' + (last ? ' end' : '') + '" cx="' + X(p.date).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="' + (last ? 4.5 : 3.2) + '"/>'; });
  var lp = pts[pts.length - 1];
  h += '<text class="endl" x="' + (X(lp.date) + 7).toFixed(1) + '" y="' + (Y(lp.y) + 4).toFixed(1) + '">' + fmtN(lp.y) + '</text>';
  h += '<text class="lbl" x="' + L + '" y="' + (H - 6) + '">' + shortDate(pts[0].date) + '</text><text class="lbl" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + shortDate(lp.date) + '</text>';
  return h + '</svg>';
}
Views.progress = function () {
  var h = '<div class="page">' + navbar('التقدّم') + '<h1 class="large-title">التقدّم</h1>';
  h += '<div class="seg" role="tablist" style="margin-top:12px">' + [['week', 'الأسبوع'], ['ex', 'التمارين'], ['body', 'الجسم'], ['tests', 'الاختبارات']].map(function (x) { return '<button role="tab" data-act="prog-seg" data-v="' + x[0] + '" class="' + (PROG.seg === x[0] ? 'on' : '') + '" aria-selected="' + (PROG.seg === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
  if (PROG.seg === 'week') h += progWeek();
  else if (PROG.seg === 'ex') h += progEx();
  else if (PROG.seg === 'body') h += progBody();
  else h += progTests();
  return h + '</div>';
};
Actions['prog-seg'] = function (b) { PROG.seg = b.getAttribute('data-v'); App.render(); };
function progWeek() {
  var ws = weekStart(today()), list = S.sessions.filter(function (s) { return s.date >= ws; });
  var mins = list.reduce(function (a, s) { return a + (s.end && s.start ? Math.round((s.end - s.start) / 60000) : (s.min || 0)); }, 0);
  var sets = list.reduce(function (a, s) { return a + (s.items || []).reduce(function (b, it) { return b + (it.sets || []).length; }, 0); }, 0);
  var v = Logic.volumeBetween(ws, today()), plan = Logic.plannedVolume();
  var h = '<div class="stat-row" style="margin-top:16px"><div class="stat"><span class="v">' + Logic.weekCount().length + '</span><span class="l">جلسات</span></div><div class="stat"><span class="v">' + mins + '</span><span class="l">دقيقة</span></div><div class="stat"><span class="v">' + sets + '</span><span class="l">مجموعة</span></div></div>';
  h += '<section class="section"><div class="section-h"><h2>توزيع العمل على العضلات</h2><span class="aside">من السبت</span></div><div class="card ty-strength">' + BodyMap.render({heat: Logic.heat(v)}) +
    '<div class="legend" style="margin-top:10px"><span><i class="o"></i>لم تتدرب</span><span><i style="opacity:.4"></i>بداية</span><span><i></i>وصلت الهدف</span></div></div></section>';
  h += '<section class="section"><div class="section-h"><h2>المجموعات والهدف</h2><button class="aside" data-act="term" data-k="primary">كيف تُحسب؟</button></div><div class="card ty-strength stack" style="gap:6px">';
  Object.keys(DATA.muscles).forEach(function (m) {
    var mu = DATA.muscles[m], t = mu.target, max = Math.max(t[1], v[m], plan[m]) * 1.1 || 1;
    h += '<div class="mbar"><span>' + esc(mu.n) + (mu.prio ? ' <span style="color:var(--str-tx)">V</span>' : '') + '</span><span class="bt"><i style="width:' + (100 * Math.min(v[m], max) / max).toFixed(1) + '%"></i><u style="inset-inline-start:' + (100 * t[0] / max).toFixed(1) + '%;width:' + (100 * (t[1] - t[0]) / max).toFixed(1) + '%"></u></span><b>' + fmtN(v[m]) + '<small class="muted" style="font-weight:500">/' + fmtN(plan[m]) + '</small></b></div>';
  });
  h += '<p class="muted" style="font-size:13px;margin-top:6px">الشريط: ما أنجزته هذا الأسبوع. الإطار: المدى المستهدف. الرقم الصغير: ما في خطة الأيام الأربعة. المجموعة الثانوية تُحسب نصف مجموعة.</p></div></section>';
  h += '<section class="section"><div class="section-h"><h2>السجل</h2><button class="aside" data-act="go" data-p="history">كل الجلسات</button></div><div class="list">' + (Logic.sorted().slice(0, 5).map(sessionRow).join('') || '<div class="row"><span class="row-m"><span class="row-s">لا توجد جلسات بعد.</span></span></div>') + '</div></section>';
  return h;
}
function progEx() {
  var count = {};
  S.sessions.forEach(function (s) { (s.items || []).forEach(function (it) { if (it.sets && it.sets.length) count[it.ex] = (count[it.ex] || 0) + 1; }); });
  var ids = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; });
  if (!ids.length) return '<div class="empty" style="margin-top:18px"><span class="em-ic">' + I('progress', 'lg') + '</span><b>لا يوجد تطور بعد</b><p>بعد أول جلسة، يظهر هنا تطور كل تمرين: الوزن والتكرار وتقدير القوة.</p></div>';
  if (!PROG.ex || ids.indexOf(PROG.ex) < 0) PROG.ex = ids[0];
  var e = EX[PROG.ex], ser = Logic.series(PROG.ex);
  var h = '<div class="chips scroll" style="margin-top:14px">' + ids.map(function (id) { return '<button class="chip' + (id === PROG.ex ? ' sel' : '') + '" data-act="prog-ex" data-v="' + id + '">' + esc(EX[id].n) + '</button>'; }).join('') + '</div>';
  var best = ser.reduce(function (a, p) { return p.y > a.y ? p : a; }, ser[0]), first = ser[0], last = ser[ser.length - 1];
  var diff = last.y - first.y;
  h += '<section class="section ty-' + e.t + '"><div class="card"><div style="display:flex;align-items:center;gap:12px">' + figEl(e.fig, 'thumb', e.pm) + '<div class="row-m"><b style="font-size:18px">' + esc(e.n) + '</b><span class="muted" style="font-size:14px">' + (e.m === 'kg' ? 'تقدير القوة من أفضل مجموعة (الوزن × التكرار)' : e.m === 'sec' ? 'أفضل وقت بالثواني' : 'أفضل عدد تكرارات') + '</span></div></div>' + (ser.length > 1 ? chart(ser, {label: e.n}) : '<p class="muted" style="font-size:14px;margin:10px 0">يظهر الخط بعد الجلسة الثانية لهذا التمرين.</p>') +
    '<div class="stat-row" style="margin-top:8px"><div class="stat flat" style="box-shadow:none;background:var(--surface-2)"><span class="v" style="font-size:22px">' + esc(best.lbl) + '</span><span class="l">أفضل مجموعة</span></div><div class="stat flat" style="box-shadow:none;background:var(--surface-2)"><span class="v" style="font-size:22px">' + ser.length + '</span><span class="l">جلسات</span></div><div class="stat flat" style="box-shadow:none;background:var(--surface-2)"><span class="v trend ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : 'eq') + '" style="font-size:22px">' + I(diff > 0 ? 'up' : diff < 0 ? 'down' : 'eq', 'sm') + fmtN(Math.abs(diff)) + '</span><span class="l">منذ البداية</span></div></div></div></section>';
  h += '<section class="section"><div class="list">' + ser.slice().reverse().map(function (p) { return '<div class="row"><span class="row-m"><span class="row-t" style="font-size:15px">' + fmtDate(p.date) + '</span><span class="row-s num">' + p.sets.map(function (s) { return (s.w ? fmtN(s.w) + '×' : '') + s.r; }).join(' · ') + '</span></span></div>'; }).join('') + '</div></section>';
  return h;
}
Actions['prog-ex'] = function (b) { PROG.ex = b.getAttribute('data-v'); App.render(); };
function progBody() {
  var ww = Logic.weeklyWeights(), raw = S.body.filter(function (b) { return b.w != null; }).map(function (b) { return {date: b.date, y: b.w}; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var waist = S.body.filter(function (b) { return b.waist != null; }).map(function (b) { return {date: b.date, y: b.waist}; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var pr = Logic.proteinRange(), w = +S.profile.weight || 0;
  var h = '<div class="stack" style="margin-top:16px"><button class="btn btn-primary btn-block" data-act="body-open">' + I('plus') + 'سجّل الوزن أو الخصر</button>';
  if (!raw.length && !waist.length) h += '<div class="empty"><span class="em-ic">' + I('scale', 'lg') + '</span><b>لا قياسات بعد</b><p>تزن نفسك صباحاً 3 مرات أسبوعياً أو أكثر، والتطبيق يحسب المتوسط الأسبوعي لأن الوزن اليومي يتذبذب.</p></div>';
  if (ww.length) {
    var lw = ww[ww.length - 1], pw = ww[ww.length - 2], ch = pw ? lw.y - pw.y : null, pct = pw ? ch / pw.y * 100 : null;
    h += '<div class="card ty-conditioning"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>متوسط الوزن الأسبوعي</b>' + (ch != null ? '<span class="trend ' + (ch < 0 ? 'up' : ch > 0 ? 'down' : 'eq') + '">' + I(ch < 0 ? 'down' : ch > 0 ? 'up' : 'eq', 'sm') + fmtN(Math.abs(ch)) + ' كغ (' + fmtN(Math.abs(pct)) + '%)</span>' : '') + '</div><div class="num" style="font-size:44px;font-weight:800">' + fmtN(lw.y) + '<small style="font-size:18px;color:var(--muted)"> كغ</small></div>' + chart(ww, {raw: raw, label: 'الوزن'}) +
      '<p class="muted" style="font-size:14px">الهدف: نزول 0.5 إلى 0.7% أسبوعياً، أي ' + fmtN(lw.y * 0.005) + ' إلى ' + fmtN(lw.y * 0.007) + ' كغ. النقاط الرمادية هي الأوزان اليومية.</p></div>';
  }
  if (waist.length) h += '<div class="card ty-readiness"><b>محيط الخصر</b><div class="num" style="font-size:40px;font-weight:800">' + fmtN(waist[waist.length - 1].y) + '<small style="font-size:18px;color:var(--muted)"> سم</small></div>' + chart(waist, {label: 'الخصر'}) + '</div>';
  h += '<div class="card"><b>التغذية باختصار</b><table class="tbl" style="margin-top:6px"><tbody><tr><td>البروتين</td><td class="num">' + pr[0] + '–' + pr[1] + ' غ يومياً</td></tr><tr><td>المشي</td><td class="num">7000–10000 خطوة</td></tr><tr><td>إذا ثبت المتوسط أسبوعين</td><td>أنقص 150 إلى 200 سعرة يومياً</td></tr></tbody></table><p class="muted" style="font-size:13px;margin-top:6px">مبني على وزنك ' + fmtN(w) + ' كغ. المصادر 10 و11 و12.</p></div>';
  return h + '</div>';
}
Actions['body-open'] = function () {
  var last = S.body.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0] || {}, td = S.body.filter(function (b) { return b.date === today(); })[0] || {};
  App.sheet({title: 'الوزن والخصر', body: '<div class="fields"><label class="field"><span>الوزن (كغ)</span><input class="input num" id="bd-w" inputmode="decimal" value="' + (td.w != null ? td.w : '') + '" placeholder="' + (last.w || S.profile.weight || '') + '"></label><label class="field"><span>الخصر (سم)</span><input class="input num" id="bd-x" inputmode="decimal" value="' + (td.waist != null ? td.waist : '') + '" placeholder="' + (last.waist || '') + '"></label><label class="field full"><span>التاريخ</span><input class="input" type="date" id="bd-d" value="' + today() + '"></label></div>' +
    '<p class="muted" style="font-size:14px">الوزن: صباحاً بعد الحمام وقبل الأكل. الخصر: عند السرة، بعد الزفير، والشريط أفقي.</p><button class="btn btn-primary btn-block" data-act="body-save">احفظ</button>'});
};
Actions['body-save'] = function () {
  var w = num($('#bd-w').value), x = num($('#bd-x').value), d = $('#bd-d').value || today();
  if (w == null && x == null) { App.toast('اكتب الوزن أو الخصر', {err: true}); return; }
  if (w != null && (w < 30 || w > 300)) { App.toast('الوزن يبدو غير صحيح', {err: true}); return; }
  var rec = S.body.filter(function (b) { return b.date === d; })[0];
  if (!rec) { rec = {date: d}; S.body.push(rec); }
  if (w != null) { rec.w = w; S.profile.weight = w; } if (x != null) rec.waist = x; rec.u = Date.now();
  save(); App.closeAllSheets(); App.render(); App.toast('حُفظ القياس');
};
function progTests() {
  var h = '<div class="stack" style="margin-top:16px">';
  h += Logic.testsDue() ? '<div class="banner info">' + I('target') + '<div><b>الاختبارات مستحقة هذا الأسبوع</b><p>الأسابيع 1 و5 و9 و14 من كل دورة.</p><button class="btn btn-primary" data-act="tests-open">ابدأ الاختبارات</button></div></div>' : '<button class="btn btn-tonal btn-block" data-act="tests-open">' + I('plus') + 'سجّل اختباراً الآن</button>';
  Object.keys(DATA.testGroups).forEach(function (g) {
    var tests = DATA.tests.filter(function (t) { return t.g === g; });
    h += '<section class="section" style="margin-top:12px"><div class="section-h"><h2 style="font-size:18px">' + DATA.testGroups[g] + '</h2></div><div class="list">';
    tests.forEach(function (t) {
      var l = Logic.lastTest(t.id), v = l[0] ? l[0].res[t.id] : null, pv = l[1] ? l[1].res[t.id] : null;
      var tr = '';
      if (v != null && pv != null && !t.bool) { var d = v - pv, good = t.hi === false ? d < 0 : d > 0; tr = '<span class="trend ' + (d === 0 ? 'eq' : good ? 'up' : 'down') + '">' + I(d === 0 ? 'eq' : d > 0 ? 'up' : 'down', 'sm') + fmtN(Math.abs(d)) + '</span>'; }
      h += '<div class="row"><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(t.n) + '</span><span class="row-s">' + (l[0] ? fmtDate(l[0].date, false) : 'لم يُسجّل بعد') + (t.gate && S.ankle.phase < t.gate ? ' · بعد المرحلة ' + t.gate + ' للكاحل' : '') + '</span></span>' + tr + '<b class="num" style="font-size:20px;min-width:56px;text-align:end">' + (v == null ? '—' : t.bool ? (v ? 'نعم' : 'لا') : fmtN(v)) + '</b><span class="muted" style="font-size:12px;min-width:36px">' + (t.bool ? '' : esc(t.u)) + '</span></div>';
    });
    h += '</div></section>';
  });
  return h + '</div>';
}
Actions['tests-open'] = function () {
  var body = '<p class="muted" style="font-size:15px">اترك أي اختبار فارغاً إذا لم تنفّذه. افعلها بعد إحماء خفيف وفي يوم بدون تمرين ثقيل.</p>';
  Object.keys(DATA.testGroups).forEach(function (g) {
    body += '<h4 style="font-family:var(--f-display);font-size:17px;margin-top:4px">' + DATA.testGroups[g] + '</h4>';
    DATA.tests.filter(function (t) { return t.g === g; }).forEach(function (t) {
      var gated = t.gate && S.ankle.phase < t.gate;
      body += '<div class="card flat" style="padding:12px"><div style="display:flex;gap:10px;align-items:center"><div class="row-m"><b style="font-size:15px">' + esc(t.n) + '</b><details><summary class="muted" style="font-size:13px;cursor:pointer;min-height:32px;display:flex;align-items:center">كيف؟</summary><p style="font-size:14px">' + esc(t.how) + '</p></details></div>' +
        (gated ? '<span class="tag">بعد المرحلة ' + t.gate + '</span>' : t.bool ? '<div class="seg" style="min-width:120px"><button data-act="ts-bool" data-id="' + t.id + '" data-v="1">نعم</button><button data-act="ts-bool" data-id="' + t.id + '" data-v="0">لا</button></div>' : '<input class="input num" style="width:96px;min-height:48px;text-align:center" data-test="' + t.id + '" inputmode="decimal" placeholder="' + esc(t.u) + '" aria-label="' + esc(t.n) + '">') + '</div></div>';
    });
  });
  body += '<button class="btn btn-primary btn-block" data-act="tests-save">احفظ النتائج</button>';
  App.sheet({title: 'الاختبارات الدورية', body: body});
};
var TEST_BOOL = {};
Actions['ts-bool'] = function (b) { var id = b.getAttribute('data-id'); TEST_BOOL[id] = b.getAttribute('data-v') === '1'; $$('[data-act="ts-bool"][data-id="' + id + '"]').forEach(function (x) { x.classList.toggle('on', x === b); }); };
Actions['tests-save'] = function () {
  var res = {};
  $$('[data-test]').forEach(function (i) { var v = num(i.value); if (v != null) res[i.getAttribute('data-test')] = v; });
  for (var k in TEST_BOOL) res[k] = TEST_BOOL[k];
  TEST_BOOL = {};
  if (!Object.keys(res).length) { App.toast('لم تسجّل أي نتيجة', {err: true}); return; }
  S.tests.push({id: uid(), date: today(), res: res, u: Date.now()});
  if (res.t_push != null) S.ladders.pushup = res.t_push < 5 ? 0 : res.t_push < 13 ? 1 : res.t_push < 21 ? 2 : 3;
  if (res.t_waist != null) { var rec = S.body.filter(function (b) { return b.date === today(); })[0]; if (!rec) { rec = {date: today()}; S.body.push(rec); } rec.waist = res.t_waist; rec.u = Date.now(); }
  save(); App.closeAllSheets(); PROG.seg = 'tests'; App.render(); App.toast('حُفظت ' + Object.keys(res).length + ' نتيجة');
};
Views.history = function () {
  var list = Logic.sorted(), h = '<div class="page">' + navbar('السجل') + '<h1 class="large-title">السجل</h1>';
  if (!list.length) return h + '<div class="empty" style="margin-top:20px"><span class="em-ic">' + I('calendar', 'lg') + '</span><b>السجل فارغ</b><p>كل جلسة ونشاط حر يظهر هنا.</p></div></div>';
  var month = null;
  list.forEach(function (s) {
    var m = s.date.slice(0, 7);
    if (m !== month) { if (month) h += '</div></section>'; month = m; var d = parseD(s.date); h += '<section class="section"><div class="section-h"><h2 style="font-size:18px">' + AR_MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</h2></div><div class="list">'; }
    h += sessionRow(s);
  });
  return h + '</div></section></div>';
};
Actions['session-open'] = function (b) {
  var s = S.sessions.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (!s) return;
  if (s.key === 'free') { freeEdit(s.id); return; }
  var sd = DATA.sessions[s.key], dur = s.end ? Math.round((s.end - s.start) / 60000) : 0;
  var body = '<p class="muted">' + fmtDate(s.date) + (dur ? ' · ' + dur + ' دقيقة' : '') + ' · الأسبوع ' + (s.week || '—') + (s.status === 'partial' ? ' · <span class="tag warn">ناقصة</span>' : '') + '</p>';
  body += '<div class="list">' + (s.items || []).map(function (it) { var e = EX[it.ex]; return '<div class="row ty-' + e.t + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t" style="font-size:16px">' + esc(e.n) + (it.orig && it.orig !== it.ex ? ' <span class="tag">بديل</span>' : '') + '</span><span class="row-s num">' + (it.skipped && !it.sets.length ? 'تخطيت' : it.sets.map(function (x) { return (x.w ? fmtN(x.w) + '×' : '') + x.r + (x.rir != null ? ' (' + x.rir + ')' : ''); }).join(' · ')) + '</span></span></div>'; }).join('') +
    (s.rounds || []).map(function (r) { var rp = DATA.roundPlans[r.plan]; return '<div class="row"><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(rp ? rp.n : r.plan) + '</span><span class="row-s">' + r.done + ' من ' + r.total + (r.feel ? ' · ' + {easy: 'سهلة', ok: 'مناسبة', hard: 'صعبة'}[r.feel] : '') + '</span></span></div>'; }).join('') + '</div>';
  var meta = [];
  if (s.rpe) meta.push('التقييم ' + s.rpe + '/10'); if (s.sleep) meta.push('النوم: ' + {good: 'جيد', ok: 'متوسط', bad: 'سيئ'}[s.sleep]);
  if (s.pain) Object.keys(s.pain).forEach(function (j) { meta.push('ألم ' + DATA.joints[j].n + ': ' + s.pain[j]); });
  if (meta.length) body += '<p style="font-size:15px">' + esc(meta.join(' · ')) + '</p>';
  if (s.note) body += '<p class="card flat" style="font-size:15px">' + esc(s.note) + '</p>';
  body += '<button class="btn btn-danger btn-block" data-act="session-del" data-id="' + s.id + '">احذف الجلسة</button>';
  App.sheet({title: sd ? sd.n : 'جلسة', body: body});
};
Actions['session-del'] = function (b) {
  var id = b.getAttribute('data-id');
  App.confirm({title: 'حذف هذا السجل؟', text: 'لا يمكن التراجع، والاقتراحات تُحسب بدونه.', ok: 'احذف', danger: true}).then(function (y) {
    if (!y) return;
    S.sessions = S.sessions.filter(function (s) { return s.id !== id; }); S.deleted.push(id);
    save(); App.closeAllSheets(); App.render(); App.toast('حُذف السجل');
  });
};
