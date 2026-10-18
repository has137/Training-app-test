/* Joints: status per joint, pain log, ankle rehabilitation phases. */
function jointStatus(j) {
  var l = S.pain.filter(function (p) { return p.joint === j && daysAgo(p.date) <= 7; }).sort(function (a, b) { return (b.u || 0) - (a.u || 0); });
  if (!l.length) return {cls: '', v: null, t: 'لا ألم مسجّل'};
  var v = l[0].v; return {cls: v <= 3 ? 'ok' : v <= 5 ? 'warn' : 'bad', v: v, t: 'آخر ألم ' + v + ' من 10 · ' + agoText(l[0].date)};
}
Views.joints = function () {
  var ph = Logic.anklePhase(), n = S.ankle.phase;
  var h = '<div class="page">' + navbar('المفاصل') + '<h1 class="large-title">المفاصل</h1><p class="subtitle">احمِ كل المفاصل، وتابع تأهيل الكاحل خطوة بخطوة.</p>';
  h += '<section class="section"><div class="card ty-mobility stack"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><span class="muted" style="font-size:14px;font-weight:700">تأهيل الكاحل</span><h2 style="font-family:var(--f-display);font-size:24px;line-height:1.25">المرحلة ' + n + ': ' + esc(ph.name) + '</h2></div>' + figEl(n >= 3 ? 'pogo' : 'balance', 'thumb lg', ['calves'], true) + '</div>';
  h += '<div class="phase-track">' + DATA.ankle.phases.map(function (p) { return '<div class="' + (p.n < n ? 'done' : p.n === n ? 'cur' : '') + '"><i></i>' + esc(p.name) + '</div>'; }).join('') + '</div>';
  h += '<p style="font-size:16px"><b>الهدف:</b> ' + esc(ph.goal) + '</p><div class="banner info">' + I('info') + '<div><p>' + esc(ph.allow) + '</p></div></div>';
  h += '<div><b style="font-size:15px">تمارين المرحلة (تظهر في إحماء جلساتك)</b><div class="list" style="margin-top:8px">' + Object.keys(ph.sets).map(function (k) { return ph.sets[k].map(function (id) { var e = EX[id]; return '<button class="row" data-act="ex-open" data-id="' + id + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t" style="font-size:16px">' + esc(e.n) + '</span><span class="row-s">' + esc(e.d || '') + '</span></span>' + I('chevR', 'chev sm') + '</button>'; }).join(''); }).join('') + '</div></div>';
  if (ph.crit.length) {
    var ok = ph.crit.filter(function (c) { return Logic.critState(c).ok; }).length;
    h += '<div><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:15px">شروط الانتقال للمرحلة ' + (n + 1) + '</b><span class="num" style="font-weight:800">' + ok + ' / ' + ph.crit.length + '</span></div><div class="crit" style="margin-top:8px">';
    ph.crit.forEach(function (c) { var s = Logic.critState(c); h += '<button class="' + (s.ok ? 'on' : '') + '" data-act="crit" data-k="' + c.k + '" aria-pressed="' + s.ok + '"><span class="cbox">' + I('check', 'sm') + '</span><span class="row-m"><span style="font-size:15px;font-weight:600">' + esc(c.t) + '</span>' + (s.hint ? '<span class="hint">' + esc(s.hint) + '</span>' : '') + '</span></button>'; });
    h += '</div></div>';
    h += ok === ph.crit.length ? '<button class="btn btn-type btn-block" data-act="ankle-next">انتقل للمرحلة ' + (n + 1) + '</button>' : '<p class="muted" style="font-size:14px">ابقَ في هذه المرحلة حتى تتحقق كل الشروط. الشروط الآلية تُحسب من تسجيلاتك.</p>';
  } else h += '<div class="banner ok">' + I('check') + '<div><p>عودة كاملة. استمر في التوازن ورفع الكعب مرتين أسبوعياً، فهذا يقلل تكرار الالتواء.</p></div></div>';
  h += '<button class="btn btn-text" data-act="ankle-pick">غيّر المرحلة يدوياً</button></div></section>';
  h += '<section class="section"><div class="section-h"><h2>حالة المفاصل</h2><button class="aside" data-act="pain-open">سجّل ألماً</button></div><div class="jgrid">';
  Object.keys(DATA.joints).forEach(function (j) { var st = jointStatus(j); h += '<button class="jc" data-act="joint-open" data-k="' + j + '"><span class="st ' + st.cls + '">' + I(st.cls === 'ok' || !st.cls ? 'check' : 'warn', 'sm') + '</span><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(DATA.joints[j].n) + '</span><span class="row-s" style="font-size:13px">' + esc(st.t) + '</span></span></button>'; });
  h += '</div></section>';
  h += '<section class="section"><div class="section-h"><h2>قاعدة الألم</h2><span class="aside">لكل مفصل</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>الحالة</th><th>الألم</th><th>ماذا تفعل</th></tr></thead><tbody>' +
    DATA.painRule.map(function (r) { return '<tr><td><span class="tag ' + (r.state === 'ok' ? 'ok' : r.state === 'warn' ? 'warn' : 'bad') + '">' + I(r.state === 'ok' ? 'check' : 'warn', 'sm') + esc(r.label) + '</span></td><td class="num" style="white-space:nowrap;font-weight:800">' + r.from + '–' + r.to + '</td><td>' + esc(r.act) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  h += '<details class="more card" style="margin-top:12px"><summary>' + I('warn', 'sm') + ' علامات تستوجب التوقف ومراجعة مختص ' + I('chevD', 'sm') + '</summary><ul class="bul" style="margin-top:8px">' + DATA.redFlags.map(function (f) { return '<li>' + I('warn', 'sm') + '<span>' + esc(f) + '</span></li>'; }).join('') + '</ul></details></section>';
  return h + '</div>';
};
Actions.crit = function (b) { var k = b.getAttribute('data-k'); S.ankle.crit[k] = !S.ankle.crit[k]; save(); App.render(); };
Actions['ankle-next'] = function () {
  if (S.ankle.phase >= 4) return;
  S.ankle.phase++; S.ankle.crit = {}; S.ankle.since = today(); save(); App.render();
  App.toast('انتقلت للمرحلة ' + S.ankle.phase + ': ' + Logic.anklePhase().name);
};
Actions['ankle-pick'] = function () {
  App.sheet({title: 'مرحلة الكاحل', body: '<div class="banner warn">' + I('warn') + '<div><p>الانتقال قبل تحقق الشروط يرفع خطر تكرار الالتواء. غيّرها يدوياً فقط إذا قيّمك مختص.</p></div></div><div class="opt">' + DATA.ankle.phases.map(function (p) { return '<button data-act="ankle-set" data-v="' + p.n + '" class="' + (S.ankle.phase === p.n ? 'on' : '') + '"><span class="dot"></span>المرحلة ' + p.n + ': ' + esc(p.name) + '</button>'; }).join('') + '</div>'});
};
Actions['ankle-set'] = function (b) { S.ankle.phase = +b.getAttribute('data-v'); S.ankle.crit = {}; S.ankle.since = today(); save(); App.closeAllSheets(); App.render(); };
var PAIN = {joint: 'ankle', v: null, ctx: 'during'};
Actions['pain-open'] = function (b) {
  if (b && b.getAttribute('data-k')) PAIN.joint = b.getAttribute('data-k');
  PAIN.v = null;
  App.sheet({title: 'سجّل ألماً', body: painForm()});
};
function painForm() {
  return '<div class="field"><span>المفصل</span><div class="chips">' + Object.keys(DATA.joints).map(function (j) { return '<button class="chip' + (PAIN.joint === j ? ' sel' : '') + '" data-act="pf-j" data-k="' + j + '">' + esc(DATA.joints[j].n) + '</button>'; }).join('') + '</div></div>' +
    '<div class="field"><span>كم الألم من 10؟</span><div class="pain" role="group">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return '<button data-act="pf-v" data-v="' + v + '" class="' + (v <= 3 ? 'p0' : v <= 5 ? 'p1' : 'p2') + (PAIN.v === v ? ' on' : '') + '">' + v + '</button>'; }).join('') + '</div>' + (PAIN.v != null ? '<small style="font-size:14px;font-weight:700">' + esc(DATA.painRule.filter(function (r) { return PAIN.v >= r.from && PAIN.v <= r.to; })[0].act) + '</small>' : '') + '</div>' +
    '<div class="field"><span>متى؟</span><div class="seg" role="group">' + [['during', 'أثناء التمرين'], ['after', 'بعده'], ['morning', 'صباحاً']].map(function (c) { return '<button data-act="pf-c" data-v="' + c[0] + '" class="' + (PAIN.ctx === c[0] ? 'on' : '') + '">' + c[1] + '</button>'; }).join('') + '</div></div>' +
    '<label class="field"><span>ملاحظة</span><input class="input" id="pf-n" placeholder="مثال: أثناء دوران القدم في الكروس"></label><button class="btn btn-primary btn-block" data-act="pf-save"' + (PAIN.v == null ? ' disabled' : '') + '>احفظ</button>';
}
function painRefresh() { var sh = App.topSheet(); if (sh) { var n = $('#pf-n') ? $('#pf-n').value : ''; $('.sheet-b', sh.el).innerHTML = painForm(); $('#pf-n').value = n; } }
Actions['pf-j'] = function (b) { PAIN.joint = b.getAttribute('data-k'); painRefresh(); };
Actions['pf-v'] = function (b) { PAIN.v = +b.getAttribute('data-v'); painRefresh(); };
Actions['pf-c'] = function (b) { PAIN.ctx = b.getAttribute('data-v'); painRefresh(); };
Actions['pf-save'] = function () {
  if (PAIN.v == null) return;
  S.pain.push({id: uid(), date: today(), joint: PAIN.joint, v: PAIN.v, ctx: PAIN.ctx, note: ($('#pf-n').value || '').trim(), u: Date.now()});
  save(); App.closeAllSheets(); App.render();
  App.toast(PAIN.v >= 6 ? 'سُجّل. أوقف التمرين المسبّب اليوم.' : PAIN.v >= 4 ? 'سُجّل. خفّف أو بدّل التمرين.' : 'سُجّل الألم', {err: PAIN.v >= 6});
};
Actions['joint-open'] = function (b) {
  var j = b.getAttribute('data-k'), jd = DATA.joints[j], logs = S.pain.filter(function (p) { return p.joint === j; }).sort(function (a, c) { return a.date < c.date ? -1 : 1; });
  var body = '<div class="banner warn">' + I('warn') + '<div><b>أكبر خطر عليه</b><p>' + esc(jd.risk) + '</p></div></div>' + (jd.rule ? '<div class="banner info">' + I('info') + '<div><p>' + esc(jd.rule) + '</p></div></div>' : '');
  body += '<div><b>تمارين الحماية</b><span class="muted" style="font-size:14px"> · ' + esc(jd.where) + '</span><div class="list" style="margin-top:8px">' + jd.protect.map(function (id) { var e = EX[id]; return '<button class="row" data-act="ex-open" data-id="' + id + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t" style="font-size:16px">' + esc(e.n) + '</span><span class="row-s">' + esc(e.s) + '</span></span></button>'; }).join('') + '</div></div>';
  if (logs.length) {
    var pts = logs.map(function (p) { return {date: p.date, y: p.v}; });
    body += '<div class="card ty-readiness"><b>سجل الألم</b>' + (pts.length > 1 ? chart(pts, {label: 'الألم'}) : '') + '<div class="list" style="box-shadow:none">' + logs.slice().reverse().slice(0, 6).map(function (p) { return '<div class="row"><span class="row-m"><span class="row-t" style="font-size:15px">' + fmtDate(p.date) + ' · ' + ({during: 'أثناء التمرين', after: 'بعده', morning: 'صباحاً', session: 'بعد جلسة', walk: 'عند المشي', now: 'عند البدء'}[p.ctx] || '') + '</span>' + (p.note ? '<span class="row-s">' + esc(p.note) + '</span>' : '') + '</span><span class="tag ' + (p.v <= 3 ? 'ok' : p.v <= 5 ? 'warn' : 'bad') + '">' + p.v + '</span></div>'; }).join('') + '</div></div>';
  }
  body += '<button class="btn btn-primary btn-block" data-act="pain-open" data-k="' + j + '">سجّل ألم ' + esc(jd.n) + '</button>';
  App.sheet({title: jd.n, body: body});
};
