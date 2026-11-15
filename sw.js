/* 画面の枠だけをキャッシュする Service Worker。データ通信（GASへのPOST）は一切触らない。
   画面を更新したら VERSION を上げる（上げないと、次の次の起動まで古い画面が出る） */
var VERSION = 'kakeibo-v5';
var SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'avatar.webp', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // POST・他ドメイン（GAS・フォント）は素通し
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;   // キャッシュがあれば即返し、裏で更新
    });
  }));
});
