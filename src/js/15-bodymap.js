/* Body map: front and back silhouettes; each muscle region is drawn for one side and mirrored. */
var BodyMap = (function () {
  var BASE = {
    front: ['<circle class="head" cx="50" cy="16" r="11"/>',
      '<path class="base" d="M29 36 Q50 30 71 36 L70 96 Q50 102 30 96 Z"/>',
      '<path class="base" d="M30 92 L70 92 L68 106 Q50 110 32 106 Z"/>'],
    back: ['<circle class="head" cx="50" cy="16" r="11"/>',
      '<path class="base" d="M29 36 Q50 30 71 36 L70 96 Q50 102 30 96 Z"/>',
      '<path class="base" d="M30 92 L70 92 L68 106 Q50 110 32 106 Z"/>']
  };
  var LIMBS = '<rect class="base" x="14" y="42" width="11" height="38" rx="5.5"/><rect class="base" x="13" y="78" width="10" height="30" rx="5"/><circle class="base" cx="17" cy="112" r="5"/>' +
    '<rect class="base" x="30" y="100" width="18" height="46" rx="8"/><rect class="base" x="32" y="144" width="12" height="46" rx="6"/><ellipse class="base" cx="38" cy="194" rx="7" ry="4"/>';
  var R = {
    front: {
      neck: 'M44 27 L50 27 L50 35 L43 35 Z',
      traps: 'M43 32 Q36 34 30 37 L44 37 Z',
      frontdelt: 'M30 38 Q23 40 22 51 Q28 49 33 45 Z',
      sidedelt: 'M24 37 Q15 41 15 53 L20 53 Q20 44 27 39 Z',
      chest: 'M33 40 Q42 37 50 39 L50 56 Q40 60 32 55 Q30 47 33 40 Z',
      biceps: 'M16 56 Q14 66 16.5 76 L24 76 Q26 66 24 56 Z',
      forearms: 'M15 80 Q12.5 92 14 104 L20.5 104 Q24 92 23 80 Z',
      abs: 'M42 58 L50 58 L50 93 L43 93 Q40.5 75 42 58 Z',
      obliques: 'M31 58 Q37 60 41 60 L41.5 90 Q34 88 31 80 Q29.5 68 31 58 Z',
      quads: 'M31 102 Q29 120 33 141 L46 141 Q47.5 120 46.5 102 Q39 98 31 102 Z',
      adductors: 'M47 102 L50 105 L50 128 Q46.5 124 46.5 112 Z',
      calves: 'M34 149 Q32 166 35 186 L42 186 Q44.5 166 43 149 Z'
    },
    back: {
      neck: 'M44 26 L50 26 L50 31 L45 31 Z',
      traps: 'M50 29 L43 31 Q35 34 29 38 L40 45 L50 55 Z',
      reardelt: 'M29 39 Q21 41 20 50 Q27 48 32 44 Z',
      sidedelt: 'M24 37 Q15 41 15 53 L20 53 Q20 44 27 39 Z',
      midback: 'M38 46 L50 56 L50 70 Q43 65 36 56 Z',
      lats: 'M30 47 Q28.5 66 40 84 L48.5 86 L48.5 74 Q37 66 34.5 51 Z',
      lowback: 'M42 85 L50 87 L50 98 L41 96 Z',
      triceps: 'M16 54 Q14 66 16.5 77 L24 77 Q26 66 24 54 Z',
      forearms: 'M15 80 Q12.5 92 14 104 L20.5 104 Q24 92 23 80 Z',
      glutes: 'M32 99 Q30.5 112 38 117 Q46 118 50 112 L50 99 Q40 95.5 32 99 Z',
      hams: 'M32 119 Q30 133 34 145 L46 145 Q48 131 47 119 Z',
      calves: 'M33 149 Q30 162 35 177 L44 177 Q47 162 44 149 Z'
    }
  };
  function view(side, cls) {
    var regions = R[side], half = '';
    for (var m in regions) half += '<path class="m ' + (cls[m] || '') + '" data-m="' + m + '" d="' + regions[m] + '"/>';
    var limbs = LIMBS;
    return '<svg class="bm" viewBox="0 0 100 202" role="img" aria-label="' + (side === 'front' ? 'الأمام' : 'الخلف') + '">' + BASE[side].join('') +
      '<g>' + limbs + half + '</g><g transform="translate(100 0) scale(-1 1)">' + limbs + half + '</g></svg>';
  }
  // pri/sec: arrays of muscle ids; heat: {muscle: 1..4}
  function render(opts) {
    var cls = {};
    (opts.sec || []).forEach(function (m) { cls[m] = 's'; });
    (opts.pri || []).forEach(function (m) { cls[m] = 'p'; });
    if (opts.heat) for (var m in opts.heat) cls[m] = opts.heat[m] ? 'h' + opts.heat[m] : '';
    return '<div class="bodymap"><figure>' + view('front', cls) + '<figcaption>الأمام</figcaption></figure><figure>' + view('back', cls) + '<figcaption>الخلف</figcaption></figure></div>';
  }
  return {render: render};
})();
