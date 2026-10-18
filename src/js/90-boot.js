/* Boot: theme, tab bar, first render, cloud sync, offline cache. */
(function () {
  var tabs = [['today', 'اليوم', 'today'], ['library', 'المكتبة', 'library'], ['progress', 'التقدّم', 'progress'], ['joints', 'المفاصل', 'joints']];
  $('#tabbar').innerHTML = '<div class="tabbar-in">' + tabs.map(function (t) { return '<button class="tab" data-act="tab" data-v="' + t[0] + '"><span class="pill">' + I(t[2]) + '</span>' + t[1] + '</button>'; }).join('') + '</div>';
  applyTheme();
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) {}
  App.render();
  if (S.active) { Workout.renderMini(); }
  Cloud.init();
  if (window.AZM_STANDALONE && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    try { navigator.serviceWorker.register('./sw.js').catch(function () {}); } catch (e) {}
  }
  window.AZM = {S: function () { return S; }, setS: function (o) { S = migrate(o); save(true); App.render(); }, Logic: Logic, Workout: Workout, App: App, DATA: DATA, Rounds: Rounds};
})();
