// Program data: everything the UI needs to run the plan, kept apart from the interface
// so another level or equipment set can be swapped in later.
const strength = require('./ex-strength.js');
const drills = require('./ex-drills.js');

module.exports = {
  version: 1,
  meta: {
    app: 'عزم', appEn: 'Azm', tagline: 'قوة تُبنى كل يوم',
    program: 'برنامج عزم الأساسي', programEn: 'Azm Foundation',
    level: 'مبتدئ', days: '4 أيام + يوم اختياري', minutes: 60,
    author: 'مبني على البحث في research.md'
  },

  types: {
    strength:     {n:'قوة وعضل', short:'قوة', icon:'dumbbell', role:'الدمبلز والبنش والعقلة والأشرطة'},
    boxing:       {n:'ملاكمة', short:'ملاكمة', icon:'glove', role:'القوة الانفجارية والمهارة'},
    conditioning: {n:'لياقة', short:'لياقة', icon:'rope', role:'الحبل والقلب وخفة القدمين'},
    readiness:    {n:'جاهزية النزال', short:'جاهزية', icon:'bolt', role:'وزن الجسم والانفجار والدوران'},
    mobility:     {n:'مفاصل ومرونة', short:'حركة', icon:'mobility', role:'الإحماء والحماية والإطالة'}
  },

  patterns: {
    vpull:'سحب عمودي', hpull:'سحب أفقي', hpush:'دفع أفقي', vpush:'دفع عمودي', squat:'سكوات', hinge:'ثني الورك',
    single:'رجل واحدة', carry:'حمل الأوزان', antiExt:'جذع: مقاومة الانثناء', antiRot:'جذع: مقاومة الدوران',
    antiLat:'جذع: مقاومة الميل', rotPower:'جذع: دوران قوي', power:'انفجاري', iso:'تمرين مساعد',
    warm:'إحماء', joint:'حماية المفاصل', rehab:'تأهيل الكاحل', stretch:'إطالة', cardio:'لياقة'
  },

  equipment: {
    db:{n:'دمبلز'}, bench:{n:'بنش'}, bar:{n:'عقلة'}, band:{n:'أشرطة مطاطية'}, bag:{n:'كيس ملاكمة'}, rope:{n:'حبل نط'}
  },

  // target: weekly fractional sets [min, max]; prio = V-taper priority
  muscles: {
    lats:{n:'الظهرية العريضة', en:'Lats', target:[10,14], prio:true},
    midback:{n:'منتصف الظهر', en:'Mid back', target:[8,12]},
    traps:{n:'الترابيس العلوية', en:'Upper traps', target:[4,12]},
    reardelt:{n:'الكتف الخلفي', en:'Rear delts', target:[8,12], prio:true},
    sidedelt:{n:'الكتف الجانبي', en:'Side delts', target:[10,14], prio:true},
    frontdelt:{n:'الكتف الأمامي', en:'Front delts', target:[6,10]},
    chest:{n:'الصدر', en:'Chest', target:[8,12], prio:true},
    triceps:{n:'الترايسبس', en:'Triceps', target:[6,10]},
    biceps:{n:'البايسبس', en:'Biceps', target:[6,10]},
    forearms:{n:'الساعد والقبضة', en:'Forearms', target:[6,12]},
    abs:{n:'البطن', en:'Abs', target:[6,10]},
    obliques:{n:'الخواصر', en:'Obliques', target:[6,10]},
    lowback:{n:'أسفل الظهر', en:'Lower back', target:[4,8]},
    glutes:{n:'الأرداف', en:'Glutes', target:[8,16]},
    quads:{n:'الفخذ الأمامي', en:'Quads', target:[8,12]},
    hams:{n:'خلف الفخذ', en:'Hamstrings', target:[8,12]},
    adductors:{n:'الفخذ الداخلي', en:'Adductors', target:[4,8]},
    calves:{n:'الساق', en:'Calves', target:[6,10]},
    neck:{n:'الرقبة', en:'Neck', target:[2,6]}
  },

  joints: {
    shoulder:{n:'الكتف', risk:'تكرار اللكم للأمام والضغط يُتعب مقدمة الكتف.', protect:['bandPullApart','extRot','facePull','scapPushup'], where:'الجلسات 1 و3'},
    wrist:{n:'الرسغ واليد', risk:'ضرب الكيس والضغط على الأرض. اليد والرسغ أكثر إصابات الملاكمين.', protect:['wristRocks','wristCircles','wristCurls','pushupDb'], where:'الجلسات 1 و3 و5', rule:'لفّ اليد والقفاز دائماً على الكيس.'},
    elbow:{n:'المرفق', risk:'فرد الذراع بعنف في الهواء أثناء الشادو، وكثرة السحب.', protect:['forearmRot','hammer'], where:'الجلستان 3 و5', rule:'لا تقفل المرفق بالكامل في الشادو.'},
    neck:{n:'الرقبة', risk:'الضربات وحركة الرأس، والجلوس الطويل.', protect:['chinTuck','neckIso'], where:'الجلسات 1 و3 و5'},
    lowback:{n:'أسفل الظهر', risk:'أخطاء الرفعة الرومانية والأرجحة، والدوران مع التعب.', protect:['birdDog','deadBug','gluteBridge'], where:'الجلستان 2 و4'},
    hip:{n:'الورك', risk:'الوقفة العريضة والدوران، والجلوس الطويل.', protect:['hip9090','copenhagen','stHip'], where:'الجلستان 2 و4'},
    knee:{n:'الركبة', risk:'الهبوط من القفز وانهيار الركبة في الطعن.', protect:['nordic','bulgarian','gluteBridge'], where:'الجلستان 2 و4'},
    ankle:{n:'الكاحل', risk:'الحبل والقفز ودوران القدم الخلفية. إصابتك الحالية.', protect:['balanceSL','calfSL','k2w','tibRaise'], where:'كل الجلسات'}
  },

  painRule: [
    {from:0, to:3, state:'ok', label:'مقبول', act:'استمر، بشرط أن يعود لطبيعته صباح اليوم التالي.'},
    {from:4, to:5, state:'warn', label:'خفّف', act:'قلّل المدى أو الوزن، أو بدّل التمرين بالبديل.'},
    {from:6, to:10, state:'stop', label:'أوقف', act:'أوقف التمرين الذي سبّب الألم اليوم.'}
  ],
  redFlags: [
    'ألم حاد مفاجئ، أو صوت طقطقة مع ألم.',
    'تورّم يزيد بدل أن يقل.',
    'تنميل، أو ضعف مفاجئ، أو برودة في اليد أو القدم.',
    'المفصل «يفلت» أو ينقفل.',
    'ألم ليلي يوقظك.',
    'ألم يستمر أكثر من أسبوعين رغم التخفيف.',
    'ألم في الصدر، أو دوخة، أو ضيق نفس غير طبيعي: توقف فوراً واطلب مساعدة.'
  ],

  ladders: {
    pullup: {n:'سلّم العقلة', steps:[
      {ex:'hangScap', sets:3, reps:[20,30], t:'30 ث في كل المجموعات'},
      {ex:'pullupBand', sets:3, reps:[6,8], t:'8 في كل المجموعات مرتين متتاليتين'},
      {ex:'pullupNeg', sets:3, reps:[3,5], t:'5 نزولات بطيئة كاملة مرتين متتاليتين'},
      {ex:'pullupBand', sets:3, reps:[5,8], t:'8 بشريط أخف مرتين متتاليتين', note:'استخدم شريطاً أخف من قبل.'},
      {ex:'pullup', sets:4, reps:[3,5], t:'5 في كل المجموعات مرتين متتاليتين'},
      {ex:'pullup', sets:4, reps:[6,8], t:'8 في كل المجموعات مرتين متتاليتين'},
      {ex:'pullupWeighted', sets:4, reps:[5,8], t:'زِد الوزن كقاعدة الدمبلز'}
    ]},
    pushup: {n:'سلّم الضغط', steps:[
      {ex:'pushupIncline', sets:3, reps:[8,15], t:'15 في كل المجموعات مرتين'},
      {ex:'pushup', sets:3, reps:[5,12], t:'12 في كل المجموعات مرتين'},
      {ex:'pushup', sets:3, reps:[12,20], t:'20 في كل المجموعات مرتين'},
      {ex:'pushupFeet', sets:3, reps:[8,15], t:'15 في كل المجموعات مرتين'},
      {ex:'pushupExplosive', sets:4, reps:[5,5], t:'كل تكرار بأقصى سرعة'}
    ]}
  },
  // chin-up slot follows the same ladder but swaps to the chin-up family
  ladderMap: { chinup: {hangScap:'hangScap', pullupBand:'chinupBand', pullupNeg:'pullupNeg', pullup:'chinup', pullupWeighted:'chinupWeighted'} },

  // ---------- boxing ----------
  lessons: [
    {id:'stance', n:'الوقفة والحراسة', en:'Stance & Guard', figs:['stance','guardFront'], lvl:1,
      s:'الوضعية التي تبدأ منها كل ضربة وكل دفاع.',
      st:['قف والقدمان بعرض الكتفين، ثم أرجع قدمك اليمنى خطوة للخلف (إذا كنت تكتب باليمين).','القدم الأمامية تشير للأمام، والخلفية مائلة للخارج وكعبها مرفوع قليلاً.','الركبتان مثنيتان قليلاً، ووزنك موزّع على القدمين.','قبضتاك عند خدّيك، ومرفقاك ملتصقان بأضلاعك.','ذقنك للأسفل، وعيناك تنظران من فوق قبضتيك.'],
      mk:['القدمان على خط واحد، فتفقد توازنك.','إنزال اليدين عند التعب.','رفع الذقن.'],
      shadow:'تحرّك في الوقفة: خطوات صغيرة للأمام والخلف والجانبين، ويداك مرفوعتان طوال الجولة.',
      bag:'قف أمام الكيس على بعد ذراع. المس الكيس بجاب خفيف كل 3 ثوانٍ، وارجع للوقفة بعد كل لمسة.',
      ring:'وقفة متوازنة تعني أنك جاهز للضرب أو التراجع في أي لحظة.', yt:'boxing stance and guard for beginners'},
    {id:'foot', n:'الحركة بالقدمين', en:'Footwork: Step & Drag', figs:['stepDrag'], lvl:1,
      s:'كيف تتحرك بدون أن تتقاطع قدماك أو تخسر توازنك.',
      st:['للأمام: القدم الأمامية أولاً، ثم تلحقها الخلفية بنفس المسافة.','للخلف: القدم الخلفية أولاً، ثم الأمامية.','للجانب: القدم التي في اتجاه الحركة أولاً.','خطوات صغيرة، والمسافة بين قدميك ثابتة.'],
      mk:['تقاطع القدمين.','القفز بدل الخطو.','خطوات كبيرة تُخلّ بالتوازن.'],
      shadow:'4 خطوات للأمام، 4 للخلف، 4 لليمين، 4 لليسار، ويداك في الحراسة. كرّر حتى نهاية الجولة.',
      bag:'دُر حول الكيس بخطوات جانبية صغيرة، والمسه بجاب بعد كل 3 خطوات.',
      ring:'الحركة تتحكم بالمسافة: تقترب لتضرب، وتبتعد قبل أن يرد الخصم.', ankle:'الخطوات تنزلق على الأرض بدون قفز، فهي مناسبة لكل مراحل الكاحل.', yt:'boxing footwork step drag beginners'},
    {id:'jab', n:'الجاب (1)', en:'Jab', figs:['jab'], lvl:1,
      s:'لكمة مستقيمة باليد الأمامية. أسرع ضربة وأكثرها استخداماً.',
      st:['من الوقفة، افرد يدك الأمامية مستقيمة نحو الهدف.','لُفّ قبضتك في النهاية حتى تتجه راحتك للأرض.','أرجعها بنفس الخط إلى خدّك، أسرع من خروجها.','يدك الخلفية تبقى على خدّك.'],
      mk:['إنزال اليد قبل الضربة.','ترك اليد ممدودة بعد الضربة.','رفع الذقن.'],
      shadow:'جاب مفرد، ثم جاب مزدوج (1-1)، ثم جاب مع خطوة للأمام. ارجع للوقفة بين كل واحدة.',
      bag:'جاب كل ثانيتين، وخطوة للأمام أو للخلف بعد كل ضربة.',
      ring:'الجاب يقيس المسافة ويُشغل الخصم ويفتح الطريق لباقي الضربات.', yt:'how to throw a jab boxing beginners'},
    {id:'cross', n:'الكروس (2)', en:'Cross', figs:['cross','oneTwo'], lvl:1,
      s:'لكمة مستقيمة باليد الخلفية. أقوى من الجاب لأن جسمك كله يدور معها.',
      st:['افرد يدك الخلفية مستقيمة نحو الهدف.','لُفّ كعب قدمك الخلفية للخارج.','الورك والكتف يدوران مع الضربة.','ارجع للحراسة فوراً.'],
      mk:['الضرب بالذراع فقط بدون دوران القدم والورك.','الميل للأمام كثيراً.','إنزال اليد الأمامية.'],
      shadow:'1-2 ببطء 10 مرات، ثم بسرعة متوسطة حتى نهاية الجولة.',
      bag:'1-2 ثم خطوة للخلف. كرّر، وركّز على دوران القدم الخلفية.',
      ring:'تركيبة 1-2 هي الأكثر استخداماً في الملاكمة كلها.', ankle:'دوران القدم الخلفية يضغط على الكاحل. إذا كانت المصابة هي الخلفية، دُرها بلطف.', yt:'how to throw a cross boxing beginners'},
    {id:'hook', n:'الخطاف الأمامي (3)', en:'Lead Hook', figs:['hook'], lvl:2,
      s:'لكمة دائرية قصيرة باليد الأمامية تأتي من الجانب.',
      st:['ارفع مرفقك لمستوى قبضتك، والذراع بزاوية قائمة.','الدوران من القدم الأمامية والورك، وليس من الذراع.','الضربة قصيرة، والقبضة لا تتجاوز خط جسمك.','يدك الخلفية تحمي ذقنك.'],
      mk:['سحب الذراع للخلف قبل الضربة.','ضربة واسعة تكشف وجهك.','إنزال اليد الخلفية.'],
      shadow:'1-2-3 ببطء، ثم بسرعة متوسطة.',
      bag:'1-2-3 من مسافة قريبة، ثم خطوة للخارج.',
      ring:'الخطاف يصيب الخصم عندما يرفع حراسته أمام وجهه.', yt:'lead hook boxing technique beginners'},
    {id:'upper', n:'الأبركت (5 و6)', en:'Uppercuts', figs:['upper'], lvl:2,
      s:'لكمة صاعدة من الأسفل للأعلى، للمسافة القريبة.',
      st:['انزل قليلاً بثني ركبتيك.','ادفع من الأرض والورك للأعلى، والقبضة تصعد وراحتك نحوك.','المرفق مثني بزاوية قائمة تقريباً.','لا تُنزل يدك كثيراً قبل الضربة.'],
      mk:['إنزال اليد لأسفل الخصر قبل الضربة.','الضرب من بعيد.'],
      shadow:'1-6-3 (جاب، أبركت خلفي، خطاف أمامي) ببطء، ثم بسرعة.',
      bag:'اقترب من الكيس: أبركت خلفي ثم خطاف أمامي، ثم اخرج بخطوة للخلف.',
      ring:'الأبركت يصيب الخصم الذي ينحني للأمام.', yt:'uppercut boxing technique beginners'},
    {id:'slip', n:'التفادي الجانبي', en:'Slip', figs:['slip'], lvl:3,
      s:'تحريك الرأس قليلاً خارج خط اللكمة المستقيمة، والبقاء قريباً للرد.',
      st:['اثنِ ركبتيك قليلاً ولُفّ كتفيك.','رأسك يخرج من خط اللكمة بمقدار يكفي فقط.','لا تنحنِ من الخصر، ولا تُنزل يديك.','ارجع للوسط أو اضرب فوراً.'],
      mk:['حركة كبيرة تُخلّ بالتوازن.','إغماض العينين.'],
      shadow:'تخيّل جاباً قادماً: تفادٍ للخارج ثم 2. ثم 1-2، تفادٍ، تفادٍ، 2-3.',
      bag:'1-2، ثم تفادٍ يميناً ويساراً كأن الكيس يرد، ثم 2-3.',
      ring:'التفادي يتركك قريباً وجاهزاً للرد.', yt:'how to slip punches boxing beginners'},
    {id:'roll', n:'الانحناء والدوران', en:'Roll (Bob & Weave)', figs:['roll'], lvl:3,
      s:'النزول تحت الخطاف بحركة على شكل U والصعود من الجهة الأخرى.',
      st:['عندما يأتي خطاف، اثنِ ركبتيك وانزل.','حرّك رأسك على شكل U.','ظهرك مستقيم وعيناك على الخصم.','اصعد جاهزاً للضرب.'],
      mk:['الانحناء من الخصر والنظر للأرض.','النزول عميقاً جداً.'],
      shadow:'1-2، ثم انحناء ودوران، ثم 2-3. بدّل الجهة.',
      bag:'1-2-3، ثم انحنِ تحت خطاف وهمي، ثم 2.',
      ring:'الانحناء يجعل الخصم يخطئ ويتركك في زاوية للرد.', yt:'bob and weave boxing beginners'},
    {id:'block', n:'الصدّ والالتقاط', en:'Catch & High Guard', figs:['catchJab','block'], lvl:3,
      s:'صدّ اللكمات بيديك: التقاط الجاب، وتغطية رأسك من الخطاف.',
      st:['الجاب: التقطه بكف يدك الخلفية أمام وجهك.','الخطاف: ألصق قبضتك بصدغك والمرفق للأسفل.','ابقَ ناظراً للخصم.','بعد الصدّ، رُدّ فوراً.'],
      mk:['مدّ اليد بعيداً لملاقاة الضربة.','إدارة الوجه.'],
      shadow:'التقط الجاب ثم 1-2. غطِّ من خطاف ثم 3.',
      bag:'بعد كل تركيبة ارفع حراستك ثانية كأن الكيس يرد، ثم تركيبة جديدة.',
      ring:'الصدّ يحميك عندما لا يكفي الوقت للتفادي.', yt:'boxing catch jab high guard beginners'},
    {id:'pivot', n:'الدوران وتغيير الزاوية', en:'Pivot & Angles', figs:['pivot'], lvl:4,
      s:'تغيير زاويتك بالدوران على القدم الأمامية حتى لا تبقى أمام الخصم.',
      st:['بعد تركيبتك، ارتكز على مشط قدمك الأمامية.','حرّك قدمك الخلفية في قوس للجانب.','الآن أنت بزاوية جديدة.','أو اخطُ خطوة جانبية بدل الدوران.'],
      mk:['الدوران على الكعب.','إنزال اليدين.'],
      shadow:'1-2، دوران، 1-2، دوران. ثم استبدل الدوران بخطوة جانبية.',
      bag:'1-2 ثم دُر حول الكيس ربع دورة، ثم 1-2 من الزاوية الجديدة.',
      ring:'الزاوية تجعلك تضرب ولا تُضرب.', ankle:'قبل المرحلة 4 للكاحل: خطوة جانبية بدل الدوران.', yt:'boxing pivot footwork beginners'},
    {id:'body', n:'ضربات الجسم', en:'Body Shots', figs:['body'], lvl:4,
      s:'ضرب الجسم بدل الرأس. تُتعب الخصم وتُنزل حراسته.',
      st:['انزل بثني ركبتيك حتى تصبح قبضتك بمستوى البطن.','جاب للجسم، أو خطاف أمامي للجسم.','يدك الأخرى عند وجهك.','ارجع لمستوى الرأس.'],
      mk:['الانحناء من الخصر.','إنزال اليد الخلفية.'],
      shadow:'1 للرأس، 1 للجسم، 2 للرأس. ثم 1-2، ثم 3 للجسم.',
      bag:'أسفل الكيس: 1 للجسم، ثم 2-3 للأعلى.',
      ring:'ضربات الجسم تُتعب الخصم وتكشف رأسه لاحقاً.', yt:'boxing body shots beginners'},
    {id:'combo', n:'تركيبات مع الدفاع', en:'Combos with Defense', figs:['combo3'], lvl:5,
      s:'تركيبات تنتهي بدفاع أو حركة، حتى لا تقف أمام الخصم بعد أن تضرب.',
      st:['1-2، ثم تفادٍ، ثم 2.','1-2-3، ثم انحناء ودوران، ثم 3.','1-1-2، ثم دوران أو خطوة جانبية.','كل تركيبة تنتهي بحراسة مرفوعة.'],
      mk:['الوقوف أمام الخصم بعد التركيبة.','تركيبة طويلة تُتعبك وتكشفك.'],
      shadow:'نفّذ التركيبات الثلاث، كل واحدة 5 مرات، ثم كرّر.',
      bag:'تركيبة، ثم دفاع أو حركة، ثم تركيبة. لا تقف ثابتاً.',
      ring:'اضرب، ثم دافع، ثم اخرج.', yt:'boxing combinations with defense beginners'}
  ],
  // lesson of the week by program week (1-based)
  lessonByWeek: ['stance','foot','jab','cross','hook','upper','slip','roll','combo','block','pivot','body','combo','combo'],
  combos: [
    {lvl:1, n:'المستوى 1: لكمات مفردة', list:['1','2','1-1','1-2']},
    {lvl:2, n:'المستوى 2: تركيبات قصيرة', list:['1-1-2','1-2-1','2-1-2','1-2-3']},
    {lvl:3, n:'المستوى 3: الخطاف والأبركت', list:['1-6-3','3-2','1-2-3-2','5-2']},
    {lvl:4, n:'المستوى 4: مع الدفاع', list:['1-2 ثم تفادٍ ثم 2','1-2-3 ثم انحناء ثم 3','التقاط ثم 1-2','2-3 ثم صدّ ثم 2']},
    {lvl:5, n:'المستوى 5: زوايا ورد', list:['1-2 ثم دوران','خدعة ثم 1-2','1 للجسم ثم 2-3','1-2-3-2 بقوة']}
  ],

  // round plans: rounds[] are templates; {shadow} {bag} pull text from the lesson of the week
  roundPlans: {
    shadowTech: {n:'شادو تقني', type:'boxing', fig:'shadow', base:{rounds:3, len:120, rest:60}, p2:{rounds:4, len:120}, p3:{rounds:4, len:180}, deload:{rounds:2},
      intro:'التقنية قبل السرعة. ازفر مع كل لكمة، والحراسة مرفوعة طوال الجولة.',
      rounds:[
        {k:'شادو', t:'تمرين الدرس', d:'{shadow}'},
        {k:'شادو', t:'الدرس مع الحركة', d:'نفس الدرس، وأضف خطوة أو حركة بعد كل تركيبة. لا تقف ثابتاً.'},
        {k:'شادو', t:'جولة حرّة', d:'تركيبات قصيرة مما تعلمته حتى الآن، ثم دفاع أو حركة. سرعة متوسطة.'},
        {k:'شادو', t:'دفاع ثم رد', d:'تخيّل خصماً: صدّ أو تفادٍ، ثم رد بتركيبة من ضربتين.'},
        {k:'شادو', t:'سرعة نظيفة', d:'تركيبات الدرس بأقصى سرعة مع الحفاظ على الشكل.'}
      ]},
    bagPower: {n:'كيس: قوة وتقنية', type:'boxing', fig:'bag', eq:['bag'], wraps:true, base:{rounds:4, len:120, rest:60}, p2:{rounds:4, len:150}, p3:{rounds:5, len:180}, deload:{rounds:2},
      intro:'لفّ يديك والبس القفاز. القوة من دوران القدم والورك، وليس من الذراع.',
      rounds:[
        {k:'كيس', t:'إحماء على الكيس', d:'جاب فقط ودُر حول الكيس بخطوات صغيرة. نصف قوتك.'},
        {k:'كيس', t:'درس الأسبوع', d:'{bag}'},
        {k:'كيس', t:'ضربات قوة', d:'ضربة أو ضربتان بكل قوتك مع دوران الورك، ثم تحرّك ثانيتين. لا تستعجل.'},
        {k:'كيس', t:'دفعات قوة', d:'كل 30 ثانية: 10 ثوانٍ لكمات قوية متواصلة، ثم 20 ثانية حركة وجاب خفيف.'},
        {k:'كيس', t:'تركيبات مع خروج', d:'1-2-3 ثم خطوة للخارج أو دوران. كرّر.'}
      ]},
    bagCond: {n:'كيس: لياقة بفترات', type:'boxing', fig:'bag', eq:['bag'], wraps:true, base:{rounds:5, len:120, rest:60}, p2:{rounds:6, len:150}, p3:{rounds:6, len:180}, deload:{rounds:3},
      intro:'يوم اللياقة: الجولات هي التمرين الأساسي. حافظ على الحراسة حتى آخر ثانية.',
      rounds:[
        {k:'كيس', t:'إحماء', d:'جاب وكروس خفيف مع حركة حول الكيس.'},
        {k:'كيس', t:'1-2 ثم اخرج', d:'جاب ثم كروس، ثم خطوة للخلف أو للجانب بعد كل تركيبة.'},
        {k:'كيس', t:'درس الأسبوع', d:'{bag}'},
        {k:'كيس', t:'تركيبات مع دفاع', d:'1-2-3، ثم ارفع حراستك أو انحنِ تحت خطاف وهمي، كأن الكيس يرد.'},
        {k:'كيس', t:'سرعة', d:'20 ثانية لكمات مستقيمة سريعة متواصلة، ثم 10 ثوانٍ حركة. كرّر.'},
        {k:'كيس', t:'الجولة الأخيرة', d:'كل ما تعلمته. آخر 30 ثانية بأقصى جهد.'}
      ]},
    circuit: {n:'دائرة النزال', type:'readiness', fig:'sprawl', base:{rounds:3, len:120, rest:60}, p3:{rounds:4, len:120}, deload:{rounds:2},
      intro:'4 حركات × 30 ثانية في كل جولة، بدون راحة بينها. تحاكي مجهود جولة كاملة.',
      segs:[{ex:'pushup', ladder:'pushup', sec:30},{ex:'sprawl', gate:3, fallback:'sprawlStep', sec:30},{ex:'shoulderTaps', sec:30},{ex:'fastPunches', sec:30}]},
    rope: {n:'حبل فترات', type:'conditioning', fig:'rope', eq:['rope'], gate:3, fallback:'shadowNoBounce',
      intro:'قفزات منخفضة على المشط. أوقف إذا زاد ألم الكاحل عن 2.'},
    shadowNoBounce: {n:'شادو فترات بدون نطّ', type:'conditioning', fig:'shadow',
      intro:'بديل الحبل حتى يجهز الكاحل: لكمات وحركة على الأرض بدون قفز.'}
  },
  ropeLevels: [
    {work:30, rest:30, n:6}, {work:30, rest:30, n:8}, {work:45, rest:15, n:6}, {work:60, rest:30, n:5},
    {work:120, rest:60, n:3}, {work:180, rest:60, n:3}, {work:180, rest:60, n:3, bursts:true}
  ],

  // ---------- ankle rehab ----------
  ankle: {
    phases: [
      {n:1, name:'حماية', goal:'تهدئة الألم واستعادة الحركة.',
        sets:{A:['ankleCircles','balanceEasy'], B:['ankleIso','calfBoth'], C:['ankleCircles','k2w']},
        allow:'لا قفز ولا حبل ولا جري. الملاكمة بخطوات على الأرض فقط.',
        crit:[
          {k:'walk', t:'تمشي وتنزل الدرج بدون عرج.'},
          {k:'pain2', t:'ألم الكاحل 2 أو أقل خلال آخر 7 أيام.', auto:{type:'painMax', joint:'ankle', days:7, lte:2}},
          {k:'calfBoth', t:'15 رفعة كعب على الرجلين بدون ألم.', auto:{type:'best', ex:'calfBoth', gte:15}}
        ]},
      {n:2, name:'قوة وتوازن', goal:'قوة الساق والثبات.',
        sets:{A:['balanceSL','calfSL'], B:['k2w','tibRaise'], C:['bandEversion','balanceEyes']},
        allow:'لا قفز ولا حبل بعد. خطوات الملاكمة مسموحة.',
        crit:[
          {k:'calf20', t:'20 رفعة كعب على الرجل المصابة وحدها.', auto:{type:'best', ex:'calfSL', gte:20}},
          {k:'bal30', t:'توازن 30 ثانية بعينين مفتوحتين.', auto:{type:'best', ex:'balanceSL', gte:30}},
          {k:'eyes10', t:'توازن 10 ثوانٍ بعينين مغمضتين.', auto:{type:'best', ex:'balanceEyes', gte:10}},
          {k:'k2w', t:'الركبة إلى الحائط: الفرق بين الرجلين 2 سم أو أقل.'},
          {k:'morning', t:'ألم الصباح 2 أو أقل بعد التمارين.', auto:{type:'painMax', joint:'ankle', days:7, lte:2}}
        ]},
      {n:3, name:'قفز تدريجي', goal:'عودة الحبل والقفز الخفيف.',
        sets:{A:['balanceReach','calfSL'], B:['pogo','k2w'], C:['lineHops','bandEversion']},
        allow:'الحبل بفترات 30/30، وقفزات خفيفة. لا وثب ولا قفز عالٍ بعد.',
        crit:[
          {k:'calf25', t:'25 رفعة كعب على الرجل المصابة.', auto:{type:'best', ex:'calfSL', gte:25}},
          {k:'hop20', t:'20 قفزة على الرجل المصابة بدون ألم.', auto:{type:'best', ex:'singleHop', gte:20}},
          {k:'rope3', t:'حبل 3 دقائق متصلة بدون ألم.', auto:{type:'ropeLevel', gte:5}},
          {k:'conf', t:'تثق بكاحلك في الحركة الجانبية.'}
        ]},
      {n:4, name:'عودة كاملة', goal:'قفز وانفجار ودوران كامل، مع الوقاية.',
        sets:{A:['balanceReach','calfSL'], B:['singleHop','k2w'], C:['lineHops','tibRaise']},
        allow:'كل شيء مسموح. استمر في التوازن ورفع الكعب مرتين أسبوعياً للوقاية.',
        crit:[]}
    ],
    intake: [
      {k:'when', q:'متى حدثت الإصابة؟', opts:[{v:'recent', t:'خلال آخر 6 أسابيع'},{v:'months', t:'من 6 أسابيع إلى 6 أشهر'},{v:'old', t:'أكثر من 6 أشهر'}]},
      {k:'pain', q:'كم ألم الكاحل الآن عند المشي؟', opts:[{v:0, t:'0: لا ألم'},{v:2, t:'1–2: خفيف'},{v:4, t:'3–5: متوسط'},{v:7, t:'6 أو أكثر'}]},
      {k:'hop', q:'هل تستطيع القفز على الرجل المصابة 10 مرات بدون ألم؟', opts:[{v:'yes', t:'نعم'},{v:'some', t:'بصعوبة أو بألم خفيف'},{v:'no', t:'لا'}]},
      {k:'seen', q:'هل فحصه مختص؟', opts:[{v:'yes', t:'نعم'},{v:'no', t:'لا'}]}
    ]
  },

  // ---------- sessions ----------
  // item kinds: drill (warm-up checklist), rehab (ankle slot), rounds (boxing/conditioning timer), lift (logged sets), stretch
  sessions: {
    s1: {n:'علوي: قوة + شادو', short:'علوي قوة', type:'strength', types:['strength','boxing','mobility'], est:55, order:1,
      focus:'العقلة وضغط الصدر والسحب والكتف، مع تقنية الملاكمة.',
      blocks:[
        {k:'warm', n:'إحماء وحماية المفاصل', min:8, items:[{ex:'shadowLight'},{ex:'bandPullApart'},{ex:'scapPushup'},{ex:'wristRocks'},{ex:'chinTuck'},{rehab:'A'}]},
        {k:'rounds', n:'شادو تقني', plan:'shadowTech'},
        {k:'lift', n:'المقاومة', items:[
          {id:'a1', ex:'pullup', slot:'pullup', ladder:'pullup', sets:4, reps:[4,8], rir:2, rest:90, pair:'A', p3:{reps:[3,6]}},
          {id:'a2', ex:'dbBench', sets:4, reps:[6,10], rir:2, rest:90, pair:'A', p3:{reps:[5,8]}},
          {id:'b1', ex:'dbRow', sets:3, reps:[8,12], rir:2, rest:60, pair:'B'},
          {id:'b2', ex:'hkPress', sets:3, reps:[8,12], rir:2, rest:60, pair:'B'},
          {id:'c1', ex:'latRaise', sets:3, reps:[12,20], rir:1, rest:45, pair:'C', acc:true},
          {id:'c2', ex:'pallof', sets:2, reps:[10,10], rir:0, rest:45, pair:'C', core:true}
        ]},
        {k:'stretch', n:'إطالة', min:3, items:[{ex:'stLat'},{ex:'stChest'}]}
      ]},
    s2: {n:'سفلي + لياقة', short:'سفلي', type:'strength', types:['strength','conditioning','mobility'], est:55, order:2,
      focus:'السكوات وثني الورك والرجل الواحدة والحمل، ثم حبل أو بديله.',
      blocks:[
        {k:'warm', n:'إحماء وحماية المفاصل', min:8, items:[{ex:'ankleCircles'},{ex:'hip9090'},{ex:'gluteBridge'},{ex:'birdDog'},{rehab:'B'}]},
        {k:'lift', n:'المقاومة', items:[
          {id:'a1', ex:'goblet', sets:4, reps:[8,12], rir:2, rest:90, pair:'A', p3:{reps:[6,10]}},
          {id:'a2', ex:'deadBug', sets:3, reps:[6,8], rir:0, rest:30, pair:'A', core:true},
          {id:'b1', ex:'rdl', sets:4, reps:[8,12], rir:2, rest:90, pair:'B', p3:{reps:[6,10]}},
          {id:'b2', ex:'nordic', sets:2, reps:[4,6], rir:2, rest:60, pair:'B', prot:true},
          {id:'c1', ex:'bulgarian', sets:3, reps:[8,12], rir:2, rest:60, p3:{reps:[6,10]}},
          {id:'d1', ex:'farmer', sets:3, reps:[40,40], unit:'sec', rir:0, rest:60}
        ]},
        {k:'rounds', n:'لياقة: حبل', plan:'rope'},
        {k:'stretch', n:'إطالة', min:3, items:[{ex:'stHip'},{ex:'stHam'}]}
      ]},
    s3: {n:'علوي: شكل V + كيس', short:'علوي V', type:'boxing', types:['boxing','strength','mobility'], est:50, order:3,
      focus:'قوة على الكيس، ثم الظهر وأعلى الصدر والكتف الجانبي والخلفي.',
      blocks:[
        {k:'warm', n:'إحماء وحماية المفاصل', min:7, items:[{ex:'armCircles'},{ex:'extRot'},{ex:'wristCircles'},{ex:'shadowLight'},{rehab:'C'}]},
        {k:'rounds', n:'كيس: قوة وتقنية', plan:'bagPower'},
        {k:'lift', n:'المقاومة', items:[
          {id:'a1', ex:'chinup', slot:'chinup', ladder:'pullup', sets:3, reps:[6,10], rir:2, rest:90, pair:'A'},
          {id:'a2', ex:'inclinePress', sets:4, reps:[8,12], rir:2, rest:90, pair:'A'},
          {id:'b1', ex:'csRow', sets:3, reps:[10,15], rir:1, rest:60, pair:'B'},
          {id:'b2', ex:'latRaise', sets:4, reps:[12,20], rir:1, rest:45, pair:'B', acc:true},
          {id:'c1', ex:'facePull', sets:3, reps:[15,20], rir:1, rest:45, pair:'C', acc:true},
          {id:'c2', ex:'neckIso', sets:1, reps:[1,1], unit:'check', rir:0, rest:0, pair:'C', prot:true}
        ]},
        {k:'stretch', n:'إطالة', min:3, items:[{ex:'stLat'},{ex:'stTri'},{ex:'stWrist'}]}
      ]},
    s4: {n:'سفلي انفجاري + جاهزية', short:'انفجاري', type:'readiness', types:['readiness','strength','mobility'], est:55, order:4,
      focus:'أرجحة انفجارية ورجل واحدة ودوران قوي، ثم دائرة النزال.',
      blocks:[
        {k:'warm', n:'إحماء وحماية المفاصل', min:8, items:[{ex:'legSwing'},{ex:'wgs'},{rehab:'A'}]},
        {k:'lift', n:'المقاومة والانفجار', items:[
          {id:'a1', ex:'swing', sets:4, reps:[10,10], rir:3, rest:60, pair:'A', power:true},
          {id:'a2', ex:'copenhagen', sets:2, reps:[15,25], unit:'sec', rir:0, rest:30, pair:'A', prot:true},
          {id:'b1', ex:'revLunge', sets:3, reps:[8,10], rir:2, rest:60, pair:'B'},
          {id:'b2', ex:'slRdl', sets:3, reps:[8,10], rir:2, rest:60, pair:'B'},
          {id:'c1', ex:'latRaise', sets:3, reps:[12,20], rir:1, rest:45, pair:'C', acc:true},
          {id:'c2', ex:'woodchop', sets:3, reps:[8,8], rir:2, rest:45, pair:'C', power:true}
        ]},
        {k:'rounds', n:'دائرة النزال', plan:'circuit'},
        {k:'stretch', n:'إطالة', min:3, items:[{ex:'stQuad'},{ex:'stCalf'}]}
      ]},
    s5: {n:'ملاكمة ولياقة + حركة', short:'ملاكمة', type:'boxing', types:['boxing','conditioning','mobility'], est:40, order:5, optional:true,
      focus:'جولات كيس للياقة، وحبل، وذراعان اختيارياً، وتسلسل حركة.',
      blocks:[
        {k:'warm', n:'إحماء', min:5, items:[{ex:'shadowLight'},{ex:'openBook'},{ex:'wristCircles'}]},
        {k:'rounds', n:'كيس: لياقة بفترات', plan:'bagCond'},
        {k:'rounds', n:'حبل', plan:'rope', short:true},
        {k:'lift', n:'ذراعان وحماية', items:[
          {id:'a1', ex:'hammer', sets:3, reps:[10,15], rir:1, rest:45, pair:'A', acc:true, optional:true},
          {id:'a2', ex:'ohTri', sets:3, reps:[10,15], rir:1, rest:45, pair:'A', acc:true, optional:true},
          {id:'b1', ex:'deadHang', sets:2, reps:[20,60], unit:'sec', rir:0, rest:45, prot:true}
        ]},
        {k:'stretch', n:'تسلسل حركة', min:8, items:[{ex:'catCow'},{ex:'openBook'},{ex:'hip9090'},{ex:'deepSquat'},{ex:'stChild'}]}
      ]},
    mob: {n:'حركة يوم الراحة', short:'حركة', type:'mobility', types:['mobility'], est:10, order:6, optional:true, rest:true,
      focus:'10 دقائق تحرّك المفاصل وتحسّن المرونة بدون تعب.',
      blocks:[
        {k:'stretch', n:'تسلسل الحركة', min:10, items:[{ex:'catCow'},{ex:'openBook'},{ex:'hip9090'},{ex:'wgs'},{ex:'deepSquat'},{ex:'k2w'},{ex:'stChild'}]}
      ]}
  },
  rotation4: ['s1','s2','s3','s4'],
  rotation5: ['s1','s2','s3','s4','s5'],
  week: [
    {d:6, label:'السبت', s:'s1'}, {d:0, label:'الأحد', s:'s2'}, {d:1, label:'الاثنين', s:'mob', rest:true},
    {d:2, label:'الثلاثاء', s:'s3'}, {d:3, label:'الأربعاء', s:'s4'}, {d:4, label:'الخميس', s:'s5', optional:true}, {d:5, label:'الجمعة', s:null, rest:true}
  ],

  phases: [
    {id:'p1', n:'الأساس', from:1, to:4, desc:'تعلّم الحركات. توقف وعندك 3 تكرارات في أول أسبوعين، ثم 2.'},
    {id:'p2', n:'البناء', from:5, to:8, desc:'المجموعات كاملة، والجهد 1 إلى 2، وجولات أطول.'},
    {id:'d1', n:'تخفيف واختبارات', from:9, to:9, deload:true, tests:true, desc:'نصف المجموعات تقريباً وجهد أخف. الاختبارات في أول جلسة.'},
    {id:'p3', n:'القوة والانفجار', from:10, to:13, desc:'تكرار أقل ووزن أعلى في التمارين الكبيرة، وانفجار أكثر.'},
    {id:'d2', n:'تخفيف واختبارات', from:14, to:14, deload:true, tests:true, desc:'ثم دورة جديدة من مرحلة البناء بدرجات أعلى.'}
  ],
  testWeeks: [1, 5, 9, 14],

  maxedSteps: [
    {k:'reps', n:'تكرارات أكثر', d:'ارفع سقف التكرار حتى 20 بنفس الوزن.'},
    {k:'tempo', n:'نزول بطيء', d:'انزل خلال 3 إلى 4 ثوانٍ في كل تكرار.'},
    {k:'pause', n:'توقف', d:'توقف ثانيتين في أصعب نقطة من الحركة.'},
    {k:'half', n:'تكرار ونصف', d:'انزل كاملاً، اصعد للنصف، انزل مرة أخرى، ثم اصعد كاملاً. هذا تكرار واحد.'},
    {k:'harder', n:'تمرين أصعب', d:'انتقل للبديل الأصعب أو لنسخة اليد أو الرجل الواحدة.'}
  ],

  missed: [
    {from:0, to:7, t:'أكمل من الجلسة التالية بالترتيب. لا تضغط جلستين في يوم.'},
    {from:8, to:13, mode:'week', t:'رجعت بعد أسبوع: نفس الأوزان، ومجموعة أقل من كل تمرين في هذه الجلسة.'},
    {from:14, to:27, mode:'weeks', t:'رجعت بعد أسبوعين أو أكثر: 90% من الأوزان وجهد أخف لجلستين.'},
    {from:28, to:9999, mode:'month', t:'رجعت بعد شهر أو أكثر: نعود للأسبوع 3 من مرحلة الأساس بأوزان 80 إلى 85%.'}
  ],

  deloadSigns: [
    {k:'sleep', t:'نوم سيئ ثلاث ليالٍ أو أكثر'},
    {k:'pain', t:'ألم 4 أو أكثر في أي مفصل'},
    {k:'drop', t:'تراجع التكرارات جلستين متتاليتين'},
    {k:'rpe', t:'تقييم الجلسة 9 من 10 أو أكثر مرتين'}
  ],

  rir: [
    {v:0, t:'لا أستطيع تكراراً آخر بشكل صحيح'},
    {v:1, t:'تكرار واحد فقط'},
    {v:2, t:'تكراران'},
    {v:3, t:'3 أو أكثر: المجموعة سهلة'}
  ],

  tests: [
    {id:'t_pull', g:'strength', n:'أقصى عدد عقلة كاملة', u:'تكرار', how:'من تعلّق كامل حتى يتجاوز الذقن العقلة. إذا لم تستطع واحدة، سجّل 0 واكتب درجة السلّم.', hi:true},
    {id:'t_push', g:'strength', n:'أقصى عدد ضغط كامل', u:'تكرار', how:'الصدر يقترب من الأرض في كل تكرار والجسم مستقيم.', hi:true},
    {id:'t_goblet', g:'strength', n:'سكوات الكأس بأثقل دمبل', u:'تكرار', how:'بأثقل دمبل لديك، حتى يبقى عندك تكرار واحد.', hi:true},
    {id:'t_side', g:'strength', n:'البلانك الجانبي', u:'ث', how:'على الجهة الأضعف، حتى يهبط الورك.', hi:true},
    {id:'t_broad', g:'power', n:'الوثب الطويل من الثبات', u:'سم', how:'من الوقوف، اقفز للأمام واهبط ثابتاً. أفضل من 3 محاولات.', hi:true, gate:4},
    {id:'t_rhr', g:'cond', n:'نبض الراحة صباحاً', u:'نبضة/د', how:'قبل النهوض من السرير: عدّ النبض 30 ثانية واضربه في 2.', hi:false},
    {id:'t_bag', g:'cond', n:'عدد 1-2 على الكيس في دقيقتين', u:'عدد', how:'جاب ثم كروس بأداء صحيح وأسرع إيقاع تستطيع المحافظة عليه.', hi:true},
    {id:'t_k2wL', g:'flex', n:'الركبة إلى الحائط: اليسرى', u:'سم', how:'أبعد مسافة بين الأصابع والحائط والركبة تلمسه والكعب على الأرض.', hi:true},
    {id:'t_k2wR', g:'flex', n:'الركبة إلى الحائط: اليمنى', u:'سم', how:'نفس الاختبار للرجل الأخرى.', hi:true},
    {id:'t_toe', g:'flex', n:'لمس الأرض', u:'سم', how:'قف والرجلان مستقيمتان وانحنِ. المسافة بين الأصابع والأرض بالسالب، أو بعد ملامستها بالموجب.', hi:true},
    {id:'t_scrL', g:'flex', n:'خدش الظهر: اليد اليسرى للأعلى', u:'سم', how:'يد من فوق الكتف وأخرى من أسفل الظهر. المسافة بين الأصابع بالسالب، أو التداخل بالموجب.', hi:true},
    {id:'t_scrR', g:'flex', n:'خدش الظهر: اليد اليمنى للأعلى', u:'سم', how:'نفس الاختبار للجهة الأخرى.', hi:true},
    {id:'t_thomas', g:'flex', n:'اختبار توماس (الورك الأمامي)', u:'نعم/لا', how:'على طرف البنش، اسحب ركبة لصدرك. هل تبقى فخذ الرجل الأخرى على البنش؟ نعم = مرونة جيدة.', bool:true},
    {id:'t_waist', g:'body', n:'محيط الخصر عند السرة', u:'سم', how:'صباحاً قبل الأكل، بعد الزفير، والشريط أفقي.', hi:false}
  ],
  testGroups: {strength:'قوة', power:'انفجار', cond:'لياقة', flex:'مرونة', body:'الجسم'},

  flexibility: [
    {area:'الكاحل', why:'بعد الإصابة يقل المدى، ويحدّ من السكوات والحركة.', how:'الركبة إلى الحائط، والسكوات بمدى كامل.', test:'t_k2wL'},
    {area:'الورك الأمامي', why:'الجلوس والوقفة القتالية تقصّره.', how:'إطالة الورك الأمامية، والطعن الخلفي.', test:'t_thomas'},
    {area:'خلف الفخذ', why:'ثني الورك في الرفعة والأرجحة.', how:'الرفعة الرومانية بمدى كامل، وإطالة خلف الفخذ.', test:'t_toe'},
    {area:'الظهر العلوي', why:'دوران اللكمة والحراسة.', how:'فتح الكتاب، وأعظم إطالة.'},
    {area:'الكتف', why:'رفع الذراعين والعقلة والوضعية.', how:'إطالة جانب الظهر والصدر، والعقلة بمدى كامل.', test:'t_scrL'},
    {area:'الرسغ', why:'الضغط والكيس.', how:'هزّ الرسغ، وإطالة الساعد.'}
  ],

  freeKinds: [
    {k:'rope', n:'حبل', type:'conditioning', unit:'min', fig:'rope'},
    {k:'shadow', n:'شادو', type:'boxing', unit:'rounds', fig:'shadow'},
    {k:'bag', n:'جولات كيس', type:'boxing', unit:'rounds', fig:'bag'},
    {k:'walk', n:'مشي', type:'conditioning', unit:'min', fig:'walk'},
    {k:'mobility', n:'حركة وإطالة', type:'mobility', unit:'min', fig:'s_child'},
    {k:'other', n:'نشاط آخر', type:'readiness', unit:'min', fig:'run'}
  ],

  glossary: [
    {k:'set', n:'المجموعة', d:'عدد من التكرارات المتتالية بدون راحة. مثال: 3 مجموعات × 10 = تفعل 10، ترتاح، 10، ترتاح، 10.'},
    {k:'rep', n:'التكرار', d:'مرة واحدة كاملة من الحركة: نزول وصعود.'},
    {k:'rir', n:'مقياس الجهد', d:'كم تكراراً بقي عندك عندما توقفت؟ 2 يعني أنك كنت تستطيع تكرارين آخرين بشكل صحيح. هذا يحمي من الإرهاق ويكفي لبناء العضل.'},
    {k:'round', n:'الجولة', d:'وقت عمل متواصل (مثلاً دقيقتان) تليه راحة قصيرة. نوع الجولة يحدد ماذا تفعل: شادو، أو كيس، أو حبل.'},
    {k:'rest', n:'الراحة', d:'الوقت بين المجموعات. التطبيق يبدأ مؤقت الراحة تلقائياً بعد كل مجموعة.'},
    {k:'pair', n:'الزوج', d:'تمرينان تتناوب بينهما: مجموعة من الأول، ثم مجموعة من الثاني، ثم راحة. يوفّر الوقت لأن العضلات مختلفة.'},
    {k:'deload', n:'أسبوع التخفيف', d:'أسبوع بنصف المجموعات تقريباً وجهد أخف، حتى يتعافى جسمك ويعود أقوى.'},
    {k:'ladder', n:'السلّم', d:'درجات من الأسهل إلى الأصعب لتمارين وزن الجسم. تنتقل للدرجة التالية عندما تحقق شرطها.'},
    {k:'pattern', n:'نمط الحركة', d:'نوع الحركة الأساسي: دفع، أو سحب، أو سكوات، أو ثني الورك، أو حمل. البرنامج يغطي كل الأنماط.'},
    {k:'primary', n:'العضلة الأساسية والثانوية', d:'الأساسية تقوم بمعظم العمل وتظهر بلون قوي في الخريطة. الثانوية تساعد وتظهر بلون أخف.'},
    {k:'double', n:'الزيادة المزدوجة', d:'تزيد التكرارات أولاً حتى الحد الأعلى في كل المجموعات، ثم تزيد الوزن وتبدأ من الحد الأدنى من جديد.'},
    {k:'tempo', n:'النزول البطيء', d:'إنزال الوزن خلال 3 إلى 4 ثوانٍ. يجعل نفس الوزن أصعب.'}
  ],

  parq: [
    'هل قال لك طبيب إن لديك مرضاً في القلب أو ارتفاعاً في ضغط الدم؟',
    'هل تشعر بألم في الصدر أثناء الراحة، أو في حياتك اليومية، أو أثناء النشاط البدني؟',
    'هل فقدت توازنك بسبب دوخة، أو فقدت الوعي، خلال آخر 12 شهراً؟',
    'هل شُخّصت بحالة مزمنة أخرى غير القلب وضغط الدم؟',
    'هل تتناول حالياً أدوية موصوفة لحالة مزمنة؟',
    'هل لديك حالياً، أو خلال آخر 12 شهراً، مشكلة في العظام أو المفاصل أو الأنسجة الرخوة تزداد سوءاً مع النشاط؟ (لا تحسب إصابة الكاحل التي ستتابعها في التطبيق إذا لم تكن تسوء)',
    'هل قال لك طبيب إنك يجب أن تمارس النشاط البدني تحت إشراف طبي فقط؟'
  ],

  nutrition: {protein:[1.6, 2.0], lossPct:[0.5, 0.7], steps:[7000, 10000],
    note:'إذا لم ينزل متوسط الوزن الأسبوعي أسبوعين متتاليين، أنقص 150 إلى 200 سعرة يومياً.'},

  sources: [
    {n:1, lvl:'strong', t:'ACSM Position Stand 2026: Resistance Training Prescription in Healthy Adults', use:'مرتان أسبوعياً لكل عضلة، ونحو 10 مجموعات أسبوعياً، والأدوات المنزلية فعّالة.', url:'https://journals.lww.com/acsm-msse/fulltext/2026/04000/american_college_of_sports_medicine_position.21.aspx'},
    {n:2, lvl:'strong', t:'Schoenfeld, Ogborn, Krieger 2017 — Weekly volume and muscle mass (J Sports Sci)', use:'مجموعات أكثر أسبوعياً ترتبط بنمو أكبر.', url:'https://doi.org/10.1080/02640414.2016.1210197'},
    {n:3, lvl:'strong', t:'Pelland et al. 2024 — Volume & frequency dose-response (SportRxiv)', use:'المجموعة الثانوية تُحسب نصف مجموعة. جدول العضلات مبني عليها.', url:'https://sportrxiv.org/index.php/server/preprint/view/460'},
    {n:4, lvl:'strong', t:'Robinson et al. 2024 — Proximity to failure (Sports Med)', use:'الاقتراب من الفشل يزيد التضخيم. نتوقف قبله بتكرار إلى ثلاثة.', url:'https://doi.org/10.1007/s40279-024-02069-2'},
    {n:5, lvl:'strong', t:'Schoenfeld et al. 2017 — Low vs high load (JSCR)', use:'الأوزان الخفيفة تبني العضل إذا اقتربت من الفشل.', url:'https://doi.org/10.1519/JSC.0000000000002200'},
    {n:6, lvl:'strong', t:'Schoenfeld, Ogborn, Krieger 2016 — Training frequency (Sports Med)', use:'مرتان أسبوعياً أفضل من مرة.', url:'https://doi.org/10.1007/s40279-016-0543-8'},
    {n:7, lvl:'strong', t:'Schoenfeld, Ogborn, Krieger 2015 — Repetition duration (Sports Med)', use:'إبطاء النزول أداة صالحة لزيادة الصعوبة.', url:'https://doi.org/10.1007/s40279-015-0304-0'},
    {n:8, lvl:'mid', t:'Zourdos et al. 2016 — RIR-based RPE scale (JSCR)', use:'مقياس «كم تكراراً بقي» صالح ويتحسن بالممارسة.', url:'https://doi.org/10.1519/JSC.0000000000001049'},
    {n:9, lvl:'strong', t:'Schumann et al. 2022 — Concurrent training (Sports Med)', use:'اللياقة لا تمنع العضل والقوة. الانفجاري أول الجلسة.', url:'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8891239/'},
    {n:10, lvl:'strong', t:'Murphy & Koehler 2022 — Energy deficiency and lean mass (SJMSS)', use:'العجز المعتدل يحفظ العضل أفضل.', url:'https://doi.org/10.1111/sms.14075'},
    {n:11, lvl:'strong', t:'Morton et al. 2018 — Protein and resistance training (BJSM)', use:'1.6 غرام بروتين لكل كغ يومياً وحتى 2.2.', url:'https://doi.org/10.1136/bjsports-2017-097608'},
    {n:12, lvl:'mid', t:'Garthe et al. 2011 — Weight-loss rate and body composition (IJSNEM)', use:'الخسارة البطيئة تحفظ العضل.', url:'https://doi.org/10.1123/ijsnem.21.2.97'},
    {n:13, lvl:'strong', t:'Lauersen et al. 2014 — Exercise to prevent sports injuries (BJSM)', use:'القوة والتوازن يقللان الإصابات، والإطالة وحدها لا.', url:'https://doi.org/10.1136/bjsports-2013-092538'},
    {n:14, lvl:'strong', t:'Vuurberg et al. 2018 — Ankle sprain guideline (BJSM)', use:'التمارين أفضل من الراحة للكاحل.', url:'https://doi.org/10.1136/bjsports-2017-098106'},
    {n:15, lvl:'mid', t:'Hupperets et al. 2009 — Home balance training and ankle re-sprain (BMJ)', use:'برنامج توازن 8 أسابيع خفّض تكرار الالتواء 35%.', url:'https://doi.org/10.1136/bmj.b2684'},
    {n:16, lvl:'mid', t:'Smith et al. 2021 — PAASS return-to-sport framework (BJSM)', use:'شروط العودة: ألم، قوة ومدى، ثقة، توازن، قفز.', url:'https://doi.org/10.1136/bjsports-2021-104087'},
    {n:17, lvl:'mid', t:'Silbernagel et al. 2007 — Pain-monitoring model (AJSM)', use:'ألم خفيف مقبول إذا عاد لطبيعته صباحاً.', url:'https://doi.org/10.1177/0363546506298279'},
    {n:18, lvl:'strong', t:'Afonso et al. 2021 — Strength training vs stretching for ROM (Healthcare)', use:'القوة بمدى كامل تحسّن المرونة مثل الإطالة.', url:'https://doi.org/10.3390/healthcare9040427'},
    {n:19, lvl:'strong', t:'Behm et al. 2016 — Acute effects of stretching (APNM)', use:'الإحماء الحركي قبل، والإطالة الثابتة بعد.', url:'https://doi.org/10.1139/apnm-2015-0235'},
    {n:20, lvl:'mid', t:'Thomas et al. 2018 — Stretching duration and ROM (IJSM)', use:'نحو 5 دقائق إطالة أسبوعياً لكل منطقة.', url:'https://doi.org/10.1055/s-0044-101146'},
    {n:21, lvl:'strong', t:'Chaabène et al. 2015 — Amateur boxing attributes (Sports Med)', use:'الملاكمة تحتاج قدرة لاهوائية وأساساً هوائياً وقوة.', url:'https://doi.org/10.1007/s40279-014-0274-7'},
    {n:22, lvl:'mid', t:'Loturco et al. 2016 — Strength/power and punching impact (JSCR)', use:'قوة اللكمة ترتبط بقدرة الرجلين.', url:'https://lida.sport-iat.de/ta/Record/4038583?lng=en'},
    {n:23, lvl:'mid', t:'Lenetsky, Harris, Brughelli 2013 — Contributors of punching forces (SCJ)', use:'اللكمة تبدأ من الأرض والورك والجذع.', url:'https://doi.org/10.1519/SSC.0b013e31828b6c12'},
    {n:24, lvl:'mid', t:'Loosemore et al. 2015 — Boxing injury epidemiology (BJSM)', use:'اليد والرسغ أكثر إصابات الملاكمين.', url:'https://bjsm.bmj.com/content/49/17/1100'},
    {n:25, lvl:'mid', t:'Cools et al. 2007 — Scapular muscle balance exercises (AJSM)', use:'تمارين حماية الكتف.', url:'https://doi.org/10.1177/0363546507303560'},
    {n:26, lvl:'mid', t:'Hrysomallis 2016 — Neck strength and injury risk (Sports Med)', use:'تقوية الرقبة في رياضات الاحتكاك.', url:'https://doi.org/10.1007/s40279-016-0490-4'},
    {n:27, lvl:'strong', t:'van Dyk et al. 2019 — Nordic hamstring exercise (BJSM)', use:'نورديك يخفّض إصابات خلف الفخذ للنصف.', url:'https://doi.org/10.1136/bjsports-2018-100045'},
    {n:28, lvl:'mid', t:'Harøy et al. 2019 — Copenhagen adduction programme (BJSM)', use:'كوبنهاغن يقلل مشاكل الورك الداخلية.', url:'https://doi.org/10.1136/bjsports-2017-098937'},
    {n:29, lvl:'mid', t:'Bell et al. 2023 — Deloading Delphi consensus (Sports Med Open)', use:'أسبوع التخفيف وعلاماته.', url:'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10511399/'},
    {n:30, lvl:'mid', t:'Trecroci et al. 2015 — Jump rope training (JSSM)', use:'الحبل يحسّن التوازن والتنسيق.', url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4657422/'},
    {n:31, lvl:'strong', t:'PAR-Q+ 2023 (Warburton et al.)', use:'أسئلة الجاهزية الصحية في أول استخدام.', url:'https://eparmedx.com/'},
    {n:32, lvl:'strong', t:'Bull et al. 2020 — WHO physical activity guidelines (BJSM)', use:'150 إلى 300 دقيقة نشاط أسبوعياً وتقوية العضلات.', url:'https://doi.org/10.1136/bjsports-2020-102955'},
    {n:33, lvl:'coach', t:'NSCA — Essentials of Strength Training and Conditioning (4th ed.)', use:'ترتيب التمارين والإحماء والراحة.', url:'https://www.nsca.com/store/product-detail/INV/9781492501626/9781492501626'},
    {n:34, lvl:'coach', t:'Dan John — Intervention / Easy Strength', use:'الأنماط الأساسية: دفع، سحب، ثني الورك، سكوات، حمل.', url:'https://danjohn.net/'},
    {n:35, lvl:'coach', t:'McGill 2010 — Core training (SCJ)', use:'الجذع يقاوم الحركة، وتمارين McGill الثلاثة.', url:'https://doi.org/10.1519/SSC.0b013e3181df4521'},
    {n:36, lvl:'coach', t:'Mike Boyle — New Functional Training for Sports', use:'تمارين الرجل الواحدة.', url:'https://us.humankinetics.com/products/new-functional-training-for-sports-2nd-edition'},
    {n:37, lvl:'coach', t:'Joel Jamieson — Ultimate MMA Conditioning', use:'لياقة النزال بطول الجولة.', url:'https://www.8weeksout.com/'},
    {n:38, lvl:'coach', t:'RP Strength — Training Volume Landmarks', use:'الحجم يختلف بين الأشخاص، وابدأ قريباً من الحد الأدنى.', url:'https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth'},
    {n:39, lvl:'coach', t:'Expert Boxing (Johnny Nguyen)', use:'شرح الوقفة واللكمات والتركيبات للمبتدئين.', url:'https://expertboxing.com/'}
  ],

  exercises: Object.assign({}, strength, drills)
};
