/* =========================================================
   Still Got This — script.js
   No libraries. Plain JavaScript only.
   Photos and journal messages are saved in IndexedDB, so they
   stay on this device (private) and there is no fixed limit.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1) DATA
     --------------------------------------------------------- */

  const CATEGORIES = {
    tired:      { label: "I'm Tired",            emoji: '😮‍💨', color: 'sun',   blurb: 'For when you are completely worn out' },
    friends:    { label: 'With My Classmates',   emoji: '🧑‍🤝‍🧑', color: 'mint',  blurb: 'For the joy of studying and laughing together' },
    home:       { label: 'Going Home Sad',       emoji: '🏡',  color: 'rose',  blurb: 'Comfort for the walk home after a rough day' },
    pressure:   { label: 'When Home Is Hard',    emoji: '💔',  color: 'sky',   blurb: 'For when you are compared, pressured or put down at home' },
    acads:      { label: 'Academic Struggles',   emoji: '📚',  color: 'sky',   blurb: 'For bad grades, deadlines and exams' },
    mind:       { label: 'Mental Health',        emoji: '💚',  color: 'lav',   blurb: 'Gentle words for your heart and mind' },
    motivation: { label: 'Get Motivated',        emoji: '🔥',  color: 'coral', blurb: 'A push to start, or to keep going' }
  };

  // [category, quote]  (all original)
  const RAW_QUOTES = [
    // --- Tired ---
    ['tired', "Rest is not the opposite of ambition. It's the fuel for it. Sleep, then rise again."],
    ['tired', "You've carried a lot this week. Set it down for tonight. It will still be there tomorrow, and so will your strength."],
    ['tired', "A tired heart is still a heart that showed up. That already counts for a lot."],
    ['tired', "Even the sun disappears every evening, and nobody calls it a failure. Take your rest."],
    ['tired', "You are not behind. You are a human being on a long road, and long roads need pauses."],
    ['tired', "Be as gentle with yourself tonight as you would be with a friend who studied all day."],
    ['tired', "Your battery isn't broken, it's just low. Plug into sleep, water, and a good laugh."],
    ['tired', "Tomorrow you get a fresh page. Tonight, all you have to do is close the notebook."],
    ['tired', "Exhaustion is what effort looks like from the inside. Look how far you've come to feel this tired."],
    ['tired', "You don't need a perfect day. You need a deep breath, a warm meal, and a good night's sleep."],

    // --- With classmates ---
    ['friends', "Some people turn a boring lecture into your favorite memory. Keep those people close."],
    ['friends', "Alone, a hard week is a mountain. With your classmates, it's just a hike with snacks."],
    ['friends', "Your classmates are not your competition. They are your crew, your witnesses, your cheerleaders."],
    ['friends', "Behind every finished project is a group chat full of “we're almost done!” and “I believe in us.”"],
    ['friends', "Laugh together on the hard days. It's amazing how heavy things get lighter when they're shared."],
    ['friends', "Study buddies, shared notes, borrowed pens: that's how the best friendships quietly begin."],
    ['friends', "The best part of school isn't the diploma. It's the people who were there when you earned it."],
    ['friends', "When one of you rises, you all rise. Celebrate your classmates loudly."],
    ['friends', "You grow faster in a circle of friends who believe in you than in a room of people who only watch."],
    ['friends', "Take the photo. Years from now, this messy, tired, laughing moment will be gold."],

    // --- Going home sad ---
    ['home', "The door of home is the one place where you can stop performing and just be tired."],
    ['home', "Whatever happened at school today, leave it at the door. Inside, you are simply loved."],
    ['home', "A bad day is not a bad life. Go home, eat well, and let love do its quiet work."],
    ['home', "The people who love you aren't counting your grades. They're counting the minutes until you're home."],
    ['home', "Walk in, take a breath, and say it out loud: “Today was hard.” Home was built for that sentence."],
    ['home', "You're allowed to come home with a heavy heart and leave tomorrow morning with a lighter one."],
    ['home', "Love at home doesn't ask for proof of success. It only asks, “Are you okay?”"],
    ['home', "Tonight your only job is to rest, eat, and be someone's beloved child. Everything else can wait."],
    ['home', "Your family's pride in you was never tied to a score. It was tied to who you are."],
    ['home', "Home is proof that you are loved without having to earn it."],

    // --- When home is hard ---
    ['pressure', "Being compared to someone else says nothing about your worth. You were never meant to be a copy of anyone."],
    ['pressure', "Someone else's grades are their story. Yours has its own pace, its own plot, and its own ending."],
    ['pressure', "Harsh words at home can sting more than any exam score. If they hurt, that's real, and it's okay to feel it."],
    ['pressure', "You are not 'less than' because someone said so, even if that someone is family."],
    ['pressure', "Pressure can come from love or from fear, but your worth was never up for debate."],
    ['pressure', "You can aim high and still be gentle with yourself. Those two can live in the same heart."],

    // --- Academic struggles ---
    ['acads', "A failed test is a plot twist, not the ending. Your story gets better from here."],
    ['acads', "Every expert you admire once sat confused at the same kind of problem. Confusion is where learning begins."],
    ['acads', "Your grade is one number. Your effort, curiosity and growth can't be measured on any scale."],
    ['acads', "Don't try to eat the whole deadline. Take it one small bite at a time."],
    ['acads', "Mistakes on paper are just your brain marking the places it's about to grow."],
    ['acads', "You're not behind. You're on your own timeline, and it's still moving forward."],
    ['acads', "A hard subject isn't a wall. It's a door that needs a few more keys. Ask for help to find them."],
    ['acads', "Study with kindness. A calm mind remembers more than a panicked one."],
    ['acads', "Thesis or capstone feeling impossible? So did every finished one, right up until the day it wasn't."],
    ['acads', "The question you're afraid to ask is probably the one half your class is wondering too."],

    // --- Mental health ---
    ['mind', "You don't have to be okay all the time. You only have to be honest with yourself and gentle with your pace."],
    ['mind', "Your worth is not a performance review. You matter on your best days and on your worst days."],
    ['mind', "Feelings are like weather. They pass through you; they are not who you are."],
    ['mind', "Taking care of your mind is not a luxury. It's the foundation under every goal you have."],
    ['mind', "Reaching out is a strength. The bravest sentence can be, “Can you sit with me for a while?”"],
    ['mind', "Talk to yourself the way you'd talk to someone you love. You deserve that voice too."],
    ['mind', "Small acts of care count: a glass of water, a short walk, a song you love, a message to a friend."],
    ['mind', "You're allowed to take up space, ask for help, and change your mind. You're allowed to grow slowly."],
    ['mind', "Some days, getting through is the whole victory. Count it."],
    ['mind', "Healing isn't about becoming a different person. It's about coming home to yourself."],

    // --- Get motivated ---
    ['motivation', "You don't need the whole map tonight. You only need to know where the next step goes."],
    ['motivation', "Future you is cheering for the choice you make in the next five minutes."],
    ['motivation', "Dreams don't work unless you do, and they don't work without rest either. Do both."],
    ['motivation', "Courage can look like opening the textbook while your stomach is in knots."],
    ['motivation', "You're one focused hour away from feeling proud of yourself. Start the timer."],
    ['motivation', "Discipline is just kindness to your future self. Be good to them today."],
    ['motivation', "Progress is quiet. It looks like showing up again when nobody is clapping."],
    ['motivation', "The person you want to become is built from ordinary Tuesdays. Make this one count."],
    ['motivation', "Don't wait to feel ready. Ready is something you become by starting."],
    ['motivation', "You're studying for a future that hasn't happened yet, and that takes real faith in yourself. Be proud of that."]
  ];

  const BASE_QUOTES = RAW_QUOTES.map(([cat, text], i) => ({ id: `${cat}-${i}`, cat, text }));

  /* ---- Endless daily quotes ----
     PER_DAY brand-new quotes unlock every day, the same for everybody, with no server.
     Each quote = [lead-in] + [opener for its category] + [closing line], picked by a
     fixed permutation, so none repeats until every combination is used (years).
     To add more: just add lines to OPENERS / CLOSERS / LEADS. Don't reorder old lines,
     or saved favorites of generated quotes will point to different text. */
  const LAUNCH = new Date(2026, 10, 22); // first day (change to your own launch day)
  const PER_DAY = 3;

  const OPENERS = {
    tired: [
      "Tired doesn't mean weak. It means you've been giving more than you've been getting back.",
      "Switch off the screen, loosen your shoulders, and let tonight be quiet.",
      "Your body keeps count of every late night, so thank it by resting.",
      "A slow day is still a day you moved forward.",
      "You can't pour from an empty cup, and nobody is asking you to.",
      "Sleep is not wasted time. It's where today's lessons settle into memory."
    ],
    friends: [
      "A shared snack, a shared deadline, a shared laugh: that's how classmates become family.",
      "Someone out there is glad you sat beside them today.",
      "The group chat at midnight is proof you were never studying alone.",
      "Good classmates remember your birthday and your presentation date.",
      "Kindness spreads fast in a classroom, so be the one who starts it.",
      "Your friends have seen you at your sleepiest and stayed anyway."
    ],
    home: [
      "However loud the day was, the walk home can be gentle.",
      "Home is where you take off your bag and your mask.",
      "You are allowed to arrive home carrying more than books.",
      "The evening belongs to you: slippers on, shoulders down, heart soft.",
      "A warm meal is a quiet way of saying you matter.",
      "Leave the school day at the gate and let the evening begin."
    ],
    pressure: [
      "You don't have to prove your worth to people who only measure you in numbers.",
      "It's okay to feel hurt when people you love compare you to others. It hurts because you care.",
      "Their words describe their fears, not your future.",
      "You are allowed to rest even when someone says you should be doing more.",
      "Not being understood today doesn't mean you won't be understood someday.",
      "You are not a project to be fixed. You are a person in progress."
    ],
    acads: [
      "One low score is a snapshot, not your whole photo album.",
      "Learning looks messy while it's happening, and that's normal.",
      "Review a little every day and the mountain turns into stairs.",
      "Asking a teacher for help is a study skill, not a confession.",
      "Redo, retry, revise. Every pass makes it clearer.",
      "A deadline is stressful, but it's also proof that you're in the game."
    ],
    mind: [
      "Your thoughts are visitors. You don't have to give them your whole house.",
      "Being sensitive is not a flaw. It means you feel the world deeply.",
      "Healing is rarely a straight line, so be patient with the zigzags.",
      "You don't have to earn rest. Needing it is reason enough.",
      "Some days the bravest thing is to drink water and keep breathing.",
      "Your feelings deserve a listener, even if it starts with you."
    ],
    motivation: [
      "Start messy. A rough first draft beats a perfect plan that never begins.",
      "You've survived every hard day so far. That's a perfect record.",
      "Ten focused minutes are worth more than two hours of worrying.",
      "Small steps count, especially the ones you take when you don't feel like it.",
      "The person you're becoming will thank you for tonight's effort.",
      "Momentum loves a small start, so open the notebook."
    ]
  };
  const CLOSERS = [
    "Be proud of how far you've come.", "One small step today is enough.", "You are more than your hardest day.",
    "Breathe in slowly. You've got this.", "Rest, then try again tomorrow.", "Someone is cheering for you quietly.",
    "Progress counts, even when it's slow.", "Be kind to yourself today.", "You're allowed to ask for help.",
    "Your best today is enough.", "Today is not the whole story.", "You belong here, just as you are.",
    "Drink some water. Take a breath. Keep going.", "Tomorrow is a fresh page.", "You are doing better than you think.",
    "Trust the slow, steady you.", "Hold on. Better days are on their way.", "You matter, whatever the score says.",
    "Take it one gentle step at a time.", "Your effort is seen, even when you can't tell.", "It's okay to start again.",
    "You were made to grow, not to be perfect.", "Let that sink in, then let it go.", "You've survived every hard day so far."
  ];
  const LEADS = ['', 'Note to self: ', 'Reminder: ', 'Read this twice: ', "Today's truth: ", 'Psst. ', 'Gentle reminder: ', 'Breathe. '];

  const CAT_KEYS = Object.keys(CATEGORIES);
  const TODAY_IDX = (() => {
    const n = new Date();
    return Math.max(0, Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - LAUNCH) / 864e5));
  })();

  function genQuote(g) {
    const slot = g % CAT_KEYS.length;
    const cat = CAT_KEYS[slot];
    const op = OPENERS[cat];
    const space = op.length * CLOSERS.length * LEADS.length;
    const idx = (Math.floor(g / CAT_KEYS.length) * 509 + slot * 97) % space; // 509 is prime: no repeats until `space` is used up
    const lead = LEADS[Math.floor(idx / (op.length * CLOSERS.length)) % LEADS.length];
    const text = `${lead}${op[idx % op.length]} ${CLOSERS[Math.floor(idx / op.length) % CLOSERS.length]}`;
    return { id: `g${g}`, cat, text, day: Math.floor(g / PER_DAY) };
  }
  const GENERATED = [];
  for (let g = 0; g < (TODAY_IDX + 1) * PER_DAY; g += 1) GENERATED.push(genQuote(g));
  const QUOTES = GENERATED.slice().reverse().concat(BASE_QUOTES); // newest first
  const TODAY_QUOTES = GENERATED.filter((q) => q.day === TODAY_IDX);

  // Short phrases for the scrolling band
  const PHRASES = [
    "You've got this", 'One step at a time', 'Rest is productive', "You're not alone",
    'Progress, not perfection', 'Be gentle with yourself', 'Small wins count',
    'Tomorrow is a fresh page', 'Your effort matters', 'Keep showing up'
  ];

  // Moods for the check-in
  const MOODS = [
    { key: 'tired',    emoji: '😮‍💨', label: 'Tired',           cat: 'tired',
      tip: 'Drink some water and close your eyes for 10 minutes. You are not losing time, you are recharging.' },
    { key: 'sad',      emoji: '😢',  label: 'Sad',             cat: 'mind', help: true,
      tip: 'Write what you feel in the journal below, and if you can, share it with someone you trust today.' },
    { key: 'stressed', emoji: '😰',  label: 'Stressed',        cat: 'acads',
      tip: 'Write down everything you need to do, then pick just one thing to start with. The rest can wait.' },
    { key: 'unmotivated', emoji: '😶‍🌫️', label: 'No motivation', cat: 'motivation',
      tip: 'Try the 5-minute rule: set a timer for 5 minutes and begin. If you want to stop after that, you can.' },
    { key: 'home',     emoji: '🥺',  label: 'Want to go home', cat: 'home',
      tip: 'When you get home, eat and rest first. It is okay to say, "Mom, Dad, I\'m tired," with nothing more.' },
    { key: 'pressured', emoji: '😞', label: 'Pressured at home', cat: 'pressure', help: true,
      tip: 'Step away for a few minutes and breathe slowly. Their words are not the final word on your worth. Then write what you feel in the journal below.' },
    { key: 'happy',    emoji: '😄',  label: 'Happy',           cat: 'friends',
      tip: 'Thank one classmate today. Happiness grows when you share it.' }
  ];

  // Feelings for the journal
  const FEELINGS = [
    { key: 'happy',    emoji: '😄', label: 'Happy',    cat: 'friends',
      thanks: "I'm glad you're feeling happy. Hold onto this one and write down what caused it." },
    { key: 'grateful', emoji: '🥰', label: 'Grateful', cat: 'friends',
      thanks: "Gratitude is a beautiful thing to write down. You'll love reading this again on a harder day." },
    { key: 'calm',     emoji: '😌', label: 'Calm',     cat: 'motivation',
      thanks: "A calm moment is a gift. Use a little of it to do something your future self will thank you for." },
    { key: 'tired',    emoji: '😮‍💨', label: 'Tired',    cat: 'tired',
      thanks: "Thank you for being honest about being tired. Rest is part of the plan, not a break from it." },
    { key: 'sad',      emoji: '😢', label: 'Sad',      cat: 'mind', help: true,
      thanks: "Thank you for writing that down. Saying how you feel takes courage, and it's already a step forward." },
    { key: 'stressed', emoji: '😰', label: 'Stressed', cat: 'acads',
      thanks: "That sounds like a lot to hold. Putting it on the page makes it a little lighter and a little smaller." },
    { key: 'compared', emoji: '😔', label: 'Compared', cat: 'pressure', help: true,
      thanks: "Being compared hurts, and it makes sense that it stings. Thank you for putting it into words." },
    { key: 'angry',    emoji: '😠', label: 'Angry',    cat: 'mind',
      thanks: "Your anger makes sense, and it's okay to feel it. Writing it out is a safe place to let it breathe." },
    { key: 'lonely',   emoji: '🥺', label: 'Lonely',   cat: 'mind', help: true,
      thanks: "I'm glad you wrote this. Feeling lonely is human, and you are not as alone as it feels right now." }
  ];

  const STARTERS = ['Today I felt…', "I'm proud that I…", "What's worrying me is…", "I'm grateful for…", 'I wish I could tell…'];

  // Letters from home
  const LETTERS = [
    { from: 'Mom', text: "Sweetheart, when you come home I won't ask about your grades. All I want to know is: have you eaten?" },
    { from: 'Dad', text: "I'm not upset about a low mark. I'd be upset if you faced your sadness alone." },
    { from: 'Mom', text: "Your worth isn't measured on paper. You've been our treasure since the day you were born." },
    { from: 'Dad', text: "Dinner is on the table and a hug is waiting for you. Everything else can wait until tomorrow." },
    { from: 'Mom', text: "Tired? That's why we work: so you have a home to come back to and rest in." },
    { from: 'Dad', text: "I never expected perfect. I want you to grow up happy and healthy." },
    { from: 'Mom', text: "You might fail a subject, but you will never fail as our child." },
    { from: 'Dad', text: "Rest first, kiddo. Blaming yourself doesn't help you study. Rest, food and love do." }
  ];

  // For students whose home is not a place of rest
  const LETTERS_HEAVY = [
    { from: 'Someone who gets it', text: "Being compared hurts, and it's okay that it hurts. You're not too sensitive. You're human." },
    { from: 'Your future self', text: "I'm proud you kept going on the days nobody at home said well done." },
    { from: 'A friend', text: "Your grades don't decide whether you're enough. I've seen how hard you try." },
    { from: 'A teacher', text: "Slow progress is still progress. I've seen you grow even when you can't see it." },
    { from: 'Someone who has been there', text: "Their words may come from fear or their own pressure, but you are still allowed to feel hurt, and you are still worthy." },
    { from: 'Your own heart', text: "You don't have to become your cousin, your classmate, or the 'perfect child'. You only need to become you." },
    { from: 'A friend', text: "When home feels loud, find a quiet corner. Breathe. You're not alone, and this moment will pass." },
    { from: 'You, years from now', text: "One day you'll tell someone who needs it, 'I'm proud of you.' You'll know how much it means." }
  ];

  const HOME_MODES = {
    warm: {
      label: '💌 Words I hope to hear', letters: LETTERS,
      intro: "If you're upset about a grade, about school, or about life, these are the words we hope you'd hear from your Mom and Dad when you walk through the door. Open each letter."
    },
    heavy: {
      label: '💔 When home feels heavy', letters: LETTERS_HEAVY,
      intro: "Not everyone gets to rest when they get home. Sometimes there is more scolding, more pressure, and being compared to a cousin, a classmate or the \"top student next door.\" If that's you, it hurts, and you are not alone. These are words you deserve to hear, even if no one at home has said them yet."
    }
  };

  // Gentle words for the "Take it slow" section
  const GENTLE = [
    "Take your time. Nothing here is a race.",
    "You have done enough for today. Truly.",
    "Let your shoulders drop. Let your jaw unclench. You're safe right now.",
    "Be as patient with yourself as you are with the people you love.",
    "You don't have to fix everything tonight. Just breathe.",
    "Slow is still moving. Soft is still strong.",
    "This feeling is heavy, but it is not forever.",
    "Rest is not giving up. It's how you get ready to continue.",
    "You are allowed to pause, and the world will wait for you.",
    "Whatever you carried today, you can put it down for a while.",
    "You're doing something right just by taking this moment for yourself.",
    "Small and slow is a perfectly good way to heal.",
    "One breath. Then another. That's all you need to do right now.",
    "You are worth the same care you give to everyone else."
  ];

  // Small steps for today
  const STEPS = [
    { id: 'water',   label: 'Drank some water 💧' },
    { id: 'task',    label: 'Wrote down one task to start ✍️' },
    { id: 'five',    label: 'Studied for 5 minutes ⏱️' },
    { id: 'stretch', label: 'Stood up and stretched 🧘' },
    { id: 'checkin', label: 'Checked in on a classmate or family member 💬' },
    { id: 'sleep',   label: 'Plan to sleep on time tonight 😴' }
  ];

  // Breathing phases
  const BREATH_PHASES = [
    { name: 'Breathe in…',  secs: 4, scale: 1.45 },
    { name: 'Hold…',        secs: 2, scale: 1.45 },
    { name: 'Breathe out…', secs: 6, scale: 1    }
  ];
  const BREATH_CYCLES = 5; // about 1 minute

  /* ---------------------------------------------------------
     2) HELPERS
     --------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Small things (theme, favorites, steps, wins) live in localStorage
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('stg:' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('stg:' + key, JSON.stringify(value)); } catch (e) { /* storage may be unavailable */ }
    }
  };

  // Tiny element builder
  function h(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c != null) el.append(c);
    });
    return el;
  }

  function randomFrom(list, avoid) {
    if (list.length <= 1) return list[0];
    let pick;
    do { pick = list[Math.floor(Math.random() * list.length)]; } while (avoid && pick.id === avoid.id);
    return pick;
  }

  let toastTimer;
  function toast(msg, ms = 2400) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  async function copyText(text, okMsg = 'Copied! ✨') {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg);
      return;
    } catch (e) { /* fall back below */ }
    try {
      const ta = h('textarea', { readonly: true, 'aria-hidden': 'true' });
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px;';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      toast(ok ? okMsg : "Couldn't copy. Select the text and copy it by hand.");
    } catch (e) {
      toast("Couldn't copy. Select the text and copy it by hand.");
    }
  }
  const copyQuote = (text) => copyText(`“${text}” — Still Got This`);

  const catById = (id) => CATEGORIES[id];

  function formatDate(ts) {
    try { return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return new Date(ts).toLocaleString(); }
  }

  // Smooth scroll that works even where #hash links are restricted
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector('.site-header');
    const offset = header ? header.offsetHeight + 12 : 12;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function initAnchorLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      scrollToId(id);
    });
  }

  // Two-step confirm for delete buttons (confirm() is blocked in some frames)
  function armButton(btn, armedLabel, onConfirm) {
    let armed = false;
    let timer;
    const original = btn.textContent;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!armed) {
        armed = true;
        btn.textContent = armedLabel;
        btn.classList.add('is-armed');
        timer = setTimeout(() => { armed = false; btn.textContent = original; btn.classList.remove('is-armed'); }, 3000);
        return;
      }
      clearTimeout(timer);
      armed = false; btn.textContent = original; btn.classList.remove('is-armed');
      onConfirm();
    });
  }

  /* ---------------------------------------------------------
     3) STORAGE (IndexedDB with an in-memory fallback)
     Stores:  photos (meta + thumbnail), files (full photo), notes
     --------------------------------------------------------- */

  const DB_NAME = 'still-got-this';
  const DB_VERSION = 1;
  let dbPromise = null;
  let persistent = true;
  const mem = { photos: new Map(), files: new Map(), notes: new Map(), seq: 1 };

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('files'))  db.createObjectStore('files',  { keyPath: 'id' });
        if (!db.objectStoreNames.contains('notes'))  db.createObjectStore('notes',  { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB error'));
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    });
    return dbPromise;
  }

  function idbRun(store, mode, fn) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const os = t.objectStore(store);
      let result;
      const r = fn(os);
      if (r) r.onsuccess = () => { result = r.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Transaction aborted'));
    }));
  }

  const isQuota = (e) => !!(e && (e.name === 'QuotaExceededError' || e.code === 22));

  async function withFallback(idbOp, memOp) {
    if (persistent) {
      try { return await idbOp(); }
      catch (e) {
        if (isQuota(e)) throw e;
        persistent = false;
        updateStorageNote();
      }
    }
    return memOp();
  }

  const db = {
    all: (store) => withFallback(
      () => idbRun(store, 'readonly', (os) => os.getAll()),
      () => [...mem[store].values()]
    ),
    get: (store, key) => withFallback(
      () => idbRun(store, 'readonly', (os) => os.get(key)),
      () => mem[store].get(key)
    ),
    // returns the saved record (with its id)
    put: async (store, rec) => {
      const key = await withFallback(
        () => idbRun(store, 'readwrite', (os) => os.put(rec)),
        () => {
          const id = rec.id != null ? rec.id : mem.seq++;
          mem[store].set(id, { ...rec, id });
          return id;
        }
      );
      return { ...rec, id: key };
    },
    del: (store, key) => withFallback(
      () => idbRun(store, 'readwrite', (os) => os.delete(key)),
      () => { mem[store].delete(key); }
    )
  };

  function updateStorageNote() {
    const el = $('storageNote');
    if (!el) return;
    if (!persistent) {
      el.className = 'storage-note storage-note--warn';
      el.textContent = 'Heads up: your browser is blocking saved storage, so photos and messages will only last until you close this page.';
      return;
    }
    el.className = 'storage-note';
    el.textContent = '';
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (!persistent || !est || !est.usage) return;
        const mb = est.usage / (1024 * 1024);
        const used = mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
        const qm = (est.quota || 0) / (1024 * 1024);
        const total = qm ? ` of about ${qm >= 1024 ? `${(qm / 1024).toFixed(1)} GB` : `${Math.round(qm)} MB`} available` : '';
        el.textContent = `🔒 Stored privately on this device. Using about ${used}${total}.`;
      }).catch(() => {});
    }
  }

  /* ---------------------------------------------------------
     4) THEME (light / dark)
     --------------------------------------------------------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    $('themeToggle').setAttribute('aria-pressed', String(dark));
    $('themeIcon').textContent = dark ? '☀️' : '🌙';
  }

  function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    $('themeToggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('theme', next);
    });
  }

  /* ---------------------------------------------------------
     5) FAVORITES
     --------------------------------------------------------- */

  let favorites = new Set(store.get('favorites', []));

  function toggleFavorite(id) {
    if (favorites.has(id)) {
      favorites.delete(id);
      toast('Removed from favorites');
    } else {
      favorites.add(id);
      toast('Added to favorites 💛');
    }
    store.set('favorites', [...favorites]);
    renderTabs();
    renderGrid();
    updateDailyFav();
  }

  /* ---------------------------------------------------------
     6) QUOTE OF THE DAY (hero)
     --------------------------------------------------------- */

  let dailyQuote = null;

  function quoteOfTheDay() {
    return TODAY_QUOTES[0] || QUOTES[0]; // first of today's brand-new quotes
  }

  function showDaily(q) {
    dailyQuote = q;
    $('dailyQuote').textContent = q.text;
    const c = catById(q.cat);
    $('dailyCat').textContent = `${c.emoji} ${c.label}`;
    updateDailyFav();
  }

  function updateDailyFav() {
    if (!dailyQuote) return;
    const on = favorites.has(dailyQuote.id);
    const btn = $('dailyFav');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '♥ Favorited' : '♡ Favorite';
  }

  function initDaily() {
    $('quoteTotal').textContent = String(QUOTES.length);
    showDaily(quoteOfTheDay());
    $('dailyNew').addEventListener('click', () => showDaily(randomFrom(QUOTES, dailyQuote)));
    $('dailyCopy').addEventListener('click', () => copyQuote(dailyQuote.text));
    $('dailyFav').addEventListener('click', () => toggleFavorite(dailyQuote.id));
  }

  function initMarquee() {
    const track = $('marqueeTrack');
    // two identical halves so the loop is seamless
    for (let i = 0; i < 2; i += 1) {
      PHRASES.forEach((p) => track.append(h('span', { class: 'marquee__item', text: p })));
    }
  }

  /* ---------------------------------------------------------
     7) PICK YOUR QUOTES (big category buttons)
     --------------------------------------------------------- */

  let activeFilter = 'all'; // 'all' | 'new' | a key of CATEGORIES | 'fav'
  const PAGE = 24;          // quotes shown at a time (the library keeps growing)
  let shown = PAGE;

  function selectCategory(key, shouldScroll) {
    activeFilter = key;
    shown = PAGE;
    renderPicker();
    renderTabs();
    renderGrid();
    if (shouldScroll) scrollToId('quotes');
  }

  function renderPicker() {
    const wrap = $('picker');
    wrap.textContent = '';
    Object.entries(CATEGORIES).forEach(([key, c]) => {
      wrap.append(
        h('button', {
          class: `pick-card pick-card--${c.color}`, type: 'button',
          'aria-pressed': String(activeFilter === key),
          onclick: () => selectCategory(key, true)
        }, [
          h('span', { class: 'pick-card__emoji', 'aria-hidden': 'true', text: c.emoji }),
          h('span', { class: 'pick-card__label', text: c.label }),
          h('span', { class: 'pick-card__blurb', text: c.blurb }),
          h('span', { class: 'pick-card__go', 'aria-hidden': 'true', text: 'Show quotes →' })
        ])
      );
    });
  }

  /* ---------------------------------------------------------
     8) QUOTE LIBRARY (tabs + grid)
     --------------------------------------------------------- */

  const TILTS = ['-1.4deg', '1.1deg', '-.6deg', '1.6deg', '-1.1deg', '.7deg'];

  function renderTabs() {
    const wrap = $('tabs');
    wrap.textContent = '';

    const makeTab = (key, label, badge) => {
      const children = [document.createTextNode(label)];
      if (badge != null) children.push(h('span', { class: 'tab__badge', text: String(badge) }));
      return h('button', {
        class: 'tab', type: 'button', 'data-filter': key,
        'aria-pressed': String(activeFilter === key),
        onclick: () => selectCategory(key, false)
      }, children);
    };

    wrap.append(makeTab('all', 'All'));
    wrap.append(makeTab('new', '🆕 New today', TODAY_QUOTES.length));
    Object.entries(CATEGORIES).forEach(([key, c]) => wrap.append(makeTab(key, `${c.emoji} ${c.label}`)));
    wrap.append(makeTab('fav', '♥ Favorites', favorites.size));
  }

  function makeNote(q, index) {
    const c = catById(q.cat);
    const isFav = favorites.has(q.id);

    const favBtn = h('button', {
      class: 'icon-btn', type: 'button', 'aria-pressed': String(isFav),
      'aria-label': isFav ? 'Remove from favorites' : 'Add to favorites',
      title: 'Favorite', text: isFav ? '♥' : '♡',
      onclick: () => toggleFavorite(q.id)
    });
    const copyBtn = h('button', {
      class: 'icon-btn', type: 'button', 'aria-label': 'Copy this quote',
      title: 'Copy', text: '📋',
      onclick: () => copyQuote(q.text)
    });

    const note = h('article', { class: `note note--${c.color}` }, [
      h('p', { class: 'note__text', text: q.text }),
      h('div', { class: 'note__foot' }, [
        h('span', { class: 'note__cat', text: `${c.emoji} ${c.label}` }),
        h('div', { class: 'note__actions' }, [copyBtn, favBtn])
      ])
    ]);
    note.style.setProperty('--tilt', TILTS[index % TILTS.length]);
    note.style.animationDelay = `${Math.min(index, 12) * 35}ms`;
    return note;
  }

  function renderGrid() {
    const grid = $('quoteGrid');
    let list;
    if (activeFilter === 'all') list = QUOTES;
    else if (activeFilter === 'new') list = TODAY_QUOTES;
    else if (activeFilter === 'fav') list = QUOTES.filter((q) => favorites.has(q.id));
    else list = QUOTES.filter((q) => q.cat === activeFilter);

    grid.textContent = '';
    list.slice(0, shown).forEach((q, i) => grid.append(makeNote(q, i)));
    $('loadMore').hidden = shown >= list.length;

    $('emptyFav').hidden = !(activeFilter === 'fav' && list.length === 0);
    $('quoteCount').textContent = list.length
      ? `Showing ${Math.min(shown, list.length)} of ${list.length} ${list.length === 1 ? 'quote' : 'quotes'}`
      : '';
  }

  /* ---------------------------------------------------------
     9) MOOD CHECK-IN
     --------------------------------------------------------- */

  let currentMood = null;
  let moodQuote = null;

  function showMood(mood, again) {
    currentMood = mood;
    const pool = QUOTES.filter((q) => q.cat === mood.cat);
    moodQuote = randomFrom(pool, again ? moodQuote : null);

    const c = catById(mood.cat);
    $('moodCat').textContent = `${c.emoji} ${c.label}`;
    $('moodQuote').textContent = moodQuote.text;
    $('moodTip').textContent = mood.tip;
    $('moodHelp').hidden = !mood.help;
    $('moodResult').hidden = false;
    $('moodResult').classList.add('is-visible');

    document.querySelectorAll('.mood-chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.mood === mood.key));
    });
  }

  function initMood() {
    const wrap = $('moodChips');
    MOODS.forEach((m) => {
      wrap.append(
        h('button', { class: 'mood-chip', type: 'button', 'data-mood': m.key, 'aria-pressed': 'false', onclick: () => showMood(m, false) }, [
          h('span', { class: 'mood-chip__emoji', 'aria-hidden': 'true', text: m.emoji }),
          h('span', { text: m.label })
        ])
      );
    });
    $('moodAgain').addEventListener('click', () => currentMood && showMood(currentMood, true));
    $('moodCopy').addEventListener('click', () => moodQuote && copyQuote(moodQuote.text));
  }

  /* ---------------------------------------------------------
     10) MEMORY WALL (photos, no fixed limit)
     --------------------------------------------------------- */

  let photos = [];                 // metadata, newest first
  let albums = store.get('albums', []);   // folders: [{ id, name }]
  if (!Array.isArray(albums)) albums = [];
  let activeAlbum = 'all';         // 'all' or a folder id
  let albumEditing = null;
  const visiblePhotos = () => (activeAlbum === 'all' ? photos : photos.filter((p) => p.album === activeAlbum));
  const albumName = (id) => { const a = albums.find((x) => x.id === id); return a ? a.name : ''; };
  let lbList = [];                 // photos the lightbox is flipping through
  const thumbUrls = new Map();     // photo id -> object URL for the grid
  let lightboxIndex = -1;
  let lightboxUrl = null;
  let lightboxOpener = null;

  async function makeThumb(file, max = 640) {
    const attempt = async (opts) => {
      const bmp = opts ? await createImageBitmap(file, opts) : await createImageBitmap(file);
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const hgt = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = hgt;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, w, hgt);
      if (bmp.close) bmp.close();
      return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82));
    };
    try { return await attempt({ imageOrientation: 'from-image' }); }
    catch (e1) {
      try { return await attempt(null); } catch (e2) { return null; }
    }
  }

  // Shrink big phone photos before saving. Still sharp, but uses far less storage,
  // so many more photos fit. Falls back to the original file if anything goes wrong.
  async function shrinkPhoto(file, max = 2048) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type || '')) return file;
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 1.5 * 1024 * 1024) { if (bmp.close) bmp.close(); return file; }
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bmp.width * scale));
      c.height = Math.max(1, Math.round(bmp.height * scale));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
      return blob && blob.size < file.size ? blob : file;
    } catch (e) { return file; }
  }

  async function thumbUrlFor(meta) {
    if (thumbUrls.has(meta.id)) return thumbUrls.get(meta.id);
    let blob = meta.thumb;
    if (!blob) {
      const rec = await db.get('files', meta.id);
      blob = rec && rec.blob;
    }
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    thumbUrls.set(meta.id, url);
    return url;
  }

  function updateWallUi() {
    const list = visiblePhotos();
    const empty = $('wallEmpty');
    if (!empty.dataset.all) empty.dataset.all = empty.textContent;
    empty.textContent = activeAlbum === 'all'
      ? empty.dataset.all
      : 'This folder is empty. Add photos here, or move photos in using the 📁 menu on each photo.';
    empty.hidden = list.length > 0;
    $('wallCount').textContent = list.length
      ? `${list.length} ${list.length === 1 ? 'memory' : 'memories'} ${activeAlbum === 'all' ? 'on your wall' : `in “${albumName(activeAlbum)}”`}`
      : '';
  }

  /* ---- Folders (like Featured / Highlights) ---- */
  function renderAlbums() {
    const row = $('albumRow');
    row.textContent = '';
    const make = (key, label, count, coverMeta, emoji, extra) => {
      let inner;
      if (coverMeta) {
        inner = h('img', { class: 'album__img', alt: '' });
        thumbUrlFor(coverMeta).then((u) => { if (u) inner.src = u; }).catch(() => {});
      } else {
        inner = h('span', { class: 'album__emoji', 'aria-hidden': 'true', text: emoji });
      }
      return h('button', {
        class: `album ${extra || ''}`, type: 'button', 'aria-pressed': String(activeAlbum === key),
        onclick: () => (key === '__new' ? openAlbumForm(null) : selectAlbum(key))
      }, [
        h('span', { class: 'album__circle' }, [inner]),
        h('span', { class: 'album__name', text: label }),
        count == null ? null : h('span', { class: 'album__count', text: `${count} ${count === 1 ? 'photo' : 'photos'}` })
      ]);
    };
    row.append(make('__new', 'New folder', null, null, '＋', 'album--new'));
    row.append(make('all', 'All', photos.length, photos[0], '🖼️'));
    albums.forEach((a) => {
      const inAlbum = photos.filter((p) => p.album === a.id);
      row.append(make(a.id, a.name, inAlbum.length, inAlbum[0], '📁'));
    });
    $('albumTools').hidden = activeAlbum === 'all';
  }

  function selectAlbum(key) {
    activeAlbum = key;
    $('albumForm').hidden = true;
    renderAlbums();
    renderWall();
  }

  function openAlbumForm(editId) {
    albumEditing = editId;
    $('albumForm').hidden = false;
    $('albumName').value = editId ? albumName(editId) : '';
    $('albumSave').textContent = editId ? 'Save name' : 'Create folder';
    $('albumName').focus();
  }

  function initAlbums() {
    $('albumForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('albumName').value.replace(/\s+/g, ' ').trim().slice(0, 30);
      if (!name) return;
      if (albumEditing) {
        const a = albums.find((x) => x.id === albumEditing);
        if (a) a.name = name;
        toast('Folder renamed');
      } else {
        const a = { id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name };
        albums.push(a);
        activeAlbum = a.id;
        toast(`Folder “${name}” created 📁`);
      }
      store.set('albums', albums);
      $('albumForm').hidden = true;
      renderAlbums();
      renderWall();
    });
    $('albumCancel').addEventListener('click', () => { $('albumForm').hidden = true; });
    $('albumRename').addEventListener('click', () => { if (activeAlbum !== 'all') openAlbumForm(activeAlbum); });
    armButton($('albumDelete'), 'Sure? Tap again', async () => {
      const id = activeAlbum;
      if (id === 'all') return;
      for (const p of photos) {
        if (p.album === id) { p.album = null; try { await db.put('photos', p); } catch (e) { /* keep going */ } }
      }
      albums = albums.filter((a) => a.id !== id);
      store.set('albums', albums);
      activeAlbum = 'all';
      renderAlbums();
      renderWall();
      toast('Folder deleted. Your photos are still on the wall.');
    });
    renderAlbums();
  }

  function makePolaroid(meta, index) {
    const img = h('img', { class: 'polaroid__img polaroid__img--loading', alt: meta.caption || 'Photo with friends', loading: 'lazy', decoding: 'async' });
    thumbUrlFor(meta).then((url) => {
      if (url) { img.src = url; img.classList.remove('polaroid__img--loading'); }
    }).catch(() => {});
    img.addEventListener('error', () => { img.alt = 'This photo could not be shown on this browser'; });

    const open = h('button', {
      class: 'polaroid__imgbtn', type: 'button', 'aria-label': 'View this photo larger',
      onclick: (e) => { lbList = visiblePhotos(); openLightbox(lbList.findIndex((p) => p.id === meta.id), e.currentTarget); }
    }, [img]);

    const cap = h('input', {
      class: 'polaroid__cap', type: 'text', maxlength: '60', placeholder: 'Add a caption…',
      'aria-label': 'Photo caption', value: meta.caption || ''
    });
    cap.addEventListener('change', async () => {
      meta.caption = cap.value.trim().slice(0, 60);
      img.alt = meta.caption || 'Photo with friends';
      try { await db.put('photos', meta); } catch (e) { toast("Couldn't save the caption."); }
    });
    cap.addEventListener('keydown', (e) => { if (e.key === 'Enter') cap.blur(); });

    const sel = h('select', { class: 'polaroid__album', 'aria-label': 'Move this photo to a folder' }, [
      h('option', { value: '', text: '📁 No folder' }),
      ...albums.map((a) => h('option', { value: a.id, text: `📁 ${a.name}` }))
    ]);
    sel.value = meta.album || '';
    sel.addEventListener('change', async () => {
      meta.album = sel.value || null;
      try { await db.put('photos', meta); } catch (e) { toast("Couldn't move the photo."); return; }
      if (activeAlbum !== 'all' && meta.album !== activeAlbum) card.remove();
      renderAlbums();
      updateWallUi();
      toast(meta.album ? `Moved to “${albumName(meta.album)}” 📁` : 'Removed from folder');
    });

    const del = h('button', { class: 'polaroid__del', type: 'button', 'aria-label': 'Delete this photo', text: '✕' });
    const card = h('article', { class: 'polaroid', 'data-id': String(meta.id) }, [
      del, open, cap, h('span', { class: 'polaroid__date', text: formatDate(meta.ts) }), sel
    ]);
    card.style.setProperty('--tilt', TILTS[index % TILTS.length]);
    armButton(del, 'Delete?', () => removePhoto(meta.id, card));
    return card;
  }

  async function removePhoto(id, card) {
    try {
      await db.del('photos', id);
      await db.del('files', id);
    } catch (e) { toast("Couldn't delete that photo."); return; }
    photos = photos.filter((p) => p.id !== id);
    const url = thumbUrls.get(id);
    if (url) { URL.revokeObjectURL(url); thumbUrls.delete(id); }
    if (card && card.remove) card.remove();
    updateWallUi();
    renderAlbums();
    toast('Photo removed');
  }

  function renderWall() {
    const wall = $('wall');
    wall.textContent = '';
    visiblePhotos().forEach((p, i) => wall.append(makePolaroid(p, i)));
    updateWallUi();
  }

  async function addPhotos(fileList) {
    const all = Array.from(fileList || []);
    const files = all.filter((f) => (f.type && f.type.startsWith('image/')) || /\.(heic|heif|avif|webp|jfif)$/i.test(f.name || ''));
    const skipped = all.length - files.length;
    if (!files.length) {
      if (all.length) toast('Those files are not pictures. Please choose photos.');
      return;
    }

    let saved = 0;
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (files.length > 1) toast(`Saving photo ${i + 1} of ${files.length}…`, 6000);
      try {
        const thumb = await makeThumb(f);
        const full = await shrinkPhoto(f);
        const meta = await db.put('photos', { ts: Date.now() + i, name: f.name || 'photo', type: full.type || f.type || '', size: full.size || 0, caption: '', album: activeAlbum === 'all' ? null : activeAlbum, thumb });
        await db.put('files', { id: meta.id, blob: full });
        photos.unshift(meta);
        const wall = $('wall');
        wall.prepend(makePolaroid(meta, 0));
        saved += 1;
        updateWallUi();
      } catch (e) {
        if (isQuota(e)) { toast('Your device storage is full. Free some space and try again.', 5000); break; }
        toast(`Couldn't save "${f.name || 'a photo'}".`);
      }
    }
    if (saved) toast(`${saved} ${saved === 1 ? 'photo' : 'photos'} added to your wall 📸${skipped ? ` (${skipped} skipped)` : ''}`);
    renderAlbums();
    updateStorageNote();
  }

  /* ---- Lightbox ---- */
  async function showLightbox(index) {
    const meta = lbList[index];
    if (!meta) return;
    lightboxIndex = index;
    const rec = await db.get('files', meta.id);
    if (lightboxIndex !== index) return; // user moved on
    if (lightboxUrl) URL.revokeObjectURL(lightboxUrl);
    lightboxUrl = rec && rec.blob ? URL.createObjectURL(rec.blob) : (thumbUrls.get(meta.id) || '');
    const img = $('lbImg');
    img.src = lightboxUrl;
    img.alt = meta.caption || 'Photo with friends';
    $('lbCap').textContent = meta.caption || '';
    const multiple = lbList.length > 1;
    $('lbPrev').hidden = !multiple;
    $('lbNext').hidden = !multiple;
  }

  function openLightbox(index, opener) {
    if (index < 0) return;
    lightboxOpener = opener || null;
    $('lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
    showLightbox(index);
    $('lbClose').focus();
  }

  function closeLightbox() {
    if ($('lightbox').hidden) return;
    $('lightbox').hidden = true;
    document.body.style.overflow = '';
    lightboxIndex = -1;
    $('lbImg').removeAttribute('src');
    if (lightboxUrl) { URL.revokeObjectURL(lightboxUrl); lightboxUrl = null; }
    if (lightboxOpener && lightboxOpener.focus) lightboxOpener.focus();
  }

  function stepLightbox(delta) {
    if (!lbList.length || lightboxIndex < 0) return;
    showLightbox((lightboxIndex + delta + lbList.length) % lbList.length);
  }

  function initLightbox() {
    $('lbClose').addEventListener('click', closeLightbox);
    $('lbPrev').addEventListener('click', () => stepLightbox(-1));
    $('lbNext').addEventListener('click', () => stepLightbox(1));
    $('lightbox').addEventListener('click', (e) => { if (e.target === $('lightbox')) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if ($('lightbox').hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      else if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  function initWall() {
    const input = $('photoInput');
    const zone = $('dropzone');

    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      input.value = ''; // so choosing the same photo again still fires "change"
      await addPhotos(files);
    });

    ['dragenter', 'dragover'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    }));
    zone.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) addPhotos(files);
    });

    // Don't let a missed drop navigate the page to the photo
    ['dragover', 'drop'].forEach((evt) => window.addEventListener(evt, (e) => {
      if (!zone.contains(e.target)) e.preventDefault();
    }));

    initLightbox();
    initAlbums();

    db.all('photos').then((list) => {
      photos = list.sort((a, b) => (b.id || 0) - (a.id || 0));
      renderWall();
      renderAlbums();
      updateStorageNote();
    }).catch(() => { renderWall(); updateStorageNote(); });

    if (navigator.storage && navigator.storage.persist) { navigator.storage.persist().catch(() => {}); }
  }

  /* ---------------------------------------------------------
     11) FEELINGS JOURNAL
     --------------------------------------------------------- */

  let notes = [];
  let selectedFeeling = null;

  function renderFeelingChips() {
    const wrap = $('feelingChips');
    wrap.textContent = '';
    FEELINGS.forEach((f) => {
      wrap.append(
        h('button', {
          class: 'feeling', type: 'button', 'data-feeling': f.key,
          'aria-pressed': String(selectedFeeling === f.key),
          onclick: () => { selectedFeeling = selectedFeeling === f.key ? null : f.key; renderFeelingChips(); }
        }, [h('span', { 'aria-hidden': 'true', text: f.emoji }), h('span', { text: f.label })])
      );
    });
  }

  function renderStarters() {
    const wrap = $('starters');
    STARTERS.forEach((s) => {
      wrap.append(h('button', {
        class: 'starter', type: 'button', text: s,
        onclick: () => {
          const ta = $('journalText');
          const sep = ta.value && !/\s$/.test(ta.value) ? ' ' : '';
          ta.value += sep + s + ' ';
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      }));
    });
  }

  function makeEntry(n) {
    const f = FEELINGS.find((x) => x.key === n.feeling);
    const copyBtn = h('button', { class: 'entry__tool', type: 'button', text: 'Copy', onclick: () => copyText(n.text, 'Message copied ✨') });
    const delBtn = h('button', { class: 'entry__tool', type: 'button', text: 'Delete' });
    const li = h('li', { class: 'entry' }, [
      h('div', { class: 'entry__top' }, [
        h('div', { class: 'entry__meta' }, [
          h('span', { class: 'entry__emoji', 'aria-hidden': 'true', text: f ? f.emoji : '📝' }),
          h('span', { text: `${f ? f.label + ' · ' : ''}${formatDate(n.ts)}` })
        ]),
        h('div', { class: 'entry__tools' }, [copyBtn, delBtn])
      ]),
      h('p', { class: 'entry__text', text: n.text })
    ]);
    armButton(delBtn, 'Sure?', async () => {
      try { await db.del('notes', n.id); } catch (e) { toast("Couldn't delete that message."); return; }
      notes = notes.filter((x) => x.id !== n.id);
      li.remove();
      $('entriesEmpty').hidden = notes.length > 0;
      toast('Message deleted');
    });
    return li;
  }

  function renderEntries() {
    const ul = $('entries');
    ul.textContent = '';
    notes.forEach((n) => ul.append(makeEntry(n)));
    $('entriesEmpty').hidden = notes.length > 0;
  }

  function showReply(feelingKey) {
    const f = FEELINGS.find((x) => x.key === feelingKey);
    const cat = f ? f.cat : 'motivation';
    const q = randomFrom(QUOTES.filter((x) => x.cat === cat));
    $('replyThanks').textContent = f ? f.thanks : "Thank you for writing this down. Putting words on a day is a kind thing to do for yourself.";
    $('replyQuote').textContent = q.text;
    $('replyHelp').hidden = !(f && f.help);
    $('journalReply').hidden = false;
  }

  function initJournal() {
    renderFeelingChips();
    renderStarters();

    $('journalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ta = $('journalText');
      const text = ta.value.trim();
      if (!text) { toast('Write a few words first. Anything is okay. 🌱'); ta.focus(); return; }
      try {
        const saved = await db.put('notes', { ts: Date.now(), feeling: selectedFeeling, text });
        notes.unshift(saved);
        $('entries').prepend(makeEntry(saved));
        $('entriesEmpty').hidden = true;
        showReply(selectedFeeling);
        ta.value = '';
        selectedFeeling = null;
        renderFeelingChips();
        toast('Saved. Thank you for sharing. 💛');
      } catch (err) {
        toast(isQuota(err) ? 'Your device storage is full.' : "Couldn't save your message.", 4000);
      }
    });

    db.all('notes').then((list) => {
      notes = list.sort((a, b) => (b.id || 0) - (a.id || 0));
      renderEntries();
    }).catch(() => renderEntries());
  }

  /* ---------------------------------------------------------
     12) LETTERS FROM HOME
     --------------------------------------------------------- */

  function renderLetters(mode) {
    const wrap = $('letters');
    wrap.textContent = '';
    HOME_MODES[mode].letters.forEach((l, i) => {
      const bodyId = `letter-body-${i}`;
      const head = h('button', {
        class: 'letter__head', type: 'button', 'aria-expanded': 'false', 'aria-controls': bodyId
      }, [
        h('span', { class: 'letter__icon', 'aria-hidden': 'true', text: '💌' }),
        h('span', {}, [
          h('span', { class: 'letter__who', text: `From ${l.from}` }),
          h('span', { class: 'letter__hint', text: 'Tap to open' })
        ])
      ]);
      const body = h('div', { class: 'letter__body', id: bodyId }, [
        h('div', {}, [h('p', { class: 'letter__text', text: (userName ? `Dear ${userName},\n` : '') + l.text })])
      ]);
      const card = h('article', { class: 'letter', 'data-open': 'false' }, [head, body]);

      head.addEventListener('click', () => {
        const open = card.getAttribute('data-open') !== 'true';
        card.setAttribute('data-open', String(open));
        head.setAttribute('aria-expanded', String(open));
        head.querySelector('.letter__hint').textContent = open ? 'Tap to close' : 'Tap to open';
      });
      wrap.append(card);
    });
  }

  function showHome(mode) {
    homeMode = mode;
    $('homeIntro').textContent = HOME_MODES[mode].intro;
    $('calloutTell').hidden = mode !== 'warm';
    $('calloutHeavy').hidden = mode !== 'heavy';
    document.querySelectorAll('#homeTabs .tab').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    renderLetters(mode);
  }

  function initLetters() {
    Object.entries(HOME_MODES).forEach(([key, m]) => {
      $('homeTabs').append(h('button', { class: 'tab', type: 'button', 'data-mode': key, 'aria-pressed': 'false', onclick: () => showHome(key) }, m.label));
    });
    showHome('warm');
  }

  /* ---------------------------------------------------------
     13) BREATHING
     --------------------------------------------------------- */

  const breath = { running: false, timer: null, cycle: 0, phase: 0 };

  function breathStop(finished) {
    breath.running = false;
    clearTimeout(breath.timer);
    const circle = $('breathCircle');
    circle.style.transitionDuration = '600ms';
    circle.style.transform = 'scale(1)';
    $('breathLabel').textContent = finished ? 'Well done. 💚' : 'Ready?';
    $('breathMeta').textContent = finished ? `You finished ${BREATH_CYCLES} breaths. How do you feel now?` : '';
    $('breathBtn').textContent = finished ? 'Go again' : 'Start';
  }

  function breathStep() {
    if (!breath.running) return;
    const p = BREATH_PHASES[breath.phase];
    const circle = $('breathCircle');
    circle.style.transitionDuration = `${p.secs}s`;
    circle.style.transform = `scale(${p.scale})`;
    $('breathLabel').textContent = p.name;
    $('breathMeta').textContent = `Breath ${breath.cycle + 1} of ${BREATH_CYCLES}`;

    breath.timer = setTimeout(() => {
      breath.phase += 1;
      if (breath.phase >= BREATH_PHASES.length) {
        breath.phase = 0;
        breath.cycle += 1;
        if (breath.cycle >= BREATH_CYCLES) { breathStop(true); return; }
      }
      breathStep();
    }, p.secs * 1000);
  }

  function initBreath() {
    $('breathBtn').addEventListener('click', () => {
      if (breath.running) { breathStop(false); return; }
      breath.running = true;
      breath.cycle = 0;
      breath.phase = 0;
      $('breathBtn').textContent = 'Stop';
      breathStep();
    });
  }

  /* ---------------------------------------------------------
     14) SMALL STEPS FOR TODAY
     --------------------------------------------------------- */

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  let stepsState = (() => {
    const saved = store.get('steps', null);
    if (saved && saved.date === todayKey() && Array.isArray(saved.done)) return saved;
    return { date: todayKey(), done: [] };
  })();

  function renderSteps() {
    const list = $('stepsList');
    list.textContent = '';
    STEPS.forEach((s) => {
      const done = stepsState.done.includes(s.id);
      list.append(
        h('li', {}, [
          h('button', {
            class: 'step', type: 'button', 'aria-pressed': String(done),
            onclick: () => {
              const i = stepsState.done.indexOf(s.id);
              if (i === -1) stepsState.done.push(s.id); else stepsState.done.splice(i, 1);
              store.set('steps', stepsState);
              renderSteps();
              if (stepsState.done.length === STEPS.length) toast('Amazing! Small steps, big change. 🎉');
            }
          }, [
            h('span', { class: 'step__box', 'aria-hidden': 'true', text: '✓' }),
            h('span', { class: 'step__label', text: s.label })
          ])
        ])
      );
    });

    const total = STEPS.length;
    const n = stepsState.done.length;
    $('stepsBar').style.width = `${(n / total) * 100}%`;
    $('stepsText').textContent =
      n === 0 ? `0 of ${total}. Start with the easiest one.` :
      n === total ? `${n} of ${total}. You did them all today! 🌟` :
      `${n} of ${total}. Keep going, you're off to a good start.`;
  }

  /* ---------------------------------------------------------
     15) LITTLE WINS
     --------------------------------------------------------- */

  let wins = store.get('wins', []);
  if (!Array.isArray(wins)) wins = [];

  function renderWins() {
    const list = $('winsList');
    list.textContent = '';
    wins.forEach((w, i) => {
      list.append(
        h('li', { class: 'win' }, [
          h('span', { text: `⭐ ${w}` }),
          h('button', {
            class: 'win__del', type: 'button', 'aria-label': `Delete: ${w}`, text: '×',
            onclick: () => { wins.splice(i, 1); store.set('wins', wins); renderWins(); }
          })
        ])
      );
    });
    $('winsEmpty').hidden = wins.length > 0;
  }

  function initWins() {
    $('winsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('winInput');
      const value = input.value.trim().slice(0, 80);
      if (!value) return;
      wins.unshift(value);
      wins = wins.slice(0, 30);
      store.set('wins', wins);
      input.value = '';
      renderWins();
      toast('Added! Nice work. 🌟');
    });
  }

  /* ---------------------------------------------------------
     16) REVEAL ON SCROLL
     --------------------------------------------------------- */

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     17) START
     --------------------------------------------------------- */

  /* ---------------------------------------------------------
     NAME: greet the visitor (a website can't know a name by itself,
     so we use ?name=Prince in the link, or ask once and remember it)
     --------------------------------------------------------- */
  let userName = '';
  let homeMode = 'warm';
  const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 30);

  function applyName() {
    $('greetText').textContent = userName ? `Hi, ${userName}! 💛` : 'Welcome! 💛';
    $('changeName').textContent = userName ? 'Not you? Change name' : 'Add my name';
    $('gentleLabel').textContent = userName ? `💚 A gentle word for ${userName}` : '💚 A gentle word';
    $('dailyLabel').textContent = userName ? `✨ Quote of the day for ${userName}` : '✨ Quote of the day';
    $('footerBig').textContent = userName
      ? `${userName}, you don't have to be perfect. Showing up is enough. 💛`
      : "You don't have to be perfect. Showing up is enough. 💛";
    showHome(homeMode);
    if (store.get('remind', false)) saveSchedule();
  }

  function openWelcome() {
    $('welcome').hidden = false;
    $('nameInput').value = userName;
    $('nameInput').focus();
  }

  function initName() {
    const fromLink = cleanName(new URLSearchParams(location.search).get('name'));
    userName = fromLink || cleanName(store.get('name', ''));
    if (fromLink) store.set('name', fromLink);
    applyName();
    $('changeName').addEventListener('click', openWelcome);
    $('nameForm').addEventListener('submit', (e) => {
      e.preventDefault();
      userName = cleanName($('nameInput').value);
      store.set('name', userName);
      store.set('nameAsked', true);
      $('welcome').hidden = true;
      applyName();
      if (userName) toast(`Welcome, ${userName}! 💛`);
    });
    $('nameSkip').addEventListener('click', () => { store.set('nameAsked', true); $('welcome').hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('welcome').hidden = true; });
    if (!userName && !store.get('nameAsked', false)) setTimeout(openWelcome, 700);
  }

  /* ---------------------------------------------------------
     MENU (hamburger on small screens) + BACK TO TOP
     --------------------------------------------------------- */
  function initMenu() {
    const header = document.querySelector('.site-header');
    const btn = $('menuToggle');
    const setOpen = (open) => {
      header.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!header.classList.contains('menu-open')); });
    $('mainNav').addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
  }

  function initToTop() {
    const btn = $('toTop');
    const update = () => btn.classList.toggle('show', window.pageYOffset > 400);
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));
    update();
  }

  /* ---------------------------------------------------------
     DAILY REMINDER (notification with the quote of the day)
     The page saves the next 30 days of quotes where the service
     worker can read them, so it can show one even when the site is closed.
     --------------------------------------------------------- */
  const hasNotif = () => 'Notification' in window;
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const remindOn = () => !!store.get('remind', false) && hasNotif() && Notification.permission === 'granted';

  async function saveSchedule() {
    if (!('caches' in window)) return;
    try {
      const days = [];
      for (let i = 0; i < 30; i += 1) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() + i);
        const idx = Math.max(0, Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - LAUNCH) / 864e5));
        days.push({ date: dateKey(d), text: genQuote(idx * PER_DAY).text });
      }
      const c = await caches.open('stg-daily');
      await c.put(new URL('daily.json', location.href).href, new Response(JSON.stringify({ name: userName, days })));
    } catch (e) { /* not available here */ }
  }

  async function getReg() {
    if (!('serviceWorker' in navigator)) return null;
    try { await navigator.serviceWorker.register('sw.js'); return await navigator.serviceWorker.ready; } catch (e) { return null; }
  }

  function notifyToday(reg) {
    const q = TODAY_QUOTES[0] || QUOTES[0];
    const icon = new URL('icon-192.png', location.href).href;
    const title = `Quote of the day${userName ? ' for ' + userName : ''} ✨`;
    if (reg) return reg.showNotification(title, { body: q.text, icon, badge: icon, tag: 'daily-quote' });
    return Promise.resolve(new Notification(title, { body: q.text, icon }));
  }

  async function registerPeriodic(reg) {
    if (!reg || !('periodicSync' in reg)) return false;
    try { await reg.periodicSync.register('daily-quote', { minInterval: 864e5 }); return true; } catch (e) { return false; }
  }

  function updateRemindBtn() {
    const on = remindOn();
    const b = $('dailyRemind');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? '🔕 Reminders on' : '🔔 Remind me daily';
  }

  async function enableReminders() {
    if (!hasNotif()) {
      toast('This browser can\'t show reminders. On iPhone: tap Share, then Add to Home Screen, and open it from there.', 7000);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Notifications are blocked. Allow them in your browser settings to get daily quotes.', 5500); return; }
    store.set('remind', true);
    await saveSchedule();
    const reg = await getReg();
    const auto = await registerPeriodic(reg);
    store.set('lastNotified', dateKey(new Date()));
    try { await notifyToday(reg); } catch (e) { /* ignore */ }
    updateRemindBtn();
    toast(auto
      ? 'Daily reminders are on 🔔 A quote will pop up each day.'
      : 'Reminders on 🔔 You\'ll get today\'s quote when you open the site. Install it (Add to Home Screen) for automatic pop-ups where your browser allows.', 7000);
  }

  async function disableReminders() {
    store.set('remind', false);
    const reg = await getReg();
    try { if (reg && reg.periodicSync) await reg.periodicSync.unregister('daily-quote'); } catch (e) { /* ignore */ }
    updateRemindBtn();
    toast('Reminders turned off');
  }

  function initReminders() {
    updateRemindBtn();
    $('dailyRemind').addEventListener('click', () => (remindOn() ? disableReminders() : enableReminders()));
    getReg().then(async (reg) => {
      if (!reg || !remindOn()) return;
      await saveSchedule();
      await registerPeriodic(reg);
      const today = dateKey(new Date());
      if (store.get('lastNotified', '') !== today) { store.set('lastNotified', today); notifyToday(reg).catch(() => {}); }
    });
  }

  let gentleLast = -1;
  function showGentle() {
    let i;
    do { i = Math.floor(Math.random() * GENTLE.length); } while (i === gentleLast && GENTLE.length > 1);
    gentleLast = i;
    $('gentleText').textContent = GENTLE[i];
  }
  function initGentle() {
    showGentle();
    $('gentleNext').addEventListener('click', showGentle);
  }

  function init() {
    initAnchorLinks();
    initTheme();
    initDaily();
    initMarquee();
    $('loadMore').addEventListener('click', () => { shown += PAGE; renderGrid(); });
    renderPicker();
    renderTabs();
    renderGrid();
    initMood();
    initWall();
    initJournal();
    initLetters();
    initBreath();
    renderSteps();
    renderWins();
    initWins();
    initReveal();
    initGentle();
    initName();
    initMenu();
    initToTop();
    initReminders();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
