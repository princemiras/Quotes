/* =========================================================
   chat.js  —  real chat between friends who both use the site

   How it works (simple version)
   - Everyone who opens the chat gets a short FRIEND CODE (like K7P4QX).
   - You add a friend by typing their code (or opening their invite link).
   - When you send a message it goes into your friend's online "mailbox".
     Their phone checks the mailbox every few seconds, copies the message
     to THEIR device, and removes it from the mailbox. So the server only
     holds a message until it is delivered.
   - Only people who know your code can message you, and you can block
     anyone. No public list of users exists.

   It needs a free Firebase project (see the guide) and the two values
   in chat-config.js. Without them this file does nothing and the site
   works as before.

   Add to index.html, just before </body>, in this order:
        <script src="chat-config.js"></script>
        <script src="course.js"></script>
        <script src="share.js"></script>
        <script src="chat.js"></script>
        <script src="reminder.js"></script>
   ========================================================= */
(() => {
  'use strict';

  const CFG = window.STG_CHAT || {};
  const API_KEY = String(CFG.apiKey || '').trim();
  const DB = String(CFG.databaseURL || '').trim().replace(/\/+$/, '');
  const CONFIGURED = !!(API_KEY && /^https?:\/\//.test(DB));
  const AUTH_BASE = String(CFG.authBase || 'https://identitytoolkit.googleapis.com').replace(/\/+$/, '');
  const TOKEN_BASE = String(CFG.tokenBase || 'https://securetoken.googleapis.com').replace(/\/+$/, '');

  const LIM = { name: 30, text: 300, thread: 300 };
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1, so codes are easy to read out loud
  const CODE_LEN = 6;
  const CODE_RE = /^[A-Z0-9]{4,8}$/;

  /* ---------------------------------------------------------
     1) SMALL HELPERS
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
  const clampText = (s) => String(s == null ? '' : s).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, LIM.text);
  const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const ls = {
    get(k, d) { try { const r = localStorage.getItem('stg:chat-' + k); return r == null ? d : JSON.parse(r); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('stg:chat-' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  };

  let toastTimer;
  function toast(msg, ms = 2600) {
    let t = document.getElementById('ch-toast');
    if (!t) { t = el('div', { id: 'ch-toast', class: 'ch-toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg || 'Copied! ✨'); return; } catch (e) { /* fallback below */ }
    try {
      const ta = el('textarea', { readonly: true, 'aria-hidden': 'true' });
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px;';
      document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
      toast(ok ? (okMsg || 'Copied! ✨') : "Couldn't copy. Select it and copy by hand.");
    } catch (e) { toast("Couldn't copy. Select it and copy by hand."); }
  }

  function randomCode() {
    const bytes = new Uint8Array(CODE_LEN);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  }

  function fmtTime(ts) {
    const d = new Date(ts); if (isNaN(d)) return '';
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toDateString() === new Date().toDateString() ? t : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${t}`;
  }

  function profileName() {
    try { const api = window.StillGotThis; const p = api && api.getProfile && api.getProfile(); if (p && p.name) return clamp(p.name, LIM.name); } catch (e) { /* ignore */ }
    return '';
  }

  /* ---------------------------------------------------------
     2) SAVED STATE (on this device only)
     --------------------------------------------------------- */
  let auth = null;      // { uid, refreshToken }
  let me = null;        // { name, code, synced }
  let friends = [];     // [{ code, uid, name, pending? }]
  let threads = {};     // code -> [{ id, mine, text, ts }]
  let unread = {};      // code -> number
  let blocked = [];     // [uid]
  let idToken = null;
  let tokenExp = 0;

  function loadState() {
    auth = ls.get('auth', null); me = ls.get('me', null); friends = ls.get('friends', []);
    threads = ls.get('threads', {}); unread = ls.get('unread', {}); blocked = ls.get('blocked', []);
  }
  function saveState() {
    ls.set('auth', auth); ls.set('me', me); ls.set('friends', friends);
    ls.set('threads', threads); ls.set('unread', unread); ls.set('blocked', blocked);
  }
  const ready = () => !!(auth && auth.uid && me && me.name && me.code);
  const totalUnread = () => Object.values(unread).reduce((a, b) => a + (Number(b) || 0), 0);

  /* ---------------------------------------------------------
     3) TALKING TO FIREBASE (plain fetch, no library)
     --------------------------------------------------------- */
  function fail(kind, detail) { const e = new Error(kind + (detail ? ': ' + detail : '')); e.kind = kind; return e; }

  async function http(url, opts) {
    let res;
    try { res = await fetch(url, opts); } catch (e) { throw fail('network'); }
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    return { ok: res.ok, status: res.status, data };
  }

  async function signUp() {
    const r = await http(`${AUTH_BASE}/v1/accounts:signUp?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true })
    });
    if (!r.ok || !r.data || !r.data.idToken) {
      const msg = (r.data && r.data.error && r.data.error.message) || '';
      if (/OPERATION_NOT_ALLOWED|ADMIN_ONLY_OPERATION/.test(msg)) throw fail('auth-disabled');
      if (/API_KEY|API key/i.test(msg)) throw fail('bad-key');
      throw fail('other', msg || r.status);
    }
    return r.data;
  }

  async function token() {
    if (idToken && Date.now() < tokenExp - 60000) return idToken;
    if (auth && auth.refreshToken) {
      const r = await http(`${TOKEN_BASE}/v1/token?key=${encodeURIComponent(API_KEY)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(auth.refreshToken)
      });
      if (r.ok && r.data && r.data.id_token) {
        idToken = r.data.id_token; tokenExp = Date.now() + (Number(r.data.expires_in) || 3600) * 1000;
        auth = { uid: r.data.user_id || auth.uid, refreshToken: r.data.refresh_token || auth.refreshToken };
        ls.set('auth', auth);
        return idToken;
      }
    }
    // First time (or the old sign-in is gone): create a new anonymous identity
    const d = await signUp();
    const changed = auth && auth.uid && auth.uid !== d.localId;
    idToken = d.idToken; tokenExp = Date.now() + (Number(d.expiresIn) || 3600) * 1000;
    auth = { uid: d.localId, refreshToken: d.refreshToken };
    if (changed && me) me.code = null; // our old friend code belonged to the old identity, claim a new one
    saveState();
    return idToken;
  }

  async function rtdb(method, path, body) {
    const t = await token();
    const hasBody = body !== undefined;
    return http(`${DB}/${path}.json?auth=${encodeURIComponent(t)}`, {
      method, headers: hasBody ? { 'Content-Type': 'application/json' } : undefined, body: hasBody ? JSON.stringify(body) : undefined
    });
  }

  // Get a friend code for this device (tries a few random ones until a free one is found)
  async function claimCode() {
    let denied = 0;
    for (let i = 0; i < 10; i += 1) {
      const code = randomCode();
      const r = await rtdb('PUT', `codes/${code}`, { uid: auth.uid, name: me.name });
      if (r.ok) { me.code = code; me.synced = me.name; saveState(); return; }
      if (r.status === 401 || r.status === 403) denied += 1; else throw fail('other', r.status);
    }
    throw fail(denied >= 10 ? 'rules' : 'other');
  }

  // Make sure we have a sign-in, a friend code, and our current name published
  async function ensureReady() {
    if (!me || !me.name) throw fail('needs-name');
    await token();
    if (!me.code) await claimCode();
    else if (me.synced !== me.name) {
      const r = await rtdb('PUT', `codes/${me.code}`, { uid: auth.uid, name: me.name });
      if (r.ok) { me.synced = me.name; saveState(); }
    }
  }

  async function lookupCode(code) {
    const r = await rtdb('GET', `codes/${code}`);
    if (!r.ok) throw fail(r.status === 401 || r.status === 403 ? 'rules' : 'other', r.status);
    const d = r.data;
    return d && typeof d === 'object' && typeof d.uid === 'string' ? { uid: d.uid, name: clamp(d.name, LIM.name) } : null;
  }

  function friendMessage(e) {
    switch (e && e.kind) {
      case 'network': return "Can't reach the chat server. Check your internet and try again.";
      case 'auth-disabled': return 'Chat is not switched on yet. In Firebase, turn on Authentication → Sign-in method → Anonymous.';
      case 'rules': return 'Chat is not set up yet. In Firebase, publish the Realtime Database rules from the guide.';
      case 'bad-key': return 'The Firebase API key in chat-config.js is not valid.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  /* ---------------------------------------------------------
     4) FRIENDS AND MESSAGES
     --------------------------------------------------------- */
  const friendByCode = (c) => friends.find((f) => f.code === c);

  async function addFriendByCode(raw) {
    const code = normCode(raw);
    if (!CODE_RE.test(code)) throw fail('bad-code');
    if (me && code === me.code) throw fail('own-code');
    const have = friendByCode(code);
    if (have) { have.pending = false; saveState(); return have; }
    const rec = await lookupCode(code);
    if (!rec) throw fail('not-found');
    if (rec.uid === (auth && auth.uid)) throw fail('own-code');
    blocked = blocked.filter((u) => u !== rec.uid); // adding on purpose un-blocks
    let f = friends.find((x) => x.uid === rec.uid);
    if (f) { f.code = code; f.pending = false; f.name = rec.name || f.name; }
    else { f = { code, uid: rec.uid, name: rec.name || code }; friends.push(f); }
    saveState();
    return f;
  }

  let lastSend = 0;
  async function sendMessage(friend, rawText) {
    const text = clampText(rawText);
    if (!text) throw fail('empty');
    if (Date.now() - lastSend < 1200) throw fail('slow-down');
    await ensureReady();
    const r = await rtdb('POST', `inbox/${friend.uid}`, {
      fromUid: auth.uid, fromCode: me.code, fromName: me.name, text, ts: { '.sv': 'timestamp' }
    });
    if (!r.ok) throw fail(r.status === 401 || r.status === 403 ? 'rules' : 'other', r.status);
    lastSend = Date.now();
    const id = (r.data && r.data.name) || 'm' + Date.now();
    const th = threads[friend.code] || (threads[friend.code] = []);
    th.push({ id, mine: true, text, ts: Date.now() });
    if (th.length > LIM.thread) th.splice(0, th.length - LIM.thread);
    saveState();
  }

  let polling = false;
  async function poll() {
    loadState();
    if (polling || !ready()) return;
    polling = true;
    const fresh = [];
    try {
      const r = await rtdb('GET', `inbox/${auth.uid}`);
      if (!r.ok || !r.data || typeof r.data !== 'object') return;
      const entries = Object.entries(r.data).sort((a, b) => ((a[1] && a[1].ts) || 0) - ((b[1] && b[1].ts) || 0));
      for (const [id, m] of entries) {
        const good = m && typeof m.text === 'string' && m.text.length && m.text.length <= LIM.text
          && typeof m.fromUid === 'string' && CODE_RE.test(String(m.fromCode || ''));
        if (good && !blocked.includes(m.fromUid)) {
          let f = friends.find((x) => x.uid === m.fromUid);
          if (!f) { f = { code: String(m.fromCode), uid: m.fromUid, name: clamp(m.fromName, LIM.name) || String(m.fromCode), pending: true }; friends.push(f); }
          else if (m.fromName) f.name = clamp(m.fromName, LIM.name) || f.name;
          const th = threads[f.code] || (threads[f.code] = []);
          if (!th.some((x) => x.id === id)) {
            th.push({ id, mine: false, text: m.text, ts: Number(m.ts) || Date.now() });
            if (th.length > LIM.thread) th.splice(0, th.length - LIM.thread);
            if (!(chatOpen && current === f.code)) unread[f.code] = (unread[f.code] || 0) + 1;
            fresh.push(f);
          }
        }
        saveState(); // keep our copy first,
        try { await rtdb('DELETE', `inbox/${auth.uid}/${id}`); } catch (e) { /* will retry next time */ } // then clear it from the mailbox
      }
    } catch (e) { /* offline or not set up: try again later */ } finally { polling = false; }
    if (fresh.length) {
      const names = [...new Set(fresh.map((f) => f.name))];
      if (!chatOpen) toast(`💌 New message from ${names.slice(0, 2).join(' & ')}`, 3500);
      updateBadge();
      if (chatOpen) draw();
    }
  }

  let pollTimer = null;
  function schedulePoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => { if (!document.hidden) await poll(); schedulePoll(); }, chatOpen ? 4000 : 20000);
  }

  /* ---------------------------------------------------------
     5) STYLES
     --------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('ch-styles')) return;
    const css = `
    .ch-backdrop{position:fixed;inset:0;z-index:2147482600;display:flex;align-items:center;justify-content:center;padding:10px;background:rgba(12,10,28,.72);animation:ch-fade .2s ease}
    .ch-dialog{box-sizing:border-box;display:flex;flex-direction:column;width:100%;max-width:900px;height:min(720px,94vh);height:min(720px,94dvh);overflow:hidden;border-radius:24px;background:var(--card,#fffdf7);color:var(--ink,#2d2a3a);font-family:var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:1rem;line-height:1.5;box-shadow:0 26px 70px rgba(0,0,0,.5);animation:ch-pop .25s ease}
    .ch-dialog *{box-sizing:border-box}
    .ch-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:2px solid var(--line,#e6dcc3)}
    .ch-top h2{margin:0;font-family:var(--font-head,inherit);font-weight:600;font-size:1.3rem}
    .ch-x{width:38px;height:38px;border-radius:50%;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font-size:1rem;cursor:pointer}
    .ch-x:hover{border-color:#ff7a59}
    .ch-body{flex:1;min-height:0;display:grid;grid-template-columns:300px minmax(0,1fr)}
    .ch-side{min-height:0;overflow-y:auto;padding:14px;border-right:2px solid var(--line,#e6dcc3);display:flex;flex-direction:column;gap:14px}
    .ch-thread{min-height:0;display:flex;flex-direction:column}
    @media (max-width:720px){
      .ch-body{grid-template-columns:1fr}
      .ch-body.is-list .ch-thread{display:none}
      .ch-body.is-thread .ch-side{display:none}
      .ch-side{border-right:0}
      .ch-backdrop{padding:0}
      .ch-dialog{height:100vh;height:100dvh;border-radius:0;max-width:none}
    }
    .ch-box{padding:12px;border-radius:16px;background:var(--paper,#fff);border:2px solid var(--line,#e6dcc3)}
    .ch-label{display:block;margin:0 0 6px;font-weight:800;font-size:.9rem}
    .ch-code{display:block;margin:2px 0 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:800;font-size:1.7rem;letter-spacing:.14em}
    .ch-row{display:flex;flex-wrap:wrap;gap:8px}
    .ch-btn{padding:9px 14px;border-radius:999px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;font-weight:800;font-size:.88rem;cursor:pointer;line-height:1.2;transition:transform .15s,border-color .15s}
    .ch-btn:hover{border-color:#ff7a59;transform:translateY(-1px)}
    .ch-btn--primary{border-color:transparent;background:linear-gradient(135deg,#ff7a59,#ffb347);color:#2d2a3a}
    .ch-btn--danger:hover{border-color:#d6334a;color:#d6334a}
    .ch-btn[disabled]{opacity:.55;cursor:wait;transform:none}
    .ch-input,.ch-text{width:100%;padding:10px 12px;border-radius:12px;border:2px solid var(--line,#e6dcc3);background:var(--paper,#fff);color:inherit;font:inherit}
    .ch-input:focus,.ch-text:focus{outline:none;border-color:#146f6f}
    .ch-add{display:flex;gap:8px}
    .ch-add .ch-input{text-transform:uppercase;letter-spacing:.08em;font-weight:700}
    .ch-err{margin:6px 0 0;font-size:.86rem;font-weight:700;color:#b3261e}
    .ch-ok{margin:6px 0 0;font-size:.86rem;font-weight:700;color:#146f6f}
    .ch-list{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
    .ch-friend{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:2px solid var(--line,#e6dcc3);background:var(--card,#fffdf7);color:inherit;font:inherit;text-align:left;cursor:pointer}
    .ch-friend:hover{border-color:#ff7a59}
    .ch-friend[aria-current="true"]{background:#2d2a3a;color:#fff;border-color:#2d2a3a}
    .ch-av{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#2d2a3a}
    .ch-fname{flex:1;min-width:0;display:flex;flex-direction:column}
    .ch-fname b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ch-fname small{opacity:.7;font-size:.76rem}
    .ch-badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#d6334a;color:#fff;font-size:.78rem;font-weight:800;margin-left:4px}
    .ch-empty{margin:0;color:var(--ink-soft,#595470);font-size:.9rem}
    .ch-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:2px solid var(--line,#e6dcc3)}
    .ch-head h3{margin:0;flex:1;min-width:0;font-size:1.05rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ch-back{display:none}
    @media (max-width:720px){.ch-back{display:inline-block}}
    .ch-msgs{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:linear-gradient(var(--paper,#fff),var(--paper,#fff))}
    .ch-msg{max-width:82%;padding:9px 13px;border-radius:18px;overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.4}
    .ch-msg time{display:block;margin-top:3px;font-size:.7rem;opacity:.65}
    .ch-msg--them{align-self:flex-start;background:#ffe38f;color:#2d2a3a;border-bottom-left-radius:6px}
    .ch-msg--mine{align-self:flex-end;background:#2d2a3a;color:#fff;border-bottom-right-radius:6px}
    .ch-compose{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:2px solid var(--line,#e6dcc3)}
    .ch-compose .ch-text{min-height:46px;max-height:120px;resize:none}
    .ch-pending{margin:10px 14px 0;padding:10px 12px;border-radius:14px;background:#fff0c7;color:#5a4300;font-weight:700;font-size:.9rem}
    .ch-center{flex:1;display:grid;place-items:center;padding:24px;text-align:center;color:var(--ink-soft,#595470)}
    .ch-setup{max-width:460px;margin:auto;padding:26px 22px;display:flex;flex-direction:column;gap:12px}
    .ch-setup h3{margin:0;font-family:var(--font-head,inherit);font-weight:600;font-size:1.5rem}
    .ch-setup p{margin:0}
    .ch-sub{color:var(--ink-soft,#595470)}
    .ch-note{font-size:.82rem;color:var(--ink-soft,#595470)}
    .ch-link{background:none;border:0;padding:4px;color:var(--ink-soft,#595470);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
    .ch-dialog :focus-visible{outline:3px solid #146f6f;outline-offset:2px;border-radius:10px}
    .ch-fab{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147481000;padding:12px 18px;border-radius:999px;border:0;background:#2d2a3a;color:#fff;font:inherit;font-weight:800;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);cursor:pointer}
    .ch-toast{position:fixed;left:50%;bottom:24px;z-index:2147483600;transform:translate(-50%,24px);opacity:0;pointer-events:none;width:max-content;max-width:min(92vw,420px);padding:12px 22px;border-radius:16px;background:#2d2a3a;color:#fff;font-family:var(--font-body,system-ui,sans-serif);font-weight:800;line-height:1.4;text-align:center;box-shadow:0 12px 28px rgba(0,0,0,.4);transition:opacity .25s,transform .25s}
    .ch-toast.show{opacity:1;transform:translate(-50%,0)}
    @keyframes ch-fade{from{opacity:0}to{opacity:1}}
    @keyframes ch-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.ch-backdrop,.ch-dialog{animation:none}.ch-btn,.ch-toast{transition:none}}
    `;
    document.head.append(el('style', { id: 'ch-styles', text: css }));
  }

  /* ---------------------------------------------------------
     6) THE CHAT WINDOW
     --------------------------------------------------------- */
  const AV_COLORS = ['#ffe38f', '#bff0dd', '#ffcdd0', '#c6e2ff', '#ddd2ff', '#ffc8ab', '#b9ecf2'];
  const avColor = (s) => AV_COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];

  let chatOpen = false;
  let current = null;       // friend code of the open conversation
  let view = 'list';        // phone layout: 'list' or 'thread'
  let setupBusy = false;
  let setupError = '';
  let addError = '';
  let addInfo = '';
  let invite = null;        // { code, rec, error } when someone opened an invite link
  let rootEl = null;
  let lastFocus = null;
  let draft = '';

  function closeChat() {
    chatOpen = false;
    if (rootEl) rootEl.remove();
    rootEl = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
    updateBadge();
    schedulePoll();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closeChat(); } }

  function openChat() {
    if (!CONFIGURED) return;
    if (chatOpen) return;
    injectStyles();
    loadState();
    lastFocus = document.activeElement;
    chatOpen = true; setupError = ''; addError = ''; addInfo = '';
    if (!current || !friendByCode(current)) current = null;
    view = current ? 'thread' : 'list';
    rootEl = el('div', { class: 'ch-backdrop' });
    rootEl.addEventListener('mousedown', (e) => { if (e.target === rootEl) closeChat(); });
    document.body.append(rootEl);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);
    draw();
    schedulePoll();
    if (ready()) { ensureReady().catch(() => {}).then(() => poll()); runInvite(); }
  }

  function setCurrent(code) {
    current = code; view = 'thread'; unread[code] = 0; saveState(); updateBadge(); draw();
    const ta = document.getElementById('ch-input'); if (ta) ta.focus();
    const box = document.getElementById('ch-msgs'); if (box) box.scrollTop = box.scrollHeight;
  }

  async function runInvite() {
    if (!invite || !ready()) return;
    try {
      const code = invite.code;
      if (me && code === me.code) invite = { code, own: true };
      else if (friendByCode(code)) invite = null;
      else { const rec = await lookupCode(code); invite = rec ? { code, rec } : { code, error: 'We couldn’t find that friend code.' }; }
    } catch (e) { invite = { code: invite.code, error: friendMessage(e) }; }
    if (chatOpen) draw();
  }

  function draw() {
    if (!rootEl) return;
    const had = document.activeElement && document.activeElement.id === 'ch-input';
    const prev = document.getElementById('ch-input');
    if (prev) draft = prev.value;
    const msgsBefore = document.getElementById('ch-msgs');
    const stick = !msgsBefore || msgsBefore.scrollHeight - msgsBefore.scrollTop - msgsBefore.clientHeight < 80;

    const dialog = el('div', { class: 'ch-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ch-title' });
    dialog.append(el('div', { class: 'ch-top' }, [
      el('h2', { id: 'ch-title', text: '💬 Chat with friends' }),
      el('button', { class: 'ch-x', type: 'button', 'aria-label': 'Close chat', text: '✕', onclick: closeChat })
    ]));

    if (!ready()) dialog.append(setupScreen());
    else dialog.append(mainScreen());
    rootEl.replaceChildren(dialog);

    const box = document.getElementById('ch-msgs');
    if (box && stick) box.scrollTop = box.scrollHeight;
    if (had) { const ta = document.getElementById('ch-input'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
  }

  function errText(e) {
    switch (e && e.kind) {
      case 'bad-code': return 'A friend code has 6 letters or numbers.';
      case 'own-code': return 'That’s your own code 😄';
      case 'not-found': return 'No one has that code. Check it with your friend.';
      case 'slow-down': return 'Slow down a little 💛';
      case 'empty': return 'Type a message first.';
      default: return friendMessage(e);
    }
  }

  function setupScreen() {
    const nameIn = el('input', { class: 'ch-input', id: 'ch-name', type: 'text', maxlength: String(LIM.name), autocomplete: 'given-name', placeholder: 'Your name or nickname', value: (me && me.name) || profileName() });
    const err = el('p', { class: 'ch-err', role: 'alert', text: setupError, hidden: !setupError });
    const start = el('button', { class: 'ch-btn ch-btn--primary', type: 'button', text: setupBusy ? 'Setting up…' : 'Start chatting', disabled: setupBusy });
    const go = async () => {
      const name = clamp(nameIn.value, LIM.name);
      if (!name) { nameIn.focus(); setupError = 'Type your name first.'; draw(); return; }
      setupBusy = true; setupError = '';
      me = Object.assign({}, me || {}, { name }); saveState(); draw();
      try { await ensureReady(); setupBusy = false; await runInvite(); draw(); poll(); schedulePoll(); }
      catch (e) { setupBusy = false; setupError = friendMessage(e); draw(); }
    };
    start.addEventListener('click', go);
    nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    setTimeout(() => { if (document.activeElement === document.body) nameIn.focus(); }, 40);
    return el('div', { class: 'ch-setup' }, [
      el('h3', { text: 'Chat with your friends 💛' }),
      el('p', { class: 'ch-sub', text: 'Both of you use this website? Send each other messages here. You get a short friend code. Share it with a friend, or type theirs.' }),
      el('div', {}, [el('label', { class: 'ch-label', for: 'ch-name', text: 'What should your friends call you?' }), nameIn]),
      err,
      el('div', { class: 'ch-row' }, [start]),
      el('p', { class: 'ch-note', text: '🔒 Only people who have your code can message you, and you can block anyone. Messages are removed from the server as soon as they are delivered.' }),
      el('button', { class: 'ch-link', type: 'button', text: '🖼️ Just make a picture or link instead', onclick: () => { closeChat(); const api = window.StillGotThis || {}; if (api.messageFriend) api.messageFriend(); } })
    ]);
  }

  function mainScreen() {
    const body = el('div', { class: 'ch-body ' + (view === 'thread' ? 'is-thread' : 'is-list') });
    body.append(sidePane(), threadPane());
    return body;
  }

  function sidePane() {
    const link = location.href.split('#')[0] + '#f=' + me.code;
    const addIn = el('input', { class: 'ch-input', id: 'ch-addcode', type: 'text', maxlength: '12', autocomplete: 'off', autocapitalize: 'characters', placeholder: 'Friend’s code', 'aria-label': 'Friend’s code' });
    const addBtn = el('button', { class: 'ch-btn ch-btn--primary', type: 'button', text: 'Add' });
    const doAdd = async () => {
      addError = ''; addInfo = ''; addBtn.disabled = true;
      try { const f = await addFriendByCode(addIn.value); addInfo = `${f.name} added 💛`; addIn.value = ''; setCurrent(f.code); return; }
      catch (e) { addError = errText(e); }
      addBtn.disabled = false; draw();
      const again = document.getElementById('ch-addcode'); if (again) again.focus();
    };
    addBtn.addEventListener('click', doAdd);
    addIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

    const mine = el('div', { class: 'ch-box' }, [
      el('span', { class: 'ch-label', text: 'Your friend code' }),
      el('strong', { class: 'ch-code', text: me.code }),
      el('div', { class: 'ch-row' }, [
        el('button', { class: 'ch-btn', type: 'button', text: '📋 Copy code', onclick: () => copyText(me.code, 'Code copied! Send it to your friend 💌') }),
        el('button', { class: 'ch-btn', type: 'button', text: '🔗 Invite link', onclick: () => copyText(link, 'Invite link copied! Paste it in Messenger 💌') })
      ])
    ]);

    const addBox = el('div', { class: 'ch-box' }, [
      el('label', { class: 'ch-label', for: 'ch-addcode', text: 'Add a friend' }),
      el('div', { class: 'ch-add' }, [addIn, addBtn]),
      addError ? el('p', { class: 'ch-err', role: 'alert', text: addError }) : null,
      addInfo ? el('p', { class: 'ch-ok', text: addInfo }) : null
    ]);

    const parts = [mine];
    if (invite && invite.own) parts.unshift(el('div', { class: 'ch-pending', text: 'That invite link is yours. Send it to a friend 😄' }));
    else if (invite && invite.error) parts.unshift(el('div', { class: 'ch-pending', text: invite.error }));
    else if (invite && invite.rec) {
      parts.unshift(el('div', { class: 'ch-pending' }, [
        el('p', { text: `Add ${invite.rec.name || invite.code} as a friend?` }),
        el('div', { class: 'ch-row', style: 'margin-top:8px' }, [
          el('button', { class: 'ch-btn ch-btn--primary', type: 'button', text: 'Add friend', onclick: async () => {
            try { const f = await addFriendByCode(invite.code); invite = null; setCurrent(f.code); } catch (e) { addError = errText(e); invite = null; draw(); }
          } }),
          el('button', { class: 'ch-btn', type: 'button', text: 'No thanks', onclick: () => { invite = null; draw(); } })
        ])
      ]));
    }
    parts.push(addBox);

    const list = el('ul', { class: 'ch-list', 'aria-label': 'Your friends' });
    const sorted = friends.slice().sort((a, b) => {
      const ta = (threads[a.code] || []).slice(-1)[0], tb = (threads[b.code] || []).slice(-1)[0];
      return ((tb && tb.ts) || 0) - ((ta && ta.ts) || 0);
    });
    sorted.forEach((f) => {
      const n = unread[f.code] || 0;
      list.append(el('li', {}, [el('button', {
        class: 'ch-friend', type: 'button', 'aria-current': String(current === f.code), onclick: () => setCurrent(f.code)
      }, [
        el('span', { class: 'ch-av', style: `background:${avColor(f.code)}`, text: (f.name || '?').trim().charAt(0).toUpperCase() }),
        el('span', { class: 'ch-fname' }, [el('b', { text: f.name || f.code }), el('small', { text: f.pending ? 'New · ' + f.code : f.code })]),
        n ? el('span', { class: 'ch-badge', text: String(n > 99 ? '99+' : n) }) : null
      ])]));
    });
    parts.push(el('div', {}, [
      el('span', { class: 'ch-label', text: friends.length ? 'Your friends' : 'No friends yet' }),
      friends.length ? list : el('p', { class: 'ch-empty', text: 'Send your code to a friend, or type theirs above.' })
    ]));
    parts.push(el('button', { class: 'ch-link', type: 'button', text: '🖼️ Make a picture or link instead', onclick: () => { closeChat(); const api = window.StillGotThis || {}; if (api.messageFriend) api.messageFriend(); } }));
    return el('div', { class: 'ch-side' }, parts);
  }

  function threadPane() {
    const f = current && friendByCode(current);
    if (!f) return el('div', { class: 'ch-thread' }, [el('div', { class: 'ch-center', text: 'Pick a friend on the left to start chatting 💬' })]);

    const head = el('div', { class: 'ch-head' }, [
      el('button', { class: 'ch-btn ch-back', type: 'button', 'aria-label': 'Back to friends', text: '←', onclick: () => { view = 'list'; draw(); } }),
      el('h3', { text: `${f.name || f.code}` }),
      el('button', { class: 'ch-btn ch-btn--danger', type: 'button', text: 'Block', onclick: () => {
        if (!confirm(`Block ${f.name || f.code}? They won't be able to message you anymore.`)) return;
        blocked.push(f.uid); friends = friends.filter((x) => x.uid !== f.uid); delete threads[f.code]; delete unread[f.code];
        current = null; view = 'list'; saveState(); updateBadge(); draw(); toast('Blocked 🚫');
      } }),
      el('button', { class: 'ch-btn', type: 'button', text: 'Clear chat', onclick: () => {
        if (!confirm('Clear this chat from this device?')) return;
        threads[f.code] = []; saveState(); draw();
      } })
    ]);

    const msgs = el('div', { class: 'ch-msgs', id: 'ch-msgs', role: 'log', 'aria-live': 'polite', 'aria-label': 'Messages' });
    const th = threads[f.code] || [];
    if (!th.length) msgs.append(el('p', { class: 'ch-empty', style: 'margin:auto;text-align:center', text: `Say hi to ${f.name || 'your friend'}! 👋` }));
    th.forEach((m) => msgs.append(el('div', { class: 'ch-msg ' + (m.mine ? 'ch-msg--mine' : 'ch-msg--them') }, [m.text, el('time', { text: fmtTime(m.ts) })])));

    const ta = el('textarea', { class: 'ch-text', id: 'ch-input', rows: '1', maxlength: String(LIM.text), placeholder: 'Write a message…', 'aria-label': 'Message' });
    ta.value = draft;
    const send = el('button', { class: 'ch-btn ch-btn--primary', type: 'submit', text: 'Send' });
    const form = el('form', { class: 'ch-compose', autocomplete: 'off' }, [ta, send]);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = ta.value; send.disabled = true;
      try { await sendMessage(f, text); draft = ''; ta.value = ''; draw(); const t2 = document.getElementById('ch-input'); if (t2) t2.focus(); }
      catch (err) { toast(errText(err)); send.disabled = false; }
    });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (form.requestSubmit) form.requestSubmit(); else send.click(); } });
    ta.addEventListener('input', () => { draft = ta.value; });

    const parts = [head];
    if (f.pending) {
      parts.push(el('div', { class: 'ch-pending' }, [
        el('p', { text: `${f.name || f.code} (${f.code}) sent you a message. Do you know them?` }),
        el('div', { class: 'ch-row', style: 'margin-top:8px' }, [
          el('button', { class: 'ch-btn ch-btn--primary', type: 'button', text: 'Yes, accept', onclick: () => { f.pending = false; saveState(); draw(); } }),
          el('button', { class: 'ch-btn ch-btn--danger', type: 'button', text: 'Block', onclick: () => {
            blocked.push(f.uid); friends = friends.filter((x) => x.uid !== f.uid); delete threads[f.code]; delete unread[f.code];
            current = null; view = 'list'; saveState(); updateBadge(); draw(); toast('Blocked 🚫');
          } })
        ])
      ]));
    }
    parts.push(msgs, form);
    return el('div', { class: 'ch-thread' }, parts);
  }

  /* ---------------------------------------------------------
     7) BADGE ON THE "MESSAGE A FRIEND" BUTTON + START
     --------------------------------------------------------- */
  function fabEl() { return document.getElementById('sg-fab') || document.getElementById('ch-fab'); }
  function updateBadge() {
    const f = fabEl(); if (!f) return;
    f.querySelectorAll('.ch-badge').forEach((x) => x.remove());
    const n = totalUnread();
    if (n > 0) f.append(' ', el('span', { class: 'ch-badge', text: String(n > 99 ? '99+' : n) }));
  }

  function checkInviteHash() {
    const m = /^#f=([A-Za-z0-9]{4,8})$/.exec(location.hash || '');
    if (!m) return;
    invite = { code: normCode(m[1]) };
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    openChat();
  }

  window.StillGotThis = Object.assign(window.StillGotThis || {}, {
    chatReady: () => CONFIGURED,
    openChat: () => openChat(),
    chatUnread: () => totalUnread()
  });

  function start() {
    if (!CONFIGURED) return;
    injectStyles();
    loadState();
    if (!document.getElementById('sg-fab')) {
      document.body.append(el('button', { id: 'ch-fab', class: 'ch-fab', type: 'button', text: '💬 Chat with friends', onclick: () => openChat() }));
    }
    updateBadge();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
    window.addEventListener('online', () => poll());
    window.addEventListener('hashchange', checkInviteHash);
    if (ready()) { setTimeout(() => poll(), 1200); schedulePoll(); }
    checkInviteHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
