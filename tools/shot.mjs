// Quick screenshot helper: node tools/shot.mjs <name> [js-to-run-before] [theme]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const OUT = '/tmp/claude-0/-home-user-Training-app-test/9edf90b4-14c0-527b-8a0b-d0a909d16dfc/scratchpad/shots/';
const [name, script, theme] = process.argv.slice(2);
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, colorScheme: theme || 'light', hasTouch: true, isMobile: true});
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await p.goto('file://' + process.cwd() + '/index.html');
await p.waitForTimeout(400);
if (script) { await p.evaluate(script); await p.waitForTimeout(700); }
await p.screenshot({path: OUT + name + '.png'});
console.log(errs.length ? errs.join('\n') : 'console clean');
await b.close();
