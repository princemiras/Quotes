/* =========================================================
   share.js  —  "Share as picture" + "Message for a friend"

   1) 🖼️ Picture  — a button appears on every quote. Tap it to turn
      the quote into a nice picture (Post or Story size, pick a colour),
      then Share it (Messenger, Facebook story, etc.) or Save it.
   2) 💌 Message a friend — write a short message for a classmate who
      is sad or tired. It becomes a picture AND a link. When your friend
      opens the link, they see your message on the site.
      (The message lives inside the link itself. Nothing is stored on a
      server, and nothing is sent anywhere.)

   How to use it on your site
   1) Put this file next to index.html (same folder as course.js)
   2) Add this line just before </body>, after course.js:
        <script src="course.js"></script>
        <script src="share.js"></script>
        <script src="reminder.js"></script>
   No libraries. No other changes needed.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1) DATA
     --------------------------------------------------------- */
  const COLORS = [
    { id: 'sun', hex: '#ffe38f', name: 'Yellow' },
    { id: 'mint', hex: '#bff0dd', name: 'Mint' },
    { id: 'rose', hex: '#ffcdd0', name: 'Pink' },
    { id: 'sky', hex: '#c6e2ff', name: 'Blue' },
    { id: 'lav', hex: '#ddd2ff', name: 'Purple' },
    { id: 'coral', hex: '#ffc8ab', name: 'Orange' },
    { id: 'aqua', hex: '#b9ecf2', name: 'Aqua' },
    { id: 'night', hex: '#2d2a3a', name: 'Night' }
  ];

  // Short, warm lines to put under a message for a friend
  const FRIEND_QUOTES = [
    "You don't have to carry it alone. I'm right here.",
    "A rough day doesn't change how much you matter.",
    "I'm proud of you for showing up today, even when it was hard.",
    "Whatever happens, we'll study, laugh and survive it together.",
    "Rest. Breathe. Then we try again tomorrow, as a team.",
    "You're doing better than you think.",
    "A bad grade is not a measure of how good a person you are.",
    "Your friends are cheering for you louder than your worries.",
    "Being tired is allowed. Giving up is not the only way to rest."
  ];

  const STARTERS = [
    "Hey, I'm here for you. Whatever you're feeling, you don't have to carry it alone. 💛",
    "Don't be sad about the grade. It doesn't define you. Let's study together next time!",
    "I'm proud of you. You've been working so hard, so take a break. You deserve it.",
    "Thanks for always being there for me. You're the best classmate ever! 🥹"
  ];

  const LIMITS = { name: 30, msg: 300, quote: 200 };

  /* ---------------------------------------------------------
     2) SMALL HELPERS
     --------------------------------------------------------- */
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

  const clamp = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
  const clampMsg = (s) => String(s == null ? '' : s).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, LIMITS.msg);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let toastTimer;
  function toast(msg) {
    let t = document.getElementById('sg-toast');
    if (!t) { t = el('div', { id: 'sg-toast', class: 'sg-toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg || 'Copied! ✨'); return true; } catch (e) { /* fallback */ }
    try {
      const ta = el('textarea', { readonly: true, 'aria-hidden': 'true' });
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px;';
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove();
      toast(ok ? (okMsg || 'Copied! ✨') : "Couldn't copy. Select the text and copy it by hand.");
      return ok;
    } catch (e) { toast("Couldn't copy. Select the text and copy it by hand."); return false; }
  }

  function myName() {
    try { const api = window.StillGotThis; const p = api && api.getProfile && api.getProfile(); if (p && p.name) return clamp(p.name, LIMITS.name); } catch (e) { /* ignore */ }
    return '';
  }

  function quotePool() {
    let mine = [];
    try { const api = window.StillGotThis; if (api && api.courseQuotes) mine = api.courseQuotes().filter((q) => q.length <= LIMITS.quote); } catch (e) { /* ignore */ }
    return FRIEND_QUOTES.concat(mine);
  }

  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return 1;
    const n = parseInt(m[1], 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  // Read the colour of a sticky note on the page ("rgb(255, 227, 143)" -> "#ffe38f")
  function cssBgToHex(node) {
    try {
      const c = getComputedStyle(node).backgroundColor;
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(c);
      if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
      return '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------
     3) LINK FORMAT  (#m=...)  — encode / decode a friend message
     --------------------------------------------------------- */
  function toB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64(b64) {
    const pad = b64.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(pad + '==='.slice((pad.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function buildLink(d) {
    const payload = { t: d.to || '', f: d.from || '', m: d.msg || '', q: d.quote || '', c: d.bgId || '' };
    return location.href.split('#')[0] + '#m=' + toB64(JSON.stringify(payload));
  }
  function readLink() {
    const m = /^#m=([A-Za-z0-9_-]+)$/.exec(location.hash || '');
    if (!m) return null;
    try {
      const o = JSON.parse(fromB64(m[1]));
      if (!o || typeof o !== 'object') return null;
      const out = {
        to: clamp(o.t, LIMITS.name), from: clamp(o.f, LIMITS.name), msg: clampMsg(o.m), quote: clamp(o.q, LIMITS.quote),
        bgId: COLORS.some((c) => c.id === o.c) ? o.c : 'rose'
      };
      return out.msg ? out : null;
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------
     4) DRAWING THE PICTURE (canvas)
     --------------------------------------------------------- */
  const SANS = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
  const SERIF = 'Georgia, "Times New Roman", serif';

  // Break text into lines that fit maxW (handles \n and very long words)
  function wrap(ctx, text, maxW) {
    const lines = [];
    String(text).split('\n').forEach((para) => {
      if (!para.trim()) { lines.push(''); return; }
      let line = '';
      para.split(/\s+/).forEach((word) => {
        let w = word;
        while (ctx.measureText(w).width > maxW) { // a single word wider than the card
          let cut = w.length - 1;
          while (cut > 1 && ctx.measureText(w.slice(0, cut)).width > maxW) cut -= 1;
          if (line) { lines.push(line); line = ''; }
          lines.push(w.slice(0, cut)); w = w.slice(cut);
        }
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) line = test;
        else { lines.push(line); line = w; }
      });
      if (line) lines.push(line);
    });
    return lines;
  }

  // Biggest font size (between max and min) at which the text fits in maxW x maxH
  function fit(ctx, text, font, maxW, maxH, maxSize, minSize, lh) {
    for (let size = maxSize; size >= minSize; size -= 2) {
      ctx.font = font(size);
      const lines = wrap(ctx, text, maxW);
      if (lines.length * size * lh <= maxH) return { size, lines, lh };
    }
    ctx.font = font(minSize);
    const all = wrap(ctx, text, maxW);
    const maxLines = Math.max(1, Math.floor(maxH / (minSize * lh)));
    const lines = all.slice(0, maxLines);
    if (all.length > maxLines) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return { size: minSize, lines, lh };
  }

  function drawLines(ctx, fitted, x, y, align) {
    ctx.textAlign = align || 'left';
    fitted.lines.forEach((l, i) => ctx.fillText(l, x, y + i * fitted.size * fitted.lh));
    return fitted.lines.length * fitted.size * fitted.lh;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawCard(o) {
    const W = 1080, H = o.format === 'story' ? 1920 : 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const dark = luminance(o.bg) < 0.4;
    const ink = dark ? '#ffffff' : '#2d2a3a';
    const soft = dark ? 'rgba(255,255,255,.72)' : 'rgba(45,42,58,.72)';
    const L = 130, R = W - 110, maxW = R - L;
    ctx.textBaseline = 'alphabetic';

    // paper
    ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(45,42,58,.07)'; ctx.lineWidth = 2;
    for (let y = 170; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(224,90,110,.4)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(92, 0); ctx.lineTo(92, H); ctx.stroke();
    // tape
    ctx.save(); ctx.translate(W / 2, 48); ctx.rotate(-0.04);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.6)'; ctx.fillRect(-140, -30, 280, 68); ctx.restore();

    // footer
    const footY = H - 90;
    ctx.fillStyle = ink; ctx.font = `800 40px ${SANS}`; ctx.textAlign = 'left';
    ctx.fillText('💛 Still Got This', L, footY);
    const right = o.kind === 'quote' && o.name ? `shared by ${o.name}` : (location.host || '');
    if (right) { ctx.fillStyle = soft; ctx.font = `600 32px ${SANS}`; ctx.textAlign = 'right'; ctx.fillText(clamp(right, 34), R, footY); }

    if (o.kind === 'quote') {
      // big quote mark
      ctx.fillStyle = dark ? 'rgba(255,255,255,.16)' : 'rgba(45,42,58,.14)';
      ctx.font = `700 300px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillText('“', L - 20, 380);
      // tag pill
      let pillH = 0;
      if (o.tag) {
        ctx.font = `800 34px ${SANS}`;
        const label = clamp(o.tag, 40); const pw = Math.min(maxW, ctx.measureText(label).width + 56); pillH = 64;
        ctx.fillStyle = dark ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.7)';
        roundRect(ctx, L, footY - 150, pw, pillH, 32); ctx.fill();
        ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText(label, L + 28, footY - 150 + 43);
      }
      const top = 300, bottom = footY - (o.tag ? 200 : 140);
      const font = (s) => `700 ${s}px ${SERIF}`;
      const f = fit(ctx, o.text, font, maxW, bottom - top, 92, 40, 1.28);
      ctx.fillStyle = ink; ctx.font = font(f.size);
      const used = f.lines.length * f.size * f.lh;
      drawLines(ctx, f, L, top + Math.max(0, (bottom - top - used) / 2) + f.size, 'left');
    } else {
      // message for a friend
      const heading = o.to ? `💌 For ${o.to}` : '💌 A little message for you';
      ctx.fillStyle = ink; ctx.textAlign = 'left';
      const hf = fit(ctx, heading, (s) => `800 ${s}px ${SANS}`, maxW, 80, 64, 36, 1.1);
      ctx.font = `800 ${hf.size}px ${SANS}`; ctx.fillText(hf.lines[0], L, 270);

      let bottom = footY - 120;
      let quoteBlock = null;
      if (o.quote) {
        const qf = fit(ctx, '“' + o.quote + '”', (s) => `italic 600 ${s}px ${SERIF}`, maxW, 300, 44, 30, 1.3);
        quoteBlock = { f: qf, h: qf.lines.length * qf.size * qf.lh };
        bottom -= quoteBlock.h + 70;
      }
      if (o.from) bottom -= 90;
      const top = 340;
      const font = (s) => `700 ${s}px ${SERIF}`;
      const f = fit(ctx, o.msg, font, maxW, Math.max(200, bottom - top), 76, 34, 1.32);
      ctx.fillStyle = ink; ctx.font = font(f.size);
      const used = drawLines(ctx, f, L, top + f.size, 'left');
      let y = top + used;
      if (o.from) {
        ctx.font = `800 ${Math.min(54, f.size + 4)}px ${SANS}`; ctx.textAlign = 'right'; ctx.fillStyle = ink;
        ctx.fillText(`— ${o.from}`, R, y + 70); y += 90;
      }
      if (quoteBlock) {
        const qy = Math.max(y + 60, footY - 120 - quoteBlock.h - 10);
        ctx.strokeStyle = soft; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L, qy - 40); ctx.lineTo(L + 140, qy - 40); ctx.stroke();
        ctx.fillStyle = soft; ctx.font = `italic 600 ${quoteBlock.f.size}px ${SERIF}`;
        drawLines(ctx, quoteBlock.f, L, qy + quoteBlock.f.size - 6, 'left');
      }
    }
    return canvas;
  }

  const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));

  /* ---------------------------------------------------------
     5) STYLES
     --------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('sg-styles')) return;
    const css = `
    .sg-backdrop{position:fixed;inset:0;z-index:2147482500;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(12,10,28,.72);animation:sg-fade .2s ease}
    .sg-dialog{box-sizing:border-box;width:100%;max-width:880px;max-height:95vh;overflow:auto;padding:22px 22px 18px;border-radius:24px;background:var(--card,#fffdf7);color:var(--ink,#2d2a3a);font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:1rem;line-height:1.5;box-shadow:0 26px 70px rgba(0,0,0,.5);animation:sg-pop .25s ease}
    .sg-dialog *{box-sizing:border-box}
    .sg-dialog h2{margin:0 0 4px;font-family:var(--font-head,inherit);font-weight:600;font-size:1.5rem;line-height:1.2}
    .sg-dialog p{margin:0}
    .sg-sub{color:var(--ink-soft,#595470)}
    .sg-cols{display:grid;gap:20px;grid-template-columns:minmax(0,1fr) minmax(0,300px);margin-top:14px;align-items:start}
    @media (max-width:720px){.sg-cols{grid-template-columns:1fr}}
    .sg-previewbox{display:flex;flex-direction:column;align-items:center;gap:8px}
    .sg-preview{display:block;width:100%;max-width:300px;height:auto;max-height:55vh;object-fit:contain;border-radius:12px;box-shadow:0 12px 28px -12px rgba(0,0,0,.55);background:#eee;-webkit-touch-callout:default}
    .sg-hint{font-size:.82rem;color:var(--ink-soft,#595470);text-align:center}
    .sg-controls{display:flex;flex-direction:column;gap:14px;min-width:0}
    .sg-field label,.sg-label{display:block;margin-bottom:6px;font-weight:800;font-size:.92rem}
    .sg-input,.sg-text{width:100%;padding:11px 14px;border-radius:12px;border:2px solid var(--line,#e6dcc3);background:var(--paper,#fff);color:inherit;font:inherit}
    .sg-text{min-height:110px;resize:vertical}
    .sg-input:focus,.sg-text:focus{outline:none;border-color:#146f6f}
    .sg-count{margin-top:4px;text-align:right;font-size:.8rem;color:var(--ink-soft,#595470)}
    .sg-row{display:flex;flex-wrap:wrap;gap:8px}
    .sg-sw{width:40px;height:40px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
    .sg-sw[aria-pressed="true"]{border-color:#146f6f;box-shadow:0 0 0 2px #fff,0 0 0 4px #146f6f}
    .sg-seg{padding:9px 16px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;font-size:.92rem;cursor:pointer}
    .sg-seg[aria-pressed="true"]{background:#2d2a3a;color:#fff;border-color:#2d2a3a}
    .sg-chip{padding:8px 12px;border-radius:12px;border:2px dashed var(--line,#e6dcc3);background:transparent;color:inherit;font:inherit;font-size:.85rem;text-align:left;cursor:pointer}
    .sg-chip:hover{border-style:solid;border-color:#ff7a59}
    .sg-btn{padding:12px 20px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;cursor:pointer;line-height:1.2;transition:transform .15s,border-color .15s}
    .sg-btn:hover{border-color:#ff7a59;transform:translateY(-1px)}
    .sg-btn--primary{border-color:transparent;background:linear-gradient(135deg,#ff7a59,#ffb347);color:#2d2a3a}
    .sg-btn--small{padding:8px 14px;font-size:.88rem}
    .sg-btn[disabled]{opacity:.55;cursor:wait;transform:none}
    .sg-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:2px}
    .sg-close{margin-top:14px;text-align:right}
    .sg-link{background:none;border:0;padding:6px 4px;color:var(--ink-soft,#595470);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
    .sg-check{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.92rem}
    .sg-check input{width:20px;height:20px}
    .sg-dialog :focus-visible{outline:3px solid #146f6f;outline-offset:2px;border-radius:10px}
    .sg-got{padding:30px 24px 22px;border-radius:8px 8px 26px 8px;color:#2d2a3a;box-shadow:0 14px 30px -16px rgba(0,0,0,.55);position:relative;margin-top:14px}
    .sg-got::before{content:"";position:absolute;top:-12px;left:50%;width:100px;height:24px;transform:translateX(-50%) rotate(-3deg);background:rgba(255,255,255,.6)}
    .sg-got h3{margin:0 0 12px;font-weight:800;font-size:1.05rem}
    .sg-got__msg{margin:0 0 12px;font-family:var(--font-hand,Georgia,serif);font-weight:700;font-size:clamp(1.3rem,3.5vw,1.9rem);line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere}
    .sg-got__from{margin:0 0 10px;text-align:right;font-weight:800}
    .sg-got__q{margin:12px 0 0;padding-top:12px;border-top:2px dashed rgba(45,42,58,.25);font-style:italic;font-weight:600;overflow-wrap:anywhere}
    .sg-fab{position:fixed;right:16px;bottom:16px;z-index:2147481000;padding:12px 18px;border-radius:999px;border:0;background:#2d2a3a;color:#fff;font:inherit;font-weight:800;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);cursor:pointer}
    .sg-fab:hover{background:#413d55}
    .sg-mini{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.7);cursor:pointer;font-size:1rem;padding:0}
    .sg-mini:hover{background:#fff}
    .sg-toast{position:fixed;left:50%;bottom:24px;z-index:2147483600;transform:translate(-50%,24px);opacity:0;pointer-events:none;width:max-content;max-width:min(92vw,420px);padding:12px 22px;border-radius:16px;background:#2d2a3a;color:#fff;font-family:var(--font-body,system-ui,sans-serif);font-weight:800;line-height:1.4;text-align:center;box-shadow:0 12px 28px rgba(0,0,0,.4);transition:opacity .25s,transform .25s}
    .sg-toast.show{opacity:1;transform:translate(-50%,0)}
    @keyframes sg-fade{from{opacity:0}to{opacity:1}}
    @keyframes sg-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.sg-backdrop,.sg-dialog{animation:none}.sg-btn,.sg-toast{transition:none}}
    `;
    document.head.append(el('style', { id: 'sg-styles', text: css }));
  }

  /* ---------------------------------------------------------
     6) THE DIALOGS
     --------------------------------------------------------- */
  let openBackdrop = null;
  let lastFocus = null;
  let escHandler = null;
  let previewUrl = null;

  function closeDialog() {
    if (openBackdrop) openBackdrop.remove();
    openBackdrop = null;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escHandler, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
  }

  function showDialog(dialog) {
    if (openBackdrop) closeDialog();
    injectStyles();
    lastFocus = document.activeElement;
    dialog.classList.add('sg-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    openBackdrop = el('div', { class: 'sg-backdrop' }, [dialog]);
    openBackdrop.addEventListener('mousedown', (e) => { if (e.target === openBackdrop) closeDialog(); });
    escHandler = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeDialog(); } };
    document.addEventListener('keydown', escHandler, true);
    document.body.append(openBackdrop);
    document.body.style.overflow = 'hidden';
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // Share the picture with the phone's share sheet; if that isn't possible, save it
  async function sharePicture(blob, text, url) {
    const file = new File([blob], 'still-got-this.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try {
      if (navigator.share) { await navigator.share({ text, url: url || undefined }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    download(blob, 'still-got-this.png');
    toast('Picture saved. Now send it in Messenger or post it! 💛');
  }

  /* Studio: used for both "share a quote" and "message a friend" */
  function openStudio(init) {
    const s = {
      kind: init.kind, text: init.text || '', tag: init.tag || '',
      bgId: init.bgId || null, bg: init.bg || null, format: 'post',
      name: init.kind === 'quote' ? myName() : '',
      to: '', from: myName(), msg: init.msg || '', withQuote: true, quote: init.quote || pick(quotePool())
    };
    if (!s.bg) { const c = COLORS.find((x) => x.id === s.bgId) || COLORS[Math.floor(Math.random() * 7)]; s.bg = c.hex; s.bgId = c.id; }
    else if (!s.bgId) { const c = COLORS.find((x) => x.hex.toLowerCase() === s.bg.toLowerCase()); s.bgId = c ? c.id : 'custom'; }

    const isMsg = s.kind === 'message';
    const img = el('img', { class: 'sg-preview', alt: 'Preview of your picture' });
    let blob = null; let drawToken = 0; let timer = null;

    function currentOpts() {
      return isMsg
        ? { kind: 'message', bg: s.bg, format: s.format, to: s.to, from: s.from, msg: s.msg || 'Write your message…', quote: s.withQuote ? s.quote : '' }
        : { kind: 'quote', bg: s.bg, format: s.format, text: s.text, tag: s.tag, name: s.name };
    }
    async function render() {
      const token = ++drawToken;
      const b = await toBlob(drawCard(currentOpts()));
      if (token !== drawToken || !b) return;
      blob = b;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(b);
      img.src = previewUrl;
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(render, 120); };

    // colour swatches
    const swatches = el('div', { class: 'sg-row', role: 'group', 'aria-label': 'Picture colour' });
    const drawSwatches = () => {
      swatches.replaceChildren(...COLORS.map((c) => el('button', {
        class: 'sg-sw', type: 'button', style: `background:${c.hex}`, title: c.name, 'aria-label': c.name,
        'aria-pressed': String(s.bgId === c.id),
        onclick: () => { s.bg = c.hex; s.bgId = c.id; drawSwatches(); schedule(); }
      })));
    };
    drawSwatches();

    // size toggle
    const segs = el('div', { class: 'sg-row', role: 'group', 'aria-label': 'Picture size' });
    const drawSegs = () => {
      segs.replaceChildren(
        el('button', { class: 'sg-seg', type: 'button', 'aria-pressed': String(s.format === 'post'), text: '📷 Post', onclick: () => { s.format = 'post'; drawSegs(); schedule(); } }),
        el('button', { class: 'sg-seg', type: 'button', 'aria-pressed': String(s.format === 'story'), text: '📱 Story', onclick: () => { s.format = 'story'; drawSegs(); schedule(); } })
      );
    };
    drawSegs();

    const controls = el('div', { class: 'sg-controls' });

    if (isMsg) {
      const toIn = el('input', { class: 'sg-input', id: 'sg-to', type: 'text', maxlength: String(LIMITS.name), placeholder: 'e.g. Ana', autocomplete: 'off' });
      const fromIn = el('input', { class: 'sg-input', id: 'sg-from', type: 'text', maxlength: String(LIMITS.name), placeholder: 'Your name', value: s.from, autocomplete: 'off' });
      const msgIn = el('textarea', { class: 'sg-text', id: 'sg-msg', maxlength: String(LIMITS.msg), placeholder: 'Write something kind for your friend…' });
      msgIn.value = s.msg;
      const count = el('div', { class: 'sg-count', text: `${s.msg.length}/${LIMITS.msg}` });
      toIn.addEventListener('input', () => { s.to = clamp(toIn.value, LIMITS.name); schedule(); });
      fromIn.addEventListener('input', () => { s.from = clamp(fromIn.value, LIMITS.name); schedule(); });
      msgIn.addEventListener('input', () => { s.msg = clampMsg(msgIn.value); count.textContent = `${msgIn.value.length}/${LIMITS.msg}`; schedule(); });

      const starters = el('div', { class: 'sg-row' }, STARTERS.map((t) => el('button', {
        class: 'sg-chip', type: 'button', text: t.length > 54 ? t.slice(0, 52) + '…' : t, title: t,
        onclick: () => { msgIn.value = t; s.msg = t; count.textContent = `${t.length}/${LIMITS.msg}`; msgIn.focus(); schedule(); }
      })));

      const qCheck = el('input', { type: 'checkbox', id: 'sg-wq', checked: true });
      qCheck.addEventListener('change', () => { s.withQuote = qCheck.checked; schedule(); });
      const qShow = el('div', { class: 'sg-sub', style: 'font-size:.88rem;font-style:italic', text: `“${s.quote}”` });
      const qNew = el('button', { class: 'sg-btn sg-btn--small', type: 'button', text: '🔄 Different quote', onclick: () => { s.quote = pick(quotePool()); qShow.textContent = `“${s.quote}”`; schedule(); } });

      controls.append(
        el('div', { class: 'sg-field' }, [el('label', { for: 'sg-to', text: 'To (your friend’s name)' }), toIn]),
        el('div', { class: 'sg-field' }, [el('label', { for: 'sg-msg', text: 'Your message' }), msgIn, count]),
        el('div', {}, [el('span', { class: 'sg-label', text: 'Need an idea? Tap one:' }), starters]),
        el('div', { class: 'sg-field' }, [el('label', { for: 'sg-from', text: 'From (your name)' }), fromIn]),
        el('div', {}, [el('label', { class: 'sg-check', for: 'sg-wq' }, [qCheck, 'Add a quote under my message']), qShow, el('div', { style: 'margin-top:8px' }, [qNew])])
      );
    } else {
      const nameIn = el('input', { class: 'sg-input', id: 'sg-name', type: 'text', maxlength: String(LIMITS.name), placeholder: 'Your name (optional)', value: s.name, autocomplete: 'off' });
      nameIn.addEventListener('input', () => { s.name = clamp(nameIn.value, LIMITS.name); schedule(); });
      controls.append(el('div', { class: 'sg-field' }, [el('label', { for: 'sg-name', text: 'Add your name (optional)' }), nameIn]));
    }

    controls.append(
      el('div', {}, [el('span', { class: 'sg-label', text: 'Colour' }), swatches]),
      el('div', {}, [el('span', { class: 'sg-label', text: 'Size' }), segs])
    );

    // action buttons
    const busy = (btn, fn) => async () => { btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } };
    const ensureBlob = async () => { clearTimeout(timer); await render(); return blob; };
    const shareText = () => (isMsg
      ? `${s.to ? 'For ' + s.to + ': ' : ''}${s.msg}${s.from ? ' — ' + s.from : ''}`
      : `“${s.text}” — Still Got This`);

    const shareBtn = el('button', { class: 'sg-btn sg-btn--primary', type: 'button', text: '📤 Share picture' });
    shareBtn.addEventListener('click', busy(shareBtn, async () => { const b = await ensureBlob(); if (b) await sharePicture(b, shareText(), isMsg ? buildLink(linkData()) : ''); }));
    const saveBtn = el('button', { class: 'sg-btn', type: 'button', text: '⬇️ Save picture' });
    saveBtn.addEventListener('click', busy(saveBtn, async () => { const b = await ensureBlob(); if (b) { download(b, 'still-got-this.png'); toast('Picture saved! 💛'); } }));
    const copyBtn = el('button', { class: 'sg-btn', type: 'button', text: '📋 Copy text', onclick: () => copyText(shareText(), 'Text copied! ✨') });
    const actions = el('div', { class: 'sg-actions' }, [shareBtn, saveBtn]);

    function linkData() { return { to: s.to, from: s.from, msg: s.msg, quote: s.withQuote ? s.quote : '', bgId: s.bgId }; }
    if (isMsg) {
      actions.append(el('button', {
        class: 'sg-btn', type: 'button', text: '🔗 Copy link for my friend',
        onclick: () => { if (!s.msg) { toast('Write your message first 💛'); return; } copyText(buildLink(linkData()), 'Link copied! Paste it in Messenger 💌'); }
      }));
    }
    actions.append(copyBtn);
    controls.append(actions);

    const hint = el('p', { class: 'sg-hint', text: 'On a phone, if Save doesn’t work, press and hold the picture, then choose Save image.' });

    const dialog = el('div', { 'aria-labelledby': 'sg-title' }, [
      el('h2', { id: 'sg-title', text: isMsg ? '💌 Message for a friend' : '🖼️ Share as a picture' }),
      el('p', { class: 'sg-sub', text: isMsg ? 'Write a few kind words. Send it as a picture or as a link they can open.' : 'Pick a colour and size, then share it or save it.' }),
      el('div', { class: 'sg-cols' }, [controls, el('div', { class: 'sg-previewbox' }, [img, hint])]),
      el('div', { class: 'sg-close' }, [el('button', { class: 'sg-link', type: 'button', text: 'Close', onclick: closeDialog })])
    ]);
    showDialog(dialog);
    render();
    setTimeout(() => { const f = dialog.querySelector(isMsg ? '#sg-to' : '.sg-btn--primary'); if (f && document.activeElement === document.body) f.focus(); }, 40);
  }

  /* What a friend sees when they open a message link */
  function showReceived(d) {
    const c = COLORS.find((x) => x.id === d.bgId) || COLORS[2];
    const dark = luminance(c.hex) < 0.4;
    const card = el('div', { class: 'sg-got', style: `background:${c.hex};${dark ? 'color:#fff' : ''}` }, [
      el('h3', { text: d.to ? `💌 For ${d.to}` : '💌 A little message for you' }),
      el('p', { class: 'sg-got__msg', text: d.msg }),
      d.from ? el('p', { class: 'sg-got__from', text: `— ${d.from}` }) : null,
      d.quote ? el('p', { class: 'sg-got__q', text: `“${d.quote}”` }) : null
    ]);
    const done = () => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } closeDialog(); };
    const dialog = el('div', { style: 'max-width:560px', 'aria-labelledby': 'sg-title' }, [
      el('h2', { id: 'sg-title', text: d.from ? `${d.from} sent you a message 💛` : 'Someone sent you a message 💛' }),
      el('p', { class: 'sg-sub', text: 'Made with Still Got This.' }),
      card,
      el('div', { class: 'sg-actions', style: 'margin-top:16px' }, [
        el('button', { class: 'sg-btn sg-btn--primary', type: 'button', text: '💌 Send one to a friend too', onclick: () => { done(); openStudio({ kind: 'message' }); } }),
        el('button', { class: 'sg-btn', type: 'button', text: 'Close', onclick: done })
      ])
    ]);
    showDialog(dialog);
  }

  /* ---------------------------------------------------------
     7) BUTTONS ON THE PAGE
     --------------------------------------------------------- */
  const textOf = (node) => (node ? node.textContent.trim() : '');

  function pictureBtn(cls, label, getInfo) {
    return el('button', {
      class: cls, type: 'button', title: 'Share as a picture', 'aria-label': 'Share this quote as a picture', text: label,
      onclick: () => { const i = getInfo(); if (i && i.text) openStudio({ kind: 'quote', text: i.text, tag: i.tag, bg: i.bg }); }
    });
  }

  function decorate() {
    // my sticky notes (main site)
    document.querySelectorAll('.note:not([data-sg])').forEach((n) => {
      n.setAttribute('data-sg', '');
      const box = n.querySelector('.note__actions'); if (!box) return;
      box.prepend(pictureBtn('icon-btn', '🖼️', () => ({ text: textOf(n.querySelector('.note__text')), tag: textOf(n.querySelector('.note__cat')), bg: cssBgToHex(n) })));
    });
    // course.js cards
    document.querySelectorAll('.cs-note-card:not([data-sg])').forEach((n) => {
      n.setAttribute('data-sg', '');
      const foot = n.querySelector('.cs-note-foot'); if (!foot) return;
      const copy = foot.querySelector('.cs-copy');
      const b = pictureBtn('sg-mini', '🖼️', () => ({ text: textOf(n.querySelector('p')), tag: textOf(n.querySelector('.cs-tag')), bg: cssBgToHex(n) }));
      if (copy) foot.insertBefore(b, copy); else foot.append(b);
    });
    // course.js big quote
    document.querySelectorAll('.cs-hero:not([data-sg])').forEach((h) => {
      n_(h);
      const box = h.querySelector('.cs-hero__actions'); if (!box) return;
      box.append(pictureBtn('cs-btn cs-btn--small', '🖼️ Picture', () => ({ text: textOf(h.querySelector('.cs-hero__quote')), tag: textOf(h.querySelector('.cs-tag')), bg: cssBgToHex(h) })));
    });
    // main site "quote of the day" card
    const daily = document.getElementById('dailyCard');
    if (daily && !daily.hasAttribute('data-sg')) {
      n_(daily);
      const anchor = document.getElementById('dailyCopy');
      if (anchor && anchor.parentNode) {
        anchor.after(pictureBtn('btn btn--small', '🖼️ Picture', () => ({ text: textOf(document.getElementById('dailyQuote')), tag: textOf(document.getElementById('dailyCat')), bg: null })));
      }
    }
  }
  function n_(node) { node.setAttribute('data-sg', ''); }

  function addFab() {
    if (document.getElementById('sg-fab')) return;
    injectStyles();
    document.body.append(el('button', { id: 'sg-fab', class: 'sg-fab', type: 'button', text: '💌 Message a friend', onclick: () => openStudio({ kind: 'message' }) }));
  }

  /* ---------------------------------------------------------
     8) API + START
     --------------------------------------------------------- */
  window.StillGotThis = Object.assign(window.StillGotThis || {}, {
    shareQuote: (text, opts = {}) => openStudio({ kind: 'quote', text: String(text || ''), tag: opts.tag, bg: opts.bg }),
    messageFriend: () => openStudio({ kind: 'message' })
  });

  function checkLink() {
    const d = readLink();
    if (d) showReceived(d);
  }

  function start() {
    injectStyles();
    addFab();
    decorate();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; decorate(); });
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', checkLink);
    checkLink();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
