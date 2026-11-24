/* =========================================================
   course.js  —  "Tell us your name and course" for Still Got This

   What it does
   - First visit: asks for the student's name, then their course
     (grouped by college: IT, CBA, Education, Criminology, Agriculture
     & Forestry, or "my course isn't listed").
   - Saves it on the device (localStorage). No account, no server.
   - Shows a "For you" section with quotes written for that course.
   - Lets the student change their name or course any time.
   - Feeds the course quotes to reminder.js, so the daily phone
     notifications are course quotes too.

   How to use it on your site
   1) Put this file next to index.html (same folder as reminder.js)
   2) Add this line just before </body> in index.html, ABOVE reminder.js:
        <script src="course.js"></script>
        <script src="reminder.js"></script>
   No libraries. No other changes needed.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1) COURSES AND THEIR QUOTES  (all original)
     --------------------------------------------------------- */
  const COLLEGES = [
    {
      id: 'it', name: 'College of Information Technology', short: 'IT students', emoji: '💻', color: '#c6e2ff',
      quotes: [
        "Every bug you fix today is a skill you'll be paid for tomorrow. Stay stubborn.",
        "Even the best developers search for the same error twice. You're not slow, you're learning.",
        "Code that won't run at 2 AM will often work after sleep. Rest is a debugging tool.",
        "You don't have to understand the whole system tonight. Understand the next function.",
        "Your capstone will have bugs, and you'll fix them one at a time, just like everyone before you.",
        "Compare your first draft to your own work last month, not to someone's polished GitHub."
      ],
      courses: [
        { id: 'bsit', label: 'BSIT', full: 'BS Information Technology', quotes: [
          "You're the person who makes technology work for real people. That matters more than any single line of code.",
          "Networks, databases, web, support: IT is wide. You don't have to master all of it today.",
          "Today's confusing error message is tomorrow's easy fix."
        ] },
        { id: 'bsis', label: 'BSIS', full: 'BS Information Systems', quotes: [
          "Information Systems is where technology meets people's real problems. Having both worlds is your superpower.",
          "Systems analysis is just asking better questions. Ask one more today.",
          "Diagrams, requirements and interviews are the unglamorous parts that make systems truly useful."
        ] },
        { id: 'bscs', label: 'BSCS', full: 'BS Computer Science', quotes: [
          "Algorithms feel impossible until they suddenly click. Keep going until the click.",
          "Computer science is learning to think clearly. Every hard problem makes that muscle stronger.",
          "Stuck on recursion or a proof? Trace it by hand with small numbers. Everyone does."
        ] }
      ]
    },
    {
      id: 'cba', name: 'College of Business Administration (CBA)', short: 'CBA students', emoji: '💼', color: '#ffe38f',
      quotes: [
        "Every great business started as someone's tired idea at the end of a long day.",
        "Numbers, people and plans: you're learning the language every industry speaks.",
        "Case studies are rehearsal for real decisions. Make your mistakes here, where they're cheap.",
        "Presentations get easier by doing them badly first. Stand up anyway.",
        "Your network begins in this classroom. Be the classmate people are glad to work with.",
        "Profit matters, but so does the person across the table. Learn both."
      ],
      courses: [
        { id: 'bsba-mm', label: 'BSBA Marketing', full: 'BSBA Major in Marketing Management', quotes: [
          "Marketing is understanding people so well that your help feels natural. Start by listening.",
          "Every brand you admire began with someone guessing, testing and trying again.",
          "Creative block? Look at a real customer's problem. The ideas follow."
        ] },
        { id: 'bsba-fm', label: 'BSBA Financial Mgmt', full: 'BSBA Major in Financial Management', quotes: [
          "Finance is patience measured in numbers. Small, steady decisions compound.",
          "A tough formula is just a story about money. Read it slowly.",
          "Spreadsheets only look scary until you realize they just follow your instructions."
        ] },
        { id: 'bsba-hrm', label: 'BSBA HRM', full: 'BSBA Major in Human Resource Management', quotes: [
          "HR is the art of caring about people at scale. You already practice it with your classmates.",
          "Good leaders listen first. Practice it today.",
          "Labor laws and policies are heavy to read, but they protect real people. That's why you study them."
        ] },
        { id: 'bsa', label: 'BS Accountancy', full: 'BS Accountancy', quotes: [
          "Accountancy is tough because trust is built on getting the details right. Your effort matters.",
          "Debit, credit, balance: once the logic clicks, it clicks forever. Keep practicing the problems.",
          "These long nights with ledgers and reviewers are building a reputation for accuracy you'll carry for life."
        ] },
        { id: 'bsentre', label: 'BS Entrepreneurship', full: 'BS Entrepreneurship', quotes: [
          "Failure is tuition for entrepreneurs. Pay it, learn from it, and keep your idea alive.",
          "Start small, test fast, learn loudly. Your first customer is closer than you think.",
          "Your hustle is already training you: balancing school, ideas and sleep."
        ] },
        { id: 'bshm', label: 'BS Hospitality Mgmt (HM)', full: 'BS Hospitality Management', quotes: [
          "Hospitality is making strangers feel at home. You practice it every time you smile through a tired day.",
          "Early shifts, practicals and uniforms are rehearsals for service people will remember.",
          "A calm face during a rush is a skill. You are building it right now."
        ] },
        { id: 'bstm', label: 'BS Tourism Mgmt', full: 'BS Tourism Management', quotes: [
          "Tourism sells experiences and memories. You are learning to build the best ones.",
          "Every destination starts as a story someone loved enough to share. Learn to tell it well.",
          "Languages, maps and itineraries are tools that help people feel at ease anywhere."
        ] }
      ]
    },
    {
      id: 'edu', name: 'College of Education', short: 'future teachers', emoji: '🍎', color: '#ffcdd0',
      quotes: [
        "Today you are a student. Tomorrow a child will remember something you said. Study like it matters, because it will.",
        "Teaching is the profession that creates every other profession. Be proud you chose it.",
        "Lesson plans take forever now so that classrooms feel easy later.",
        "You'll learn the most from the students who are hardest to teach. Start practicing patience today.",
        "Practicum jitters happen to everyone. Even the best teachers had shaky first days.",
        "Good teachers are not perfect. They are prepared, kind and willing to try again tomorrow."
      ],
      courses: [
        { id: 'beed', label: 'BEEd', full: 'Bachelor of Elementary Education', quotes: [
          "Elementary teachers shape how children feel about learning. Your patience is changing a future.",
          "A sticker, a smile, a gentle correction. The small things you practice now are what children remember.",
          "Teaching reading and numbers to little hands is a quiet superpower."
        ] },
        { id: 'beced', label: 'BECEd', full: 'Bachelor of Early Childhood Education', quotes: [
          "The earliest years build the biggest foundations, and you're learning to build them with care.",
          "Songs, play and stories are serious teaching tools. Your creativity is your classroom.",
          "Little ones teach patience faster than any textbook. Keep showing up."
        ] },
        { id: 'bsed', label: 'BSEd (Secondary)', full: 'Bachelor of Secondary Education', quotes: [
          "Whatever your major, you're learning to make one subject make sense to many different minds.",
          "Explaining something three different ways is the real skill. Practice it with your classmates.",
          "Teachers who stay curious keep classrooms alive. Keep learning."
        ] },
        { id: 'bped', label: 'BPEd', full: 'Bachelor of Physical Education', quotes: [
          "Movement, health and teamwork are lessons that outlast any exam. You teach more than sport.",
          "Tired muscles and tired minds both grow back stronger with rest.",
          "Be the coach who notices the student standing at the edge, and invites them in."
        ] },
        { id: 'btled', label: 'BTLEd', full: 'Bachelor of Technology and Livelihood Education', quotes: [
          "Skills change lives. You're learning to hand students something they can use to support their families.",
          "Hands-on lessons are the most memorable. Your practical work today becomes a student's confidence tomorrow.",
          "You teach people how to build their own opportunities."
        ] },
        { id: 'bsned', label: 'BSNEd (SPED)', full: 'Bachelor of Special Needs Education', quotes: [
          "Every child learns differently, and you're learning to meet each one where they are.",
          "Patience is your strongest tool. It's okay to rest so you can keep giving it.",
          "Small progress in your student is a big victory. Celebrate it, and celebrate yourself."
        ] }
      ]
    },
    {
      id: 'crim', name: 'College of Criminology', short: 'criminology students', emoji: '🛡️', color: '#ddd2ff',
      quotes: [
        "Justice starts with people who stay calm, honest and fair when it's hard. You're training that right now.",
        "Law, investigation and ethics are heavy subjects. Take breaks so your heart stays steady.",
        "Every officer, investigator and forensic expert once studied the same long reviewers you're reading tonight.",
        "Discipline in training is not punishment. It's the foundation of the person others will trust in an emergency.",
        "Physical training builds your body; rest builds the rest of you. Do both.",
        "People who protect others must protect themselves too. Take care of your mind.",
        "Report writing, case analysis and board exam reviews: each page you finish builds the professional you're becoming."
      ],
      courses: [
        { id: 'bscrim', label: 'BS Criminology', full: 'BS Criminology', quotes: [
          "Your uniform and your studies are both promises to serve with honor. Keep them one page at a time.",
          "Mastering the long list of laws and procedures is how you'll stay fair when it matters.",
          "Courage includes asking for help when training or school gets too heavy."
        ] }
      ]
    },
    {
      id: 'agri', name: 'Agriculture & Forestry', short: 'agri & forestry students', emoji: '🌱', color: '#bff0dd',
      quotes: [
        "Farmers and foresters work with patience. Seeds don't rush, and neither do you.",
        "Food on every table and trees on every mountain begin with students like you.",
        "Fieldwork is tiring because it's real. You're learning from the land itself.",
        "Mud on your boots is proof you're doing something real. Be proud of it.",
        "Growth takes seasons. Your effort this semester is a seed that hasn't shown yet.",
        "The country needs people who understand land and food. You chose an essential path."
      ],
      courses: [
        { id: 'bsag', label: 'BS Agriculture', full: 'BS Agriculture', quotes: [
          "You're learning to feed people. There is no more important lesson.",
          "Soil, crops and weather change every season. Keep adapting, as farmers always have.",
          "A failed trial plot teaches persistence the way crops do. Plant again."
        ] },
        { id: 'bsf', label: 'BS Forestry', full: 'BS Forestry', quotes: [
          "Forests are planted by people who may not see them fully grown. That quiet courage is what you're training.",
          "Long hikes, heavy gear and field notes are making you someone the forests can rely on.",
          "Every tree you study is a reason to keep going."
        ] },
        { id: 'bsagf', label: 'BS Agroforestry', full: 'BS Agroforestry', quotes: [
          "You're learning to grow trees and food together, a rare skill the future needs.",
          "Balance is the heart of agroforestry, and of student life too. Rest between the hard work.",
          "Small farm solutions can change a whole community. Keep studying them."
        ] },
        { id: 'bsab', label: 'BS Agribusiness', full: 'BS Agribusiness', quotes: [
          "You connect the farm to the market. Few skills are as valuable.",
          "Numbers and soil both matter. You're learning to speak to farmers and to buyers.",
          "Good harvests need good plans. So do good semesters."
        ] },
        { id: 'bsfish', label: 'BS Fisheries', full: 'BS Fisheries', quotes: [
          "Oceans, rivers and fishponds feed communities. Your studies protect them.",
          "Early mornings and wet fieldwork are part of the job. You're already building a fisher's patience.",
          "Healthy waters begin with students who care. Keep caring."
        ] }
      ]
    }
  ];

  // Used for "my course isn't listed" and when a course has no quotes
  const GENERAL_QUOTES = [
    "Whatever you're studying, you chose it for a reason. Remember that reason on the hard days.",
    "You are allowed to be tired and still be on the right path.",
    "Small effort every day beats big effort once in a while.",
    "A hard semester is not a sign you're in the wrong place. It's a sign you're growing.",
    "Ask for help early. Everyone who finished did.",
    "Rest, water and a good friend are part of the study plan.",
    "You don't have to be the best in the class. You have to keep showing up.",
    "One page, one problem, one step. That's how every degree gets finished."
  ];

  // Quotes about work, OJT and working students (shown under the "💼 Work" tab)
  const WORK_QUOTES = [
    "Your first paycheck won't make you rich, but it will teach you what your effort is worth. Keep going.",
    "Working and studying at the same time is not a weakness. It's two jobs done by someone brave.",
    "A bad day at work is one chapter, not the whole story. Clock out and let it stay behind.",
    "Nobody is born knowing the job. Ask questions. Every expert was once the new hire who asked.",
    "Be the person who shows up on time, tries honestly and treats people kindly. That reputation travels far.",
    "OJT can feel like carrying coffee and photocopies. But you are watching how real work happens. Learn from every minute.",
    "Being tired after a shift doesn't mean you're failing. It means you gave something real today.",
    "Your boss's bad mood is not a grade on your worth. Do your best, breathe, and move on.",
    "Rest on your day off without guilt. You can't pour from an empty cup, and you can't work from an empty body.",
    "Mistakes at work are tuition. Own it, fix it, learn it, and you've already grown past it.",
    "The work you do now, even when it feels small, is building the person who will lead someday.",
    "Every peso you earn while studying is proof of your discipline. Be proud of it."
  ];

  // Quotes about love (shown under the "❤️ Love" tab)
  const LOVE_GROUPS = [
    { id: "happy", label: "Happy in love", quotes: [
      "Being happy in love is wonderful. Just love your own dreams, grades and goals as loudly as you love them.",
      "The best love makes you want to become a better student and a better person, not a more distracted one.",
      "Share your good news with the one who cheers the loudest. Happiness doubles when it's shared.",
      "A good partner celebrates your wins, waits through your busy weeks and never makes you choose between them and your future.",
      "Love isn't only big surprises. It's the \"did you eat?\" text in the middle of a hard day.",
      "Enjoy this happiness without guilt. You deserve soft moments between all the hard ones.",
      "Love that is steady, kind and patient will still be there after the exams are done.",
      "Study dates count. Review together, laugh together, and pass together.",
      "You can be deeply in love and still need time for yourself, your friends and your family. That's healthy, not selfish.",
      "Hold your happiness gently and gratefully. Today is a good day, so let it be one."
    ] },
    { id: "heartbreak", label: "Heartbreak", quotes: [
      "It's okay to cry about it. Your heart is not weak. It simply loved sincerely.",
      "Heartbreak hurts because you cared deeply. That caring is still a beautiful part of you.",
      "You don't have to be okay today. Eat something, drink water, and take the next small step.",
      "Missing someone doesn't mean you should go back. Missing is love with nowhere to go, and it will soften with time.",
      "Your worth was never decided by who stayed and who left.",
      "Some nights feel heavier than others. Let them come and let them pass. Morning always arrives.",
      "Lean on your friends, your family or a school counselor. You were never meant to heal alone.",
      "Don't let a broken heart break your grades or your health. Look after yourself first, even if it's slowly.",
      "Healing isn't a straight line. A bad day after a good week doesn't erase your progress.",
      "One day you'll look back on this time and see how much stronger and wiser it made you."
    ] },
    { id: "hope", label: "Hoping to get back together", quotes: [
      "Hoping is human. While you wait, grow: study, rest, laugh, and become someone you'd be proud to come back to.",
      "If it's meant to work, it will survive time apart. If it isn't, you will survive too.",
      "Don't put your life on pause waiting for someone. Keep moving. The right people can catch up.",
      "Real love comes back with changed actions, not only sweet words. Look for the change.",
      "Ask yourself honestly: do I miss the person, or the comfort of having someone? Both are valid. Just be honest.",
      "Give space, not pressure. Respect is what keeps any future possible.",
      "Work on what you can change in yourself, for your own sake, not just to win someone back.",
      "Whether you get back together or not, you will be okay. Hold that truth next to your hope.",
      "Be kind in your messages and patient in your waiting. Don't beg. Your dignity is part of your love.",
      "Hope is allowed. So is letting go when it's time. Trust yourself to know the difference."
    ] },
  ];

  const COLLEGE_BY_ID = Object.fromEntries(COLLEGES.map((c) => [c.id, c]));
  const FLAT_COURSES = COLLEGES.flatMap((col) => col.courses.map((c) => ({ ...c, college: col })));

  /* ---------------------------------------------------------
     2) SMALL HELPERS
     --------------------------------------------------------- */
  const KEY = 'stg:profile';
  let memoryProfile = null; // used if the browser blocks storage

  function loadProfile() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* fall through */ }
    return memoryProfile;
  }
  function saveProfile(p) {
    memoryProfile = p;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
  }

  function el(tag, props = {}, kids = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') node.setAttribute('style', v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => { if (c != null) node.append(c); });
    return node;
  }

  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('cs-toast');
    if (!t) { t = el('div', { id: 'cs-toast', class: 'cs-toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function copyText(text) {
    const payload = `“${text}” — Still Got This`;
    try { await navigator.clipboard.writeText(payload); toast('Copied! ✨'); return; } catch (e) { /* fallback */ }
    try {
      const ta = el('textarea', { readonly: true, 'aria-hidden': 'true' });
      ta.value = payload; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px;';
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove();
      toast(ok ? 'Copied! ✨' : "Couldn't copy. Select the text and copy it by hand.");
    } catch (e) { toast("Couldn't copy. Select the text and copy it by hand."); }
  }

  // If the site already asked for a name somewhere, reuse it instead of asking twice
  function guessExistingName() {
    try {
      const mine = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (mine && mine.name) return mine.name;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (!/name/i.test(k) || /course|file|user.?agent/i.test(k)) continue;
        let v = localStorage.getItem(k);
        try { const parsed = JSON.parse(v); if (typeof parsed === 'string') v = parsed; else if (parsed && typeof parsed.name === 'string') v = parsed.name; } catch (e) { /* plain string */ }
        if (typeof v === 'string' && v.trim() && v.length <= 30) return v.trim();
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  /* ---------------------------------------------------------
     3) WHAT THE PROFILE MEANS
     --------------------------------------------------------- */
  function resolve(profile) {
    if (!profile) return null;
    if (profile.courseId) {
      const course = FLAT_COURSES.find((c) => c.id === profile.courseId);
      if (course) return { course, college: course.college, title: course.full, label: course.label, emoji: course.college.emoji, color: course.college.color, short: course.college.short };
    }
    if (profile.custom) return { course: null, college: null, title: profile.custom, label: profile.custom, emoji: '🎓', color: '#ffc8ab', short: 'students' };
    return null;
  }

  // [{text, tag}] specific-first, then college-wide, (or general for a custom course)
  function quotesFor(profile) {
    const r = resolve(profile);
    if (!r) return [];
    if (!r.course) return GENERAL_QUOTES.map((t) => ({ text: t, tag: `All ${r.short}` }));
    return [
      ...r.course.quotes.map((t) => ({ text: t, tag: r.label })),
      ...r.college.quotes.map((t) => ({ text: t, tag: `All ${r.short}` }))
    ];
  }

  /* ---------------------------------------------------------
     4) STYLES (injected, so no CSS file is needed)
     --------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('cs-styles')) return;
    const css = `
    .cs-backdrop{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(12,10,28,.7);animation:cs-fade .2s ease}
    .cs-dialog{box-sizing:border-box;width:100%;max-width:640px;max-height:94vh;overflow:auto;padding:26px 24px 22px;border-radius:24px;background:var(--card,#fffdf7);color:var(--ink,#2d2a3a);font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:1rem;line-height:1.55;box-shadow:0 26px 70px rgba(0,0,0,.5);animation:cs-pop .25s ease}
    .cs-dialog *{box-sizing:border-box}
    .cs-dialog h2{margin:0 0 6px;font-family:var(--font-head,inherit);font-weight:600;font-size:1.6rem;line-height:1.2}
    .cs-dialog p{margin:0}
    .cs-sub{color:var(--ink-soft,#595470)}
    .cs-field{margin:18px 0 6px}
    .cs-field label{display:block;margin-bottom:8px;font-weight:800}
    .cs-input{width:100%;padding:14px 16px;border-radius:14px;border:2px solid var(--line,#e6dcc3);background:var(--paper,#fff);color:inherit;font:inherit;font-size:1.1rem}
    .cs-input:focus{outline:none;border-color:#146f6f}
    .cs-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;align-items:center}
    .cs-btn{padding:12px 22px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;cursor:pointer;line-height:1.2;transition:transform .15s,border-color .15s}
    .cs-btn:hover{border-color:#ff7a59;transform:translateY(-1px)}
    .cs-btn--primary{border-color:transparent;background:linear-gradient(135deg,#ff7a59,#ffb347);color:#2d2a3a}
    .cs-btn--small{padding:8px 14px;font-size:.9rem}
    .cs-link{background:none;border:0;padding:6px 4px;color:var(--ink-soft,#595470);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
    .cs-note{margin-top:14px;font-size:.88rem;color:var(--ink-soft,#595470)}
    .cs-group{margin-top:18px}
    .cs-group h3{margin:0 0 8px;font-family:var(--font-head,inherit);font-weight:600;font-size:1.05rem}
    .cs-chips{display:flex;flex-wrap:wrap;gap:8px}
    .cs-chip{padding:10px 16px;border-radius:999px;border:2px solid transparent;color:#2d2a3a;font:inherit;font-weight:800;font-size:.95rem;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s}
    .cs-chip:hover,.cs-chip:focus-visible{transform:translateY(-2px);box-shadow:0 8px 16px -10px rgba(0,0,0,.5);border-color:#2d2a3a}
    .cs-chip[aria-pressed="true"]{border-color:#2d2a3a}
    .cs-chip small{display:block;font-weight:600;opacity:.75;font-size:.76rem;line-height:1.2}
    .cs-dialog :focus-visible{outline:3px solid #146f6f;outline-offset:2px;border-radius:10px}
    .cs-other{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
    .cs-other .cs-input{flex:1;min-width:180px;padding:10px 14px;font-size:1rem}

    .cs-foryou{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:clamp(16px,3vw,32px) clamp(16px,5vw,56px) clamp(24px,4vw,48px);font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);color:var(--ink,#2d2a3a)}
    .cs-foryou *{box-sizing:border-box}
    .cs-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;justify-content:space-between;margin-bottom:18px}
    .cs-head h2{margin:0;font-family:var(--font-head,inherit);font-weight:600;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.15}
    .cs-badge{display:inline-flex;align-items:center;gap:8px;margin-top:8px;padding:6px 14px;border-radius:999px;font-weight:800;font-size:.9rem;color:#2d2a3a}
    .cs-hero{position:relative;padding:34px clamp(18px,4vw,40px) 26px;border-radius:8px 8px 30px 8px;color:#2d2a3a;box-shadow:0 14px 30px -16px rgba(0,0,0,.55)}
    .cs-hero::before{content:"";position:absolute;top:-12px;left:50%;width:110px;height:26px;transform:translateX(-50%) rotate(-3deg);background:rgba(255,255,255,.6);box-shadow:0 1px 3px rgba(0,0,0,.15)}
    .cs-hero__label{font-weight:800;font-size:.88rem;opacity:.8;margin-bottom:10px}
    .cs-hero__quote{margin:0 0 16px;font-family:var(--font-hand,"Segoe Print","Bradley Hand",cursive);font-weight:700;font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.2}
    .cs-hero__actions{display:flex;flex-wrap:wrap;gap:8px}
    .cs-hero .cs-btn{background:rgba(255,255,255,.75);border-color:transparent}
    .cs-hero .cs-btn:hover{background:#fff;border-color:#2d2a3a}
    .cs-tag{display:inline-block;padding:3px 11px;border-radius:999px;background:rgba(255,255,255,.7);font-size:.8rem;font-weight:800}
    .cs-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
    .cs-tab{padding:10px 18px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;cursor:pointer;transition:transform .15s,border-color .15s}
    .cs-tab:hover{transform:translateY(-1px);border-color:#ff7a59}
    .cs-tab[aria-pressed="true"]{background:#2d2a3a;color:#fff;border-color:#2d2a3a}
    .cs-tabs--sub{margin-top:-6px}
    .cs-tab--small{padding:7px 14px;font-size:.88rem}
    .cs-all{margin:26px 0 8px;font-family:var(--font-head,inherit);font-weight:600;font-size:1.25rem}
    .cs-grid{display:grid;gap:22px 18px;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));padding-top:10px}
    .cs-note-card{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:14px;padding:26px 20px 14px;border-radius:4px 4px 18px 4px;color:#2d2a3a;box-shadow:0 10px 22px -14px rgba(0,0,0,.55);transition:transform .2s}
    .cs-note-card:nth-child(odd){transform:rotate(-.9deg)}
    .cs-note-card:nth-child(even){transform:rotate(.8deg)}
    .cs-note-card:hover{transform:rotate(0) translateY(-4px)}
    .cs-note-card::before{content:"";position:absolute;top:-9px;left:50%;width:64px;height:18px;transform:translateX(-50%) rotate(-2deg);background:rgba(255,255,255,.6)}
    .cs-note-card p{margin:0;font-weight:700;line-height:1.5}
    .cs-note-foot{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .cs-copy{width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.7);cursor:pointer;font-size:1rem}
    .cs-copy:hover{background:#fff}
    .cs-fab{position:fixed;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147481000;padding:12px 18px;border-radius:999px;border:0;background:linear-gradient(135deg,#ff7a59,#ffb347);color:#2d2a3a;font:inherit;font-weight:800;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);cursor:pointer}
    .cs-toast{position:fixed;left:50%;bottom:24px;z-index:2147483600;transform:translate(-50%,24px);opacity:0;pointer-events:none;width:max-content;max-width:min(92vw,420px);padding:12px 22px;border-radius:16px;background:#2d2a3a;color:#fff;font-family:var(--font-body,system-ui,sans-serif);font-weight:800;line-height:1.4;text-align:center;box-shadow:0 12px 28px rgba(0,0,0,.4);transition:opacity .25s,transform .25s}
    .cs-toast.show{opacity:1;transform:translate(-50%,0)}
    @media (max-width:520px){.cs-fab{padding:10px 14px;font-size:.88rem}.cs-dialog{padding:22px 16px 18px;border-radius:20px}}
    @media (max-width:420px){.cs-fab{bottom:calc(max(16px,env(safe-area-inset-bottom)) + 52px)}}
    @keyframes cs-fade{from{opacity:0}to{opacity:1}}
    @keyframes cs-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.cs-backdrop,.cs-dialog{animation:none}.cs-note-card,.cs-chip,.cs-btn{transition:none}}
    `;
    document.head.append(el('style', { id: 'cs-styles', text: css }));
  }

  /* ---------------------------------------------------------
     5) THE "FOR YOU" SECTION
     --------------------------------------------------------- */
  let deck = [];
  let current = null;
  let view = 'course'; // 'course' = quotes for my course, 'work' = work / OJT, 'love' = love quotes
  let loveSub = 'all'; // inside the love tab: 'all', 'happy', 'heartbreak' or 'hope'

  function nextQuote(list) {
    if (!deck.length) deck = shuffled(list);
    let q = deck.pop();
    if (current && q.text === current.text && deck.length) q = deck.pop();
    current = q;
    return q;
  }

  function renderForYou() {
    const old = document.getElementById('cs-foryou');
    if (old) old.remove();
    const profile = loadProfile();
    const r = resolve(profile);
    const fab = document.getElementById('cs-fab');
    if (fab) fab.remove();

    if (!r) {
      // No course chosen yet: keep a small button so they can pick later
      document.body.append(el('button', { id: 'cs-fab', class: 'cs-fab', type: 'button', text: '🎓 Choose my course', onclick: () => openOnboarding({ edit: true }) }));
      return;
    }

    const isWork = view === 'work';
    const isLove = view === 'love';
    const loveList = LOVE_GROUPS.filter((g) => loveSub === 'all' || g.id === loveSub)
      .flatMap((g) => g.quotes.map((t) => ({ text: t, tag: g.label })));
    const list = isWork ? WORK_QUOTES.map((t) => ({ text: t, tag: 'Work & OJT' })) : (isLove ? loveList : quotesFor(profile));
    const color = isWork ? '#b9ecf2' : (isLove ? '#ffcdd0' : r.color);
    const emoji = isWork ? '💼' : (isLove ? '💖' : r.emoji);
    deck = [];
    current = null;
    const name = (profile.name || '').trim();

    const quoteEl = el('blockquote', { class: 'cs-hero__quote', 'aria-live': 'polite' });
    const tagEl = el('span', { class: 'cs-tag' });
    const show = (q) => { quoteEl.textContent = q.text; tagEl.textContent = `${emoji} ${q.tag}`; current = q; };
    const tab = (id, label) => el('button', {
      class: 'cs-tab', type: 'button', 'aria-pressed': String(view === id), text: label,
      onclick: () => { if (view === id) return; view = id; renderForYou(); }
    });

    const section = el('section', { id: 'cs-foryou', class: 'cs-foryou', 'aria-labelledby': 'cs-title' }, [
      el('div', { class: 'cs-head' }, [
        el('div', {}, [
          el('h2', { id: 'cs-title', text: name ? `Hi ${name} 👋 Quotes for ${r.label} students` : `Quotes for ${r.label} students` }),
          el('span', { class: 'cs-badge', style: `background:${r.color}`, text: `${r.emoji} ${r.title}${r.college ? ' · ' + r.college.name : ''}` })
        ]),
        el('button', { class: 'cs-btn cs-btn--small', type: 'button', text: '✏️ Change name or course', onclick: () => openOnboarding({ edit: true }) })
      ]),
      el('div', { class: 'cs-tabs', role: 'group', 'aria-label': 'Choose which quotes to show' }, [
        tab('course', `${r.emoji} For ${r.label}`),
        tab('work', '💼 Work & OJT'),
        tab('love', '💖 Love')
      ]),
      isLove ? el('div', { class: 'cs-tabs cs-tabs--sub', role: 'group', 'aria-label': 'Kind of love quotes' }, [
        ['all', 'All'], ['happy', '😍 Happy in love'], ['heartbreak', '💔 Heartbreak'], ['hope', '🌈 Hoping to get back together']
      ].map(([id, label]) => el('button', {
        class: 'cs-tab cs-tab--small', type: 'button', 'aria-pressed': String(loveSub === id), text: label,
        onclick: () => { if (loveSub === id) return; loveSub = id; renderForYou(); }
      }))) : null,
      el('div', { class: 'cs-hero', style: `background:${color}` }, [
        el('p', { class: 'cs-hero__label', text: isWork ? '✨ For working students, OJT and first jobs' : (isLove ? '✨ For love, heartbreak and hope' : `✨ Made for ${r.label}`) }),
        quoteEl,
        el('p', {}, [tagEl]),
        el('div', { class: 'cs-hero__actions', style: 'margin-top:16px' }, [
          el('button', { class: 'cs-btn cs-btn--small', type: 'button', text: '🔄 Another quote', onclick: () => show(nextQuote(list)) }),
          el('button', { class: 'cs-btn cs-btn--small', type: 'button', text: '📋 Copy', onclick: () => current && copyText(current.text) }),
          el('button', { class: 'cs-btn cs-btn--small', type: 'button', 'data-cs-remind': '', text: '🔔 Remind me daily' })
        ])
      ]),
      el('h3', { class: 'cs-all', text: isWork ? `All ${list.length} quotes about work` : (isLove ? `${list.length} quotes about love` : `All ${list.length} quotes for ${r.label}`) }),
      el('div', { class: 'cs-grid' }, list.map((q) => el('article', { class: 'cs-note-card', style: `background:${color}` }, [
        el('p', { text: q.text }),
        el('div', { class: 'cs-note-foot' }, [
          el('span', { class: 'cs-tag', text: q.tag }),
          el('button', { class: 'cs-copy', type: 'button', 'aria-label': 'Copy this quote', title: 'Copy', text: '📋', onclick: () => copyText(q.text) })
        ])
      ])))
    ]);

    // Put it right after the hero if there is one, otherwise at the top of the page content
    const anchor = document.querySelector('.hero');
    const main = document.querySelector('main');
    if (anchor && anchor.parentNode) anchor.after(section);
    else if (main) main.prepend(section);
    else document.body.prepend(section);

    show(nextQuote(list));
  }

  /* ---------------------------------------------------------
     6) THE WELCOME DIALOG (name, then course)
     --------------------------------------------------------- */
  let opener = null;

  function closeOnboarding(skipFocus) {
    const b = document.querySelector('.cs-backdrop');
    if (b) b.remove();
    document.removeEventListener('keydown', onKey, true);
    document.body.style.overflow = '';
    if (!skipFocus && opener && opener.focus) opener.focus();
  }

  let onEscape = null;
  function onKey(e) { if (e.key === 'Escape' && onEscape) { e.stopPropagation(); onEscape(); } }

  function openOnboarding({ edit = false } = {}) {
    if (document.querySelector('.cs-backdrop')) return;
    injectStyles();
    opener = document.activeElement;
    const existing = loadProfile() || {};
    const state = { step: 1, name: existing.name || guessExistingName() };

    const dialog = el('div', { class: 'cs-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cs-dlg-title' });
    const backdrop = el('div', { class: 'cs-backdrop' }, [dialog]);

    function finish(patch) {
      const profile = { name: state.name.trim(), courseId: null, custom: null, ...patch, savedAt: Date.now() };
      saveProfile(profile);
      closeOnboarding(true);
      renderForYou();
      const sec = document.getElementById('cs-foryou');
      if (sec) {
        sec.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        toast(profile.name ? `Welcome, ${profile.name}! 💛` : 'Welcome! 💛');
      } else toast('Saved. You can pick your course any time. 💛');
    }

    function skip() {
      // remember that they skipped so we don't ask on every visit
      const profile = { name: state.name.trim(), courseId: existing.courseId || null, custom: existing.custom || null, skipped: true, savedAt: Date.now() };
      saveProfile(profile);
      closeOnboarding(false);
      renderForYou();
    }

    function stepName() {
      const input = el('input', { class: 'cs-input', id: 'cs-name', type: 'text', maxlength: '30', autocomplete: 'given-name', placeholder: 'Your name or nickname', value: state.name });
      const go = () => { state.name = input.value.trim(); if (!state.name) { input.focus(); input.style.borderColor = '#d6334a'; return; } state.step = 2; draw(); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      input.addEventListener('input', () => { input.style.borderColor = ''; });
      dialog.replaceChildren(
        el('h2', { id: 'cs-dlg-title', text: edit ? 'Change your name' : '👋 Welcome to Still Got This' }),
        el('p', { class: 'cs-sub', text: edit ? 'What should we call you?' : 'Quotes, hugs and reminders for tired students. First, what should we call you?' }),
        el('div', { class: 'cs-field' }, [el('label', { for: 'cs-name', text: 'Your name' }), input]),
        el('div', { class: 'cs-actions' }, [
          el('button', { class: 'cs-btn cs-btn--primary', type: 'button', text: 'Next: choose my course', onclick: go }),
          el('button', { class: 'cs-link', type: 'button', text: edit ? 'Cancel' : 'Skip for now', onclick: edit ? () => closeOnboarding(false) : skip })
        ]),
        el('p', { class: 'cs-note', text: '🔒 Saved only on this device. No account or sign-up.' })
      );
      onEscape = edit ? () => closeOnboarding(false) : skip;
      setTimeout(() => { if (input.value === state.name) { input.focus(); input.select(); } }, 30); // skip if they already started typing
    }

    function stepCourse() {
      const groups = COLLEGES.map((col) => el('div', { class: 'cs-group' }, [
        el('h3', { text: `${col.emoji} ${col.name}` }),
        el('div', { class: 'cs-chips' }, col.courses.map((c) => el('button', {
          class: 'cs-chip', type: 'button', style: `background:${col.color}`,
          'aria-pressed': String(existing.courseId === c.id), title: c.full,
          onclick: () => finish({ courseId: c.id })
        }, [c.label, c.label !== c.full && c.full.length < 40 && col.courses.length < 8 ? null : null])))
      ]));

      const other = el('input', { class: 'cs-input', id: 'cs-other', type: 'text', maxlength: '60', placeholder: 'Type your course (e.g. BS Nursing)' });
      const goOther = () => { const v = other.value.trim(); if (!v) { other.focus(); other.style.borderColor = '#d6334a'; return; } finish({ custom: v }); };
      other.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); goOther(); } });
      other.addEventListener('input', () => { other.style.borderColor = ''; });

      dialog.replaceChildren(
        el('h2', { id: 'cs-dlg-title', text: state.name ? `Nice to meet you, ${state.name}! 🎓` : 'What’s your course?' }),
        el('p', { class: 'cs-sub', text: 'Tap your course and we’ll show quotes made for it.' }),
        ...groups,
        el('div', { class: 'cs-group' }, [
          el('h3', { text: '✏️ My course isn’t listed' }),
          el('div', { class: 'cs-other' }, [other, el('button', { class: 'cs-btn cs-btn--small', type: 'button', text: 'Use this', onclick: goOther })])
        ]),
        el('div', { class: 'cs-actions' }, [
          el('button', { class: 'cs-btn cs-btn--small', type: 'button', text: '← Back', onclick: () => { state.step = 1; draw(); } }),
          el('button', { class: 'cs-link', type: 'button', text: edit ? 'Cancel' : 'Skip for now', onclick: edit ? () => closeOnboarding(false) : skip })
        ])
      );
      onEscape = edit ? () => closeOnboarding(false) : skip;
      const first = dialog.querySelector('.cs-chip');
      // focus the first course button, but never steal focus if they already started typing somewhere
      if (first) setTimeout(() => { if (!dialog.contains(document.activeElement) || document.activeElement === document.body) first.focus(); }, 30);
    }

    function draw() { if (state.step === 1) stepName(); else stepCourse(); dialog.scrollTop = 0; }

    document.body.append(backdrop);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);
    draw();
  }

  /* ---------------------------------------------------------
     7) START + A SMALL API for other scripts (reminder.js)
     --------------------------------------------------------- */
  window.StillGotThis = Object.assign(window.StillGotThis || {}, {
    getProfile: () => loadProfile(),
    courseQuotes: () => quotesFor(loadProfile()).map((q) => q.text),
    openOnboarding: (opts) => openOnboarding(opts)
  });

  function start() {
    injectStyles();
    const profile = loadProfile();
    // First visit: the popup comes first. (The page section / floating button appear once they finish or skip.)
    // If someone opened a friend's message link (#m=...), show that first and don't cover it with the welcome popup
    const fromFriend = /^#(m|f)=/.test(location.hash || '');
    if (!profile && !fromFriend) setTimeout(() => openOnboarding({ edit: false }), 350);
    else renderForYou();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
