/* Library: exercises (search, filters, detail pages) and boxing techniques. */
var LIB = {seg: 'ex', q: '', type: null, muscle: null, eq: null};
var PATTERN_ORDER = ['vpull', 'hpull', 'hpush', 'vpush', 'squat', 'hinge', 'single', 'carry', 'power', 'rotPower', 'antiRot', 'antiExt', 'antiLat', 'iso', 'joint', 'rehab', 'warm', 'stretch', 'cardio'];
Views.library = function () {
  var h = '<div class="page">' + navbar('المكتبة') + '<h1 class="large-title">المكتبة</h1>';
  h += '<div class="seg" role="tablist" style="margin-top:12px"><button role="tab" data-act="lib-seg" data-v="ex" class="' + (LIB.seg === 'ex' ? 'on' : '') + '" aria-selected="' + (LIB.seg === 'ex') + '">التمارين</button><button role="tab" data-act="lib-seg" data-v="box" class="' + (LIB.seg === 'box' ? 'on' : '') + '" aria-selected="' + (LIB.seg === 'box') + '">تقنيات الملاكمة</button></div>';
  h += LIB.seg === 'ex' ? libExercises() : libBoxing();
  return h + '</div>';
};
function libExercises() {
  var h = '<div style="position:relative;margin-top:14px"><input class="input" id="lib-q" data-in="lib-q" type="search" placeholder="ابحث: عقلة، كتف، squat…" value="' + esc(LIB.q) + '" aria-label="ابحث في التمارين" style="padding-inline-start:44px"><span style="position:absolute;inset-inline-start:12px;top:14px;color:var(--muted)">' + I('search') + '</span></div>';
  h += '<div class="chips scroll" style="margin-top:12px"><button class="chip' + (!LIB.type ? ' sel' : '') + '" data-act="lib-type" data-v="">الكل</button>' + Object.keys(DATA.types).map(function (k) { return '<button class="chip ty-' + k + (LIB.type === k ? ' sel' : ' t') + '" data-act="lib-type" data-v="' + k + '">' + I(k, 'sm') + esc(DATA.types[k].short) + '</button>'; }).join('') + '</div>';
  h += '<div class="chips" style="margin-top:8px"><button class="chip' + (LIB.muscle ? ' sel' : '') + '" data-act="lib-muscle">' + I('body', 'sm') + (LIB.muscle ? esc(DATA.muscles[LIB.muscle].n) : 'العضلة') + '</button><button class="chip' + (LIB.eq ? ' sel' : '') + '" data-act="lib-eq">' + I('strength', 'sm') + (LIB.eq ? esc(DATA.equipment[LIB.eq].n) : 'الأداة') + '</button>' + (LIB.muscle || LIB.eq || LIB.type || LIB.q ? '<button class="chip" data-act="lib-clear">' + I('close', 'sm') + 'مسح</button>' : '') + '</div>';
  return h + '<div id="lib-list">' + libList() + '</div>';
}
function libList() {
  var q = normDigits(LIB.q).toLowerCase(), ids = Object.keys(EX).filter(function (id) {
    var e = EX[id];
    if (LIB.type && e.t !== LIB.type) return false;
    if (LIB.muscle && (e.pm || []).indexOf(LIB.muscle) < 0 && (e.sm || []).indexOf(LIB.muscle) < 0) return false;
    if (LIB.eq && (e.eq || []).indexOf(LIB.eq) < 0) return false;
    if (q) { var hay = (e.n + ' ' + e.en + ' ' + (e.pm || []).concat(e.sm || []).map(function (m) { return DATA.muscles[m].n; }).join(' ') + ' ' + DATA.patterns[e.p]).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
    return true;
  });
  if (!ids.length) return '<div class="empty" style="margin-top:16px"><span class="em-ic">' + I('search', 'lg') + '</span><b>لا توجد نتائج</b><p>جرّب كلمة أخرى أو امسح التصفية.</p><button class="btn btn-tonal" data-act="lib-clear">امسح التصفية</button></div>';
  var h = '<p class="muted" style="font-size:14px;margin-top:12px">' + ids.length + ' تمريناً</p>';
  PATTERN_ORDER.forEach(function (p) {
    var list = ids.filter(function (id) { return EX[id].p === p; }); if (!list.length) return;
    h += '<section class="section" style="margin-top:16px"><div class="section-h"><h2 style="font-size:18px">' + esc(DATA.patterns[p]) + '</h2><span class="aside">' + list.length + '</span></div><div class="list">';
    list.forEach(function (id) { var e = EX[id]; h += '<button class="row ty-' + e.t + '" data-act="ex-open" data-id="' + id + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t">' + esc(e.n) + '</span><span class="row-s">' + (e.pm || []).map(function (m) { return DATA.muscles[m].n; }).join('، ') + '</span></span><span class="tdot" aria-label="' + esc(DATA.types[e.t].short) + '"></span>' + I('chevR', 'chev sm') + '</button>'; });
    h += '</div></section>';
  });
  return h;
}
Actions['lib-seg'] = function (b) { LIB.seg = b.getAttribute('data-v'); App.render(); };
Actions['lib-q'] = function (el) { LIB.q = el.value; var l = $('#lib-list'); if (l) { l.innerHTML = libList(); App.mountFigs(l); } };
Actions['lib-type'] = function (b) { LIB.type = b.getAttribute('data-v') || null; App.render(); };
Actions['lib-clear'] = function () { LIB.q = ''; LIB.type = LIB.muscle = LIB.eq = null; App.render(); };
Actions['lib-muscle'] = function () {
  App.sheet({title: 'صفّ حسب العضلة', body: '<div class="chips">' + Object.keys(DATA.muscles).map(function (m) { return '<button class="chip' + (LIB.muscle === m ? ' sel' : '') + '" data-act="lib-muscle-set" data-v="' + m + '">' + esc(DATA.muscles[m].n) + '</button>'; }).join('') + '</div>' + BodyMap.render({pri: LIB.muscle ? [LIB.muscle] : []})});
};
Actions['lib-muscle-set'] = function (b) { var v = b.getAttribute('data-v'); LIB.muscle = LIB.muscle === v ? null : v; App.closeAllSheets(); App.render(); };
Actions['lib-eq'] = function () { App.sheet({title: 'صفّ حسب الأداة', body: '<div class="chips">' + Object.keys(DATA.equipment).map(function (k) { return '<button class="chip' + (LIB.eq === k ? ' sel' : '') + '" data-act="lib-eq-set" data-v="' + k + '">' + esc(DATA.equipment[k].n) + '</button>'; }).join('') + '</div>'}); };
Actions['lib-eq-set'] = function (b) { var v = b.getAttribute('data-v'); LIB.eq = LIB.eq === v ? null : v; App.closeAllSheets(); App.render(); };

function exDetail(id, inSheet) {
  var e = EX[id], h = '';
  h += '<div class="figbig ty-' + e.t + '" style="position:relative">' + figEl(e.fig, 'fig', e.pm, true, e.n).replace('class="fig"', 'class="fig" style="display:block;width:100%;height:100%"') + '</div>';
  if (!inSheet) h += '<h1 class="large-title" style="margin-top:14px">' + esc(e.n) + '</h1>';
  h += '<span class="en">' + esc(e.en) + '</span>';
  h += '<div class="chips" style="margin-top:10px"><span class="chip t ty-' + e.t + '">' + I(e.t, 'sm') + esc(DATA.types[e.t].short) + '</span><span class="chip">' + esc(DATA.patterns[e.p]) + '</span>' + (e.eq || []).map(function (q) { return '<span class="chip">' + esc(DATA.equipment[q].n) + '</span>'; }).join('') + (e.uni ? '<span class="chip">لكل جهة</span>' : '') + '</div>';
  h += '<p style="font-size:18px;font-weight:600;margin-top:14px;line-height:1.6">' + esc(e.s) + '</p>';
  if (e.why) h += '<p class="muted" style="margin-top:6px;font-size:16px"><b style="color:var(--ink-2)">لماذا في برنامجك؟</b> ' + esc(e.why) + '</p>';
  h += '<section class="section"><div class="section-h"><h2>العضلات</h2></div><div class="card ty-' + e.t + '">' + BodyMap.render({pri: e.pm, sec: e.sm}) +
    '<div class="legend" style="margin-top:10px"><span><i></i>أساسية: ' + (e.pm || []).map(function (m) { return DATA.muscles[m].n; }).join('، ') + '</span>' + ((e.sm || []).length ? '<span><i class="s"></i>ثانوية: ' + e.sm.map(function (m) { return DATA.muscles[m].n; }).join('، ') + '</span>' : '') + '</div></div></section>';
  h += '<section class="section"><div class="section-h"><h2>الطريقة</h2></div><ol class="steps">' + (e.st || []).map(function (s) { return '<li><span>' + esc(s) + '</span></li>'; }).join('') + '</ol>';
  if ((e.mk || []).length || e.j) {
    h += '<details class="more"><summary>المزيد: الأخطاء الشائعة وملاحظات المفاصل ' + I('chevD', 'sm') + '</summary>';
    if ((e.mk || []).length) h += '<ul class="bul" style="margin-top:8px">' + e.mk.map(function (m) { return '<li>' + I('close', 'sm') + '<span>' + esc(m) + '</span></li>'; }).join('') + '</ul>';
    if (e.j) h += '<div class="stack" style="margin-top:10px">' + Object.keys(e.j).map(function (k) { return '<div class="banner' + (k === 'ankle' ? ' warn' : ' info') + '">' + I(k === 'ankle' ? 'warn' : 'info') + '<div><b>' + esc(DATA.joints[k] ? DATA.joints[k].n : k) + '</b><p>' + esc(e.j[k]) + '</p></div></div>'; }).join('') + '</div>';
    h += '</details>';
  }
  h += '</section>';
  h += '<a class="yt" href="' + ytUrl(e.yt) + '" target="_blank" rel="noopener" style="margin-top:16px">' + '<span class="ytb"><svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true">' + ICONS.play + '</svg></span><span class="row-m"><span>شاهد الطريقة على يوتيوب</span><span class="row-s" style="font-weight:500">بحث: ' + esc(e.yt) + '</span></span>' + I('ext', 'sm') + '</a>';
  var alt = e.alt || {}, cards = [['e', 'أسهل'], ['h', 'أصعب'], ['s', 'نفس النمط']].filter(function (x) { return alt[x[0]] && alt[x[0]] !== id; });
  if (cards.length) {
    h += '<section class="section"><div class="section-h"><h2>البدائل</h2></div><div class="alt3">' + cards.map(function (x) { var a = EX[alt[x[0]]]; return '<button class="alt ty-' + a.t + '" data-act="ex-open" data-id="' + alt[x[0]] + '" data-replace="1">' + figEl(a.fig, 'thumb', a.pm) + '<span class="k">' + x[1] + '</span><span class="n">' + esc(a.n) + '</span></button>'; }).join('') + '</div></section>';
  }
  var ps = Logic.perfs(id).slice(0, 4);
  if (ps.length) h += '<section class="section"><div class="section-h"><h2>آخر مرات</h2></div><div class="list">' + ps.map(function (p) { return '<div class="row"><span class="row-m"><span class="row-t" style="font-size:15px">' + fmtDate(p.date) + '</span><span class="row-s num">' + p.sets.map(function (s) { return (s.w ? fmtN(s.w) + '×' : '') + s.r; }).join(' · ') + '</span></span></div>'; }).join('') + '</div></section>';
  return h;
}
Views.exercise = function (a) { var e = EX[a.id]; if (!e) return Views.library(); return '<div class="page ty-' + e.t + '">' + navbar(e.n) + exDetail(a.id) + '</div>'; };
Actions['ex-open'] = function (b) {
  var id = b.getAttribute('data-id');
  if (Workout.isOpen() || App.topSheet()) { App.closeAllSheets(); App.sheet({title: EX[id].n, body: exDetail(id, true), cls: 'ty-' + EX[id].t}); return; }
  App.go('exercise', {id: id});
};

function libBoxing() {
  var L = Logic.lesson(), lvl = Logic.comboLevel();
  var h = '<section class="section"><div class="card tint ty-boxing" style="display:flex;flex-direction:column;gap:10px"><span class="tag" style="align-self:flex-start;background:var(--surface)">درس الأسبوع</span><div style="display:flex;gap:12px;align-items:center">' + figEl(L.figs[0], 'thumb lg', null, true) + '<div class="row-m"><span class="row-t" style="font-family:var(--f-display);font-size:22px">' + esc(L.n) + '</span><span class="en">' + esc(L.en) + '</span></div></div><p style="font-size:15px">' + esc(L.s) + '</p>' +
    '<div class="hero-actions"><button class="btn btn-type" data-act="go" data-p="lesson" data-a=\'{"id":"' + L.id + '"}\'>افتح الدرس</button><button class="btn btn-outline" data-act="lesson-train" data-id="' + L.id + '">' + I('timer', 'sm') + 'شادو 3 جولات</button></div></div></section>';
  h += '<section class="section"><div class="section-h"><h2>الدروس</h2><span class="aside">بترتيب التعلّم</span></div><div class="list">' + DATA.lessons.map(function (l) {
    return '<button class="row ty-boxing" data-act="go" data-p="lesson" data-a=\'{"id":"' + l.id + '"}\'>' + figEl(l.figs[0], 'thumb') + '<span class="row-m"><span class="row-t">' + esc(l.n) + '</span><span class="row-s">' + esc(l.s) + '</span></span>' + (l.id === L.id ? '<span class="tag t">هذا الأسبوع</span>' : '<span class="tag">مستوى ' + l.lvl + '</span>') + I('chevR', 'chev sm') + '</button>';
  }).join('') + '</div></section>';
  h += '<section class="section"><div class="section-h"><h2>التركيبات</h2><span class="aside">مستواك الآن: ' + lvl + '</span></div><div class="stack">' + DATA.combos.map(function (c) {
    return '<div class="card' + (c.lvl > lvl ? ' flat' : '') + '"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>' + esc(c.n) + '</b>' + (c.lvl === lvl ? '<span class="tag t ty-boxing">الحالي</span>' : c.lvl < lvl ? '<span class="tag ok">' + I('check', 'sm') + '</span>' : '') + '</div><div class="combo">' + c.list.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div></div>';
  }).join('') + '</div><p class="muted" style="font-size:14px;margin-top:10px">الأرقام: 1 جاب، 2 كروس، 3 خطاف أمامي، 4 خطاف خلفي، 5 أبركت أمامي، 6 أبركت خلفي.</p></section>';
  return h;
}
Views.lesson = function (a) {
  var l = DATA.lessons.filter(function (x) { return x.id === a.id; })[0] || DATA.lessons[0], isCur = Logic.lesson().id === l.id;
  var h = '<div class="page ty-boxing">' + navbar(l.n);
  h += '<div class="grid2" style="margin-top:4px">' + l.figs.map(function (f) { return '<div class="figbig" style="height:200px">' + figEl(f, 'fig', null, true, l.n).replace('class="fig"', 'class="fig" style="display:block;width:100%;height:100%"') + '</div>'; }).join('') + '</div>';
  h += '<h1 class="large-title" style="margin-top:14px">' + esc(l.n) + '</h1><span class="en">' + esc(l.en) + '</span>';
  h += '<p style="font-size:18px;font-weight:600;margin-top:12px">' + esc(l.s) + '</p>';
  h += '<section class="section"><div class="section-h"><h2>الطريقة</h2></div><ol class="steps">' + l.st.map(function (s) { return '<li><span>' + esc(s) + '</span></li>'; }).join('') + '</ol>';
  h += '<details class="more"><summary>المزيد: الأخطاء الشائعة ' + I('chevD', 'sm') + '</summary><ul class="bul" style="margin-top:8px">' + l.mk.map(function (m) { return '<li>' + I('close', 'sm') + '<span>' + esc(m) + '</span></li>'; }).join('') + '</ul></details></section>';
  h += '<section class="section stack"><div class="card"><b style="display:block;margin-bottom:4px">' + I('boxing', 'sm') + ' تمرين الشادو</b><p style="font-size:16px">' + esc(l.shadow) + '</p></div><div class="card"><b style="display:block;margin-bottom:4px">على الكيس</b><p style="font-size:16px">' + esc(l.bag) + '</p></div><div class="card flat"><b style="display:block;margin-bottom:4px">في النزال</b><p style="font-size:16px">' + esc(l.ring) + '</p></div>' + (l.ankle ? '<div class="banner warn">' + I('warn') + '<div><b>الكاحل</b><p>' + esc(l.ankle) + '</p></div></div>' : '') + '</section>';
  h += '<a class="yt" href="' + ytUrl(l.yt) + '" target="_blank" rel="noopener" style="margin-top:16px"><span class="ytb"><svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true">' + ICONS.play + '</svg></span><span class="row-m"><span>شاهد الطريقة على يوتيوب</span><span class="row-s" style="font-weight:500">بحث: ' + esc(l.yt) + '</span></span>' + I('ext', 'sm') + '</a>';
  h += '<div class="stack" style="margin-top:18px"><button class="btn btn-type btn-xl btn-block" data-act="lesson-train" data-id="' + l.id + '">' + I('timer') + 'ابدأ تدريب الشادو (3 جولات)</button>' + (isCur ? '<p class="muted" style="text-align:center;font-size:14px">هذا درس الأسبوع، ويظهر في جولات جلساتك.</p>' : '<button class="btn btn-tonal btn-block" data-act="lesson-set" data-id="' + l.id + '">اجعله درس الأسبوع</button>') + '</div>';
  return h + '</div>';
};
Actions['lesson-set'] = function (b) { S.prog.lesson = b.getAttribute('data-id'); save(); App.render(); App.toast('أصبح درس الأسبوع في جولات جلساتك'); };
Actions['lesson-train'] = function (b) {
  var l = DATA.lessons.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0], rp = DATA.roundPlans.shadowTech;
  var plan = {key: 'shadowTech', n: 'شادو: ' + l.n, type: 'boxing', fig: l.figs[0], intro: rp.intro, rounds: 3, len: 120, rest: 60,
    items: rp.rounds.slice(0, 3).map(function (r) { return {k: r.k, t: r.t, d: r.d.replace('{shadow}', l.shadow) + (S.ankle.phase < 3 ? ' الخطوات على الأرض بدون نطّ.' : '')}; })};
  Rounds.openStandalone(plan, function (n) {
    S.sessions.push({id: uid(), key: 'free', kind: 'shadow', type: 'boxing', date: today(), start: Date.now() - n * 180000, end: Date.now(), roundsN: n, min: n * 3, note: l.n, status: 'done', u: Date.now()});
    save(); App.render(); App.toast('سُجّل: شادو ' + n + ' جولات');
  });
};
