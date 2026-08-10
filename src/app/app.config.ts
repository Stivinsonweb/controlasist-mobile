import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    // `ng serve` nunca genera ngsw-worker.js (solo lo genera el builder de `ng build`), así que
    // con enabled:true a secas el registro fallaba en dev con un 404 silencioso en consola. Angular
    // no soporta Service Workers bajo `ng serve` — hay que compilar y servir el `dist/` (ver abajo).
    //
    // La ruta del script DEBE ser absoluta ("/ngsw-worker.js"): con la ruta relativa, el navegador
    // la resolvía contra la URL actual en el momento del registro — y como el router redirige la
    // ruta '' a /auth/login vía pushState apenas arranca, terminaba pidiendo /auth/ngsw-worker.js
    // (404 → el servidor de la SPA devolvía index.html) y el registro fallaba con "unsupported
    // MIME type ('text/html')" (NG05604), silencioso salvo que se espere a que dispare el registro.
    provideServiceWorker('/ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
