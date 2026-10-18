/* Settings, backup, sources, about. */
Views.cloudStatus = function () {
  var st = Cloud.status(), map = {on: ['', 'تُحفظ بياناتك في حسابك على Claude أيضاً، وتظهر على أي جهاز تفتح منه هذا الرابط.'], connecting: ['off', 'جارٍ الاتصال بحسابك…'], error: ['off', 'تعذّر الحفظ في حسابك الآن. بياناتك محفوظة على هذا الجهاز.'], off: ['off', 'بياناتك محفوظة على هذا الجهاز وهذا المتصفح فقط. خذ نسخة احتياطية من وقت لآخر.']};
  var m = map[st] || map.off;
  return '<p id="cloud-st" style="font-size:15px"><span class="offline-dot ' + m[0] + '"></span>' + esc(m[1]) + '</p>';
};
function setRow(label, ctrl, sub) { return '<div class="row" style="flex-wrap:wrap"><span class="row-m"><span class="row-t" style="font-size:16px">' + label + '</span>' + (sub ? '<span class="row-s">' + sub + '</span>' : '') + '</span>' + ctrl + '</div>'; }
function segCtl(act, cur, list) { return '<div class="seg" role="group" style="min-width:180px">' + list.map(function (x) { return '<button data-act="' + act + '" data-v="' + x[0] + '" class="' + (String(cur) === String(x[0]) ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
Views.settings = function () {
  var p = S.profile, st = Logic.stage();
  var h = '<div class="page">' + navbar('الإعدادات') + '<h1 class="large-title">الإعدادات</h1>';
  h += '<section class="section"><div class="section-h"><h2>ملفي</h2></div><div class="card"><div class="fields">' +
    ['name:اسمك:text', 'age:العمر:numeric', 'weight:الوزن (كغ):decimal', 'height:الطول (سم):numeric', 'bf:نسبة الدهون %:decimal', 'smm:كتلة العضلات (كغ):decimal'].map(function (s) { var a = s.split(':'); return '<label class="field' + (a[0] === 'name' ? ' full' : '') + '"><span>' + a[1] + '</span><input class="input" data-ch="set-prof" data-k="' + a[0] + '" value="' + esc(p[a[0]] == null ? '' : p[a[0]]) + '" ' + (a[2] === 'text' ? '' : 'inputmode="' + a[2] + '"') + '></label>'; }).join('') + '</div></div></section>';
  h += '<section class="section"><div class="section-h"><h2>الأدوات والأوزان</h2></div><div class="list">' + Object.keys(DATA.equipment).map(function (k) { return '<button class="toggle" data-act="set-eq" data-k="' + k + '" aria-pressed="' + (p.equip[k] !== false) + '"><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(DATA.equipment[k].n) + '</span></span><span class="sw"></span></button>'; }).join('') + '</div>' +
    '<div class="card stack" style="margin-top:12px"><div class="field"><span>أثقل دمبل واحد لديك</span><div class="stepper"><button data-act="set-max" data-d="-1" aria-label="أقل">' + I('minus') + '</button><span class="sv"><b class="num" style="font-size:28px">' + fmtN(p.maxDb) + '</b><span>كغ</span></span><button data-act="set-max" data-d="1" aria-label="أكثر">' + I('plus') + '</button></div></div>' +
    '<div class="field"><span>أصغر زيادة</span>' + segCtl('set-step', p.dbStep, [[1, '1 كغ'], [2, '2 كغ'], [2.5, '2.5 كغ']]) + '</div>' +
    '<label class="field"><span>أوزانك الثابتة (اختياري)</span><input class="input" data-ch="set-prof" data-k="dbList" value="' + esc(p.dbList || '') + '" placeholder="مثال: 5, 7.5, 10, 12.5, 15, 20"><small>إذا كتبتها، الاقتراح يختار منها فقط.</small></label></div></section>';
  h += '<section class="section"><div class="section-h"><h2>البرنامج</h2></div><div class="list">' +
    setRow('أيام التمرين', segCtl('set-days', p.days >= 5 ? 5 : 4, [[4, '4 أيام'], [5, '5 أيام']]), 'اليوم الخامس اختياري') +
    setRow('أسبوع البرنامج', '<div class="btn-group"><button class="icon-btn" data-act="set-week" data-d="-1" aria-label="أسبوع سابق">' + I('minus') + '</button><span class="num" style="min-width:64px;text-align:center;font-weight:800;font-size:22px;align-self:center">' + st.week + '</span><button class="icon-btn" data-act="set-week" data-d="1" aria-label="أسبوع تالٍ">' + I('plus') + '</button></div>', st.ph.n + ' · بدأ ' + (S.prog.start ? fmtDate(S.prog.start, false) : '—')) +
    setRow('سلّم العقلة', '<div class="btn-group"><button class="icon-btn" data-act="set-lad" data-k="pullup" data-d="-1" aria-label="درجة أسهل">' + I('minus') + '</button><span class="num" style="min-width:48px;text-align:center;font-weight:800;font-size:20px;align-self:center">' + (Logic.ladderLevel('pullup') + 1) + '</span><button class="icon-btn" data-act="set-lad" data-k="pullup" data-d="1" aria-label="درجة أصعب">' + I('plus') + '</button></div>', EX[Logic.ladderStep('pullup').ex].n) +
    setRow('سلّم الضغط', '<div class="btn-group"><button class="icon-btn" data-act="set-lad" data-k="pushup" data-d="-1" aria-label="درجة أسهل">' + I('minus') + '</button><span class="num" style="min-width:48px;text-align:center;font-weight:800;font-size:20px;align-self:center">' + (Logic.ladderLevel('pushup') + 1) + '</span><button class="icon-btn" data-act="set-lad" data-k="pushup" data-d="1" aria-label="درجة أصعب">' + I('plus') + '</button></div>', EX[Logic.ladderStep('pushup').ex].n) +
    '<button class="toggle" data-act="set-deload" aria-pressed="' + !!st.manualDeload + '"><span class="row-m"><span class="row-t" style="font-size:16px">أسبوع تخفيف الآن</span><span class="row-s">' + (st.manualDeload ? 'حتى ' + fmtDate(S.prog.deloadUntil, false) : 'نصف المجموعات لسبعة أيام') + '</span></span><span class="sw"></span></button>' +
    '<button class="row" data-act="go" data-p="programdoc">' + I('book') + '<span class="row-m"><span class="row-t" style="font-size:16px">البرنامج كاملاً وقواعده</span></span>' + I('chevR', 'chev sm') + '</button></div></section>';
  h += '<section class="section"><div class="section-h"><h2>المظهر والصوت</h2></div><div class="list">' + setRow('المظهر', segCtl('set-theme', S.settings.theme, [['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']])) +
    '<button class="toggle" data-act="set-sound" aria-pressed="' + !!S.settings.sound + '"><span class="row-m"><span class="row-t" style="font-size:16px">صوت المؤقتات</span><span class="row-s">تنبيه قبل نهاية الراحة والجولة</span></span><span class="sw"></span></button></div></section>';
  h += '<section class="section"><div class="section-h"><h2>بياناتك والنسخ الاحتياطي</h2></div><div class="card stack">' + Views.cloudStatus() +
    '<div class="grid2"><button class="btn btn-primary" data-act="export">' + I('download', 'sm') + 'تصدير ملف</button><button class="btn btn-tonal" data-act="import">' + I('upload', 'sm') + 'استيراد ملف</button></div><button class="btn btn-text" data-act="export-copy">انسخ البيانات كنص بدلاً من ملف</button><input type="file" id="imp-file" accept="application/json,.json" hidden data-ch="import-file"></div></section>';
  h += '<section class="section"><div class="section-h"><h2>أضفه إلى الشاشة الرئيسية</h2></div><div class="tbl-wrap"><table class="tbl"><tbody><tr><td style="font-weight:700">iPhone و iPad</td><td>افتح الرابط في Safari، اضغط زر المشاركة ' + I('share', 'sm') + '، ثم «إضافة إلى الشاشة الرئيسية».</td></tr><tr><td style="font-weight:700">Android</td><td>افتح الرابط في Chrome، ثم القائمة، ثم «إضافة إلى الشاشة الرئيسية».</td></tr><tr><td style="font-weight:700">بدون إنترنت</td><td>بعد فتحه مرة واحدة، يعمل التطبيق بدون إنترنت. روابط يوتيوب فقط تحتاج إنترنت.</td></tr></tbody></table></div></section>';
  h += '<section class="section"><div class="section-h"><h2>عن التطبيق</h2></div><div class="list"><button class="row" data-act="go" data-p="sources">' + I('book') + '<span class="row-m"><span class="row-t" style="font-size:16px">المصادر (' + DATA.sources.length + ')</span><span class="row-s">الأبحاث والمراجع التي بُني عليها البرنامج</span></span>' + I('chevR', 'chev sm') + '</button><button class="row" data-act="glossary">' + I('info') + '<span class="row-m"><span class="row-t" style="font-size:16px">المصطلحات</span></span>' + I('chevR', 'chev sm') + '</button></div>' +
    '<div class="banner warn" style="margin-top:12px">' + I('warn') + '<div><b>التطبيق ليس بديلاً عن الطبيب</b><p>برنامج تمارين عام لا يشخّص ولا يعالج. عند ألم حاد أو علامة خطر، توقف وراجع مختصاً.</p></div></div>' +
    '<p class="muted" style="font-size:13px;margin-top:12px;text-align:center">' + DATA.meta.app + ' · ' + DATA.meta.program + ' · الإصدار ' + DATA.version + '</p><button class="btn btn-danger btn-block" data-act="reset" style="margin-top:8px">امسح كل البيانات</button></section>';
  return h + '</div>';
};
Actions['set-prof'] = function (el) { var k = el.getAttribute('data-k'); S.profile[k] = k === 'name' || k === 'dbList' ? el.value.trim() : num(el.value); save(); App.toast('حُفظ'); };
Actions['set-eq'] = function (b) { var k = b.getAttribute('data-k'); S.profile.equip[k] = S.profile.equip[k] === false; save(); App.render(); };
Actions['set-max'] = function (b) { S.profile.maxDb = Math.max(1, (+S.profile.maxDb || 20) + (+b.getAttribute('data-d')) * (+S.profile.dbStep || 2.5)); save(); App.render(); };
Actions['set-step'] = function (b) { S.profile.dbStep = +b.getAttribute('data-v'); save(); App.render(); };
Actions['set-days'] = function (b) { S.profile.days = +b.getAttribute('data-v'); save(); App.render(); };
Actions['set-week'] = function (b) { var d = +b.getAttribute('data-d'); if (Logic.week() + d < 1) return; S.prog.weekAdj = (S.prog.weekAdj || 0) + d; save(); App.render(); };
Actions['set-lad'] = function (b) { var k = b.getAttribute('data-k'); S.ladders[k] = clamp(Logic.ladderLevel(k) + (+b.getAttribute('data-d')), 0, DATA.ladders[k].steps.length - 1); save(); App.render(); };
Actions['set-deload'] = function () { S.prog.deloadUntil = Logic.stage().manualDeload ? null : addDays(today(), 6); save(); App.render(); };
Actions['set-theme'] = function (b) { S.settings.theme = b.getAttribute('data-v'); applyTheme(); save(); App.render(); };
Actions['set-sound'] = function () { S.settings.sound = !S.settings.sound; save(); App.render(); if (S.settings.sound) { Sound.unlock(); Sound.tick(); } };
function applyTheme() { var t = S.settings.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', getComputedStyle(document.body).backgroundColor || '#F3F4F7'); }
function exportText() { var o = JSON.parse(JSON.stringify(S)); o.exportedAt = new Date().toISOString(); o.app = 'azm'; return JSON.stringify(o, null, 1); }
Actions.export = async function () {
  var txt = exportText(), name = 'azm-backup-' + today() + '.json';
  try {
    if (window.claude && window.claude.use) { var dl = await window.claude.use('downloads'); if (dl) { await dl.save({filename: name, data: txt}); App.toast('جاهز للحفظ'); return; } }
  } catch (e) { if (e && e.code === 'cancelled') return; }
  try {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'application/json'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    App.toast('صُدّر الملف: ' + name);
  } catch (e2) { Actions['export-copy'](); }
};
Actions['export-copy'] = function () {
  var txt = exportText();
  var sh = App.sheet({title: 'نسخة احتياطية كنص', body: '<p class="muted" style="font-size:15px">انسخ النص واحفظه في الملاحظات أو أرسله لنفسك.</p><textarea class="input" id="exp-t" rows="6" readonly style="direction:ltr;text-align:left;font-family:ui-monospace,Menlo,monospace;font-size:12px">' + esc(txt) + '</textarea><button class="btn btn-primary btn-block" data-act="exp-copy-btn">نسخ</button>'});
};
Actions['exp-copy-btn'] = function () {
  var t = $('#exp-t');
  try { navigator.clipboard.writeText(t.value).then(function () { App.toast('نُسخ'); }, function () { t.select(); App.toast('حدّد النص وانسخه يدوياً', {err: true}); }); } catch (e) { t.select(); }
};
Actions.import = function () {
  App.sheet({title: 'استيراد نسخة احتياطية', body: '<p class="muted" style="font-size:15px">الاستيراد يستبدل كل بياناتك الحالية بالنسخة المختارة.</p><button class="btn btn-primary btn-block" data-act="imp-pick">' + I('upload', 'sm') + 'اختر ملف JSON</button><label class="field"><span>أو الصق النص هنا</span><textarea class="input" id="imp-t" rows="5" style="direction:ltr;text-align:left;font-family:ui-monospace,Menlo,monospace;font-size:12px"></textarea></label><button class="btn btn-tonal btn-block" data-act="imp-paste">استورد النص</button>'});
};
Actions['imp-pick'] = function () { $('#imp-file').click(); };
Actions['import-file'] = function (el) { var f = el.files && el.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { doImport(String(r.result)); }; r.readAsText(f); el.value = ''; };
Actions['imp-paste'] = function () { doImport($('#imp-t').value); };
function doImport(txt) {
  var o;
  try { o = JSON.parse(txt); } catch (e) { App.toast('الملف ليس نسخة صالحة', {err: true}); return; }
  if (!o || !Array.isArray(o.sessions) || !o.profile) { App.toast('الملف لا يحتوي بيانات عزم', {err: true}); return; }
  App.confirm({title: 'استبدال بياناتك؟', text: 'النسخة فيها ' + o.sessions.length + ' جلسة. بياناتك الحالية (' + S.sessions.length + ' جلسة) ستُستبدل.', ok: 'استبدل', danger: true}).then(function (y) {
    if (!y) return;
    delete o.exportedAt; delete o.app;
    S = migrate(o); S.u = Date.now(); save(true); applyTheme(); App.closeAllSheets(); App.render(); App.toast('استُوردت البيانات');
  });
}
Actions.reset = function () {
  App.confirm({title: 'مسح كل البيانات؟', text: 'تُحذف جلساتك وقياساتك وإعداداتك من هذا الجهاز. صدّر نسخة احتياطية أولاً إذا أردت.', ok: 'امسح كل شيء', danger: true}).then(function (y) {
    if (!y) return; var keep = S.deleted.concat(S.sessions.map(function (s) { return s.id; })); S = defaults(); S.deleted = keep; save(true); App.nav.stacks.today = []; App.nav.tab = 'today'; App.render(); App.toast('مُسحت البيانات');
  });
};
Views.sources = function () {
  var lv = {strong: ['قوي', 'مراجعة منهجية أو تحليل تجميعي أو موقف رسمي'], mid: ['متوسط', 'تجربة واحدة جيدة أو إجماع خبراء'], coach: ['رأي', 'كتب ومدربون معروفون']};
  var h = '<div class="page">' + navbar('المصادر') + '<h1 class="large-title">المصادر</h1><p class="subtitle">' + DATA.sources.length + ' مصدراً. لم نشاهد أي فيديو؛ اعتمدنا على النصوص المنشورة.</p>';
  h += '<div class="tbl-wrap" style="margin-top:14px"><table class="tbl"><thead><tr><th>المستوى</th><th>المعنى</th></tr></thead><tbody>' + Object.keys(lv).map(function (k) { return '<tr><td><span class="src" style="display:inline;border:0;padding:0"><span class="lv ' + k + '" style="display:inline-flex;width:auto;padding:0 10px">' + lv[k][0] + '</span></span></td><td>' + lv[k][1] + '</td></tr>'; }).join('') + '</tbody></table></div>';
  h += '<div class="card" style="margin-top:14px">' + DATA.sources.map(function (s) { return '<div class="src"><span class="lv ' + s.lvl + '" aria-label="' + lv[s.lvl][0] + '">' + s.n + '</span><div><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a><p>' + esc(s.use) + '</p></div></div>'; }).join('') + '</div>';
  return h + '</div>';
};
Views.programdoc = function () {
  var h = '<div class="page">' + navbar('البرنامج') + '<h1 class="large-title">البرنامج</h1><p class="subtitle">' + esc(DATA.meta.program) + ' · ' + esc(DATA.meta.days) + '</p>';
  h += '<section class="section"><div class="section-h"><h2>الأسبوع المقترح</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>اليوم</th><th>النوع</th><th>الجلسة</th></tr></thead><tbody>' + DATA.week.map(function (w) { var sd = w.s ? DATA.sessions[w.s] : null; return '<tr><td style="font-weight:700">' + w.label + '</td><td>' + (sd ? '<span class="tdot ty-' + sd.type + '" style="display:inline-block"></span>' : '') + '</td><td>' + (sd ? esc(sd.n) + (w.optional ? ' (اختيارية)' : '') : 'راحة') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  h += '<section class="section"><div class="section-h"><h2>المراحل</h2></div><div class="list">' + DATA.phases.map(function (p) { return '<div class="row"><span class="badge" style="min-width:64px;font-size:15px">' + p.from + (p.to !== p.from ? '–' + p.to : '') + '</span><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(p.n) + '</span><span class="row-s">' + esc(p.desc) + '</span></span></div>'; }).join('') + '</div></section>';
  h += '<section class="section"><div class="section-h"><h2>مقياس الجهد</h2><button class="aside" data-act="term" data-k="rir">ما هو؟</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>بقي</th><th>المعنى</th></tr></thead><tbody>' + DATA.rir.map(function (r) { return '<tr><td class="num" style="font-weight:800">' + (r.v === 3 ? '+3' : r.v) + '</td><td>' + esc(r.t) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  h += '<section class="section"><div class="section-h"><h2>عندما تصبح الدمبلز خفيفة</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>التقنية</th><th>ماذا تفعل</th></tr></thead><tbody>' + DATA.maxedSteps.map(function (m, i) { return '<tr><td class="num">' + (i + 1) + '</td><td style="font-weight:700">' + esc(m.n) + '</td><td>' + esc(m.d) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  ['pullup', 'pushup'].forEach(function (k) { var L = DATA.ladders[k]; h += '<section class="section"><div class="section-h"><h2>' + esc(L.n) + '</h2><span class="aside">أنت في الدرجة ' + (Logic.ladderLevel(k) + 1) + '</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>التمرين</th><th>الهدف</th><th>شرط الانتقال</th></tr></thead><tbody>' + L.steps.map(function (s, i) { return '<tr' + (i === Logic.ladderLevel(k) ? ' style="background:var(--str-c)"' : '') + '><td class="num">' + (i + 1) + '</td><td>' + esc(EX[s.ex].n) + '</td><td class="num">' + s.sets + '×' + repText(s.reps) + '</td><td>' + esc(s.t) + '</td></tr>'; }).join('') + '</tbody></table></div></section>'; });
  h += '<section class="section"><div class="section-h"><h2>الحبل</h2><span class="aside">أنت في الدرجة ' + (S.rope.level + 1) + '</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>عمل / راحة</th><th>التكرار</th></tr></thead><tbody>' + DATA.ropeLevels.map(function (r, i) { return '<tr' + (i === S.rope.level ? ' style="background:var(--cnd-c)"' : '') + '><td class="num">' + (i + 1) + '</td><td class="num">' + secText(r.work) + ' / ' + secText(r.rest) + (r.bursts ? ' + دفعات' : '') + '</td><td class="num">' + r.n + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  h += '<section class="section"><div class="section-h"><h2>إذا فاتتك جلسات</h2></div><div class="list">' + DATA.missed.map(function (m) { return '<div class="row"><span class="row-m"><span class="row-t" style="font-size:15px">' + (m.to > 999 ? 'أكثر من ' + (m.from - 1) + ' يوماً' : m.from + '–' + m.to + ' يوماً') + '</span><span class="row-s">' + esc(m.t) + '</span></span></div>'; }).join('') + '</div></section>';
  h += '<section class="section"><div class="section-h"><h2>المرونة</h2></div><div class="list">' + DATA.flexibility.map(function (f) { return '<div class="row" style="align-items:flex-start"><span class="row-m"><span class="row-t" style="font-size:16px">' + esc(f.area) + '</span><span class="row-s">' + esc(f.why) + ' ' + esc(f.how) + '</span></span></div>'; }).join('') + '</div></section>';
  return h + '</div>';
};
