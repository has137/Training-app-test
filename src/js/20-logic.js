/* Program logic. Pure functions over DATA and S, except afterSession() which advances progression state. */
var Logic = (function () {
  // ---------- program calendar ----------
  function rawWeek(d) { if (!S.prog.start) return 1; return Math.max(1, Math.floor(daysBetween(S.prog.start, d || today()) / 7) + 1); }
  function week(d) { return Math.max(1, rawWeek(d) + (S.prog.weekAdj || 0)); }
  function cycleWeek(w) { return w <= 14 ? w : 5 + ((w - 15) % 10); }
  function phaseFor(w) { var cw = cycleWeek(w); return DATA.phases.filter(function (p) { return cw >= p.from && cw <= p.to; })[0] || DATA.phases[0]; }
  function stageFor(w) {
    var cw = cycleWeek(w), ph = phaseFor(w);
    var manual = !!(S.prog.deloadUntil && today() <= S.prog.deloadUntil);
    return {week: w, cw: cw, ph: ph, deload: !!ph.deload || manual, manualDeload: manual, early: ph.id === 'p1' && cw <= 2, mid: ph.id === 'p1' && cw > 2};
  }
  function stage() { return stageFor(week()); }

  // ---------- history ----------
  function sorted() { return S.sessions.slice().sort(function (a, b) { return (b.start || 0) - (a.start || 0); }); }
  function programSessions() { return sorted().filter(function (s) { return s.key && DATA.sessions[s.key]; }); }
  function trainingSessions() { return programSessions().filter(function (s) { return !DATA.sessions[s.key].rest; }); }
  function lastTraining() { return trainingSessions()[0] || null; }
  function perfs(exId, excludeId) {
    var out = [];
    sorted().forEach(function (s) {
      if (excludeId && s.id === excludeId) return;
      (s.items || []).forEach(function (it) {
        if (it.ex === exId && it.sets && it.sets.length) out.push({date: s.date, sid: s.id, sets: it.sets, target: it.target || {}, slot: it.slot, ladder: it.ladder});
      });
    });
    return out;
  }
  function bestValue(exId) {
    var best = null;
    S.sessions.forEach(function (s) {
      var d = s.drills && s.drills[exId];
      if (d && d.v != null && (best == null || d.v > best)) best = d.v;
      (s.items || []).forEach(function (it) { if (it.ex === exId) (it.sets || []).forEach(function (st) { if (st.r != null && (best == null || st.r > best)) best = st.r; }); });
    });
    return best;
  }
  function rotation() { return S.profile.days >= 5 ? DATA.rotation5 : DATA.rotation4; }
  function nextKey() {
    var rot = rotation(), list = trainingSessions();
    for (var i = 0; i < list.length; i++) { var k = rot.indexOf(list[i].key); if (k >= 0) return rot[(k + 1) % rot.length]; }
    return rot[0];
  }
  function lastOf(key) { return programSessions().filter(function (s) { return s.key === key; })[0] || null; }
  function doneToday() { return trainingSessions().filter(function (s) { return s.date === today(); }); }

  // ---------- return after a break ----------
  function retMode() {
    var last = lastTraining();
    if (last) {
      var gap = daysAgo(last.date), rule = DATA.missed.filter(function (m) { return gap >= m.from && gap <= m.to; })[0];
      if (rule && rule.mode) return {mode: rule.mode, gap: gap, f: rule.mode === 'weeks' ? 0.9 : (rule.mode === 'month' ? 0.85 : 1), fresh: true, t: rule.t};
    }
    if (S.prog.ret && S.prog.ret.left > 0) return {mode: S.prog.ret.mode, f: S.prog.ret.f, fresh: false, t: 'جلسة ثانية بعد الانقطاع: أوزان مخفّفة وجهد أخف.'};
    return null;
  }

  // ---------- equipment ----------
  function equipOk(exId) { var e = EX[exId]; if (!e) return false; return (e.eq || []).every(function (q) { return S.profile.equip[q] !== false; }); }
  function equipFix(exId) {
    if (equipOk(exId)) return exId;
    var a = EX[exId].alt || {};
    var tries = [a.s, a.e, a.h];
    for (var i = 0; i < tries.length; i++) if (tries[i] && equipOk(tries[i])) return tries[i];
    return null;
  }
  function weights() {
    var l = String(S.profile.dbList || '').split(/[,،\s]+/).map(num).filter(function (x) { return x != null && x > 0; });
    l.sort(function (a, b) { return a - b; });
    return l.length ? l : null;
  }
  function maxDb() { var l = weights(); return l ? l[l.length - 1] : (+S.profile.maxDb || 20); }
  function stepKg() { return +S.profile.dbStep || 2.5; }
  function roundW(w) {
    if (w == null) return null;
    var l = weights();
    if (l) { var best = l[0]; l.forEach(function (x) { if (x <= w + 1e-9) best = x; }); return best; }
    var st = stepKg(); return Math.max(st, Math.round(w / st) * st);
  }
  function nextW(w, dir) {
    var l = weights();
    if (l) {
      if (dir > 0) { for (var i = 0; i < l.length; i++) if (l[i] > w + 1e-9) return l[i]; return null; }
      for (var j = l.length - 1; j >= 0; j--) if (l[j] < w - 1e-9) return l[j]; return null;
    }
    var v = Math.round((w + dir * stepKg()) * 100) / 100;
    return v > 0 ? v : null;
  }

  // ---------- ladders ----------
  function ladderLevel(name) { return clamp(S.ladders[name] == null ? 1 : S.ladders[name], 0, DATA.ladders[name].steps.length - 1); }
  function ladderStep(name) { return DATA.ladders[name].steps[ladderLevel(name)]; }
  function pushupEx() { var st = ladderStep('pushup'); return st.ex; }

  // ---------- ankle ----------
  function anklePhase() { return DATA.ankle.phases[clamp(S.ankle.phase, 1, 4) - 1]; }
  function ankleDrills(slot) { return (anklePhase().sets[slot] || []).slice(); }
  function critState(c) {
    var a = c.auto, r = {ok: false, hint: ''};
    if (a) {
      if (a.type === 'best') { var b = bestValue(a.ex); r.ok = b != null && b >= a.gte; r.hint = b == null ? 'لم تسجّل هذا التمرين بعد' : 'أفضل رقم مسجّل: ' + fmtN(b); }
      else if (a.type === 'painMax') {
        var l = S.pain.filter(function (p) { return p.joint === a.joint && daysAgo(p.date) < a.days; });
        if (!l.length) r.hint = 'سجّل ألم الكاحل من تبويب المفاصل';
        else { var mx = Math.max.apply(null, l.map(function (p) { return p.v; })); r.ok = mx <= a.lte; r.hint = 'أعلى ألم في آخر ' + a.days + ' أيام: ' + mx; }
      } else if (a.type === 'ropeLevel') { r.ok = S.rope.level >= a.gte; r.hint = 'درجة الحبل الحالية: ' + (S.rope.level + 1) + ' من ' + DATA.ropeLevels.length; }
    }
    if (S.ankle.crit[c.k]) { r.ok = true; r.manual = true; }
    return r;
  }
  function ankleReady() { var ph = anklePhase(); return ph.crit.length > 0 && ph.crit.every(function (c) { return critState(c).ok; }); }
  function phaseFromIntake(q) {
    if (q.pain >= 4 || q.when === 'recent' && q.pain >= 2) return 1;
    if (q.hop === 'yes' && q.pain === 0) return q.when === 'old' ? 4 : 3;
    if (q.hop === 'some' || q.pain <= 2) return 2;
    return 1;
  }

  // ---------- boxing lesson ----------
  function lesson() {
    if (S.prog.lesson) { var o = DATA.lessons.filter(function (l) { return l.id === S.prog.lesson; })[0]; if (o) return o; }
    var cw = cycleWeek(week()), id = DATA.lessonByWeek[clamp(cw - 1, 0, DATA.lessonByWeek.length - 1)];
    return DATA.lessons.filter(function (l) { return l.id === id; })[0] || DATA.lessons[0];
  }
  function comboLevel() { var cw = cycleWeek(week()); return cw <= 2 ? 1 : cw <= 4 ? 2 : cw <= 6 ? 3 : cw <= 9 ? 4 : 5; }

  // ---------- round plans ----------
  function roundSpec(key, st, short) {
    var rp = DATA.roundPlans[key];
    if (!rp) return null;
    var jumpOk = S.ankle.phase >= 3;
    if (key === 'rope') {
      var ok = jumpOk && S.profile.equip.rope !== false;
      var lv = DATA.ropeLevels[clamp(S.rope.level, 0, DATA.ropeLevels.length - 1)];
      var n = lv.n; if (short) n = Math.max(2, Math.round(n / 2)); if (st.deload) n = Math.max(2, Math.ceil(n / 2));
      var src = ok ? rp : DATA.roundPlans[rp.fallback];
      var rounds = [];
      for (var i = 0; i < n; i++) rounds.push({k: ok ? 'حبل' : 'شادو', t: ok ? (lv.bursts ? 'نط مع دفعات سرعة' : 'نط على المشط') : 'لكمات وحركة بدون نطّ',
        d: ok ? (lv.bursts ? 'إيقاع مريح، ومع كل دفعة سرعة 20 ثانية أسرع ما تستطيع.' : 'قفزات منخفضة، والحبل يدور من الرسغين. ألم الكاحل أكثر من 2 يعني توقف.') : 'لكمات مستقيمة متواصلة مع خطوات صغيرة على الأرض. لا نطّ على مشط القدم حتى المرحلة 3 للكاحل.'});
      return {key: key, n: src.n, type: 'conditioning', fig: src.fig, intro: src.intro, gated: !ok, level: S.rope.level, rounds: n, len: lv.work, rest: lv.rest, items: rounds, bursts: !!lv.bursts};
    }
    var cfg = Object.assign({}, rp.base);
    if (rp.p2 && (st.ph.id === 'p2' || st.ph.id === 'd1')) Object.assign(cfg, rp.p2);
    if (rp.p3 && (st.ph.id === 'p3' || st.ph.id === 'd2')) Object.assign(cfg, rp.p3);
    Object.assign(cfg, S.roundAdj[key] || {});
    if (st.deload && rp.deload) cfg.rounds = Math.min(cfg.rounds, rp.deload.rounds);
    if (key === 'circuit') {
      var segs = rp.segs.map(function (sg) {
        var ex = sg.ladder ? pushupEx() : sg.ex;
        if (sg.gate && S.ankle.phase < sg.gate) ex = sg.fallback;
        return {ex: ex, sec: sg.sec};
      });
      return {key: key, n: rp.n, type: rp.type, fig: rp.fig, intro: rp.intro, rounds: cfg.rounds, len: cfg.len, rest: cfg.rest, segs: segs};
    }
    var L = lesson(), noBag = (rp.eq || []).some(function (q) { return S.profile.equip[q] === false; });
    var items = [];
    for (var j = 0; j < cfg.rounds; j++) {
      var tpl = rp.rounds[j % rp.rounds.length];
      var d = tpl.d.replace('{shadow}', L.shadow).replace('{bag}', noBag ? L.shadow : L.bag);
      if (!jumpOk) d += ' الخطوات على الأرض بدون نطّ.';
      items.push({k: noBag ? 'شادو' : tpl.k, t: tpl.t, d: d});
    }
    return {key: key, n: noBag ? rp.n.replace('كيس', 'شادو') : rp.n, type: rp.type, fig: noBag ? 'shadow' : rp.fig, intro: rp.intro, wraps: rp.wraps && !noBag, rounds: cfg.rounds, len: cfg.len, rest: cfg.rest, items: items, lesson: L.id};
  }

  // ---------- plan ----------
  function liftItem(key, it, st, ret) {
    var slotId = key + '.' + it.id, exId = it.ex, sets = it.sets, reps = it.reps.slice(), rir = it.rir, unit = it.unit || null;
    if (it.ladder) {
      var lv = ladderStep(it.ladder);
      exId = lv.ex; if (it.slot === 'chinup') exId = DATA.ladderMap.chinup[exId] || exId;
      sets = it.slot === 'chinup' ? Math.min(3, lv.sets) : lv.sets; reps = lv.reps.slice();
    }
    if (S.slotSwap[slotId] && EX[S.slotSwap[slotId]]) exId = S.slotSwap[slotId];
    exId = equipFix(exId);
    if (!exId) return null;
    var ex = EX[exId];
    if (st.ph.id === 'p3' && it.p3 && !it.ladder) { if (it.p3.reps) reps = it.p3.reps.slice(); if (it.p3.sets) sets = it.p3.sets; }
    if (rir > 0) { if (st.early) rir = Math.max(rir, 3); else if (st.mid) rir = Math.max(rir, 2); }
    if (st.early && sets >= 4) sets -= 1;
    if (st.deload) { sets = Math.max(1, Math.ceil(sets / 2)); if (rir > 0) rir = Math.max(rir, 3); }
    if (ret && ret.mode === 'week') sets = Math.max(1, sets - 1);
    if (ret && (ret.mode === 'weeks' || ret.mode === 'month') && rir > 0) rir = Math.max(rir, 3);
    if (!unit) unit = ex.m === 'sec' ? 'sec' : (ex.m === 'check' ? 'check' : null);
    var item = {id: slotId, slot: it.id, kind: 'lift', ex: exId, orig: exId, pair: it.pair || null, sets: sets, reps: reps, rir: rir, rest: it.rest, unit: unit,
      ladder: it.ladder || null, slotKind: it.slot || null, acc: !!it.acc, core: !!it.core, prot: !!it.prot, power: !!it.power, optional: !!it.optional, f: ret && ret.f ? ret.f : 1};
    item.sug = suggest(item);
    return item;
  }
  function buildPlan(key) {
    var sd = DATA.sessions[key], ret = retMode(), w = week();
    if (ret && ret.fresh) { if (ret.mode === 'month') w = 3; else if (ret.mode === 'weeks') w = Math.max(1, w - Math.floor((ret.gap - 7) / 7)); }
    var st = stageFor(w), steps = [];
    sd.blocks.forEach(function (b, bi) {
      if (b.k === 'warm' || b.k === 'stretch') {
        var items = [];
        b.items.forEach(function (it) {
          if (it.rehab) ankleDrills(it.rehab).forEach(function (x) { items.push({ex: x, rehab: true}); });
          else items.push({ex: it.ex});
        });
        items = items.filter(function (i) { return equipOk(i.ex); });
        if (items.length) steps.push({id: key + '.' + b.k + bi, kind: b.k, n: b.n, min: b.min, items: items});
      } else if (b.k === 'rounds') {
        var rp = roundSpec(b.plan, st, b.short);
        if (rp) steps.push({id: key + '.r' + bi, kind: 'rounds', n: rp.n, plan: rp});
      } else if (b.k === 'lift') {
        b.items.forEach(function (it) { var li = liftItem(key, it, st, ret); if (li) steps.push(li); });
      }
    });
    return {key: key, n: sd.n, type: sd.type, week: w, phase: st.ph.id, phaseName: st.ph.n, deload: st.deload, ret: ret ? ret.mode : null, retText: ret ? ret.t : null, steps: steps};
  }
  function planSummary(plan) {
    var lifts = plan.steps.filter(function (s) { return s.kind === 'lift' && !s.core && !s.prot; }).length;
    var rounds = plan.steps.filter(function (s) { return s.kind === 'rounds'; });
    var rehab = plan.steps.some(function (s) { return s.items && s.items.some(function (i) { return i.rehab; }); });
    return {lifts: lifts, rounds: rounds, rehab: rehab};
  }

  // ---------- suggestion engine ----------
  function workingWeight(sets) {
    var c = {}, best = null, bc = 0;
    sets.forEach(function (s) { var w = s.w || 0; c[w] = (c[w] || 0) + 1; if (c[w] > bc || (c[w] === bc && w > best)) { bc = c[w]; best = w; } });
    return best;
  }
  function suggest(item) {
    var ex = EX[item.ex], lo = item.reps[0], hi = item.reps[1];
    var es = S.exState[item.ex] || {};
    var res = {w: null, r: hi, lo: lo, hi: hi, code: 'first', msg: '', tech: null, prev: null, harder: null, esHi: null};
    if (ex.m === 'check' || item.unit === 'check') { res.code = 'check'; res.msg = 'نفّذها وضع علامة عند الانتهاء.'; return res; }
    var isKg = ex.m === 'kg';
    if (isKg && es.hi) { hi = es.hi; res.hi = hi; res.esHi = es.hi; }
    if (isKg && es.stage) { res.tech = DATA.maxedSteps[clamp(es.stage, 0, DATA.maxedSteps.length - 1)]; if (es.stage >= 4) res.harder = (ex.alt || {}).h || null; }
    var ps = perfs(item.ex), last = ps[0];
    if (!last) {
      if (isKg) res.w = ex.kg ? roundW(Math.min(ex.kg, maxDb())) : null;
      res.r = isKg ? hi : lo;
      res.code = 'first';
    } else {
      res.prev = last;
      var done = last.sets, tSets = (last.target && last.target.sets) || item.sets, lastRir = last.target ? last.target.rir : null;
      var partial = done.length < Math.ceil(tSets / 2);
      if (isKg) {
        var lw = workingWeight(done), atW = done.filter(function (s) { return (s.w || 0) === lw; });
        var need = Math.min(tSets, item.sets);
        var topCount = atW.filter(function (s) { return s.r >= hi; }).length;
        var allTop = topCount >= need;
        var hard = lastRir > 0 && atW.some(function (s) { return s.rir != null && s.rir < lastRir - 1; });
        var below = atW.some(function (s) { return s.r < lo; });
        if (partial) { res.code = 'partial'; res.w = lw; res.r = lo; }
        else if (allTop && !hard) {
          var nw = nextW(lw, 1);
          if (nw != null && nw <= maxDb() + 1e-9 && !es.stage && !es.hi) { res.code = 'up'; res.w = nw; res.r = lo; res.from = lw; }
          else { res.code = 'maxed'; res.w = lw; res.r = hi; }
        } else if (allTop && hard) { res.code = 'hard'; res.w = lw; res.r = hi; }
        else if (below) {
          var p2 = ps[1], prevBelow = p2 && workingWeight(p2.sets) === lw && p2.sets.some(function (s) { return (s.w || 0) === lw && s.r < lo; });
          if (prevBelow && nextW(lw, -1) != null) { res.code = 'down'; res.w = nextW(lw, -1); res.r = lo; res.from = lw; }
          else { res.code = 'low'; res.w = lw; res.r = lo; }
        } else {
          var minR = Math.min.apply(null, atW.map(function (s) { return s.r; }));
          res.code = 'reps'; res.w = lw; res.r = clamp(minR + 1, lo, hi);
        }
        if (item.f && item.f < 1 && res.w) { res.w = roundW(res.w * item.f); res.retAdj = item.f; }
      } else {
        var allTop2 = done.length >= tSets && done.slice(0, tSets).every(function (s) { return s.r >= hi; });
        var minV = Math.min.apply(null, done.map(function (s) { return s.r || 0; }));
        if (partial) { res.code = 'partial'; res.r = lo; }
        else if (allTop2) {
          if (item.ladder) { res.code = 'ladder'; res.r = hi; }
          else if (ex.m === 'sec') { res.code = 'up'; res.r = Math.min(hi + 5, (ex.cap || hi + 30)); }
          else { res.code = 'top'; res.r = hi; res.harder = (ex.alt || {}).h && ex.alt.h !== item.ex ? ex.alt.h : null; }
        } else { res.code = 'reps'; res.r = clamp(minV + (ex.m === 'sec' ? 5 : 1), lo, hi); }
      }
    }
    res.msg = sugMsg(res, ex, item);
    return res;
  }
  function kg(w) { return fmtN(w) + ' كغ'; }
  function sugMsg(r, ex, item) {
    var unitW = item.unit === 'sec' ? 'ث' : 'تكرار', m = '';
    switch (r.code) {
      case 'first': m = ex.m === 'kg' ? (r.w ? 'أول مرة: ابدأ بوزن قريب من ' + kg(r.w) + '. اختر وزناً تصل به ' + r.hi + ' ' + unitW + ' ويبقى عندك ' + Math.max(item.rir, 2) + '.' : 'أول مرة: اختر وزناً تصل به ' + r.hi + ' ويبقى عندك تكراران.') : 'أول مرة: سجّل ما تستطيعه بأداء نظيف، وهذا رقمك المرجعي.'; break;
      case 'up': m = ex.m === 'kg' ? 'أكملت ' + r.hi + ' في كل المجموعات بـ ' + kg(r.from) + '. زِد إلى ' + kg(r.w) + ' وابدأ من ' + r.lo + '.' : 'وصلت الهدف. زِد إلى ' + r.r + ' ث.'; break;
      case 'reps': m = ex.m === 'kg' ? 'نفس الوزن. أضف تكراراً في المجموعات التي لم تصل ' + r.hi + '.' : 'أضف قليلاً عن المرة السابقة حتى تصل ' + r.hi + '.'; break;
      case 'low': m = 'نزلت تحت ' + r.lo + ' في مجموعة. نفس الوزن، والهدف ' + r.lo + ' على الأقل في كل مجموعة.'; break;
      case 'down': m = 'نزلت تحت ' + r.lo + ' مرتين متتاليتين. أنقص الوزن إلى ' + kg(r.w) + ' وابنِ من جديد.'; break;
      case 'hard': m = 'وصلت ' + r.hi + ' لكن بجهد أعلى من المطلوب. ثبّت الوزن مرة أخرى حتى يصبح أسهل.'; break;
      case 'partial': m = 'المرة السابقة لم تكتمل. نفس الوزن ونفس الهدف.'; break;
      case 'maxed': m = 'وصلت لأثقل دمبل لديك (' + kg(maxDb()) + ').'; break;
      case 'ladder': m = 'أكملت هدف هذه الدرجة. كرّرها اليوم، وإذا أكملتها مرة ثانية تنتقل للدرجة التالية.'; break;
      case 'top': m = 'أكملت الهدف.' + (r.harder ? ' جرّب الأصعب: ' + EX[r.harder].n + '.' : ''); break;
    }
    if (r.tech) m += (m ? ' ' : '') + 'التقنية الآن: ' + r.tech.n + '. ' + r.tech.d;
    if (r.code === 'maxed' && !r.tech) m += ' ارفع الهدف إلى ' + r.hi + ' تكراراً.';
    else if (r.esHi && !r.tech && r.code !== 'first') m += ' وصلت لأثقل دمبل لديك، فارتفع الهدف إلى ' + r.esHi + ' تكراراً.';
    if (r.retAdj) m += ' بعد الانقطاع: ' + Math.round(r.retAdj * 100) + '% من الوزن.';
    return m;
  }
  // after saving: advance maxed-out techniques and ladders; returns notes for the summary
  function afterSession(rec) {
    var notes = [];
    (rec.items || []).forEach(function (it) {
      if (it.kind !== 'lift' || !it.sets || !it.sets.length || !EX[it.ex]) return;
      var ex = EX[it.ex], t = it.target || {};
      if (ex.m === 'kg') {
        var es = S.exState[it.ex] || {stage: 0};
        var lw = workingWeight(it.sets), hi = es.hi || (t.reps ? t.reps[1] : 99);
        var atW = it.sets.filter(function (s) { return (s.w || 0) === lw; });
        var allTop = atW.length >= (t.sets || 1) && atW.every(function (s) { return s.r >= hi; });
        if (lw < maxDb() - 1e-9 && nextW(lw, 1) != null && nextW(lw, 1) <= maxDb() + 1e-9) { if (es.stage || es.hi) delete S.exState[it.ex]; }
        else if (allTop) {
          var cap = ex.cap || 20;
          if (!es.stage) {
            var cur = es.hi || (t.reps ? t.reps[1] : 12);
            if (cur < cap) { es.hi = Math.min(cap, cur + 2); notes.push(ex.n + ': أثقل دمبل لديك أصبح خفيفاً. الهدف القادم ' + es.hi + ' تكراراً.'); }
            else { es.stage = 1; delete es.hi; notes.push(ex.n + ': التقنية القادمة: ' + DATA.maxedSteps[1].n + '.'); }
          } else if (es.stage < 4) { es.stage++; notes.push(ex.n + ': التقنية القادمة: ' + DATA.maxedSteps[es.stage].n + '.'); }
          S.exState[it.ex] = es;
        }
      }
      if (it.ladder) {
        var met = function (sets, tt) { return sets.length >= (tt.sets || 1) && sets.slice(0, tt.sets).every(function (s) { return s.r >= tt.reps[1]; }); };
        if (met(it.sets, t)) {
          var prev = perfs(it.ex, rec.id)[0];
          if (prev && met(prev.sets, prev.target || t)) {
            var L = DATA.ladders[it.ladder], lv = ladderLevel(it.ladder);
            if (lv < L.steps.length - 1) { S.ladders[it.ladder] = lv + 1; notes.push(L.n + ': انتقلت للدرجة ' + (lv + 2) + ': ' + EX[L.steps[lv + 1].ex].n + '.'); }
          }
        }
      }
    });
    // rounds feedback: one change per plan per week
    (rec.rounds || []).forEach(function (r) {
      if (!r.feel || r.done < r.total) return;
      var adj = S.roundAdj[r.plan] || {}, last = adj.changed;
      if (last && daysAgo(last) < 7) return;
      if (r.plan === 'rope') {
        if (!r.gated && r.feel !== 'hard' && (rec.pain == null || rec.pain.ankle == null || rec.pain.ankle <= 2) && S.rope.level < DATA.ropeLevels.length - 1 && (!S.rope.changed || daysAgo(S.rope.changed) >= 7)) {
          S.rope.level++; S.rope.changed = today(); notes.push('الحبل: انتقلت للدرجة ' + (S.rope.level + 1) + '.');
        }
        return;
      }
      if (r.plan === 'circuit') return;
      var rp = DATA.roundPlans[r.plan];
      if (r.feel === 'easy') {
        if (r.total < 6) { adj.rounds = r.total + 1; notes.push(rp.n + ': جولة إضافية في المرة القادمة.'); }
        else if (r.len < 180) { adj.len = r.len + 30; notes.push(rp.n + ': الجولة أطول 30 ثانية في المرة القادمة.'); }
        adj.changed = today(); S.roundAdj[r.plan] = adj;
      } else if (r.feel === 'hard' && r.total > 2) { adj.rounds = r.total - 1; adj.changed = today(); S.roundAdj[r.plan] = adj; notes.push(rp.n + ': جولة أقل في المرة القادمة.'); }
    });
    // return-after-break bookkeeping
    var ret = rec.ret;
    if (ret === 'weeks' || ret === 'month') {
      if (!S.prog.ret || S.prog.ret.left <= 0) {
        var gap = rec.gap || 0;
        if (ret === 'month') S.prog.weekAdj = 3 - rawWeek(rec.date);
        else S.prog.weekAdj = (S.prog.weekAdj || 0) - Math.floor((gap - 7) / 7);
        S.prog.ret = {mode: ret, left: 1, f: ret === 'weeks' ? 0.9 : 0.85};
      } else S.prog.ret.left--;
      if (S.prog.ret && S.prog.ret.left <= 0) S.prog.ret = null;
    }
    return notes;
  }

  // ---------- volume ----------
  function volumeBetween(from, to) {
    var v = {}; for (var m in DATA.muscles) v[m] = 0;
    S.sessions.forEach(function (s) {
      if (s.date < from || s.date > to) return;
      (s.items || []).forEach(function (it) {
        var ex = EX[it.ex]; if (!ex || !it.sets) return;
        var n = it.sets.length; if (!n) return;
        (ex.pm || []).forEach(function (m) { v[m] += n; });
        (ex.sm || []).forEach(function (m) { v[m] += n * 0.5; });
      });
    });
    return v;
  }
  function plannedVolume() {
    var v = {}; for (var m in DATA.muscles) v[m] = 0;
    DATA.rotation4.forEach(function (k) {
      DATA.sessions[k].blocks.forEach(function (b) {
        if (b.k !== 'lift') return;
        b.items.forEach(function (it) {
          var exId = it.ladder ? ladderStep(it.ladder).ex : it.ex; if (it.slot === 'chinup') exId = DATA.ladderMap.chinup[exId] || exId;
          var ex = EX[exId], n = it.sets;
          (ex.pm || []).forEach(function (m) { v[m] += n; }); (ex.sm || []).forEach(function (m) { v[m] += n * 0.5; });
        });
      });
    });
    return v;
  }
  function heat(v) { var h = {}; for (var m in v) { var t = DATA.muscles[m].target, x = v[m] / t[0]; h[m] = v[m] <= 0 ? 0 : x < 0.34 ? 1 : x < 0.67 ? 2 : x < 1 ? 3 : 4; } return h; }

  // ---------- signals ----------
  function deloadSigns() {
    var since = addDays(today(), -7), rec = S.sessions.filter(function (s) { return s.date > since && s.key !== 'free'; }), out = [];
    if (rec.filter(function (s) { return s.sleep === 'bad'; }).length >= 2) out.push('sleep');
    if (S.pain.some(function (p) { return p.date > since && p.v >= 4; })) out.push('pain');
    if (rec.filter(function (s) { return s.rpe >= 9; }).length >= 2) out.push('rpe');
    if (dropDetected()) out.push('drop');
    return out;
  }
  function dropDetected() {
    var seen = {};
    for (var i = 0; i < S.sessions.length; i++) (S.sessions[i].items || []).forEach(function (it) { seen[it.ex] = 1; });
    return Object.keys(seen).some(function (id) {
      var p = perfs(id).slice(0, 3);
      if (p.length < 3 || daysAgo(p[0].date) > 7) return false;
      var w = workingWeight(p[0].sets);
      if (p.some(function (x) { return workingWeight(x.sets) !== w; })) return false;
      var tot = p.map(function (x) { return x.sets.reduce(function (a, s) { return a + (s.r || 0); }, 0); });
      return tot[0] < tot[1] && tot[1] < tot[2];
    });
  }
  function testsDue() {
    if (!S.prog.start) return false;
    var cw = cycleWeek(week());
    if (DATA.testWeeks.indexOf(cw) < 0) return false;
    var ws = addDays(S.prog.start, (rawWeek() - 1) * 7);
    return !S.tests.some(function (t) { return t.date >= ws; });
  }
  function lastTest(id) {
    var l = S.tests.filter(function (t) { return t.res && t.res[id] != null; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return l;
  }
  function weekCount() {
    var ws = weekStart(today());
    return trainingSessions().filter(function (s) { return s.date >= ws; });
  }
  function series(exId) {
    var ex = EX[exId];
    return perfs(exId).reverse().map(function (p) {
      var y = 0, lbl = '';
      p.sets.forEach(function (s) {
        var v = ex.m === 'kg' && s.w ? s.w * (1 + (s.r || 0) / 30) : (s.r || 0);
        if (v > y) { y = v; lbl = ex.m === 'kg' && s.w ? fmtN(s.w) + '×' + s.r : String(s.r); }
      });
      return {date: p.date, y: Math.round(y * 10) / 10, lbl: lbl, sets: p.sets};
    });
  }
  function proteinRange() { var w = +S.profile.weight || 0; return [Math.round(w * DATA.nutrition.protein[0]), Math.round(w * DATA.nutrition.protein[1])]; }
  function weeklyWeights() {
    var g = {};
    S.body.forEach(function (b) { if (b.w == null) return; var k = weekStart(b.date); (g[k] = g[k] || []).push(b.w); });
    return Object.keys(g).sort().map(function (k) { var a = g[k]; return {date: k, y: Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length * 10) / 10, n: a.length}; });
  }

  return {rawWeek: rawWeek, week: week, cycleWeek: cycleWeek, stage: stage, stageFor: stageFor, sorted: sorted, programSessions: programSessions, trainingSessions: trainingSessions,
    lastTraining: lastTraining, perfs: perfs, bestValue: bestValue, rotation: rotation, nextKey: nextKey, lastOf: lastOf, doneToday: doneToday, retMode: retMode,
    equipOk: equipOk, maxDb: maxDb, stepKg: stepKg, roundW: roundW, nextW: nextW, weights: weights, ladderLevel: ladderLevel, ladderStep: ladderStep, pushupEx: pushupEx,
    anklePhase: anklePhase, ankleDrills: ankleDrills, critState: critState, ankleReady: ankleReady, phaseFromIntake: phaseFromIntake,
    lesson: lesson, comboLevel: comboLevel, roundSpec: roundSpec, buildPlan: buildPlan, planSummary: planSummary, liftItem: liftItem,
    workingWeight: workingWeight, suggest: suggest, afterSession: afterSession, volumeBetween: volumeBetween, plannedVolume: plannedVolume, heat: heat,
    deloadSigns: deloadSigns, testsDue: testsDue, lastTest: lastTest, weekCount: weekCount, series: series, proteinRange: proteinRange, weeklyWeights: weeklyWeights};
})();
