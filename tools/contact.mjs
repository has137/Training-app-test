// Renders every pose as a still into a grid and screenshots it, for visual review.
import { createRequire } from 'module';
import fs from 'fs';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const require = createRequire(import.meta.url);
const figs = require('../src/data/figures.js');
const eng = fs.readFileSync(new URL('../src/js/10-figure.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/fig.css', import.meta.url), 'utf8');
const keys = Object.keys(figs.poses).filter(k => !process.argv[3] || k.startsWith(process.argv[3]));
const html = `<!doctype html><meta charset=utf8><style>:root{--fig-bg:#EEF0F4;--fig-ink:#1C2230;--fig-far:#8A93A6;--hl:#1F6FEB;--fig-iron:#3A4152;--fig-band:#E0791F;--fig-floor:#C9CED8;--fig-prop:#C3C9D4;--fig-bag:#F6D7C6;--fig-grid:#F7F8FA;--fig-label:#5B6270}
body{margin:0;font-family:sans-serif;background:#fff}.g{display:grid;grid-template-columns:repeat(6,200px);gap:6px;padding:6px}.c{background:var(--fig-bg);border-radius:10px;height:182px;position:relative}.c b{position:absolute;top:2px;left:6px;font-size:11px;color:#444}${css}</style>
<div class=g id=g></div><script>${eng};FIG.setPoses(${JSON.stringify(figs.poses)});var K=${JSON.stringify(keys)};var g=document.getElementById('g');K.forEach(function(k){var d=document.createElement('div');d.className='c';d.innerHTML='<b>'+k+'</b>'+FIG.still(k,{muscles:['quads','chest','lats','sidedelt']});g.appendChild(d);});</script>`;
fs.writeFileSync('/tmp/claude-0/-home-user-Training-app-test/9edf90b4-14c0-527b-8a0b-d0a909d16dfc/scratchpad/contact.html', html);
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(async () => chromium.launch());
const p = await b.newPage({viewport: {width: 1250, height: 800}});
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file:///tmp/claude-0/-home-user-Training-app-test/9edf90b4-14c0-527b-8a0b-d0a909d16dfc/scratchpad/contact.html');
await p.screenshot({path: process.argv[2] || '/tmp/claude-0/-home-user-Training-app-test/9edf90b4-14c0-527b-8a0b-d0a909d16dfc/scratchpad/contact.png', fullPage: true});
console.log(keys.length, 'poses', errs.length ? errs : 'no errors');
await b.close();
