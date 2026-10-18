/* Workout mode: a full-screen layer that keeps everything in S.active, so leaving or reloading loses nothing. */
var Workout = (function () {
  var open = false, ui = {w: null, r: null, rir: null, stepId: null, fig: 'fig'}, tick = null;
  function A() { return S.active; }
  function steps() { var a = A(); return a.order.map(function (id) { return a.plan.steps.filter(function (s) { return s.id === id; })[0]; }).filter(Boolean); }
  function stepAt(i) { return steps()[i]; }
  function curStep() { var a = A(); if (a.cur === 'summary') return null; return stepAt(a.cur); }
  function itemOf(step) { return A().rec.items.filter(function (it) { return it.id === step.id; })[0]; }
  function stDone(step) { var st = A().status[step.id]; return st === 'done' || st === 'skip'; }
  function isOpen() { return open; }

  function start(key) {
    Sound.unlock();
    if (S.active) {
      if (S.active.key === key) { show(); return; }
      App.confirm({title: 'لديك جلسة جارية', text: 'جلسة «' + S.active.plan.n + '» لم تنتهِ. هل تحفظ ما سجّلته فيها وتبدأ الجديدة؟', ok: 'احفظها وابدأ الجديدة', cancel: 'ارجع للجلسة الجارية'}).then(function (yes) {
        if (yes) { finish(true); start(key); } else show();
      });
      return;
    }
    var plan = Logic.buildPlan(key), ret = Logic.retMode();
    var rec = {id: uid(), key: key, n: plan.n, date: today(), start: Date.now(), week: plan.week, phase: plan.phase, deload: plan.deload, ret: plan.ret, gap: ret && ret.gap || 0, items: [], rounds: [], drills: {}, u: Date.now()};
    plan.steps.forEach(function (s) { if (s.kind === 'lift') rec.items.push(newItem(s)); });
    S.active = {id: rec.id, key: key, startedAt: Date.now(), plan: plan, rec: rec, order: plan.steps.map(function (s) { return s.id; }), cur: 0, rest: null, rt: null, status: {}};
    save(true); ui.stepId = null;
    App.closeAllSheets();
    show(true);
  }
  function newItem(s) { return {id: s.id, slot: s.slot, kind: 'lift', ex: s.ex, orig: s.orig || s.ex, ladder: s.ladder, pair: s.pair, target: {sets: s.sets, reps: s.reps, rir: s.rir, rest: s.rest, unit: s.unit, w: s.sug && s.sug.w}, sets: [], skipped: false}; }
  function show(first) {
    if (!S.active) return;
    open = true; Wake.on();
    var el = $('#wo'); el.hidden = false; el.classList.remove('min'); if (first) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
    document.body.style.overflow = 'hidden';
    renderWO(); renderMini();
  }
  function minimize() {
    if (!S.active) return;
    open = false; var el = $('#wo'); el.classList.add('min'); document.body.style.overflow = '';
    FIG.stopAll(); App.render();
  }
  function closeLayer() { open = false; var el = $('#wo'); el.classList.add('min'); setTimeout(function () { if (!open) { el.hidden = true; el.innerHTML = ''; } }, 450); document.body.style.overflow = ''; Wake.off(); }

  // ---------- rendering ----------
  function renderWO() {
    if (!S.active || !open) return;
    var a = A(), all = steps(), st = curStep(), sd = DATA.sessions[a.key];
    var ty = st ? stepType(st) : sd.type;
    var h = '<div class="wo-in ty-' + ty + '">';
    h += '<div class="wo-top"><button class="icon-btn" data-act="wo-min" aria-label="تصغير الجلسة">' + I('chevD') + '</button>';
    var doneN = all.filter(stDone).length;
    h += '<button class="wo-prog" data-act="wo-list" aria-label="قائمة التمارين" style="border:0;background:none;padding:0;text-align:start"><span class="wo-prog-l"><span>' + esc(a.plan.n) + '</span><b class="num">' + (a.cur === 'summary' ? all.length : a.cur + 1) + ' / ' + all.length + '</b></span><span class="wo-segs">' +
      all.map(function (s, i) { var c = a.status[s.id] === 'skip' ? 'skip' : stDone(s) ? 'done ty-' + stepType(s) : i === a.cur ? 'cur' : ''; return '<i class="' + c + '"></i>'; }).join('') + '</span></button>';
    h += '<button class="icon-btn" data-act="wo-menu" aria-label="خيارات الجلسة">' + I('more') + '</button></div>';
    if (a.cur === 'summary') h += summaryView();
    else if (st.kind === 'lift') h += liftView(st);
    else if (st.kind === 'rounds') h += roundsView(st);
    else h += checklistView(st);
    h += '</div>';
    if (a.rest) h += restView();
    var wo = $('#wo'); wo.innerHTML = h;
    wo.className = 'wo';
    App.mountFigs(wo);
    bindSwipe(wo);
    if (a.rest) startTick();
  }
  function stepType(s) {
    if (s.kind === 'lift') return EX[s.ex].t;
    if (s.kind === 'rounds') return s.plan.type;
    return 'mobility';
  }
  function exName(id) { return EX[id] ? EX[id].n : id; }
  function setStr(s, unit) { return (s.w ? fmtN(s.w) + '×' : '') + s.r + (unit === 'sec' ? 'ث' : ''); }

  function liftView(st) {
    var it = itemOf(st), ex = EX[it.ex], sug = st.sug || Logic.suggest(st), unit = it.target.unit, isKg = ex.m === 'kg', isCheck = unit === 'check';
    if (ui.stepId !== st.id) initInputs(st, it, sug);
    var n = it.sets.length, total = it.target.sets, cur = Math.min(n + 1, Math.max(total, n + 1));
    var h = '<div class="wo-body">';
    var mus = (ex.pm || []).slice(0, 2).map(function (m) { return '<span>' + esc(DATA.muscles[m].n) + '</span>'; }).join('');
    if (ui.fig === 'map') h += '<button class="wo-fig map" data-act="wo-fig" aria-label="عرض الحركة">' + BodyMap.render({pri: ex.pm, sec: ex.sm}) + '<span class="flip">' + I('flip') + '</span></button>';
    else h += '<button class="wo-fig" data-act="wo-fig" aria-label="عرض خريطة العضلات"><span style="position:absolute;inset:0" data-fig="' + ex.fig + '" data-mus="' + (ex.pm || []).join(',') + '" data-anim aria-label="' + esc(ex.n) + '"></span><span class="mus">' + mus + '</span><span class="flip">' + I('body') + '</span></button>';
    h += '<div class="wo-name"><div style="min-width:0"><h2>' + (it.pair ? '<span class="tag t" style="height:24px;vertical-align:4px;margin-inline-end:6px">' + it.pair + '</span>' : '') + esc(ex.n) + '</h2><span class="en">' + esc(ex.en) + (ex.uni ? ' · لكل جهة' : '') + '</span></div><button class="icon-btn" data-act="ex-open" data-id="' + it.ex + '" aria-label="طريقة الأداء">' + I('info') + '</button></div>';
    if (sug.tech) h += '<div class="tech">' + I('sparkle', 'sm') + ' ' + esc(sug.tech.n) + ': ' + esc(sug.tech.d) + '</div>';
    if (!isCheck) {
      h += '<div class="nums">' +
        '<div class="numc cur"><span class="v num">' + Math.min(cur, Math.max(total, cur)) + '<small>/' + total + '</small></span><span class="l">' + term('set', 'المجموعة') + '</span></div>' +
        '<div class="numc"><span class="v num" style="font-size:' + (repText([sug.lo, sug.hi]).length >= 4 ? 28 : 40) + 'px">' + repText([sug.lo, sug.hi]) + '</span><span class="l">' + (unit === 'sec' ? 'ثانية' : term('rep', 'تكرار')) + '</span></div>' +
        (isKg ? '<div class="numc"><span class="v num">' + fmtN(ui.w) + '</span><span class="l">كغ</span></div>' : '<div class="numc"><span class="v num">' + (it.target.rir || '—') + '</span><span class="l">' + term('rir', 'يبقى عندك') + '</span></div>') +
        '<div class="numc"><span class="v num">' + (it.target.rest || 0) + '</span><span class="l">' + term('rest', 'ث راحة') + '</span></div></div>';
      var prev = sug.prev ? sug.prev.sets.map(function (s) { return setStr(s, unit); }).join(' · ') : 'أول مرة';
      var icon = {up: 'up', down: 'down', reps: 'eq', low: 'eq', hard: 'eq', partial: 'eq', maxed: 'sparkle', first: 'sparkle', ladder: 'up', top: 'up'}[sug.code] || 'eq';
      var todayStr = (isKg && sug.w ? fmtN(sug.w) + ' كغ × ' : '') + sug.r + (unit === 'sec' ? ' ث' : '');
      h += '<div class="cmp"><div><span class="l">المرة السابقة</span><div class="v num">' + esc(prev) + '</div></div><div class="sug"><span class="l">' + I(icon, 'sm') + ' المقترح اليوم</span><div class="v num">' + esc(todayStr) + '</div></div></div>';
      h += '<p class="why">' + esc(sug.msg) + (it.target.rir ? ' <b>توقف وعندك ' + it.target.rir + ' تكرار.</b>' : '') + '</p>';
      if (n) h += '<div class="setpills" aria-label="المجموعات المسجّلة">' + it.sets.map(function (s, i) { return '<button class="sp done" data-act="set-edit" data-i="' + i + '">' + I('check', 'sm') + setStr(s, unit) + '</button>'; }).join('') + (n < total ? '<span class="sp cur">' + (n + 1) + '</span>' : '') + '</div>';
      h += '<div class="logger"' + (isKg ? '' : ' style="grid-template-columns:1fr"') + '>' +
        (isKg ? stepperHtml('w', ui.w, 'كغ') : '') + stepperHtml('r', ui.r, unit === 'sec' ? 'ثانية' : 'تكرار') + '</div>';
      h += '<div class="rir"><span class="rl">' + term('rir', 'كم بقي؟') + '</span><div class="btn-group" role="group" aria-label="كم تكراراً بقي عندك">' + [0, 1, 2, 3].map(function (v) { return '<button data-act="wo-rir" data-v="' + v + '" class="' + (ui.rir === v ? 'on' : '') + '" aria-pressed="' + (ui.rir === v) + '">' + (v === 3 ? '+3' : v) + '</button>'; }).join('') + '</div></div>';
    } else {
      h += '<p style="font-size:16px">' + esc(ex.s) + '</p><p class="why">' + esc(ex.d || '') + '</p>';
    }
    h += '</div><div class="wo-foot">';
    if (isCheck) h += '<button class="done-btn" data-act="wo-check-done"><b>' + (stDone(st) ? 'تم ✓' : 'تم') + '</b><span>' + esc(ex.d || '') + '</span></button>';
    else {
      var restTxt = it.target.rest ? 'ثم راحة ' + secText(it.target.rest) : '';
      h += '<button class="done-btn" data-act="wo-log"><b>' + (n >= total ? 'مجموعة إضافية ' + (n + 1) : 'أنهيت المجموعة ' + (n + 1)) + '</b><span>' + (isKg ? fmtN(ui.w) + ' كغ × ' : '') + ui.r + (unit === 'sec' ? ' ث' : ' تكرار') + (restTxt ? '، ' + restTxt : '') + '</span></button>';
    }
    h += '<div class="wo-actions"><button class="wa" data-act="wo-swap">' + I('swap') + 'بدّل</button><button class="wa" data-act="wo-addset">' + I('plus') + 'مجموعة</button><button class="wa" data-act="wo-skip">' + I('skip') + 'تخطَّ</button><button class="wa" data-act="wo-next">' + I('chevL') + 'التالي</button></div></div>';
    return h;
  }
  function stepperHtml(k, v, unit) {
    return '<div class="stepper"><button data-act="wo-step" data-k="' + k + '" data-d="-1" aria-label="أقل">' + I('minus') + '</button><span class="sv"><input id="wo-' + k + '" data-in="wo-in" data-k="' + k + '" inputmode="decimal" value="' + fmtN(v) + '" aria-label="' + unit + '"><span>' + unit + '</span></span><button data-act="wo-step" data-k="' + k + '" data-d="1" aria-label="أكثر">' + I('plus') + '</button></div>';
  }
  function initInputs(st, it, sug) {
    ui.stepId = st.id; ui.rir = null;
    var last = it.sets[it.sets.length - 1];
    var ex = EX[it.ex];
    ui.w = last && last.w != null ? last.w : (sug.w != null ? sug.w : (ex.m === 'kg' ? Logic.roundW(ex.kg || 10) : null));
    ui.r = last ? last.r : (sug.r != null ? sug.r : it.target.reps[1]);
  }
  function checklistView(st) {
    var a = A(), h = '<div class="wo-body"><div><h2 style="font-family:var(--f-display);font-weight:800;font-size:26px">' + esc(st.n) + '</h2><p class="muted" style="font-size:15px">' + (st.kind === 'warm' ? (st.min || 8) + ' دقائق تقريباً. الإحماء الحركي يجهّز المفاصل، والإطالة الطويلة تأتي في النهاية.' : 'إطالة هادئة بعد التمرين. اضغط على المؤقت لكل إطالة.') + '</p></div><div class="checks">';
    st.items.forEach(function (it) {
      var e = EX[it.ex], d = a.rec.drills[it.ex] || {};
      h += '<div class="ck' + (d.done ? ' on' : '') + ' ty-' + (it.rehab ? 'mobility' : e.t) + '"><button class="cbox" data-act="ck-toggle" data-ex="' + it.ex + '" aria-pressed="' + !!d.done + '" aria-label="تم: ' + esc(e.n) + '">' + I('check') + '</button>' + figEl(e.fig, 'thumb', e.pm) +
        '<span class="row-m" data-act="ex-open" data-id="' + it.ex + '"><span class="row-t" style="font-size:16px">' + esc(e.n) + (it.rehab ? '<span class="phase-tag">الكاحل ' + S.ankle.phase + '</span>' : '') + '</span><span class="row-s">' + esc(e.d || '') + '</span></span>' +
        (e.log ? '<input class="logv" data-in="ck-log" data-ex="' + it.ex + '" inputmode="decimal" placeholder="' + (e.log === 'sec' ? 'ث' : e.log === 'cm' ? 'سم' : 'عدد') + '" value="' + (d.v != null ? d.v : '') + '" aria-label="سجّل ' + esc(e.n) + '">' :
          (st.kind === 'stretch' ? '<button class="icon-btn" data-act="ck-timer" data-ex="' + it.ex + '" aria-label="مؤقت 30 ثانية">' + I('timer') + '</button>' : '')) + '</div>';
    });
    h += '</div></div><div class="wo-foot"><button class="done-btn ty-mobility" data-act="ck-done"><b>' + (st.kind === 'warm' ? 'انتهيت من الإحماء' : 'انتهيت من الإطالة') + '</b><span>' + st.items.filter(function (i) { return (a.rec.drills[i.ex] || {}).done; }).length + ' من ' + st.items.length + '</span></button></div>';
    return h;
  }
  function roundsView(st) {
    var rp = st.plan, a = A(), r = a.rec.rounds.filter(function (x) { return x.id === st.id; })[0];
    var h = '<div class="wo-body"><div class="wo-fig" style="height:clamp(130px,22vh,190px)"><span style="position:absolute;inset:0" data-fig="' + rp.fig + '" data-anim aria-label="' + esc(rp.n) + '"></span></div>';
    h += '<div><h2 style="font-family:var(--f-display);font-weight:800;font-size:26px">' + esc(rp.n) + '</h2><p class="muted" style="font-size:15px">' + rp.rounds + ' × ' + secText(rp.len) + '، راحة ' + secText(rp.rest) + ' · ' + term('round', 'ما هي الجولة؟') + '</p></div>';
    if (rp.gated) h += '<div class="banner info">' + I('info') + '<div><p>الحبل يعود في المرحلة 3 من تأهيل الكاحل. اليوم: بديل بدون نطّ بنفس التوقيت.</p></div></div>';
    if (rp.wraps) h += '<div class="banner warn">' + I('warn') + '<div><p>لُفّ يديك والبس القفاز قبل الكيس. اليد والرسغ أكثر إصابات الملاكمين.</p></div></div>';
    h += '<p style="font-size:15px">' + esc(rp.intro || '') + '</p><div class="list">';
    if (rp.segs) h += rp.segs.map(function (sg, i) { var e = EX[sg.ex]; return '<div class="row">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t" style="font-size:16px">' + (i + 1) + '. ' + esc(e.n) + '</span><span class="row-s">' + sg.sec + ' ث</span></span></div>'; }).join('');
    else h += rp.items.map(function (it, i) { return '<div class="row" style="align-items:flex-start"><span class="badge ty-' + rp.type + '" style="min-width:36px;height:36px;font-size:16px">' + (i + 1) + '</span><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(it.t) + '</span><span class="row-s" style="font-size:15px">' + esc(it.d) + '</span></span></div>'; }).join('');
    h += '</div>';
    if (r && r.done) {
      h += '<div class="card"><p style="font-weight:700;margin-bottom:8px">أنهيت ' + r.done + ' من ' + r.total + '. كيف كانت؟</p><div class="seg" role="group">' + [['easy', 'سهلة'], ['ok', 'مناسبة'], ['hard', 'صعبة']].map(function (f) { return '<button data-act="rd-feel" data-v="' + f[0] + '" class="' + (r.feel === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div></div>';
    }
    h += '</div><div class="wo-foot"><button class="done-btn" data-act="rd-start"><b>' + (r && r.done ? 'أعد المؤقت' : 'ابدأ مؤقت الجولات') + '</b><span>' + rp.rounds + ' ' + (rp.key === 'rope' ? 'فترات' : 'جولات') + ' مع تعليمات كل جولة</span></button><div class="wo-actions" style="grid-template-columns:repeat(3,1fr)"><button class="wa" data-act="rd-manual">' + I('check') + 'سجّل كمكتمل</button><button class="wa" data-act="wo-skip">' + I('skip') + 'تخطَّ</button><button class="wa" data-act="wo-next">' + I('chevL') + 'التالي</button></div></div>';
    return h;
  }
  function stats() {
    var a = A(), rec = a.rec, sets = 0, vol = 0, prs = [];
    rec.items.forEach(function (it) {
      sets += it.sets.length;
      it.sets.forEach(function (s) { vol += (s.w || 0) * (s.r || 0); });
      if (it.sets.length && EX[it.ex].m === 'kg') {
        var best = Math.max.apply(null, it.sets.map(function (s) { return s.w || 0; })), before = Logic.perfs(it.ex, rec.id);
        var prevBest = before.length ? Math.max.apply(null, [].concat.apply([], before.map(function (p) { return p.sets.map(function (s) { return s.w || 0; }); }))) : null;
        if (prevBest != null && best > prevBest) prs.push(EX[it.ex].n + ': ' + fmtN(best) + ' كغ');
      }
    });
    var mins = Math.round((Date.now() - a.startedAt) / 60000);
    return {sets: sets, vol: Math.round(vol), prs: prs, mins: mins};
  }
  function summaryView() {
    var a = A(), rec = a.rec, s = stats(), all = steps(), skipped = all.filter(function (x) { return a.status[x.id] === 'skip'; }).length, open = all.filter(function (x) { return !stDone(x); }).length;
    var h = '<div class="wo-body"><div><h2 style="font-family:var(--f-display);font-weight:800;font-size:28px">ملخص الجلسة</h2><p class="muted">' + esc(rec.n) + ' · ' + fmtDate(rec.date) + '</p></div>';
    h += '<div class="stat-row"><div class="stat"><span class="v">' + s.mins + '</span><span class="l">دقيقة</span></div><div class="stat"><span class="v">' + s.sets + '</span><span class="l">مجموعة</span></div><div class="stat"><span class="v">' + (s.vol >= 1000 ? fmtN(s.vol / 1000) + 'k' : s.vol) + '</span><span class="l">كغ × تكرار</span></div></div>';
    if (s.prs.length) h += '<div class="banner ok">' + I('sparkle') + '<div><b>أرقام جديدة</b><p>' + s.prs.map(esc).join('، ') + '</p></div></div>';
    if (open) h += '<div class="banner warn">' + I('info') + '<div><p>' + open + ' من التمارين لم تكتمل' + (skipped ? ' (' + skipped + ' تخطيت)' : '') + '. تُحفظ الجلسة «ناقصة»، والاقتراح التالي يُحسب مما سجّلته فقط.</p><button class="btn btn-tonal" data-act="wo-resume">ارجع وأكمل</button></div></div>';
    h += '<div class="card stack"><b>تقييم الجلسة: كم كانت صعبة من 10؟</b><div class="rpe">' + [5, 6, 7, 8, 9].map(function (v) { return '<button data-act="sm-rpe" data-v="' + v + '" class="' + (rec.rpe === v ? 'on' : '') + '">' + (v === 9 ? '9+' : v) + '</button>'; }).join('') + '</div><small class="muted">5 سهلة، 7 مجهود جيد، 9 أو أكثر مرهقة جداً.</small></div>';
    h += '<div class="card stack"><b>نومك الليلة الماضية</b><div class="seg" role="group">' + [['good', 'جيد'], ['ok', 'متوسط'], ['bad', 'سيئ']].map(function (x) { return '<button data-act="sm-sleep" data-v="' + x[0] + '" class="' + (rec.sleep === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    var pj = rec.pain || {};
    h += '<div class="card stack"><b>ألم الكاحل أثناء الجلسة (0–10)</b>' + painScale('sm-pain', pj.ankle, 'ankle') + '<small class="muted">0–3 مقبول، 4–5 خفّف، 6 أو أكثر أوقف التمرين المسبّب.</small>';
    var others = Object.keys(DATA.joints).filter(function (j) { return j !== 'ankle'; });
    h += '<div class="chips">' + others.map(function (j) { return '<button class="chip' + (pj[j] != null ? ' sel' : '') + '" data-act="sm-joint" data-k="' + j + '">' + esc(DATA.joints[j].n) + (pj[j] != null ? ' ' + pj[j] : '') + '</button>'; }).join('') + '</div><small class="muted">مفصل آخر آلمك؟ اضغط عليه وسجّل الألم.</small></div>';
    h += '<label class="field"><span>ملاحظة</span><textarea class="input" data-in="sm-note" placeholder="اختياري">' + esc(rec.note || '') + '</textarea></label>';
    h += '</div><div class="wo-foot"><button class="done-btn" data-act="wo-save"><b>احفظ الجلسة</b><span>' + (open ? 'تُحفظ ناقصة' : 'جلسة كاملة') + '</span></button></div>';
    return h;
  }
  function painScale(act, val, joint) {
    return '<div class="pain" role="group">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { var c = v <= 3 ? 'p0' : v <= 5 ? 'p1' : 'p2'; return '<button data-act="' + act + '" data-j="' + joint + '" data-v="' + v + '" class="' + c + (val === v ? ' on' : '') + '" aria-pressed="' + (val === v) + '">' + v + '</button>'; }).join('') + '</div>';
  }
  function restView() {
    var r = A().rest, left = Math.max(0, Math.ceil((r.endsAt - Date.now()) / 1000)), C = 2 * Math.PI * 46, frac = r.total ? left / r.total : 0;
    return '<div class="rest' + (left <= 0 ? ' over' : '') + '" id="rest"><div class="rest-in" role="timer" aria-live="off"><div class="rest-top"><div class="ring"><svg viewBox="0 0 104 104"><circle class="trk" cx="52" cy="52" r="46"/><circle class="bar" id="rest-bar" cx="52" cy="52" r="46" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg><div class="rt"><b id="rest-t">' + mmss(left) + '</b><span>' + (left > 0 ? 'راحة' : 'انتهت') + '</span></div></div>' +
      '<div class="rest-m"><span class="l">' + esc(r.done || '') + '</span><div class="n">' + esc(r.next || '') + '</div><div class="s">' + esc(r.sub || '') + '</div></div></div>' +
      '<div class="rest-btns"><button class="btn btn-tonal" data-act="rest-add" data-d="-15">−15 ث</button><button class="btn btn-tonal" data-act="rest-add" data-d="15">+15 ث</button><button class="btn btn-primary" data-act="rest-skip">' + (left > 0 ? 'تخطَّ الراحة' : 'ابدأ') + '</button></div></div></div>';
  }
  function startTick() {
    clearInterval(tick);
    var lastLeft = null;
    tick = setInterval(function () {
      var a = A(); if (!a || !a.rest) { clearInterval(tick); return; }
      var left = Math.ceil((a.rest.endsAt - Date.now()) / 1000);
      if (left !== lastLeft) {
        if (left <= 3 && left >= 1) Sound.tick();
        if (left === 0 && !a.rest.beeped) { a.rest.beeped = true; Sound.go(); save(); }
        lastLeft = left;
      }
      var t = $('#rest-t'); if (t) { t.textContent = mmss(Math.max(0, left)); var bar = $('#rest-bar'), C = 2 * Math.PI * 46; if (bar) bar.setAttribute('stroke-dashoffset', (C * (1 - Math.max(0, left) / a.rest.total)).toFixed(1)); }
      if (left <= 0) { var rs = $('#rest'); if (rs && !rs.classList.contains('over')) { rs.classList.add('over'); $('.rt span', rs).textContent = 'انتهت'; $('[data-act="rest-skip"]', rs).textContent = 'ابدأ'; } }
      if (left <= -6) { a.rest = null; save(); clearInterval(tick); var el = $('#rest'); if (el) el.remove(); }
      renderMiniTime();
    }, 250);
  }
  function startRest(sec, info) {
    var a = A(); a.rest = {endsAt: Date.now() + sec * 1000, total: sec, done: info.done, next: info.next, sub: info.sub};
    save(true);
  }

  // ---------- flow ----------
  function partnerOf(st) {
    if (!st.pair) return null;
    var all = steps(), i = all.indexOf(st);
    var cand = [all[i - 1], all[i + 1]].filter(function (x) { return x && x.kind === 'lift' && x.pair === st.pair && x.id.split('.')[0] === st.id.split('.')[0]; });
    return cand[0] || null;
  }
  function nextOpen(from) { var all = steps(); for (var i = from + 1; i < all.length; i++) if (!stDone(all[i])) return i; for (var j = 0; j < all.length; j++) if (!stDone(all[j])) return j; return 'summary'; }
  function goStep(i) { var a = A(); a.cur = i; ui.stepId = null; ui.fig = 'fig'; save(); renderWO(); renderMini(); var b = $('.wo-body'); if (b) b.scrollTop = 0; }
  function markLiftDone(st) { var it = itemOf(st); if (it.sets.length >= it.target.sets) A().status[st.id] = 'done'; }
  function logSet() {
    var a = A(), st = curStep(), it = itemOf(st), ex = EX[it.ex];
    var w = ex.m === 'kg' ? num($('#wo-w') ? $('#wo-w').value : ui.w) : null, r = num($('#wo-r') ? $('#wo-r').value : ui.r);
    if (r == null || r <= 0) { App.toast('اكتب عدد التكرارات أولاً', {err: true}); return; }
    it.sets.push({w: w, r: r, rir: ui.rir, t: Date.now()}); ui.w = w; ui.r = r; ui.rir = null;
    markLiftDone(st);
    var unit = it.target.unit, doneTxt = 'سُجّلت: ' + (w != null ? fmtN(w) + ' كغ × ' : '') + r + (unit === 'sec' ? ' ث' : '');
    // decide what comes next: pair partner, more sets, or the next step
    var p = partnerOf(st), all = steps(), nextIdx = all.indexOf(st), nextLbl = '', sub = '';
    if (p && !stDone(p) && itemOf(p).sets.length <= it.sets.length) nextIdx = all.indexOf(p);
    else if (!stDone(st)) nextIdx = all.indexOf(st);
    else nextIdx = nextOpen(all.indexOf(st));
    if (nextIdx === 'summary') { nextLbl = 'انتهت التمارين'; sub = 'التالي: ملخص الجلسة'; }
    else { var ns = all[nextIdx]; if (ns.kind === 'lift') { var ni = itemOf(ns); nextLbl = 'التالي: ' + exName(ni.ex); sub = 'المجموعة ' + Math.min(ni.sets.length + 1, Math.max(ni.target.sets, ni.sets.length + 1)) + ' من ' + ni.target.sets; } else { nextLbl = 'التالي: ' + ns.n; } }
    var rest = it.target.rest || 0;
    if (rest > 0 && nextIdx !== 'summary') startRest(rest, {done: doneTxt, next: nextLbl, sub: sub});
    else App.toast(doneTxt);
    var btn = $('.done-btn'); if (btn) btn.classList.add('pop');
    a.cur = nextIdx; ui.stepId = null; ui.fig = 'fig';
    save(true); renderWO(); renderMini();
  }

  // ---------- actions ----------
  Actions['wo-start'] = function (b) { start(b.getAttribute('data-k')); };
  Actions['wo-open'] = function () { show(); };
  Actions['wo-min'] = function () { minimize(); };
  Actions['wo-fig'] = function () { ui.fig = ui.fig === 'map' ? 'fig' : 'map'; renderWO(); };
  Actions['wo-step'] = function (b) {
    var k = b.getAttribute('data-k'), d = +b.getAttribute('data-d'), inp = $('#wo-' + k), it = itemOf(curStep());
    var v = num(inp.value) || 0;
    if (k === 'w') { var nv = Logic.nextW(v, d); v = nv == null ? (d < 0 ? 0 : v) : nv; }
    else v = Math.max(0, v + d * (it.target.unit === 'sec' ? 5 : 1));
    ui[k] = v; inp.value = fmtN(v); updateDoneLabel();
  };
  Actions['wo-in'] = function (el) { ui[el.getAttribute('data-k')] = num(el.value); updateDoneLabel(); };
  function updateDoneLabel() {
    var st = curStep(); if (!st || st.kind !== 'lift') return; var it = itemOf(st), ex = EX[it.ex], sp = $('.done-btn span'); if (!sp) return;
    sp.textContent = (ex.m === 'kg' ? fmtN(ui.w) + ' كغ × ' : '') + fmtN(ui.r) + (it.target.unit === 'sec' ? ' ث' : ' تكرار') + (it.target.rest ? '، ثم راحة ' + secText(it.target.rest) : '');
    var wv = $$('.numc .v')[2]; if (wv && ex.m === 'kg') wv.textContent = fmtN(ui.w);
  }
  Actions['wo-rir'] = function (b) { var v = +b.getAttribute('data-v'); ui.rir = ui.rir === v ? null : v; $$('.rir button').forEach(function (x) { var on = +x.getAttribute('data-v') === ui.rir; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); };
  Actions['wo-log'] = function () { logSet(); };
  Actions['wo-check-done'] = function () { var st = curStep(), it = itemOf(st); if (!it.sets.length) it.sets.push({r: 1, t: Date.now()}); A().status[st.id] = 'done'; goStep(nextOpen(steps().indexOf(st))); };
  Actions['wo-next'] = function () { var a = A(); if (a.cur === 'summary') return; var all = steps(), i = a.cur; goStep(i + 1 < all.length ? i + 1 : 'summary'); };
  Actions['wo-skip'] = function () {
    var a = A(), st = curStep(); if (!st) return;
    a.status[st.id] = 'skip';
    var it = st.kind === 'lift' ? itemOf(st) : null; if (it && !it.sets.length) it.skipped = true;
    App.toast('تخطيت: ' + (st.kind === 'lift' ? exName(st.ex) : st.n), {action: {label: 'تراجع', fn: function () { delete a.status[st.id]; if (it) it.skipped = false; goStep(steps().indexOf(st)); }}});
    goStep(nextOpen(steps().indexOf(st)));
  };
  Actions['wo-addset'] = function () { var st = curStep(); if (!st || st.kind !== 'lift') return; var it = itemOf(st); it.target.sets++; st.sets = it.target.sets; delete A().status[st.id]; save(); renderWO(); App.toast('أضيفت مجموعة: ' + it.target.sets + ' مجموعات الآن'); };
  Actions['set-edit'] = function (b) {
    var st = curStep(), it = itemOf(st), i = +b.getAttribute('data-i'), s = it.sets[i], ex = EX[it.ex];
    var sh = App.sheet({title: 'المجموعة ' + (i + 1), body: '<div class="logger"' + (ex.m === 'kg' ? '' : ' style="grid-template-columns:1fr"') + '>' + (ex.m === 'kg' ? '<div class="field"><span>الوزن</span><input class="input num" id="se-w" inputmode="decimal" value="' + fmtN(s.w) + '"></div>' : '') + '<div class="field"><span>' + (it.target.unit === 'sec' ? 'الثواني' : 'التكرار') + '</span><input class="input num" id="se-r" inputmode="numeric" value="' + s.r + '"></div></div>' +
      '<button class="btn btn-primary btn-block" data-act="se-save" data-i="' + i + '">احفظ التعديل</button><button class="btn btn-danger btn-block" data-act="se-del" data-i="' + i + '">احذف هذه المجموعة</button>'});
  };
  Actions['se-save'] = function (b) { var st = curStep(), it = itemOf(st), s = it.sets[+b.getAttribute('data-i')]; var w = $('#se-w'); if (w) s.w = num(w.value); s.r = num($('#se-r').value) || s.r; save(); App.closeAllSheets(); ui.stepId = null; renderWO(); App.toast('عُدّلت المجموعة'); };
  Actions['se-del'] = function (b) { var st = curStep(), it = itemOf(st); it.sets.splice(+b.getAttribute('data-i'), 1); delete A().status[st.id]; markLiftDone(st); save(); App.closeAllSheets(); ui.stepId = null; renderWO(); App.toast('حُذفت المجموعة'); };
  Actions['wo-swap'] = function () {
    var st = curStep(); if (!st || st.kind !== 'lift') return;
    var ex = EX[st.ex], alt = ex.alt || {}, orig = EX[itemOf(st).orig], oalt = orig.alt || {};
    var list = [['e', 'أسهل', alt.e], ['h', 'أصعب', alt.h], ['s', 'نفس النمط (بدون الأداة أو مع ألم)', alt.s]];
    if (itemOf(st).orig !== st.ex) list.unshift(['o', 'الأصلي', itemOf(st).orig]);
    if (oalt.s && list.every(function (x) { return x[2] !== oalt.s; })) list.push(['s2', 'بديل آخر', oalt.s]);
    var seen = {};
    var body = '<p class="muted" style="font-size:15px">البديل يشغّل نفس العضلات تقريباً. الاقتراح يُحسب من تاريخ البديل نفسه.</p><div class="list">' + list.filter(function (x) { if (!x[2] || x[2] === st.ex || seen[x[2]] || !Logic.equipOk(x[2])) return false; seen[x[2]] = 1; return true; }).map(function (x) {
      var e = EX[x[2]]; return '<button class="row" data-act="swap-to" data-id="' + x[2] + '">' + figEl(e.fig, 'thumb', e.pm) + '<span class="row-m"><span class="row-t">' + esc(e.n) + '</span><span class="row-s">' + x[1] + ' · ' + esc(e.s) + '</span></span></button>';
    }).join('') + '</div><button class="toggle card flat" id="swap-keep" aria-pressed="false" data-act="swap-keep"><span class="row-m"><span class="row-t" style="font-size:16px">اجعله الافتراضي في هذه الخانة</span><span class="row-s">يظهر البديل في الجلسات القادمة بدل الأصلي</span></span><span class="sw"></span></button>';
    App.sheet({title: 'بدّل ' + ex.n, body: body});
  };
  Actions['swap-keep'] = function (b) { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); };
  Actions['swap-to'] = function (b) {
    var a = A(), st = curStep(), it = itemOf(st), to = b.getAttribute('data-id'), keep = $('#swap-keep') && $('#swap-keep').getAttribute('aria-pressed') === 'true';
    if (keep) S.slotSwap[st.id] = to;
    if (it.sets.length) {
      // keep what was logged on the original, continue the remaining sets on the alternative
      var remaining = Math.max(1, it.target.sets - it.sets.length);
      it.target.sets = it.sets.length; a.status[st.id] = 'done';
      var ns = JSON.parse(JSON.stringify(st)); ns.id = st.id + '~' + uid().slice(-4); ns.ex = to; ns.sets = remaining; ns.pair = null; ns.ladder = null;
      ns.sug = Logic.suggest(ns);
      a.plan.steps.push(ns); a.order.splice(a.order.indexOf(st.id) + 1, 0, ns.id);
      var ni = newItem(ns); ni.orig = it.orig; a.rec.items.push(ni);
      a.cur = steps().indexOf(ns);
    } else {
      st.ex = to; st.ladder = null; it.ex = to; it.ladder = null; st.sug = Logic.suggest(st); it.target.w = st.sug.w;
    }
    ui.stepId = null; save(true); App.closeAllSheets(); renderWO(); App.toast('بدّلت إلى ' + EX[to].n);
  };
  Actions['wo-menu'] = function () {
    App.sheet({title: 'خيارات الجلسة', body: '<div class="list"><button class="row" data-act="wo-list">' + I('reorder') + '<span class="row-m"><span class="row-t">الترتيب والانتقال بين التمارين</span></span></button><button class="row" data-act="wo-finish">' + I('flag') + '<span class="row-m"><span class="row-t">أنهِ الجلسة الآن واحفظ ما تم</span></span></button><button class="row" data-act="wo-min">' + I('chevD') + '<span class="row-m"><span class="row-t">صغّر الجلسة وتنقّل في التطبيق</span></span></button><button class="row" data-act="wo-discard" style="color:var(--bad)">' + I('trash') + '<span class="row-m"><span class="row-t">احذف الجلسة بدون حفظ</span></span></button></div>'});
  };
  Actions['wo-list'] = function () {
    App.closeAllSheets();
    var a = A(), all = steps();
    var body = '<p class="muted" style="font-size:15px">اضغط على أي تمرين للانتقال إليه، أو حرّكه بالأسهم.</p><div class="list">' + all.map(function (s, i) {
      var name = s.kind === 'lift' ? exName(s.ex) : s.n, st = a.status[s.id], it = s.kind === 'lift' ? itemOf(s) : null;
      var sub = st === 'skip' ? 'تخطيت' : st === 'done' ? 'تم' : it ? it.sets.length + ' من ' + it.target.sets + ' مجموعات' : '';
      return '<div class="row ty-' + stepType(s) + '"><button class="row-m" style="border:0;background:none;text-align:start;padding:0" data-act="wo-jump" data-i="' + i + '"><span class="row-t" style="font-size:16px">' + (i === a.cur ? '▸ ' : '') + esc(name) + '</span><span class="row-s">' + sub + '</span></button>' +
        '<button class="icon-btn ghost" data-act="wo-move" data-i="' + i + '" data-d="-1" aria-label="للأعلى"' + (i === 0 ? ' disabled' : '') + '>' + I('chevU') + '</button><button class="icon-btn ghost" data-act="wo-move" data-i="' + i + '" data-d="1" aria-label="للأسفل"' + (i === all.length - 1 ? ' disabled' : '') + '>' + I('chevD') + '</button></div>';
    }).join('') + '</div>';
    App.sheet({title: 'ترتيب الجلسة', body: body});
  };
  Actions['wo-jump'] = function (b) { App.closeAllSheets(); goStep(+b.getAttribute('data-i')); };
  Actions['wo-move'] = function (b) {
    var a = A(), i = +b.getAttribute('data-i'), d = +b.getAttribute('data-d'), j = i + d; if (j < 0 || j >= a.order.length) return;
    var curId = a.cur === 'summary' ? null : a.order[a.cur];
    var t = a.order[i]; a.order[i] = a.order[j]; a.order[j] = t;
    if (curId) a.cur = a.order.indexOf(curId);
    save(); App.closeAllSheets(); Actions['wo-list']();
  };
  Actions['wo-finish'] = function () { App.closeAllSheets(); goStep('summary'); };
  Actions['wo-resume'] = function () { goStep(nextOpen(-1)); };
  Actions['wo-discard'] = function () {
    App.confirm({title: 'حذف الجلسة؟', text: 'كل ما سجّلته في هذه الجلسة سيُحذف ولن يُحفظ.', ok: 'احذف الجلسة', danger: true}).then(function (y) {
      if (!y) return; S.active = null; save(true); App.closeAllSheets(); closeLayer(); App.render(); App.toast('حُذفت الجلسة');
    });
  };
  Actions['rest-add'] = function (b) { var r = A().rest; if (!r) return; r.endsAt += (+b.getAttribute('data-d')) * 1000; r.total = Math.max(r.total, Math.ceil((r.endsAt - Date.now()) / 1000)); r.beeped = false; save(); renderWO(); };
  Actions['rest-skip'] = function () { A().rest = null; save(); clearInterval(tick); var el = $('#rest'); if (el) el.remove(); renderMini(); };
  Actions['ck-toggle'] = function (b) { var a = A(), k = b.getAttribute('data-ex'), d = a.rec.drills[k] = a.rec.drills[k] || {}; d.done = !d.done; save(); renderWO(); };
  Actions['ck-log'] = function (el) { var a = A(), k = el.getAttribute('data-ex'), d = a.rec.drills[k] = a.rec.drills[k] || {}; d.v = num(el.value); if (d.v != null) d.done = true; save(); };
  Actions['ck-timer'] = function (b) { var e = EX[b.getAttribute('data-ex')]; var a = A(), d = a.rec.drills[b.getAttribute('data-ex')] = a.rec.drills[b.getAttribute('data-ex')] || {}; d.done = true; startRest(30, {done: 'إطالة', next: e.n, sub: e.d}); renderWO(); };
  Actions['ck-done'] = function () { var a = A(), st = curStep(); a.status[st.id] = 'done'; st.items.forEach(function (i) { var d = a.rec.drills[i.ex] = a.rec.drills[i.ex] || {}; if (d.done == null) d.done = false; }); goStep(nextOpen(steps().indexOf(st))); };
  Actions['rd-start'] = function () { Rounds.open(curStep()); };
  Actions['rd-manual'] = function () { var st = curStep(); roundsDone(st, st.plan.rounds); };
  Actions['rd-feel'] = function (b) { var a = A(), st = curStep(), r = a.rec.rounds.filter(function (x) { return x.id === st.id; })[0]; if (r) { r.feel = b.getAttribute('data-v'); save(); renderWO(); } };
  function roundsDone(st, doneN) {
    var a = A(), rp = st.plan, r = a.rec.rounds.filter(function (x) { return x.id === st.id; })[0];
    if (!r) { r = {id: st.id, plan: rp.key, total: rp.rounds, len: rp.len, rest: rp.rest, gated: !!rp.gated, done: 0}; a.rec.rounds.push(r); }
    r.done = Math.max(r.done, doneN);
    if (r.done >= r.total) a.status[st.id] = 'done';
    save(true); if (open) renderWO();
  }
  Actions['sm-rpe'] = function (b) { A().rec.rpe = +b.getAttribute('data-v'); save(); renderWO(); };
  Actions['sm-sleep'] = function (b) { A().rec.sleep = b.getAttribute('data-v'); save(); renderWO(); };
  Actions['sm-pain'] = function (b) { var rec = A().rec; rec.pain = rec.pain || {}; rec.pain[b.getAttribute('data-j')] = +b.getAttribute('data-v'); save(); renderWO(); };
  Actions['sm-joint'] = function (b) {
    var j = b.getAttribute('data-k'), rec = A().rec;
    App.sheet({title: 'ألم ' + DATA.joints[j].n, body: painScale('sm-joint-v', rec.pain && rec.pain[j], j) + '<button class="btn btn-tonal" data-act="sm-joint-clear" data-j="' + j + '">لا ألم، احذف</button>'});
  };
  Actions['sm-joint-v'] = function (b) { var rec = A().rec; rec.pain = rec.pain || {}; rec.pain[b.getAttribute('data-j')] = +b.getAttribute('data-v'); save(); App.closeAllSheets(); renderWO(); };
  Actions['sm-joint-clear'] = function (b) { var rec = A().rec; if (rec.pain) delete rec.pain[b.getAttribute('data-j')]; save(); App.closeAllSheets(); renderWO(); };
  Actions['sm-note'] = function (el) { A().rec.note = el.value; save(); };
  Actions['wo-save'] = function () { finish(false); };
  function finish(silent) {
    var a = A(), rec = a.rec, all = steps();
    rec.end = Date.now();
    var incomplete = all.some(function (s) { if (a.status[s.id] === 'done') return false; if (s.kind === 'lift' && (s.optional || s.prot)) return false; return true; });
    rec.status = incomplete ? 'partial' : 'done';
    rec.items = rec.items.filter(function (it) { return it.sets.length || it.skipped; });
    rec.u = Date.now();
    if (rec.pain) Object.keys(rec.pain).forEach(function (j) { S.pain.push({id: uid(), date: rec.date, joint: j, v: rec.pain[j], ctx: 'session', sid: rec.id, u: Date.now()}); });
    S.sessions.push(rec);
    var notes = Logic.afterSession(rec);
    S.active = null; save(true);
    clearInterval(tick); closeLayer();
    App.nav.tab = 'today'; App.nav.stacks.today = []; App.render(); window.scrollTo(0, 0);
    if (!silent) savedSheet(rec, notes);
  }
  function savedSheet(rec, notes) {
    var next = Logic.nextKey(), nsd = DATA.sessions[next];
    var body = '<div class="banner ok">' + I('check') + '<div><b>' + (rec.status === 'done' ? 'جلسة كاملة' : 'حُفظت الجلسة ناقصة') + '</b><p>' + esc(rec.n) + ' · ' + Math.round((rec.end - rec.start) / 60000) + ' دقيقة</p></div></div>';
    if (notes.length) body += '<div class="card"><b>ما تغيّر للمرة القادمة</b><ul class="bul good">' + notes.map(function (n) { return '<li>' + I('up', 'sm') + '<span>' + esc(n) + '</span></li>'; }).join('') + '</ul></div>';
    body += '<div class="card ty-' + nsd.type + '"><span class="muted" style="font-size:14px">الجلسة التالية</span><p style="font-weight:800;font-size:18px">' + esc(nsd.n) + '</p></div><button class="btn btn-primary btn-block" data-act="sheet-close">تمام</button>';
    App.sheet({title: 'أحسنت', body: body});
  }
  // horizontal swipe between steps (RTL: swipe left = next)
  function bindSwipe(wo) {
    var body = $('.wo-body', wo); if (!body) return;
    var x0 = null, y0 = null;
    body.addEventListener('touchstart', function (e) { if (e.target.closest('input,.setpills,.stepper,.pain,.rpe')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive: true});
    body.addEventListener('touchend', function (e) {
      if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 50) return;
      var a = A(), all = steps(); if (a.cur === 'summary') { if (dx > 0) goStep(all.length - 1); return; }
      if (dx < 0) goStep(a.cur + 1 < all.length ? a.cur + 1 : 'summary'); else if (a.cur > 0) goStep(a.cur - 1);
    });
  }
  // ---------- mini player ----------
  function renderMini() {
    var m = $('#mini');
    if (!S.active || open || !S.onboarded) { m.hidden = true; m.innerHTML = ''; return; }
    var a = A(), st = a.cur === 'summary' ? null : curStep(), ty = st ? stepType(st) : DATA.sessions[a.key].type;
    var title = st ? (st.kind === 'lift' ? exName(st.ex) : st.n) : 'ملخص الجلسة', sub = a.plan.n;
    if (st && st.kind === 'lift') { var it = itemOf(st); sub = 'المجموعة ' + Math.min(it.sets.length + 1, it.target.sets) + ' من ' + it.target.sets + ' · ' + a.plan.n; }
    m.hidden = false;
    m.innerHTML = '<div class="mini-in ty-' + ty + '"><span class="mini-dot">' + I(ty) + '</span><button class="mini-m" data-act="wo-open" aria-label="افتح الجلسة"><span class="mini-t">' + esc(title) + '</span><span class="mini-s">' + esc(sub) + '</span></button><span class="mini-time num" id="mini-time"></span><button class="icon-btn" data-act="wo-open" aria-label="افتح الجلسة">' + I('chevU') + '</button></div>';
    renderMiniTime();
    if (a.rest) startTick();
  }
  function renderMiniTime() {
    var el = $('#mini-time'); if (!el) return; var a = A(); if (!a) return;
    if (a.rest) { var left = Math.ceil((a.rest.endsAt - Date.now()) / 1000); el.textContent = left > 0 ? mmss(left) : 'ابدأ'; }
    else el.textContent = mmss((Date.now() - a.startedAt) / 1000).replace(/^(\d+):/, '$1:');
  }
  setInterval(function () { if (S.active && !open) renderMiniTime(); }, 1000);
  return {start: start, show: show, minimize: minimize, isOpen: isOpen, renderMini: renderMini, roundsDone: roundsDone, render: renderWO, A: A, steps: steps};
})();
