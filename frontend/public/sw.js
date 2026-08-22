self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
  self.registration.unregister().then(() => {
    console.log('Service worker unregistered successfully');
  });
});
