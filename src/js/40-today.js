/* Today tab, session preview, free activity, onboarding. */
function sessionChips(plan, sd) {
  var sm = Logic.planSummary(plan), c = ['≈ ' + sd.est + ' د'];
  sm.rounds.forEach(function (r) { c.push(r.plan.n + ': ' + r.plan.rounds + (r.plan.key === 'rope' ? ' فترات' : ' جولات')); });
  if (sm.lifts) c.push(sm.lifts + ' تمارين مقاومة');
  if (sm.rehab) c.push('تأهيل الكاحل');
  return c;
}
function weekStrip() {
  var ws = weekStart(today()), h = '<div class="weekstrip" role="list" aria-label="هذا الأسبوع">';
  var names = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];
  for (var i = 0; i < 7; i++) {
    var d = addDays(ws, i), list = S.sessions.filter(function (s) { return s.date === d; });
    var tr = list.filter(function (s) { return s.key !== 'free' && DATA.sessions[s.key]; })[0], ty = tr ? DATA.sessions[tr.key].type : (list[0] ? (list[0].type || 'conditioning') : '');
    var cls = 'wd' + (d === today() ? ' today' : '') + (list.length ? ' done ty-' + ty : '');
    h += '<div class="' + cls + '" role="listitem" aria-label="' + AR_DAYS[parseD(d).getDay()] + (list.length ? '، تمرّنت' : '') + '"><span>' + names[i] + '</span><span class="wd-c">' + (list.length ? I('check', 'sm') : parseD(d).getDate()) + '</span><span class="wd-dots">' +
      list.slice(0, 3).map(function (s) { var t = s.key === 'free' ? (s.type || 'conditioning') : DATA.sessions[s.key].type; return '<i class="ty-' + t + '"></i>'; }).join('') + '</span></div>';
  }
  return h + '</div>';
}
function phaseLine() {
  var st = Logic.stage();
  return 'الأسبوع ' + st.week + ' · ' + st.ph.n + (st.manualDeload ? ' · تخفيف' : '');
}
Views.today = function () {
  var p = S.profile, next = Logic.nextKey(), done = Logic.doneToday(), st = Logic.stage();
  var h = '<div class="page" id="pg-today">' + navbar('اليوم', {end: '<button class="icon-btn ghost" data-act="go" data-p="settings" aria-label="الإعدادات">' + I('gear') + '</button>'});
  h += '<p class="subtitle">' + fmtDate(today()) + '</p><h1 class="large-title">' + (p.name ? 'يلّا يا ' + esc(p.name) : 'اليوم') + '</h1>';
  h += '<div class="stack" style="margin-top:14px">';
  if (S.active) {
    var a = S.active, sd = DATA.sessions[a.key];
    h += '<div class="card tint ty-' + (sd ? sd.type : 'strength') + '" style="display:flex;align-items:center;gap:12px"><div class="row-m"><span class="row-t">جلسة جارية: ' + esc(a.plan.n) + '</span><span class="row-s" style="color:inherit;opacity:.85">بدأت ' + new Date(a.startedAt).toLocaleTimeString('ar', {hour: 'numeric', minute: '2-digit', numberingSystem: 'latn'}) + '. كل ما سجّلته محفوظ.</span></div><button class="btn btn-type" data-act="wo-open">تابع</button></div>';
  }
  var ret = Logic.retMode();
  if (ret && !S.active) h += '<div class="banner info">' + I('calendar') + '<div><b>أهلاً بعودتك</b><p>' + esc(ret.t) + '</p></div></div>';
  var signs = Logic.deloadSigns();
  if (signs.length >= 2 && !st.deload) h += '<div class="banner warn">' + I('warn') + '<div><b>جسمك يحتاج أسبوع تخفيف</b><p>ظهرت علامتان أو أكثر: ' + signs.map(function (k) { return DATA.deloadSigns.filter(function (x) { return x.k === k; })[0].t; }).join('، ') + '.</p><button class="btn btn-primary" data-act="deload-on">خفّف هذا الأسبوع</button></div></div>';
  if (st.deload) h += '<div class="banner ok">' + I('sparkle') + '<div><b>أسبوع تخفيف</b><p>نصف المجموعات تقريباً وجهد أخف. هذا جزء من التقدّم، وليس تراجعاً.</p></div></div>';
  if (Logic.testsDue()) h += '<div class="banner info">' + I('target') + '<div><b>اختبارات هذا الأسبوع</b><p>دقائق قليلة تقيس قوتك ولياقتك ومرونتك، وتظهر في صفحة التقدّم.</p><button class="btn btn-primary" data-act="tests-open">ابدأ الاختبارات</button></div></div>';
  if (Logic.ankleReady() && S.ankle.phase < 4) h += '<div class="banner ok">' + I('check') + '<div><b>الكاحل جاهز للمرحلة ' + (S.ankle.phase + 1) + '</b><p>حققت كل شروط المرحلة الحالية.</p><button class="btn btn-primary" data-act="tab" data-v="joints">راجع وانتقل</button></div></div>';
  h += hero(done.length ? null : next, done);
  h += '<div class="quick"><button class="qbtn ty-conditioning" data-act="free-open">' + I('plus') + 'نشاط حر</button><button class="qbtn ty-mobility" data-act="go" data-p="preview" data-a=\'{"k":"mob"}\'>' + I('mobility') + 'حركة 10 د</button><button class="qbtn ty-strength" data-act="body-open">' + I('scale') + 'وزنك وخصرك</button></div>';
  h += '</div>';
  var wc = Logic.weekCount().length, target = p.days >= 5 ? 5 : 4;
  h += '<section class="section"><div class="section-h"><h2>هذا الأسبوع</h2><span class="aside"><b class="num" style="font-size:18px;color:var(--ink)">' + wc + '</b> من ' + target + ' جلسات</span></div><div class="card">' + weekStrip() + '</div></section>';
  h += '<section class="section"><div class="section-h"><h2>اختر جلسة أخرى</h2><span class="aside">التطبيق يقترح ولا يُجبر</span></div><div class="list">';
  ['s1', 's2', 's3', 's4', 's5', 'mob'].forEach(function (k) {
    var sd = DATA.sessions[k], last = Logic.lastOf(k);
    var sub = (sd.optional ? 'اختيارية · ' : '') + (last ? 'آخر مرة: ' + agoText(last.date) : 'لم تبدأها بعد') + ' · ≈ ' + sd.est + ' د';
    h += '<button class="row ty-' + sd.type + '" data-act="go" data-p="preview" data-a=\'{"k":"' + k + '"}\'><span class="badge">' + (k === 'mob' ? I('mobility') : sd.order) + '</span><span class="row-m"><span class="row-t">' + esc(sd.n) + '</span><span class="row-s">' + sub + '</span></span>' + (k === next && !done.length ? '<span class="tag t">مقترحة</span>' : '') + I('chevR', 'chev sm') + '</button>';
  });
  h += '</div></section>';
  var recent = Logic.sorted().slice(0, 3);
  if (recent.length) {
    h += '<section class="section"><div class="section-h"><h2>آخر النشاطات</h2><button class="aside" data-act="go" data-p="history">الكل</button></div><div class="list">';
    recent.forEach(function (s) { h += sessionRow(s); });
    h += '</div></section>';
  } else {
    h += '<section class="section"><div class="empty"><span class="em-ic">' + I('progress', 'lg') + '</span><b>لا توجد جلسات بعد</b><p>سجلّك يبدأ مع أول تمرين. ابدأ بالجلسة المقترحة، وتأخذ تقريباً ' + DATA.sessions[next].est + ' دقيقة.</p></div></section>';
  }
  h += '<p class="muted" style="font-size:13px;text-align:center;margin-top:24px">' + phaseLine() + ' · التطبيق ليس بديلاً عن الطبيب</p>';
  return h + '</div>';
};
function sessionRow(s) {
  var sd = DATA.sessions[s.key], kind = s.key === 'free' ? (DATA.freeKinds.filter(function (k) { return k.k === s.kind; })[0] || DATA.freeKinds[5]) : null;
  var ty = sd ? sd.type : (kind ? kind.type : 'conditioning'), name = sd ? sd.n : (kind ? kind.n : 'نشاط');
  var dur = s.end && s.start ? Math.round((s.end - s.start) / 60000) : (s.min || 0);
  var sets = (s.items || []).reduce(function (a, it) { return a + ((it.sets || []).length); }, 0);
  var sub = fmtDate(s.date) + (dur ? ' · ' + dur + ' د' : '') + (sets ? ' · ' + sets + ' مجموعة' : '') + (s.rounds && s.key === 'free' && s.roundsN ? ' · ' + s.roundsN + ' جولات' : '');
  return '<button class="row ty-' + ty + '" data-act="session-open" data-id="' + s.id + '"><span class="mini-dot" style="width:40px;height:40px">' + I(sd ? (sd.type === 'mobility' ? 'mobility' : sd.type) : ty) + '</span><span class="row-m"><span class="row-t">' + esc(name) + '</span><span class="row-s">' + sub + '</span></span>' + (s.status === 'partial' ? '<span class="tag warn">ناقصة</span>' : '') + I('chevR', 'chev sm') + '</button>';
}
function hero(key, done) {
  if (!key) {
    var last = done[0], sd0 = DATA.sessions[last.key], nk = Logic.nextKey(), nsd = DATA.sessions[nk];
    return '<section class="hero ty-mobility" aria-label="أنهيت جلسة اليوم"><div class="hero-top"><span class="hero-k">' + I('check', 'sm') + 'أنهيت جلسة اليوم</span><span class="hero-w">' + phaseLine() + '</span></div>' +
      '<div class="hero-main"><div class="row-m"><span style="font-weight:700;opacity:.85">' + esc(sd0.n) + '</span><h2 class="hero-title">الآن راحة وتعافٍ</h2></div>' + figEl('s_child', 'hero-fig') + '</div>' +
      '<p style="font-size:15px">المقترح: مشي خفيف، أو 10 دقائق حركة. الجلسة التالية: ' + esc(nsd.n) + '.</p>' +
      '<div class="hero-actions"><button class="btn btn-type btn-xl" data-act="go" data-p="preview" data-a=\'{"k":"mob"}\'>' + I('mobility') + 'حركة 10 د</button><button class="btn btn-outline" data-act="go" data-p="preview" data-a=\'{"k":"' + nk + '"}\'>التالية</button></div></section>';
  }
  var sd = DATA.sessions[key], plan = Logic.buildPlan(key), chips = sessionChips(plan, sd);
  var figKey = plan.steps.filter(function (s) { return s.kind === 'rounds'; }).map(function (s) { return s.plan.fig; })[0] || (plan.steps.filter(function (s) { return s.kind === 'lift'; })[0] || {}).ex && EX[plan.steps.filter(function (s) { return s.kind === 'lift'; })[0].ex].fig;
  return '<section class="hero ty-' + sd.type + '" aria-label="جلسة اليوم المقترحة"><div class="hero-top"><span class="hero-k">' + I(sd.type === 'mobility' ? 'mobility' : sd.type, 'sm') + 'مقترح اليوم</span><span class="hero-w">' + phaseLine() + '</span></div>' +
    '<div class="hero-main"><span class="hero-n">' + sd.order + '</span><div class="row-m"><span style="font-weight:700;opacity:.85">الجلسة ' + sd.order + ' من ' + Logic.rotation().length + '</span><h2 class="hero-title">' + esc(sd.n) + '</h2></div>' + figEl(figKey || 'shadow', 'hero-fig', null, true) + '</div>' +
    '<div class="chips">' + chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div>' +
    '<div class="hero-actions"><button class="btn btn-type btn-xl" data-act="wo-start" data-k="' + key + '">' + '<svg class="ic ic-play" viewBox="0 0 24 24" aria-hidden="true">' + ICONS.play + '</svg>ابدأ</button><button class="btn btn-outline" data-act="go" data-p="preview" data-a=\'{"k":"' + key + '"}\' aria-label="معاينة الجلسة">معاينة</button></div></section>';
}
Views.preview = function (a) {
  var key = a.k, sd = DATA.sessions[key], plan = Logic.buildPlan(key);
  var h = '<div class="page ty-' + sd.type + '">' + navbar(sd.n);
  h += '<p class="subtitle">' + (sd.optional ? 'جلسة اختيارية · ' : '') + phaseLine() + '</p><h1 class="large-title">' + esc(sd.n) + '</h1>';
  h += '<p style="margin-top:8px;font-size:16px;color:var(--ink-2)">' + esc(sd.focus) + '</p>';
  h += '<div class="chips" style="margin-top:12px">' + sessionChips(plan, sd).map(function (c) { return '<span class="chip t">' + esc(c) + '</span>'; }).join('') + '</div>';
  if (plan.retText) h += '<div class="banner info" style="margin-top:12px">' + I('calendar') + '<div><p>' + esc(plan.retText) + '</p></div></div>';
  if (plan.deload) h += '<div class="banner ok" style="margin-top:12px">' + I('sparkle') + '<div><p>أسبوع تخفيف: المجموعات أقل والجهد أخف.</p></div></div>';
  var block = null;
  plan.steps.forEach(function (s, i) {
    var title = s.kind === 'lift' ? 'المقاومة' : s.n;
    if (s.kind !== 'lift' || block !== 'lift') {
      if (block) h += '</div></section>';
      h += '<section class="section"><div class="section-h"><h2>' + esc(title) + '</h2><span class="aside">' + (s.min ? s.min + ' د' : s.kind === 'rounds' ? s.plan.rounds + ' × ' + secText(s.plan.len) : '') + '</span></div><div class="list">';
      block = s.kind;
    }
    if (s.kind === 'warm' || s.kind === 'stretch') s.items.forEach(function (it) { var e = EX[it.ex]; h += '<button class="row" data-act="ex-open" data-id="' + it.ex + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t">' + esc(e.n) + (it.rehab ? '<span class="phase-tag">الكاحل ' + S.ankle.phase + '</span>' : '') + '</span><span class="row-s">' + esc(e.d || '') + '</span></span>' + I('chevR', 'chev sm') + '</button>'; });
    else if (s.kind === 'rounds') { var rp = s.plan; h += '<div class="row ty-' + rp.type + '">' + figEl(rp.fig, 'thumb') + '<span class="row-m"><span class="row-t">' + esc(rp.n) + '</span><span class="row-s">' + rp.rounds + ' × ' + secText(rp.len) + '، راحة ' + secText(rp.rest) + (rp.gated ? ' · بديل الحبل حتى المرحلة 3 للكاحل' : '') + '</span></span></div>'; }
    else { var e2 = EX[s.ex], sg = s.sug; h += '<button class="row ty-' + e2.t + '" data-act="ex-open" data-id="' + s.ex + '">' + figEl(e2.fig, 'thumb', e2.pm) + '<span class="row-m"><span class="row-t">' + (s.pair ? '<span class="tag" style="height:22px;margin-inline-end:6px">' + s.pair + '</span>' : '') + esc(e2.n) + '</span><span class="row-s">' + s.sets + ' × ' + repText(s.reps) + (s.unit === 'sec' ? ' ث' : '') + (e2.uni ? ' لكل جهة' : '') + (sg && sg.w ? ' · اليوم ' + fmtN(sg.w) + ' كغ' : '') + (s.optional ? ' · اختياري' : '') + '</span></span>' + I('chevR', 'chev sm') + '</button>'; }
  });
  if (block) h += '</div></section>';
  h += '<div style="position:sticky;bottom:calc(var(--tabbar-h) + 14px + env(safe-area-inset-bottom,0px));margin-top:22px;z-index:5"><button class="btn btn-type btn-xl btn-block" data-act="wo-start" data-k="' + key + '"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICONS.play + '</svg>ابدأ الجلسة</button></div>';
  return h + '</div>';
};

/* ---------- free activity: two taps ---------- */
var FREE_DEF = {rope: 10, shadow: 3, bag: 3, walk: 30, mobility: 10, other: 20};
Actions['free-open'] = function () {
  App.sheet({title: 'سجّل نشاطاً حراً', body: '<p class="muted" style="font-size:15px">اضغط على النشاط فيُسجَّل فوراً بمدة افتراضية، ويمكنك تعديلها بعدها.</p><div class="quick" style="grid-template-columns:repeat(3,1fr)">' +
    DATA.freeKinds.map(function (k) { return '<button class="qbtn ty-' + k.type + '" data-act="free-add" data-k="' + k.k + '">' + figEl(k.fig, 'thumb') + esc(k.n) + '</button>'; }).join('') + '</div>'});
};
Actions['free-add'] = function (b) {
  var k = b.getAttribute('data-k'), kind = DATA.freeKinds.filter(function (x) { return x.k === k; })[0], v = FREE_DEF[k];
  var rec = {id: uid(), key: 'free', kind: k, type: kind.type, date: today(), start: Date.now(), status: 'done', u: Date.now()};
  if (kind.unit === 'rounds') { rec.roundsN = v; rec.min = v * 3; } else rec.min = v;
  S.sessions.push(rec); save();
  App.closeAllSheets(); App.render();
  var warn = k === 'rope' && S.ankle.phase < 3 ? ' · انتبه: الحبل قبل المرحلة 3 للكاحل' : '';
  App.toast('سُجّل: ' + kind.n + ' ' + (kind.unit === 'rounds' ? v + ' جولات' : v + ' د') + warn, {action: {label: 'تعديل', fn: function () { freeEdit(rec.id); }}, ms: 5000, err: !!warn});
};
function freeEdit(id) {
  var rec = S.sessions.filter(function (s) { return s.id === id; })[0]; if (!rec) return;
  var kind = DATA.freeKinds.filter(function (x) { return x.k === rec.kind; })[0], isR = kind.unit === 'rounds';
  var sh = App.sheet({title: 'تعديل: ' + kind.n, body:
    '<div class="field"><span>' + (isR ? 'عدد الجولات' : 'المدة بالدقائق') + '</span><div class="stepper"><button data-act="fe-step" data-d="-1" aria-label="أقل">' + I('minus') + '</button><span class="sv"><input id="fe-v" inputmode="numeric" value="' + (isR ? rec.roundsN : rec.min) + '" aria-label="القيمة"><span>' + (isR ? 'جولة' : 'دقيقة') + '</span></span><button data-act="fe-step" data-d="1" aria-label="أكثر">' + I('plus') + '</button></div></div>' +
    '<label class="field"><span>التاريخ</span><input class="input" type="date" id="fe-d" value="' + rec.date + '"></label>' +
    '<label class="field"><span>ملاحظة</span><input class="input" id="fe-n" value="' + esc(rec.note || '') + '" placeholder="اختياري"></label>' +
    '<button class="btn btn-primary btn-block" data-act="fe-save" data-id="' + id + '">احفظ</button><button class="btn btn-danger btn-block" data-act="session-del" data-id="' + id + '">احذف النشاط</button>'});
}
Actions['fe-step'] = function (b) { var i = $('#fe-v'); i.value = Math.max(1, (num(i.value) || 0) + (+b.getAttribute('data-d')) * (num(i.value) >= 10 ? 5 : 1)); };
Actions['fe-save'] = function (b) {
  var rec = S.sessions.filter(function (s) { return s.id === b.getAttribute('data-id'); })[0]; if (!rec) return;
  var kind = DATA.freeKinds.filter(function (x) { return x.k === rec.kind; })[0], v = Math.max(1, num($('#fe-v').value) || 1);
  if (kind.unit === 'rounds') { rec.roundsN = v; rec.min = v * 3; } else rec.min = v;
  rec.date = $('#fe-d').value || rec.date; rec.note = $('#fe-n').value.trim(); rec.u = Date.now();
  save(); App.closeAllSheets(); App.render(); App.toast('حُفظ التعديل');
};
Actions['deload-on'] = function () { S.prog.deloadUntil = addDays(today(), 6); save(); App.render(); App.toast('أسبوع تخفيف حتى ' + fmtDate(S.prog.deloadUntil, false)); };

/* ---------- onboarding ---------- */
var OB = {step: 0, d: null};
function obData() {
  if (!OB.d) OB.d = {name: S.profile.name, age: S.profile.age, sex: S.profile.sex, weight: S.profile.weight, height: S.profile.height, bf: S.profile.bf, smm: S.profile.smm,
    equip: Object.assign({}, S.profile.equip), maxDb: S.profile.maxDb, dbStep: S.profile.dbStep, dbList: S.profile.dbList, days: S.profile.days, minutes: S.profile.minutes,
    pull: null, push: null, ankle: {}, joints: {}, parq: DATA.parq.map(function () { return null; }), ack: false};
  return OB.d;
}
var OB_STEPS = 7;
Views.onboarding = function () {
  var d = obData(), s = OB.step, h = '<div class="ob" dir="rtl">';
  h += '<div class="ob-top">' + (s > 0 ? '<button class="icon-btn" data-act="ob-back" aria-label="السابق">' + I('chevR') + '</button>' : '<span style="width:48px"></span>') + '<div class="ob-dots" aria-label="الخطوة ' + (s + 1) + ' من ' + OB_STEPS + '">' + Array.from({length: OB_STEPS}, function (_, i) { return '<i class="' + (i <= s ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
  h += '<div class="ob-body">';
  if (s === 0) {
    h += '<div class="logo">' + LOGO + '<div><b>' + DATA.meta.app + '</b><span>' + DATA.meta.tagline + '</span></div></div>';
    h += '<h1>برنامج تدريب منزلي مبني على البحث، يقترح عليك ولا يُجبرك.</h1><p class="lead">كل نوع تدريب له لون ودور واضح:</p><div class="typerow">';
    Object.keys(DATA.types).forEach(function (k) { var t = DATA.types[k]; h += '<div class="row ty-' + k + '">' + I(k) + '<span class="row-m"><span class="row-t">' + esc(t.n) + '</span><span class="row-s" style="color:inherit;opacity:.8">' + esc(t.role) + '</span></span></div>'; });
    h += '</div><p class="muted" style="font-size:15px">نسألك أسئلة قصيرة (دقيقتان تقريباً) حتى يناسبك البرنامج.</p>';
  } else if (s === 1) {
    h += '<h1>عنك</h1><p class="lead">هذه الأرقام تضبط الأوزان المقترحة والبروتين. الطول والدهون اختيارية.</p><div class="fields">' +
      fld('name', 'اسمك', d.name, 'text', 'full') + fld('age', 'العمر', d.age, 'numeric') + '<div class="field"><span>الجنس</span><div class="seg" role="group"><button data-act="ob-set" data-k="sex" data-v="m" class="' + (d.sex === 'm' ? 'on' : '') + '">ذكر</button><button data-act="ob-set" data-k="sex" data-v="f" class="' + (d.sex === 'f' ? 'on' : '') + '">أنثى</button></div></div>' +
      fld('weight', 'الوزن (كغ)', d.weight, 'decimal') + fld('height', 'الطول (سم)', d.height, 'numeric') + fld('bf', 'نسبة الدهون %', d.bf, 'decimal') + fld('smm', 'كتلة العضلات (كغ)', d.smm, 'decimal') + '</div>';
  } else if (s === 2) {
    h += '<h1>أدواتك</h1><p class="lead">التطبيق يبدّل أي تمرين يحتاج أداة غير موجودة.</p><div class="list">';
    Object.keys(DATA.equipment).forEach(function (k) { h += '<button class="toggle" data-act="ob-eq" data-k="' + k + '" aria-pressed="' + (d.equip[k] !== false) + '"><span class="row-m"><span class="row-t">' + esc(DATA.equipment[k].n) + '</span></span><span class="sw"></span></button>'; });
    h += '</div><div class="fields"><div class="field full"><span>أثقل دمبل واحد لديك (كغ)</span>' + stepper('maxDb', d.maxDb, 'كغ', 1) + '</div>' +
      '<div class="field full"><span>أصغر زيادة ممكنة في الوزن</span><div class="seg" role="group">' + [1, 2, 2.5].map(function (v) { return '<button data-act="ob-set" data-k="dbStep" data-v="' + v + '" class="' + (+d.dbStep === v ? 'on' : '') + '">' + v + ' كغ</button>'; }).join('') + '</div></div>' +
      '<label class="field full"><span>إذا كانت أوزانك ثابتة، اكتبها (اختياري)</span><input class="input" data-in="ob-in" data-k="dbList" value="' + esc(d.dbList || '') + '" placeholder="مثال: 5, 7.5, 10, 12.5, 15, 20" inputmode="decimal"><small>التطبيق يقترح الوزن التالي من هذه القائمة فقط.</small></label></div>';
  } else if (s === 3) {
    h += '<h1>وقتك ومستواك</h1><div class="field"><span>كم يوماً تتمرن أسبوعياً؟</span><div class="seg" role="group"><button data-act="ob-set" data-k="days" data-v="4" class="' + (d.days == 4 ? 'on' : '') + '">4 أيام</button><button data-act="ob-set" data-k="days" data-v="5" class="' + (d.days == 5 ? 'on' : '') + '">5 أيام</button></div><small>اليوم الخامس اختياري: ملاكمة ولياقة وحركة.</small></div>' +
      '<div class="field"><span>كم عقلة كاملة تستطيع الآن؟</span>' + opts('pull', [['0', 'ولا واحدة'], ['1', '1–2'], ['3', '3–5'], ['6', '6–8'], ['9', '9 أو أكثر']], d.pull) + '</div>' +
      '<div class="field"><span>كم ضغطة كاملة تستطيع الآن؟</span>' + opts('push', [['0', 'أقل من 5'], ['5', '5–12'], ['13', '13–20'], ['21', 'أكثر من 20']], d.push) + '</div>';
  } else if (s === 4) {
    h += '<h1>الإصابات</h1><p class="lead">إصابة الكاحل تحدد مرحلة البداية في التأهيل، ومتى تعود للحبل والقفز.</p>';
    DATA.ankle.intake.forEach(function (q) { h += '<div class="field"><span>' + esc(q.q) + '</span>' + opts('ankle.' + q.k, q.opts.map(function (o) { return [String(o.v), o.t]; }), d.ankle[q.k] != null ? String(d.ankle[q.k]) : null) + '</div>'; });
    h += '<div class="field"><span>هل يؤلمك مفصل آخر الآن؟</span><div class="chips">' + Object.keys(DATA.joints).filter(function (j) { return j !== 'ankle'; }).map(function (j) { return '<button class="chip' + (d.joints[j] ? ' sel' : '') + '" data-act="ob-joint" data-k="' + j + '">' + esc(DATA.joints[j].n) + '</button>'; }).join('') + '</div><small>سيظهر في تبويب المفاصل لتتابعه.</small></div>';
    if (d.ankle.when && d.ankle.pain != null && d.ankle.hop) { var ph = Logic.phaseFromIntake(d.ankle); h += '<div class="banner info">' + I('info') + '<div><b>تبدأ من المرحلة ' + ph + ': ' + DATA.ankle.phases[ph - 1].name + '</b><p>' + esc(DATA.ankle.phases[ph - 1].allow) + '</p></div></div>'; }
    if (d.ankle.seen === 'no' || d.ankle.pain >= 4) h += '<div class="banner warn">' + I('warn') + '<div><p>إذا لم يُفحص الكاحل من قبل، أو كان الألم 4 أو أكثر، افحصه عند أخصائي علاج طبيعي.</p></div></div>';
  } else if (s === 5) {
    h += '<h1>الجاهزية الصحية</h1><p class="lead">أسئلة PAR-Q+ المختصرة. أجب بصدق، الإجابات تبقى على جهازك.</p><div class="stack">';
    DATA.parq.forEach(function (q, i) { h += '<div class="yn"><p>' + esc(q) + '</p><div class="seg" role="group" aria-label="السؤال ' + (i + 1) + '"><button data-act="ob-parq" data-i="' + i + '" data-v="1" class="' + (d.parq[i] === true ? 'on' : '') + '">نعم</button><button data-act="ob-parq" data-i="' + i + '" data-v="0" class="' + (d.parq[i] === false ? 'on' : '') + '">لا</button></div></div>'; });
    h += '</div>';
    if (d.parq.some(function (x) { return x === true; })) h += '<div class="banner warn">' + I('warn') + '<div><b>استشر طبيباً قبل أن تبدأ</b><p>أجبت «نعم» عن سؤال أو أكثر. الإرشادات تنصح بمراجعة طبيب أو مختص في التمارين قبل زيادة نشاطك.</p></div></div>';
    else if (d.parq.every(function (x) { return x === false; })) h += '<div class="banner ok">' + I('check') + '<div><p>لا موانع ظاهرة. ابدأ تدريجياً كما يقترح البرنامج.</p></div></div>';
  } else {
    h += '<h1>قبل أن تبدأ</h1><div class="banner warn">' + I('warn') + '<div><b>التطبيق ليس بديلاً عن الطبيب</b><p>هذا برنامج تمارين عام. إذا شعرت بألم في الصدر أو دوخة أو ضيق نفس، أو ألم حاد في مفصل، توقف واطلب مساعدة طبية.</p></div></div>';
    h += '<div class="card"><h3 style="font-family:var(--f-display);font-size:18px;margin-bottom:8px">أسبوعك المقترح</h3><table class="tbl"><tbody>' + DATA.week.map(function (w) { var sd = w.s ? DATA.sessions[w.s] : null; return '<tr><td style="width:84px;font-weight:700">' + w.label + '</td><td>' + (sd ? '<span class="tdot ty-' + sd.type + '" style="display:inline-block;margin-inline-end:6px"></span>' + esc(sd.n) + (w.optional ? ' (اختيارية)' : '') : 'راحة') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<button class="toggle card flat" data-act="ob-ack" aria-pressed="' + d.ack + '"><span class="row-m"><span class="row-t" style="font-size:16px">قرأت التنبيه وأتحمّل مسؤولية التمرين</span></span><span class="sw"></span></button>';
  }
  h += '</div><div class="ob-foot"><button class="btn btn-primary btn-xl" data-act="ob-next"' + (obCanNext() ? '' : ' disabled') + '>' + (s === 0 ? 'ابدأ' : s === OB_STEPS - 1 ? 'ابدأ برنامجي' : 'التالي') + '</button></div></div>';
  return h;
};
function fld(k, label, v, mode, cls) { return '<label class="field ' + (cls || '') + '"><span>' + label + '</span><input class="input" data-in="ob-in" data-k="' + k + '" value="' + esc(v == null ? '' : v) + '" ' + (mode === 'text' ? 'autocomplete="given-name"' : 'inputmode="' + mode + '"') + '></label>'; }
function stepper(k, v, unit, step) { return '<div class="stepper"><button data-act="ob-step" data-k="' + k + '" data-d="-' + step + '" aria-label="أقل">' + I('minus') + '</button><span class="sv"><input data-in="ob-in" data-k="' + k + '" inputmode="decimal" value="' + v + '" aria-label="' + unit + '"><span>' + unit + '</span></span><button data-act="ob-step" data-k="' + k + '" data-d="' + step + '" aria-label="أكثر">' + I('plus') + '</button></div>'; }
function opts(k, list, sel) { return '<div class="opt">' + list.map(function (o) { return '<button data-act="ob-opt" data-k="' + k + '" data-v="' + o[0] + '" class="' + (sel === o[0] ? 'on' : '') + '"><span class="dot"></span>' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
function obCanNext() {
  var d = obData(), s = OB.step;
  if (s === 1) return num(d.weight) > 30 && num(d.age) > 12;
  if (s === 3) return d.pull != null && d.push != null;
  if (s === 4) return d.ankle.when && d.ankle.pain != null && d.ankle.hop && d.ankle.seen;
  if (s === 5) return d.parq.every(function (x) { return x != null; });
  if (s === 6) return d.ack;
  return true;
}
function obRefresh() { var y = window.scrollY; App.render(); window.scrollTo(0, y); }
Actions['ob-in'] = function (el) { var d = obData(), k = el.getAttribute('data-k'); d[k] = k === 'name' || k === 'dbList' ? el.value : num(el.value); var btn = $('[data-act="ob-next"]'); if (btn) btn.disabled = !obCanNext(); };
Actions['ob-set'] = function (b) { var d = obData(), k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); d[k] = k === 'sex' ? v : num(v); obRefresh(); };
Actions['ob-step'] = function (b) { var d = obData(), k = b.getAttribute('data-k'); d[k] = Math.max(1, (num(d[k]) || 0) + num(b.getAttribute('data-d'))); obRefresh(); };
Actions['ob-eq'] = function (b) { var d = obData(), k = b.getAttribute('data-k'); d.equip[k] = d.equip[k] === false; obRefresh(); };
Actions['ob-opt'] = function (b) {
  var d = obData(), k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
  if (k.indexOf('ankle.') === 0) { var q = k.slice(6); d.ankle[q] = q === 'pain' ? +v : v; } else d[k] = +v;
  obRefresh();
};
Actions['ob-joint'] = function (b) { var d = obData(), k = b.getAttribute('data-k'); d.joints[k] = !d.joints[k]; obRefresh(); };
Actions['ob-parq'] = function (b) { var d = obData(); d.parq[+b.getAttribute('data-i')] = b.getAttribute('data-v') === '1'; obRefresh(); };
Actions['ob-ack'] = function () { var d = obData(); d.ack = !d.ack; obRefresh(); };
Actions['ob-back'] = function () { OB.step = Math.max(0, OB.step - 1); App.render(); window.scrollTo(0, 0); };
Actions['ob-next'] = function () {
  if (!obCanNext()) return;
  if (OB.step < OB_STEPS - 1) { OB.step++; App.render(); window.scrollTo(0, 0); return; }
  var d = obData(), p = S.profile;
  ['name', 'sex', 'dbList'].forEach(function (k) { p[k] = d[k]; });
  ['age', 'weight', 'height', 'bf', 'smm', 'maxDb', 'dbStep', 'days'].forEach(function (k) { p[k] = d[k] == null ? p[k] : d[k]; });
  p.name = String(p.name || '').trim(); p.equip = d.equip;
  p.parq = {answers: d.parq, date: today(), anyYes: d.parq.some(function (x) { return x; })};
  S.ladders.pullup = d.pull === 0 ? 1 : d.pull === 1 ? 2 : d.pull === 3 ? 4 : d.pull === 6 ? 5 : 5;
  S.ladders.pushup = d.push === 0 ? 0 : d.push === 5 ? 1 : d.push === 13 ? 2 : 3;
  S.ankle.intake = d.ankle; S.ankle.phase = Logic.phaseFromIntake(d.ankle); S.ankle.since = today();
  if (d.ankle.pain != null) S.pain.push({id: uid(), date: today(), joint: 'ankle', v: d.ankle.pain, ctx: 'walk', u: Date.now()});
  Object.keys(d.joints).forEach(function (j) { if (d.joints[j]) S.pain.push({id: uid(), date: today(), joint: j, v: 3, ctx: 'now', note: 'من أول استخدام', u: Date.now()}); });
  S.prog.start = today(); S.onboarded = true; OB.d = null; OB.step = 0;
  save(true); App.render(); window.scrollTo(0, 0);
  App.toast('برنامجك جاهز. ابدأ بالجلسة المقترحة.');
};
