// ControlAsist — se antepone a ngsw-worker.js en cada deploy (scripts/deploy-cpanel.sh).
//
// Hasta el deploy del 2026-10-13 la CDN de Hostinger reescribía los PNG y su hash no coincidía con
// ngsw.json, así que el service worker de Angular quedó atascado en versiones viejas en algunos
// navegadores. Cambiar los bytes de este archivo hace que el navegador instale un service worker
// nuevo; al instalarse borra la caché "ngsw:" para que arranque desde la versión publicada.
// Para forzar otra limpieza en el futuro, cambia NGSW_RESET_ID (solo cuando haga falta: cada
// cambio obliga a todos los usuarios a volver a descargar la app).
const NGSW_RESET_ID = '2026-10-13';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ngsw:')).map((k) => caches.delete(k))))
  );
});
