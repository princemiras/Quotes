/* Still Got This: service worker
   1) lets the site be installed + work offline
   2) shows the "Quote of the day" notification (periodic background sync) */
const CACHE = 'stg-shell-v1';
const SHELL = ['./', 'index.html', 'style.css', 'script.js', 'manifest.webmanifest', 'icon-192.png'];
const abs = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('stg-shell-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function showDaily() {
  const c = await caches.open('stg-daily');
  const r = await c.match(abs('daily.json'));
  if (!r) return;
  const data = await r.json();
  const key = todayKey();
  const day = (data.days || []).find((x) => x.date === key);
  if (!day) return;
  const last = await c.match(abs('last-shown'));
  if (last && (await last.text()) === key) return; // already shown today
  await self.registration.showNotification(`Quote of the day${data.name ? ' for ' + data.name : ''} ✨`, {
    body: day.text, icon: abs('icon-192.png'), badge: abs('icon-192.png'), tag: 'daily-quote'
  });
  await c.put(abs('last-shown'), new Response(key));
}

self.addEventListener('periodicsync', (e) => { if (e.tag === 'daily-quote') e.waitUntil(showDaily()); });
self.addEventListener('message', (e) => { if (e.data === 'show-daily') e.waitUntil(showDaily()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(self.registration.scope);
  }));
});
