'use strict';
// QuizMaster service worker (Fázis 29 / 4. ablak) — szándékosan MINIMÁLIS és hálózat-első.
// Egyetlen feladata: ha egy oldal-NAVIGÁCIÓ hálózati hiba miatt nem tölthető be (nincs internet), egy érthető tájékoztató oldalt (offline.html)
// mutat a böngésző hibaoldala helyett. SEMMIT nem tárol el az alkalmazásból: az oldalak (quiz-player.html, quiz-host.html), a szkriptek és a
// Firebase-forgalom mindig a hálózatról érkeznek — így egy új telepítés (verzió, SRI-hash) azonnal érvényesül, elavult oldal nem ragadhat be.
// Hatókör: ez a fájl a repó gyökerében van, így a /kvizmester/ alatti összes oldalt (a host-panelt is) láthatja — de csak a hibás navigációt érinti.
const CACHE = 'quizmaster-offline-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode !== 'navigate') return;   // minden más kérés (Firebase, szkriptek, képek, betűtípusok) érintetlen marad
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(OFFLINE_URL, { cacheName: CACHE }).then(res =>
        res || new Response('Nincs internetkapcsolat.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      )
    )
  );
});
