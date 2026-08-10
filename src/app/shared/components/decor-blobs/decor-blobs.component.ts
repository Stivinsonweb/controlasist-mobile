import { Component } from '@angular/core';

@Component({
  selector: 'app-decor-blobs',
  standalone: true,
  template: `
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="decor-blob decor-blob-primary -left-24 -top-24 h-80 w-80" style="animation-duration: 14s; animation-delay: 0s;"></div>
      <div class="decor-blob decor-blob-secondary -right-32 top-1/3 h-96 w-96" style="animation-duration: 18s; animation-delay: -4s;"></div>
      <div class="decor-blob decor-blob-primary bottom-[-6rem] left-1/4 h-72 w-72" style="animation-duration: 16s; animation-delay: -9s;"></div>
    </div>
  `,
})
export class DecorBlobsComponent {}
