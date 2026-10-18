// Builds the single-file app: index.html (standalone, offline, installable) and dist/artifact.html (body fragment for Claude).
import fs from 'fs';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const rd = (p) => fs.readFileSync(root + p, 'utf8');
const program = require(root + 'src/data/program.js');
const figures = require(root + 'src/data/figures.js');
const safe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const font = (f) => fs.readFileSync(root + 'src/fonts/' + f).toString('base64');
const AR = 'U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FEFC';
const LAT = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const fonts = `@font-face{font-family:'Alexandria';font-style:normal;font-weight:500 900;font-display:swap;src:url(data:font/woff2;base64,${font('alex-ar.woff2')}) format('woff2');unicode-range:${AR}}
@font-face{font-family:'Alexandria';font-style:normal;font-weight:500 900;font-display:swap;src:url(data:font/woff2;base64,${font('alex-lat.woff2')}) format('woff2');unicode-range:${LAT}}`;
const css = fonts + '\n' + rd('src/styles.css') + '\n' + rd('src/fig.css');
const order = ['10-figure', '00-core', '15-bodymap', '20-logic', '30-ui', '40-today', '41-library', '42-progress', '43-joints', '44-settings', '50-workout', '60-rounds', '90-boot'];
const js = '(function(){\n' + order.map((f) => '/* ---- ' + f + ' ---- */\n' + rd('src/js/' + f + '.js')).join('\n') + '\n})();';
const shell = rd('src/shell.html');
const data = `<script type="application/json" id="azm-program">${safe(program)}</script>\n<script type="application/json" id="azm-figures">${safe(figures.poses)}</script>`;
const title = '<title>تطبيق عزم</title>';
const body = (standalone) => `${shell}\n${data}\n<script>window.AZM_STANDALONE=${standalone ? 'true' : 'false'};</script>\n<script>\n${js}\n</script>`;
const hash = crypto.createHash('sha1').update(css + js + data).digest('hex').slice(0, 10);
const touch = fs.existsSync(root + 'icons/apple-touch-icon.png') ? 'data:image/png;base64,' + fs.readFileSync(root + 'icons/apple-touch-icon.png').toString('base64') : 'icons/apple-touch-icon.png';
const reset = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';
const index = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${title}
<meta name="description" content="عزم: برنامج تدريب منزلي بالعربية للقوة وشكل V والملاكمة واللياقة وصحة المفاصل. يعمل بدون إنترنت.">
<meta name="theme-color" content="#F3F4F7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="عزم">
<meta name="build" content="${hash}">
<link rel="apple-touch-icon" href="${touch}">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<style>${reset}</style>
<style>
${css}
</style>
</head>
<body>
${body(true)}
</body>
</html>
`;
fs.writeFileSync(root + 'index.html', index);
fs.mkdirSync(root + 'dist', {recursive: true});
const artifact = `${title}
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${body(false)}
`;
fs.writeFileSync(root + 'dist/artifact.html', artifact);
const manifest = {name: 'عزم — تدريب منزلي', short_name: 'عزم', description: 'برنامج تدريب منزلي: قوة وشكل V وملاكمة ولياقة وصحة المفاصل.', lang: 'ar', dir: 'rtl', start_url: './', scope: './', display: 'standalone', orientation: 'portrait', background_color: '#F3F4F7', theme_color: '#0E1116',
  icons: [{src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png'}, {src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png'}, {src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'}]};
fs.writeFileSync(root + 'manifest.webmanifest', JSON.stringify(manifest, null, 2));
const sw = `// Offline cache for عزم. Cache-first, refreshed in the background.
const CACHE = 'azm-${hash}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then((hit) => {
    const net = fetch(e.request).then((r) => { if (r && r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => hit || caches.match('./index.html'));
    return hit || net;
  }));
});
`;
fs.writeFileSync(root + 'sw.js', sw);
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log('index.html', kb(index), '| artifact', kb(artifact), '| build', hash);
