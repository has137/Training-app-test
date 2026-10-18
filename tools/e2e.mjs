// End-to-end scenarios at 390x844 in headless Chromium. Fails on console errors or wrong suggestions.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const OUT = '/tmp/claude-0/-home-user-Training-app-test/9edf90b4-14c0-527b-8a0b-d0a909d16dfc/scratchpad/shots/';
const URL_ = 'file://' + process.cwd() + '/index.html';
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, colorScheme: process.env.THEME || 'light', hasTouch: true, isMobile: true});
const p = await ctx.newPage();
const errs = [], fails = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({path: OUT + (process.env.THEME ? process.env.THEME + '-' : '') + n + '.png'}); };
const click = async (sel, i = 0) => { const l = p.locator(sel); await l.nth(i).click(); await p.waitForTimeout(160); };
const st = () => p.evaluate(() => JSON.parse(JSON.stringify(AZM.S())));
const check = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? 'PASS ' : 'FAIL ') + msg); };
await p.goto(URL_);
await p.evaluate(() => localStorage.clear());
await p.reload();
// ---------- onboarding ----------
await click('[data-act="ob-next"]');
await p.fill('[data-k="name"]', 'هاشم');
await shot('ob1');
await click('[data-act="ob-next"]');
await shot('ob2');
await click('[data-act="ob-next"]');
await click('[data-act="ob-opt"][data-k="pull"][data-v="0"]');
await click('[data-act="ob-opt"][data-k="push"][data-v="5"]');
await shot('ob3');
await click('[data-act="ob-next"]');
await click('[data-act="ob-opt"][data-k="ankle.when"][data-v="months"]');
await click('[data-act="ob-opt"][data-k="ankle.pain"][data-v="2"]');
await click('[data-act="ob-opt"][data-k="ankle.hop"][data-v="some"]');
await click('[data-act="ob-opt"][data-k="ankle.seen"][data-v="no"]');
await shot('ob4');
await click('[data-act="ob-next"]');
for (let i = 0; i < 7; i++) await click(`[data-act="ob-parq"][data-i="${i}"][data-v="0"]`);
await shot('ob5');
await click('[data-act="ob-next"]');
await click('[data-act="ob-ack"]');
await shot('ob6');
await click('[data-act="ob-next"]');
let s = await st();
check(s.onboarded && s.profile.name === 'هاشم', 'onboarding saved profile');
check(s.ankle.phase === 2, 'ankle intake -> phase 2 (got ' + s.ankle.phase + ')');
check(s.ladders.pullup === 1 && s.ladders.pushup === 1, 'ladders from ability answers');
await shot('today');
// ---------- full session s1 ----------
await click('.hero [data-act="wo-start"]');
await shot('wo-warm');
const warmN = await p.locator('.ck .cbox').count();
for (let i = 0; i < warmN; i++) await click('.ck .cbox', i);
await p.fill('.logv', '25').catch(() => {});
await click('[data-act="ck-done"]');
await shot('wo-rounds');
await click('[data-act="rd-start"]');
await click('[data-act="rt-toggle"]');
await p.waitForTimeout(600);
await shot('rt-work');
// jump through segments
for (let i = 0; i < 12; i++) { if (!(await p.locator('#rt:not([hidden]) [data-act="rt-next"]').count())) break; await click('[data-act="rt-next"]'); if (i === 1) await shot('rt-rest'); }
await p.waitForTimeout(300);
await click('[data-act="rd-feel"][data-v="ok"]');
await click('[data-act="wo-next"]');
await shot('wo-lift-a1');
// A1 (pullup ladder) and A2 (dbBench) alternate as a pair
const logSet = async (w, r) => {
  if (w != null) await p.fill('#wo-w', String(w));
  await p.fill('#wo-r', String(r));
  await click('[data-act="wo-log"]');
  if (await p.locator('[data-act="rest-skip"]').count()) await click('[data-act="rest-skip"]');
};
s = await st();
const plan = s.active.plan.steps.filter(x => x.kind === 'lift');
const a1 = plan[0], a2 = plan[1];
check(a1.ex === 'pullupBand', 'A1 uses ladder step pullupBand (got ' + a1.ex + ')');
check(a2.ex === 'dbBench' && a2.sets === 3, 'A2 dbBench has 3 sets in week 1 (got ' + a2.sets + ')');
await logSet(null, 8);                // A1 set 1 -> should jump to A2
let cur = (await st()).active; check(cur.order[cur.cur] === a2.id, 'after A1 set, moved to partner A2');
await logSet(14, 10);                 // A2 set 1 -> back to A1
cur = (await st()).active; check(cur.order[cur.cur] === a1.id, 'after A2 set, back to A1');
await shot('wo-lift-pair');
await logSet(null, 8); await logSet(14, 10); await logSet(null, 8); await logSet(14, 10);
cur = (await st()).active; check(cur.status[a1.id] === 'done' && cur.status[a2.id] === 'done', 'pair A completed');
// B1 dbRow: add a set, then log 4 sets
await click('[data-act="wo-addset"]');
cur = (await st()).active; const b1 = cur.plan.steps.find(x => x.id.endsWith('.b1'));
check(cur.rec.items.find(i => i.id === b1.id).target.sets === 4, 'add set: dbRow 3->4 sets');
await logSet(16, 12); // -> B2
// swap B2 hkPress -> seatedPress (easier)
await click('[data-act="wo-swap"]');
await shot('wo-swap');
await click('[data-act="swap-to"][data-id="seatedPress"]');
cur = (await st()).active; check(cur.rec.items.find(i => i.id.endsWith('.b2')).ex === 'seatedPress', 'swap B2 to seatedPress');
await logSet(10, 10);
await logSet(16, 12); await logSet(10, 10); await logSet(16, 12); await logSet(10, 10);
// exit and return: minimize, reload the page, reopen
await click('[data-act="wo-min"]');
await shot('mini');
check(await p.locator('#mini:not([hidden]) .mini-in').count() === 1, 'mini player visible after minimize');
await p.reload(); await p.waitForTimeout(500);
check(await p.locator('#mini:not([hidden]) .mini-in').count() === 1, 'mini player still visible after reload');
await click('#mini [data-act="wo-open"]');
cur = (await st()).active; check(cur && cur.rec.items.filter(i => i.sets.length).length >= 4, 'session restored with logged sets');
// C1 lateral raise: log 2 sets then skip C2 pallof
await shot('wo-c1');
await logSet(5, 15); await logSet(5, 14);
cur = (await st()).active;
await click('[data-act="wo-skip"]');
// remaining: c1 3rd set? (accessory c1 3 sets) -> go back and finish via list
await click('[data-act="wo-menu"]'); await click('[data-act="wo-finish"]');
await shot('summary');
await click('[data-act="sm-rpe"][data-v="7"]');
await click('[data-act="sm-sleep"][data-v="good"]');
await click('[data-act="sm-pain"][data-v="2"]');
await click('[data-act="wo-save"]');
await shot('saved');
await click('.sheet [data-act="sheet-close"]', 1);
s = await st();
const rec1 = s.sessions[s.sessions.length - 1];
check(rec1 && rec1.key === 's1', 'session 1 saved');
check(rec1.status === 'partial', 'session with skipped items saved as partial (got ' + rec1.status + ')');
// ---------- suggestions after session 1 ----------
const sug = await p.evaluate(() => {
  const L = AZM.Logic, plan = L.buildPlan('s1');
  const g = (id) => plan.steps.find(x => x.id === 's1.' + id);
  return {a2: g('a2').sug, b1: g('b1').sug, b2: g('b2'), c1: g('c1').sug, a1: g('a1').sug, seated: L.suggest({ex: 'seatedPress', reps: [8, 12], sets: 3, rir: 2, unit: null, f: 1}), hk: L.suggest({ex: 'hkPress', reps: [8, 12], sets: 3, rir: 2, unit: null, f: 1})};
});
check(sug.a2.code === 'up' && sug.a2.w === 16.5, 'dbBench 14x10 all sets -> up to 16.5 kg (got ' + sug.a2.code + ' ' + sug.a2.w + ')');
check(sug.b1.code === 'up' && sug.b1.w === 18.5, 'dbRow 16x12 all sets (incl. added set) -> 18.5 kg (got ' + sug.b1.code + ' ' + sug.b1.w + ')');
check(sug.seated.code === 'reps' && sug.seated.w === 10 && sug.seated.r === 11, 'swapped seatedPress 10x10 -> same weight, 11 reps (got ' + sug.seated.code + ' ' + sug.seated.w + 'x' + sug.seated.r + ')');
check(sug.hk.code === 'first', 'original hkPress has no history -> first (got ' + sug.hk.code + ')');
check(sug.c1.code === 'partial' || sug.c1.code === 'reps', 'lateral raise 2 of 3 sets -> partial/reps not up (got ' + sug.c1.code + ')');
check(sug.a1.code === 'ladder', 'pullupBand 3x8 (top) -> ladder repeat (got ' + sug.a1.code + ')');
// ---------- partial session: s2 with one exercise ----------
await click('[data-act="tab"][data-v="today"]');
await shot('today-after');
s = await st();
check((await p.evaluate(() => AZM.Logic.nextKey())) === 's2', 'next suggested session is s2');
check(await p.locator('.hero [data-act="wo-start"]').count() === 0, 'today hero shows rest after a finished session');
await click('.list [data-act="go"][data-p="preview"]', 1);
await shot('preview-s2');
await click('.page [data-act="wo-start"]');
await click('[data-act="ck-done"]');
await logSet(16, 9);                  // goblet set 1 -> partner deadBug
await click('[data-act="wo-menu"]'); await click('[data-act="wo-finish"]');
await click('[data-act="wo-save"]');
await click('.sheet [data-act="sheet-close"]', 1);
const sugG = await p.evaluate(() => AZM.Logic.buildPlan('s2').steps.find(x => x.id === 's2.a1').sug);
check(sugG.code === 'partial' && sugG.w === 16, 'goblet only 1 of 3 sets -> partial, same 16 kg (got ' + sugG.code + ' ' + sugG.w + ')');
// ---------- free activity in two taps ----------
await click('[data-act="free-open"]');
await shot('free');
await click('[data-act="free-add"][data-k="rope"]');
s = await st();
const fr = s.sessions.filter(x => x.key === 'free');
check(fr.length === 1 && fr[0].kind === 'rope' && fr[0].min === 10, 'free activity logged in two taps');
// ---------- tabs ----------
for (const t of ['library', 'progress', 'joints']) { await click(`[data-act="tab"][data-v="${t}"]`); await shot('tab-' + t); }
await click('[data-act="tab"][data-v="progress"]'); await click('[data-act="prog-seg"][data-v="ex"]'); await shot('prog-ex');
await click('[data-act="prog-seg"][data-v="tests"]'); await shot('prog-tests');
await click('[data-act="tab"][data-v="library"]');
await click('[data-act="ex-open"][data-id="pullup"]'); await shot('ex-pullup');
await click('[data-act="back"]');
await click('[data-act="lib-seg"][data-v="box"]'); await shot('lib-box');
await click('[data-act="tab"][data-v="today"]'); await click('[data-act="go"][data-p="settings"]'); await shot('settings');
console.log('\nconsole errors:', errs.length ? errs : 'none');
console.log(fails.length ? 'FAILURES: ' + fails.length : 'ALL SCENARIOS PASSED');
await b.close();
process.exit(fails.length || errs.length ? 1 : 0);
