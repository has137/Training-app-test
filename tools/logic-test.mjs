// Logic tests for progression rules, run inside the built page.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/index.html');
const res = await p.evaluate(() => {
  const out = [];
  const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const base = () => { const s = JSON.parse(JSON.stringify(AZM.S())); s.onboarded = true; s.prog.start = day(30); s.prog.weekAdj = 0; s.sessions = []; s.exState = {}; s.ladders = {pullup: 4, pushup: 1}; s.profile.maxDb = 20; s.profile.dbStep = 2.5; s.profile.dbList = ''; s.active = null; s.prog.ret = null; s.prog.deloadUntil = null; return s; };
  const sess = (key, daysAgo, items) => ({id: Math.random().toString(36).slice(2), key, n: key, date: day(daysAgo), start: Date.now() - daysAgo * 864e5, end: Date.now() - daysAgo * 864e5 + 3e6, status: 'done', items, rounds: [], u: 1});
  const it = (ex, sets, target) => ({id: 's2.a1', slot: 'a1', kind: 'lift', ex, orig: ex, target, sets: sets.map(([w, r, rir]) => ({w, r, rir: rir == null ? null : rir}))});
  const G = {sets: 4, reps: [8, 12], rir: 2};
  // 1) maxed out: goblet 20 kg (max) x12 all sets -> afterSession raises ceiling to 14
  let s = base(); AZM.setS(s);
  let rec = sess('s2', 3, [it('goblet', [[20, 12], [20, 12], [20, 12], [20, 12]], G)]);
  AZM.S().sessions.push(rec); let notes = AZM.Logic.afterSession(rec);
  let es = AZM.S().exState.goblet;
  ok(es && es.hi === 14, 'maxed dumbbell: ceiling 12 -> 14 (got ' + JSON.stringify(es) + ')');
  let sg = AZM.Logic.suggest({ex: 'goblet', reps: [8, 12], sets: 4, rir: 2, f: 1});
  ok(sg.w === 20 && sg.hi === 14 && sg.code === 'reps', 'maxed: same 20 kg, target up to 14 (got ' + sg.code + ' ' + sg.w + ' hi ' + sg.hi + ')');
  // keep reaching ceilings until cap 20, then tempo
  for (const hi of [14, 16, 18, 20]) { rec = sess('s2', 2, [it('goblet', [[20, hi], [20, hi], [20, hi], [20, hi]], G)]); AZM.S().sessions.push(rec); AZM.Logic.afterSession(rec); }
  es = AZM.S().exState.goblet;
  ok(es.stage === 1 && !es.hi, 'after reaching 20 reps -> technique stage 1 tempo (got ' + JSON.stringify(es) + ')');
  sg = AZM.Logic.suggest({ex: 'goblet', reps: [8, 12], sets: 4, rir: 2, f: 1});
  ok(sg.tech && sg.tech.k === 'tempo', 'suggestion shows tempo technique (got ' + (sg.tech && sg.tech.k) + ')');
  // 2) two sessions below range -> drop a step
  s = base(); AZM.setS(s);
  AZM.S().sessions.push(sess('s2', 6, [it('rdl', [[20, 7], [20, 7], [20, 6], [20, 6]], G)]));
  sg = AZM.Logic.suggest({ex: 'rdl', reps: [8, 12], sets: 4, rir: 2, f: 1});
  ok(sg.code === 'low' && sg.w === 20, 'one session below 8 -> same weight (got ' + sg.code + ' ' + sg.w + ')');
  AZM.S().sessions.push(sess('s2', 2, [it('rdl', [[20, 7], [20, 7], [20, 6], [20, 6]], G)]));
  sg = AZM.Logic.suggest({ex: 'rdl', reps: [8, 12], sets: 4, rir: 2, f: 1});
  ok(sg.code === 'down' && sg.w === 17.5, 'two sessions below 8 -> 17.5 kg (got ' + sg.code + ' ' + sg.w + ')');
  // 3) top reps but reported grinding (RIR 0 while target 2) -> hold
  s = base(); AZM.setS(s);
  AZM.S().sessions.push(sess('s1', 2, [it('dbBench', [[14, 10, 0], [14, 10, 0], [14, 10, 0]], {sets: 3, reps: [6, 10], rir: 2})]));
  sg = AZM.Logic.suggest({ex: 'dbBench', reps: [6, 10], sets: 3, rir: 2, f: 1});
  ok(sg.code === 'hard' && sg.w === 14, 'top reps at RIR 0 -> hold weight (got ' + sg.code + ')');
  // 4) fixed dumbbell list
  s = base(); s.profile.dbList = '5, 8, 12, 15, 20'; AZM.setS(s);
  AZM.S().sessions.push(sess('s1', 2, [it('dbBench', [[12, 10], [12, 10], [12, 10]], {sets: 3, reps: [6, 10], rir: 2})]));
  sg = AZM.Logic.suggest({ex: 'dbBench', reps: [6, 10], sets: 3, rir: 2, f: 1});
  ok(sg.code === 'up' && sg.w === 15, 'fixed weights list: 12 -> 15 kg (got ' + sg.w + ')');
  // 5) return after 10 days -> one set fewer; after 20 days -> 90% loads
  s = base(); AZM.setS(s);
  AZM.S().sessions.push(sess('s1', 10, [it('dbBench', [[14, 8], [14, 8], [14, 8], [14, 8]], {sets: 4, reps: [6, 10], rir: 2})]));
  let pl = AZM.Logic.buildPlan('s2');
  let gob = pl.steps.find(x => x.id === 's2.a1');
  ok(pl.ret === 'week' && gob.sets === 3, 'back after 10 days: goblet 4 -> 3 sets (got ' + pl.ret + ' ' + gob.sets + ')');
  s = base(); AZM.setS(s);
  AZM.S().sessions.push(sess('s1', 20, [it('dbBench', [[16, 8], [16, 8], [16, 8], [16, 8]], {sets: 4, reps: [6, 10], rir: 2})]));
  pl = AZM.Logic.buildPlan('s1');
  let bench = pl.steps.find(x => x.id === 's1.a2');
  ok(pl.ret === 'weeks' && bench.sug.w === 15 && bench.rir === 3, 'back after 20 days: 90% load (16 -> 15 kg), RIR 3 (got ' + bench.sug.w + ', rir ' + bench.rir + ')');
  // 6) deload week (week 9): sets halved
  s = base(); s.prog.weekAdj = 9 - (Math.floor(30 / 7) + 1); AZM.setS(s);
  pl = AZM.Logic.buildPlan('s2'); gob = pl.steps.find(x => x.id === 's2.a1');
  ok(pl.deload && gob.sets === 2 && gob.rir === 3, 'week 9 deload: goblet 4 -> 2 sets, RIR 3 (got ' + gob.sets + ', ' + gob.rir + ')');
  // 7) week 1: 4-set lifts start with 3 sets and RIR 3
  s = base(); s.prog.start = day(0); AZM.setS(s);
  pl = AZM.Logic.buildPlan('s2'); gob = pl.steps.find(x => x.id === 's2.a1');
  ok(gob.sets === 3 && gob.rir === 3, 'week 1: goblet 3 sets, RIR 3 (got ' + gob.sets + ', ' + gob.rir + ')');
  // 8) ladder level-up after two sessions meeting the step target
  s = base(); s.ladders.pullup = 4; AZM.setS(s);
  const T = {sets: 4, reps: [3, 5], rir: 2};
  const lad = (d) => ({id: 's1.a1', slot: 'a1', kind: 'lift', ex: 'pullup', orig: 'pullup', ladder: 'pullup', target: T, sets: [[0, 5], [0, 5], [0, 5], [0, 5]].map(([w, r]) => ({w: null, r}))});
  rec = sess('s1', 5, [lad()]); AZM.S().sessions.push(rec); AZM.Logic.afterSession(rec);
  ok(AZM.S().ladders.pullup === 4, 'ladder: first time meeting target -> stay (got ' + AZM.S().ladders.pullup + ')');
  rec = sess('s1', 1, [lad()]); AZM.S().sessions.push(rec); notes = AZM.Logic.afterSession(rec);
  ok(AZM.S().ladders.pullup === 5, 'ladder: second time -> level up to 6-8 reps (got ' + AZM.S().ladders.pullup + ')');
  // 9) rope gating by ankle phase
  s = base(); s.ankle.phase = 2; AZM.setS(s);
  let rope = AZM.Logic.buildPlan('s2').steps.find(x => x.kind === 'rounds');
  ok(rope.plan.gated === true, 'ankle phase 2: rope replaced by no-bounce shadow');
  s.ankle.phase = 3; AZM.setS(s);
  rope = AZM.Logic.buildPlan('s2').steps.find(x => x.kind === 'rounds');
  ok(rope.plan.gated === false && rope.plan.rounds === 6 && rope.plan.len === 30, 'ankle phase 3: rope 6 x 30s');
  // 10) equipment missing: no bench -> dbBench swapped to its same-pattern alternative without bench
  s = base(); s.profile.equip.bench = false; AZM.setS(s);
  pl = AZM.Logic.buildPlan('s1'); bench = pl.steps.find(x => x.id === 's1.a2');
  ok(bench.ex === 'dbFloorPress', 'no bench: dbBench -> floor press (got ' + bench.ex + ')');
  // 11) volume: planned weekly sets for priority muscles within targets
  const v = AZM.Logic.plannedVolume();
  ok(v.lats >= 10 && v.sidedelt >= 10 && v.chest >= 8, 'planned volume lats ' + v.lats + ', side delts ' + v.sidedelt + ', chest ' + v.chest);
  // 12) ankle criteria auto-check from logs
  s = base(); s.ankle.phase = 2; s.sessions = [Object.assign(sess('s1', 1, []), {drills: {calfSL: {done: true, v: 22}, balanceSL: {done: true, v: 30}, balanceEyes: {done: true, v: 12}}})]; s.pain = [{id: 'x', date: day(1), joint: 'ankle', v: 1, u: 1}]; s.ankle.crit = {k2w: true}; AZM.setS(s);
  ok(AZM.Logic.ankleReady() === true, 'ankle phase 2 criteria met from logged drills + pain');
  return out;
});
console.log(res.join('\n'));
console.log(errs.length ? 'ERRORS: ' + errs.join('; ') : 'no page errors');
const fails = res.filter(x => x.startsWith('FAIL')).length;
console.log(fails ? fails + ' FAILED' : 'ALL LOGIC TESTS PASSED');
await b.close();
process.exit(fails || errs.length ? 1 : 0);
