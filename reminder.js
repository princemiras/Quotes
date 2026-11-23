/* =========================================================
   reminder.js  —  "Remind me daily" for Still Got This

   What it does
   - Takes over any button/link whose text contains "Remind me".
   - Opens a small dialog: pick a time, press "Add to my calendar".
   - Downloads a calendar file (.ics). When you open it on your phone and
     tap Save/Add, your phone itself shows a notification EVERY DAY with
     that day's quote. It works even when the website is closed, because the
     phone's calendar app sends the alert (a plain website cannot push
     notifications by itself).

   How to use it on your site
   1) Put this file next to index.html
   2) Add this line just before </body> in index.html:
        <script src="reminder.js"></script>
   Nothing else needs to change. No libraries.
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Quotes used in the daily notifications ---------- */
  // If your site defines  window.STILL_GOT_THIS_QUOTES = ['...', '...']  before this
  // script, those are used instead of the built-in list below.
  const BUILT_IN_QUOTES = [
    "Rest is not the opposite of ambition. It's the fuel for it. Sleep, then rise again.",
    "You've carried a lot this week. Set it down for tonight. It will still be there tomorrow, and so will your strength.",
    "A tired heart is still a heart that showed up. That already counts for a lot.",
    "Even the sun disappears every evening, and nobody calls it a failure. Take your rest.",
    "You are not behind. You are a human being on a long road, and long roads need pauses.",
    "Be as gentle with yourself tonight as you would be with a friend who studied all day.",
    "Your battery isn't broken, it's just low. Plug into sleep, water, and a good laugh.",
    "Tomorrow you get a fresh page. Tonight, all you have to do is close the notebook.",
    "Exhaustion is what effort looks like from the inside. Look how far you've come to feel this tired.",
    "You don't need a perfect day. You need a deep breath, a warm meal, and a good night's sleep.",
    "Some people turn a boring lecture into your favorite memory. Keep those people close.",
    "Alone, a hard week is a mountain. With your classmates, it's just a hike with snacks.",
    "Your classmates are not your competition. They are your crew, your witnesses, your cheerleaders.",
    "Behind every finished project is a group chat full of \u201Cwe're almost done!\u201D and \u201CI believe in us.\u201D",
    "Laugh together on the hard days. It's amazing how heavy things get lighter when they're shared.",
    "Study buddies, shared notes, borrowed pens: that's how the best friendships quietly begin.",
    "The best part of school isn't the diploma. It's the people who were there when you earned it.",
    "When one of you rises, you all rise. Celebrate your classmates loudly.",
    "You grow faster in a circle of friends who believe in you than in a room of people who only watch.",
    "Take the photo. Years from now, this messy, tired, laughing moment will be gold.",
    "The door of home is the one place where you can stop performing and just be tired.",
    "Whatever happened at school today, leave it at the door. Inside, you are simply loved.",
    "A bad day is not a bad life. Go home, eat well, and let love do its quiet work.",
    "The people who love you aren't counting your grades. They're counting the minutes until you're home.",
    "Walk in, take a breath, and say it out loud: \u201CToday was hard.\u201D Home was built for that sentence.",
    "You're allowed to come home with a heavy heart and leave tomorrow morning with a lighter one.",
    "Love at home doesn't ask for proof of success. It only asks, \u201CAre you okay?\u201D",
    "Tonight your only job is to rest, eat, and be someone's beloved child. Everything else can wait.",
    "Your family's pride in you was never tied to a score. It was tied to who you are.",
    "Home is proof that you are loved without having to earn it.",
    "A failed test is a plot twist, not the ending. Your story gets better from here.",
    "Every expert you admire once sat confused at the same kind of problem. Confusion is where learning begins.",
    "Your grade is one number. Your effort, curiosity and growth can't be measured on any scale.",
    "Don't try to eat the whole deadline. Take it one small bite at a time.",
    "Mistakes on paper are just your brain marking the places it's about to grow.",
    "You're not behind. You're on your own timeline, and it's still moving forward.",
    "A hard subject isn't a wall. It's a door that needs a few more keys. Ask for help to find them.",
    "Study with kindness. A calm mind remembers more than a panicked one.",
    "Thesis or capstone feeling impossible? So did every finished one, right up until the day it wasn't.",
    "The question you're afraid to ask is probably the one half your class is wondering too.",
    "You don't have to be okay all the time. You only have to be honest with yourself and gentle with your pace.",
    "Your worth is not a performance review. You matter on your best days and on your worst days.",
    "Feelings are like weather. They pass through you; they are not who you are.",
    "Taking care of your mind is not a luxury. It's the foundation under every goal you have.",
    "Reaching out is a strength. The bravest sentence can be, \u201CCan you sit with me for a while?\u201D",
    "Talk to yourself the way you'd talk to someone you love. You deserve that voice too.",
    "Small acts of care count: a glass of water, a short walk, a song you love, a message to a friend.",
    "You're allowed to take up space, ask for help, and change your mind. You're allowed to grow slowly.",
    "Some days, getting through is the whole victory. Count it.",
    "Healing isn't about becoming a different person. It's about coming home to yourself.",
    "You don't need the whole map tonight. You only need to know where the next step goes.",
    "Future you is cheering for the choice you make in the next five minutes.",
    "Dreams don't work unless you do, and they don't work without rest either. Do both.",
    "Courage can look like opening the textbook while your stomach is in knots.",
    "You're one focused hour away from feeling proud of yourself. Start the timer.",
    "Discipline is just kindness to your future self. Be good to them today.",
    "Progress is quiet. It looks like showing up again when nobody is clapping.",
    "The person you want to become is built from ordinary Tuesdays. Make this one count.",
    "Don't wait to feel ready. Ready is something you become by starting.",
    "You're studying for a future that hasn't happened yet, and that takes real faith in yourself. Be proud of that."
  ];

  const QUOTES = (Array.isArray(window.STILL_GOT_THIS_QUOTES) && window.STILL_GOT_THIS_QUOTES.length)
    ? window.STILL_GOT_THIS_QUOTES.map(String)
    : BUILT_IN_QUOTES;

  const DAYS = 180;                 // how many days of quotes go in the calendar file
  const FILE_NAME = 'still-got-this-daily-quotes.ics';
  const STORE_KEY = 'stg:reminder';

  /* ---------- Small helpers ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  const ua = navigator.userAgent || '';
  const IN_APP = /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Messenger|Instagram|Line\/|Snapchat|TikTok|MicroMessenger|Twitter/i.test(ua);
  const IS_IOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const pad = (n) => String(n).padStart(2, '0');

  function el(tag, props = {}, kids = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => { if (c != null) node.append(c); });
    return node;
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function timeLabel(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    try { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return hhmm; }
  }

  /* ---------- iCalendar (.ics) builder ---------- */
  const escapeText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

  // Lines must be folded at 75 bytes (UTF-8 aware, so emoji / curly quotes never get split)
  function fold(line) {
    const enc = new TextEncoder();
    let out = '';
    let cur = '';
    let bytes = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (bytes + b > 75) { out += cur + '\r\n'; cur = ' '; bytes = 1; }
      cur += ch; bytes += b;
    }
    return out + cur;
  }

  const fmtLocal = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const fmtUTC = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  function firstOccurrence(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    if (start.getTime() <= Date.now() + 60 * 1000) start.setDate(start.getDate() + 1);
    return start;
  }

  // Quotes picked on course.js (the student's own course). Empty if course.js isn't on the page.
  function courseQuotes() {
    try {
      const api = window.StillGotThis;
      if (api && typeof api.courseQuotes === 'function') return (api.courseQuotes() || []).map(String);
    } catch (e) { /* ignore */ }
    return [];
  }

  // A shuffled "deck" that refills itself, so quotes don't repeat until all were used
  function makeDeck(list) {
    let deck = [];
    return () => { if (!deck.length) deck = shuffle(list); return deck.pop(); };
  }

  function quoteSequence(count) {
    const mine = courseQuotes();
    const general = makeDeck(QUOTES);
    const specific = mine.length ? makeDeck(mine) : null;
    const seq = [];
    for (let i = 0; i < count; i += 1) {
      // With a course: 2 of every 3 days are for their course, 1 is a general one
      const useCourse = specific && i % 3 !== 2;
      let q = useCourse ? specific() : general();
      if (seq.length && q === seq[seq.length - 1]) q = useCourse ? specific() : general(); // never the same quote two days in a row
      if (seq.length && q === seq[seq.length - 1]) q = general();
      seq.push(q);
    }
    return seq;
  }

  function wrapCalendar(eventLines) {
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Still Got This//Daily Quote Reminder//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Still Got This',
      ...eventLines, 'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function vevent({ uid, start, summary, description, rrule, url }) {
    const end = new Date(start.getTime() + 5 * 60 * 1000);
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${fmtUTC(new Date())}`,
      `DTSTART:${fmtLocal(start)}`,   // "floating" local time: fires at this clock time wherever the phone is
      `DTEND:${fmtLocal(end)}`
    ];
    if (rrule) lines.push(`RRULE:${rrule}`);
    lines.push(`SUMMARY:${escapeText(summary)}`, `DESCRIPTION:${escapeText(description)}`);
    if (url) lines.push(`URL:${url}`);
    lines.push(
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(summary)}`, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT'
    );
    return lines;
  }

  // Mode "quotes": a different quote on each of the next DAYS days
  function buildQuotesCalendar(hhmm) {
    const first = firstOccurrence(hhmm);
    const seq = quoteSequence(DAYS);
    const stamp = Date.now().toString(36);
    const events = [];
    seq.forEach((quote, i) => {
      const day = new Date(first);
      day.setDate(first.getDate() + i);
      events.push(...vevent({
        uid: `stg-${stamp}-${i}@still-got-this`,
        start: day,
        summary: `\uD83D\uDC9B ${quote}`,
        description: `${quote}\n\n\u2014 Still Got This`
      }));
    });
    return wrapCalendar(events);
  }

  // Mode "repeat": one event that repeats forever (most compatible)
  function buildRepeatingCalendar(hhmm) {
    const page = location.href.split('#')[0];
    const startsWithHttp = /^https?:/i.test(page);
    return wrapCalendar(vevent({
      uid: `stg-daily-${Date.now().toString(36)}@still-got-this`,
      start: firstOccurrence(hhmm),
      rrule: 'FREQ=DAILY',
      summary: '\uD83D\uDC9B Your Still Got This quote for today is ready',
      description: `Take one minute for yourself and read today's quote.${startsWithHttp ? `\n\n${page}` : ''}`,
      url: startsWithHttp ? page : ''
    }));
  }

  function makeBlobUrl(text) {
    return URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  }

  function triggerDownload(url) {
    const a = el('a', { href: url, download: FILE_NAME, style: 'display:none' });
    document.body.append(a);
    a.click();
    a.remove();
  }

  /* ---------- Styles (injected, so no CSS file is needed) ---------- */
  function injectStyles() {
    if (document.getElementById('rm-styles')) return;
    const css = `
    .rm-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(12,10,28,.66);animation:rm-fade .2s ease}
    .rm-dialog{box-sizing:border-box;width:100%;max-width:480px;max-height:92vh;overflow:auto;padding:24px 22px 20px;border-radius:22px;background:var(--card,#fffdf7);color:var(--ink,#2d2a3a);font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:1rem;line-height:1.55;box-shadow:0 24px 60px rgba(0,0,0,.45);animation:rm-pop .25s ease}
    .rm-dialog *{box-sizing:border-box}
    .rm-dialog .sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
    .rm-dialog h2{margin:0 0 6px;font-family:var(--font-head,inherit);font-weight:600;font-size:1.45rem;line-height:1.2}
    .rm-dialog p{margin:0}
    .rm-sub{color:var(--ink-soft,#595470);font-size:.95rem}
    .rm-warn{margin:14px 0 0;padding:12px 14px;border-radius:14px;background:#ffe3df;color:#5c1410;font-size:.92rem;font-weight:700}
    .rm-warn button{margin-top:8px}
    .rm-row{display:flex;align-items:center;gap:12px;margin:16px 0 4px;flex-wrap:wrap}
    .rm-row label{font-weight:800}
    .rm-time{padding:10px 14px;border-radius:12px;border:2px solid var(--line,#e6dcc3);background:var(--paper,#fff);color:inherit;font:inherit;font-weight:800;min-width:9.5em}
    .rm-opts{border:0;margin:14px 0 0;padding:0;display:grid;gap:10px}
    .rm-opt{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:2px solid var(--line,#e6dcc3);border-radius:14px;cursor:pointer;background:var(--paper,#fff)}
    .rm-opt:has(input:checked){border-color:#ff7a59;background:color-mix(in srgb,#ff7a59 10%,var(--card,#fffdf7))}
    .rm-opt input{margin-top:4px;accent-color:#ff7a59;width:18px;height:18px;flex:none}
    .rm-opt strong{display:block}
    .rm-opt span{color:var(--ink-soft,#595470);font-size:.9rem}
    .rm-preview{margin:16px 0 0;padding:14px 16px;border-radius:14px;background:#ffe38f;color:#2d2a3a;font-size:.95rem}
    .rm-preview b{display:block;margin-bottom:4px;font-size:.82rem;letter-spacing:.03em;text-transform:uppercase;opacity:.75}
    .rm-preview q{font-weight:700;quotes:"\\201C" "\\201D"}
    .rm-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
    .rm-btn{padding:12px 20px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;cursor:pointer;line-height:1.2}
    .rm-btn:hover{border-color:#ff7a59}
    .rm-btn--primary{border-color:transparent;background:linear-gradient(135deg,#ff7a59,#ffb347);color:#2d2a3a}
    .rm-btn--small{padding:8px 14px;font-size:.88rem}
    .rm-done{margin-top:16px;padding:16px;border-radius:16px;background:#bff0dd;color:#18382b}
    .rm-done h3{margin:0 0 8px;font-size:1.1rem}
    .rm-done ol{margin:8px 0 0;padding-left:1.4em;list-style:decimal}
    .rm-done li{margin:4px 0;list-style:decimal}
    .rm-done a{color:#0b5555;font-weight:800}
    .rm-tip{margin-top:10px;font-size:.88rem}
    .rm-dialog :focus-visible{outline:3px solid #146f6f;outline-offset:2px;border-radius:8px}
    @keyframes rm-fade{from{opacity:0}to{opacity:1}}
    @keyframes rm-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.rm-backdrop,.rm-dialog{animation:none}}
    `;
    document.head.append(el('style', { id: 'rm-styles', text: css }));
  }

  /* ---------- The dialog ---------- */
  let opener = null;
  let lastBlobUrl = null;

  function closeDialog() {
    const back = document.querySelector('.rm-backdrop');
    if (back) back.remove();
    document.removeEventListener('keydown', onKey, true);
    document.body.style.overflow = '';
    if (lastBlobUrl) { const u = lastBlobUrl; lastBlobUrl = null; setTimeout(() => URL.revokeObjectURL(u), 60000); }
    if (opener && opener.focus) opener.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeDialog(); }
  }

  function updateTriggerLabels() {
    const saved = store.get();
    if (!saved || !saved.time) return;
    document.querySelectorAll('[data-rm-trigger]').forEach((b) => {
      b.textContent = `\uD83D\uDD14 Reminder set \u00B7 ${timeLabel(saved.time)}`;
    });
  }

  function openDialog(trigger) {
    if (document.querySelector('.rm-backdrop')) return;
    injectStyles();
    opener = trigger || null;
    const saved = store.get() || {};
    const state = { time: saved.time || '08:00', mode: saved.mode === 'repeat' ? 'repeat' : 'quotes' };

    const timeInput = el('input', { class: 'rm-time', type: 'time', id: 'rm-time', value: state.time, required: true });
    const preview = el('div', { class: 'rm-preview', 'aria-live': 'polite' });
    const result = el('div', { 'aria-live': 'polite' });

    function refreshPreview() {
      preview.textContent = '';
      const sample = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      preview.append(el('b', { text: `Your phone will show, every day at ${timeLabel(state.time)}:` }));
      if (state.mode === 'quotes') preview.append(el('q', { text: `\uD83D\uDC9B ${sample}` }));
      else preview.append(el('q', { text: '\uD83D\uDC9B Your Still Got This quote for today is ready' }));
    }

    const radio = (value, title, desc) => {
      const input = el('input', { type: 'radio', name: 'rm-mode', value });
      input.checked = state.mode === value;
      input.addEventListener('change', () => { state.mode = value; refreshPreview(); });
      return el('label', { class: 'rm-opt' }, [input, el('div', {}, [el('strong', { text: title }), el('span', { text: desc })])]);
    };

    timeInput.addEventListener('input', () => { if (timeInput.value) { state.time = timeInput.value; refreshPreview(); } });

    const addBtn = el('button', { class: 'rm-btn rm-btn--primary', type: 'button', text: 'Add to my calendar' });
    const cancelBtn = el('button', { class: 'rm-btn', type: 'button', text: 'Cancel', onclick: closeDialog });

    const children = [
      el('h2', { id: 'rm-title', text: '\uD83D\uDD14 Daily quote reminder' }),
      el('p', { class: 'rm-sub', text: 'Pick a time and add it to your phone\u2019s calendar. Your phone will then pop up a notification every day, even when this website is closed.' })
    ];

    if (IN_APP) {
      const copyBtn = el('button', {
        class: 'rm-btn rm-btn--small', type: 'button', text: 'Copy page link',
        onclick: async () => {
          try { await navigator.clipboard.writeText(location.href.split('#')[0]); copyBtn.textContent = 'Link copied. Paste it in Chrome'; }
          catch (e) { copyBtn.textContent = 'Press and hold the address to copy it'; }
        }
      });
      children.push(el('div', { class: 'rm-warn', role: 'note' }, [
        el('p', { text: 'You\u2019re in an in-app browser (like Messenger or Facebook). These often block file downloads. If nothing happens, tap \u22EE (or \u2022\u2022\u2022) and choose \u201COpen in Chrome\u201D (or Safari), then try again.' }),
        copyBtn
      ]));
    }

    children.push(
      el('div', { class: 'rm-row' }, [el('label', { for: 'rm-time', text: 'What time?' }), timeInput]),
      el('fieldset', { class: 'rm-opts' }, [
        el('legend', { class: 'sr-only', text: 'What kind of reminder?' }),
        radio('quotes', 'A different quote every day (recommended)', `Adds ${DAYS} daily events, each with its own quote and an alert.`),
        radio('repeat', 'One repeating daily reminder', 'Simplest and works on every phone. The alert reminds you to open the site for today\u2019s quote.')
      ]),
      preview,
      el('div', { class: 'rm-actions' }, [addBtn, cancelBtn]),
      result
    );

    const dialog = el('div', { class: 'rm-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'rm-title' }, children);
    const backdrop = el('div', { class: 'rm-backdrop' }, [dialog]);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) closeDialog(); });

    addBtn.addEventListener('click', () => {
      if (!timeInput.value) { timeInput.focus(); return; }
      state.time = timeInput.value;
      const text = state.mode === 'quotes' ? buildQuotesCalendar(state.time) : buildRepeatingCalendar(state.time);
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      const url = makeBlobUrl(text);
      lastBlobUrl = url;
      triggerDownload(url);
      store.set({ time: state.time, mode: state.mode, createdAt: Date.now() });
      updateTriggerLabels();

      const steps = IS_IOS
        ? ['Tap the download / \u201CAdd to Calendar\u201D prompt that appears.', 'Tap \u201CAdd All\u201D (or \u201CAdd\u201D) at the bottom.', 'Done. Your iPhone will notify you every day.']
        : ['Tap the \u201CDownload complete\u201D notice, or open Files \u203A Downloads.', 'Open the file with your Calendar app.', 'Tap Save / Add. Done. Your phone will notify you every day.'];
      result.textContent = '';
      result.append(el('div', { class: 'rm-done' }, [
        el('h3', { text: `\u2705 Reminder file ready for ${timeLabel(state.time)}` }),
        el('p', { text: 'One last step on your phone:' }),
        el('ol', {}, steps.map((s) => el('li', { text: s }))),
        el('p', { class: 'rm-tip' }, [
          'Download didn\u2019t start? ',
          el('a', { href: url, download: FILE_NAME, text: 'Tap here to get the file.' })
        ]),
        el('p', { class: 'rm-tip', text: 'No alert on the first day? Open your Calendar app \u203A Settings and set the notification for this calendar to \u201CAt time of event\u201D.' }),
        state.mode === 'quotes'
          ? el('p', { class: 'rm-tip', text: `This covers the next ${DAYS} days. Come back and tap the button again to renew it.` })
          : null
      ]));
      addBtn.textContent = 'Download again';
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    refreshPreview();
    document.body.append(backdrop);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);
    timeInput.focus();
  }

  /* ---------- Hook the "Remind me daily" button ---------- */
  const TRIGGER_RE = /remind me|reminder set/i;

  function findTrigger(target) {
    const btn = target && target.closest ? target.closest('button, a, [role="button"]') : null;
    if (!btn || btn.closest('.rm-backdrop')) return null;
    if (btn.hasAttribute('data-rm-trigger') || TRIGGER_RE.test(btn.textContent || '')) return btn;
    return null;
  }

  // Capture phase on document = runs BEFORE any older click handler on the button,
  // so the old "this browser can't show reminders" popup can no longer appear.
  document.addEventListener('click', (e) => {
    const btn = findTrigger(e.target);
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    btn.setAttribute('data-rm-trigger', '');
    openDialog(btn);
  }, true);

  function markTriggers() {
    document.querySelectorAll('button, a, [role="button"]').forEach((b) => {
      if (TRIGGER_RE.test(b.textContent || '')) b.setAttribute('data-rm-trigger', '');
    });
    updateTriggerLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markTriggers);
  else markTriggers();
})();
