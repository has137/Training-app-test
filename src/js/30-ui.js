/* UI framework: tab stacks, page rendering, sheets, toasts, confirmations, edge-swipe back. */
var App = (function () {
  var nav = {tab: 'today', stacks: {today: [], library: [], progress: [], joints: []}, scroll: {}};
  var Actions = {}, Views = {}, afterRender = [];
  function cur() { var st = nav.stacks[nav.tab]; return st.length ? st[st.length - 1] : {p: nav.tab, a: {}}; }
  function depth() { return nav.stacks[nav.tab].length; }
  function go(p, a) { nav.scroll[nav.tab + depth()] = window.scrollY; nav.stacks[nav.tab].push({p: p, a: a || {}}); render('push'); window.scrollTo(0, 0); }
  function back() {
    var st = nav.stacks[nav.tab]; if (!st.length) return;
    st.pop(); render('pop'); window.scrollTo(0, nav.scroll[nav.tab + depth()] || 0);
  }
  function setTab(t) {
    if (nav.tab === t) { if (depth()) { nav.stacks[t] = []; render('pop'); } window.scrollTo({top: 0, behavior: 'smooth'}); return; }
    nav.scroll[nav.tab + depth()] = window.scrollY;
    nav.tab = t; render(); window.scrollTo(0, nav.scroll[t + depth()] || 0);
  }
  function mountFigs(root) {
    $$('[data-fig]', root).forEach(function (el) {
      if (el._m) return; el._m = 1;
      var mus = el.getAttribute('data-mus'), opts = {muscles: mus ? mus.split(',') : [], label: el.getAttribute('aria-label') || ''};
      if (el.hasAttribute('data-anim')) FIG.mount(el, el.getAttribute('data-fig'), opts);
      else el.innerHTML = FIG.still(el.getAttribute('data-fig'), opts);
    });
  }
  var titleObs = null;
  function render(anim) {
    if (!S.onboarded) { $('#view').innerHTML = Views.onboarding(); $('#tabbar').hidden = true; mountFigs($('#view')); return; }
    $('#tabbar').hidden = false;
    FIG.stopAll();
    var c = cur(), V = Views[c.p] || Views.today, html;
    try { html = V(c.a || {}); } catch (e) { console.error(e); html = '<div class="page"><div class="empty" style="margin-top:40px"><b>حدث خطأ في عرض هذه الصفحة</b><p>' + esc(e.message) + '</p></div></div>'; }
    var view = $('#view');
    view.innerHTML = html;
    var page = view.firstElementChild;
    if (page && anim === 'push') page.classList.add('pushed');
    if (page && anim === 'pop') page.classList.add('popped');
    $$('.tab').forEach(function (b) { var on = b.getAttribute('data-v') === nav.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    mountFigs(view);
    if (titleObs) titleObs.disconnect();
    var lt = $('.large-title', view), nb = $('.navbar', view);
    if (nb) {
      if (lt && 'IntersectionObserver' in window) {
        titleObs = new IntersectionObserver(function (en) { nb.classList.toggle('solid', !en[0].isIntersecting); }, {rootMargin: '-60px 0px 0px 0px'});
        titleObs.observe(lt);
      } else nb.classList.add('solid');
    }
    afterRender.forEach(function (f) { try { f(); } catch (e) {} });
    Workout.renderMini();
  }
  // ---------- sheets ----------
  var sheets = [];
  function sheet(o) {
    var layer = $('#layer');
    var scrim = document.createElement('div'); scrim.className = 'scrim';
    var el = document.createElement('section'); el.className = 'sheet ' + (o.cls || ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('dir', 'rtl');
    el.innerHTML = '<div class="grab" aria-hidden="true"></div><header class="sheet-h"><h3>' + esc(o.title || '') + '</h3><button class="icon-btn" data-act="sheet-close" aria-label="إغلاق">' + I('close') + '</button></header><div class="sheet-b">' + (o.body || '') + '</div>';
    layer.appendChild(scrim); layer.appendChild(el);
    var rec = {el: el, scrim: scrim, onClose: o.onClose};
    sheets.push(rec);
    scrim.addEventListener('click', function () { closeSheet(rec); });
    // drag down to dismiss from the grab bar or header
    var y0 = null, dy = 0;
    function start(e) { y0 = e.touches[0].clientY; dy = 0; el.style.transition = 'none'; }
    function move(e) { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; }
    function end() { if (y0 == null) return; el.style.transition = ''; el.style.transform = ''; if (dy > 110) closeSheet(rec); y0 = null; }
    [$('.grab', el), $('.sheet-h', el)].forEach(function (h) { h.addEventListener('touchstart', start, {passive: true}); h.addEventListener('touchmove', move, {passive: true}); h.addEventListener('touchend', end); });
    mountFigs(el);
    if (o.onOpen) o.onOpen(el);
    setTimeout(function () { var f = $('[autofocus]', el); if (f) f.focus(); }, 60);
    return {el: el, close: function () { closeSheet(rec); }, body: $('.sheet-b', el)};
  }
  function closeSheet(rec) {
    rec = rec || sheets[sheets.length - 1]; if (!rec) return;
    var i = sheets.indexOf(rec); if (i < 0) return; sheets.splice(i, 1);
    rec.el.classList.add('closing'); rec.scrim.style.transition = 'opacity .25s'; rec.scrim.style.opacity = '0';
    setTimeout(function () { rec.el.remove(); rec.scrim.remove(); }, 260);
    if (rec.onClose) rec.onClose();
  }
  function closeAllSheets() { while (sheets.length) closeSheet(sheets[sheets.length - 1]); }
  function topSheet() { return sheets[sheets.length - 1] || null; }
  function confirm(o) {
    return new Promise(function (res) {
      var done = false;
      var sh = sheet({title: o.title, body: '<p style="font-size:16px">' + esc(o.text || '') + '</p><div class="stack"><button class="btn btn-block ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-act="cf-yes">' + esc(o.ok || 'نعم') + '</button><button class="btn btn-block btn-tonal" data-act="cf-no">' + esc(o.cancel || 'إلغاء') + '</button></div>',
        onClose: function () { if (!done) res(false); }});
      sh.el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (!b) return;
        var a = b.getAttribute('data-act');
        if (a === 'cf-yes' || a === 'cf-no') { e.stopPropagation(); done = true; res(a === 'cf-yes'); sh.close(); }
      });
    });
  }
  var toastTimer = null;
  function toast(msg, o) {
    o = o || {};
    var old = $('#toast'); if (old) old.remove();
    var t = document.createElement('div'); t.id = 'toast'; t.className = 'toast' + (o.err ? ' err' : ''); t.setAttribute('role', 'status'); t.setAttribute('dir', 'rtl');
    t.innerHTML = I(o.err ? 'warn' : 'check') + '<span>' + esc(msg) + '</span>' + (o.action ? '<button type="button">' + esc(o.action.label) + '</button>' : '');
    document.body.appendChild(t);
    if (o.action) $('button', t).addEventListener('click', function () { t.remove(); o.action.fn(); });
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 320); }, o.ms || 3000);
  }
  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act');
    if (a === 'sheet-close') { closeSheet(); return; }
    if (Actions[a]) { e.preventDefault(); Actions[a](b, e); }
  });
  document.addEventListener('input', function (e) { var el = e.target.closest('[data-in]'); if (el && Actions[el.getAttribute('data-in')]) Actions[el.getAttribute('data-in')](el, e); });
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-ch]'); if (el && Actions[el.getAttribute('data-ch')]) Actions[el.getAttribute('data-ch')](el, e); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (sheets.length) closeSheet(); else if (Workout.isOpen() && !Rounds.isOpen()) Workout.minimize(); } });
  // edge swipe back: in RTL the gesture starts at the right edge
  (function () {
    var x0 = null, y0 = null, dx = 0, page = null, active = false;
    document.addEventListener('touchstart', function (e) {
      if (!S.onboarded || !depth() || sheets.length || Workout.isOpen()) return;
      var t = e.touches[0];
      if (t.clientX < window.innerWidth - 28) return;
      x0 = t.clientX; y0 = t.clientY; dx = 0; active = false; page = $('#view').firstElementChild;
    }, {passive: true});
    document.addEventListener('touchmove', function (e) {
      if (x0 == null || !page) return;
      var t = e.touches[0]; dx = x0 - t.clientX;
      if (!active) { if (Math.abs(t.clientY - y0) > 14) { x0 = null; return; } if (dx > 10) active = true; else return; }
      page.style.transition = 'none'; page.style.transform = 'translateX(' + (-Math.max(0, dx)) + 'px)';
    }, {passive: true});
    document.addEventListener('touchend', function () {
      if (x0 == null || !page) return;
      var p = page; x0 = null;
      if (active && dx > window.innerWidth * 0.3) { p.style.transform = ''; back(); }
      else { p.style.transition = 'transform .3s var(--sheet)'; p.style.transform = ''; }
    });
  })();
  function refreshCloud() { var el = $('#cloud-st'); if (el) el.outerHTML = Views.cloudStatus(); }
  return {go: go, back: back, setTab: setTab, render: render, cur: cur, depth: depth, nav: nav, sheet: sheet, closeSheet: closeSheet, closeAllSheets: closeAllSheets, topSheet: topSheet,
    confirm: confirm, toast: toast, Actions: Actions, Views: Views, mountFigs: mountFigs, afterRender: afterRender, refreshCloud: refreshCloud};
})();
var Actions = App.Actions, Views = App.Views;
Actions.tab = function (b) { App.setTab(b.getAttribute('data-v')); };
Actions.back = function () { App.back(); };
Actions.go = function (b) { App.go(b.getAttribute('data-p'), JSON.parse(b.getAttribute('data-a') || '{}')); };
Actions.term = function (b) {
  var g = DATA.glossary.filter(function (x) { return x.k === b.getAttribute('data-k'); })[0]; if (!g) return;
  App.sheet({title: g.n, body: '<p style="font-size:17px;line-height:1.7">' + esc(g.d) + '</p><button class="btn btn-tonal" data-act="glossary">كل المصطلحات</button>'});
};
Actions.glossary = function () {
  App.closeAllSheets();
  App.sheet({title: 'المصطلحات', body: '<div class="list">' + DATA.glossary.map(function (g) { return '<div class="row" style="align-items:flex-start"><div class="row-m"><span class="row-t">' + esc(g.n) + '</span><span class="row-s" style="font-size:15px">' + esc(g.d) + '</span></div></div>'; }).join('') + '</div>'});
};
function term(k, label) { return '<button type="button" class="term" data-act="term" data-k="' + k + '">' + esc(label) + '</button>'; }
function navbar(title, o) {
  o = o || {};
  var start = App.depth() ? '<button class="back-btn" data-act="back" aria-label="رجوع">' + I('chevR') + '<span>' + esc(o.backLabel || 'رجوع') + '</span></button>' : '';
  return '<div class="navbar"><div class="nb-side">' + start + '</div><div class="nb-title">' + esc(title) + '</div><div class="nb-side end">' + (o.end || '') + '</div></div>';
}
function figEl(key, cls, mus, anim, label) { return '<span class="' + (cls || 'thumb') + '" data-fig="' + key + '"' + (mus ? ' data-mus="' + mus.join(',') + '"' : '') + (anim ? ' data-anim' : '') + ' role="img" aria-label="' + esc(label || '') + '"></span>'; }
function typeName(t) { return DATA.types[t] ? DATA.types[t].short : ''; }
