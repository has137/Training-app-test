// Checks that every id referenced in the program data exists.
const P = require('../src/data/program.js');
let figs = null;
try { figs = require('../src/data/figures.js'); } catch (e) {}
const EX = P.exercises, errs = [];
const need = (id, where) => { if (!EX[id]) errs.push('missing exercise ' + id + ' in ' + where); };
const M = P.muscles;
for (const [id, e] of Object.entries(EX)) {
  ['n','en','t','p','m','s','fig','yt'].forEach(k => { if (e[k] == null) errs.push(id + ' lacks ' + k); });
  if (!P.types[e.t]) errs.push(id + ' bad type ' + e.t);
  if (!P.patterns[e.p]) errs.push(id + ' bad pattern ' + e.p);
  (e.pm || []).concat(e.sm || []).forEach(m => { if (!M[m]) errs.push(id + ' bad muscle ' + m); });
  (e.eq || []).forEach(q => { if (!P.equipment[q]) errs.push(id + ' bad equip ' + q); });
  Object.values(e.alt || {}).forEach(a => need(a, id + '.alt'));
  if (figs && !figs.poses[e.fig]) errs.push(id + ' missing fig ' + e.fig);
}
Object.values(P.ladders).forEach(l => l.steps.forEach(s => need(s.ex, 'ladder')));
Object.values(P.ladderMap.chinup).forEach(x => need(x, 'ladderMap'));
for (const [sid, s] of Object.entries(P.sessions)) s.blocks.forEach(b => {
  (b.items || []).forEach(it => { if (it.ex) need(it.ex, sid); });
  if (b.plan && !P.roundPlans[b.plan]) errs.push(sid + ' bad plan ' + b.plan);
});
P.ankle.phases.forEach(ph => Object.values(ph.sets).flat().forEach(x => need(x, 'ankle ' + ph.n)));
Object.values(P.joints).forEach(j => j.protect.forEach(x => need(x, 'joint')));
Object.values(P.roundPlans).forEach(rp => (rp.segs || []).forEach(sg => { need(sg.ex, 'seg'); if (sg.fallback) need(sg.fallback, 'seg'); }));
if (figs) {
  P.lessons.forEach(l => l.figs.forEach(f => { if (!figs.poses[f]) errs.push('lesson fig ' + f); }));
  Object.values(P.roundPlans).forEach(rp => { if (!figs.poses[rp.fig]) errs.push('plan fig ' + rp.fig); });
  P.freeKinds.forEach(k => { if (!figs.poses[k.fig]) errs.push('free fig ' + k.fig); });
}
console.log(Object.keys(EX).length + ' exercises; ' + (errs.length ? errs.join('\n') : 'all references OK'));
process.exit(errs.length ? 1 : 0);
