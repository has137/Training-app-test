// Renders the app icon (same mark as the in-app logo) to PNG sizes for the home screen.
import fs from 'fs';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" ${pad ? '' : 'rx="0"'} fill="#0E1116"/><g transform="${pad ? 'translate(9.6 9.6) scale(.8)' : ''}"><path d="M24 30 46 74" stroke="#4C86FF" stroke-width="15" stroke-linecap="round"/><path d="M72 30 50 74" stroke="#FF6A3D" stroke-width="15" stroke-linecap="round"/><circle cx="48" cy="22" r="9" fill="#3DD47A"/></g></svg>`;
fs.mkdirSync('icons', {recursive: true});
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p = await b.newPage();
for (const [name, size, pad] of [['apple-touch-icon.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]) {
  await p.setViewportSize({width: size, height: size});
  await p.setContent(`<html><body style="margin:0">${svg(pad).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({path: 'icons/' + name, omitBackground: false, clip: {x: 0, y: 0, width: size, height: size}});
}
await b.close();
console.log('icons written');
