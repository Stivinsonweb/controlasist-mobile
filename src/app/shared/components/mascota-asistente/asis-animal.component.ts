import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimalAsis } from '../../../core/services/asis-preferencias.service';

/**
 * Dibujo de la mascota de Asis según el animal elegido. Todos comparten las mismas piezas con
 * clase (ala-izq / ala-der / pupilas / parpados / birrete) para que la mascota las anime igual.
 */
@Component({
  selector: 'app-asis-animal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="tam" [attr.height]="tam" viewBox="0 0 120 120" aria-hidden="true" [ngSwitch]="animal">
      <defs>
        <linearGradient id="asis-buho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34D399"/><stop offset="1" stop-color="#0D9488"/></linearGradient>
        <linearGradient id="asis-panza" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECFDF5"/><stop offset="1" stop-color="#A7F3D0"/></linearGradient>
        <linearGradient id="asis-gato" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDBA74"/><stop offset="1" stop-color="#EA580C"/></linearGradient>
        <linearGradient id="asis-perro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D6A77A"/><stop offset="1" stop-color="#9A6B43"/></linearGradient>
        <linearGradient id="asis-pinguino" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#0F172A"/></linearGradient>
      </defs>

      <!-- ================= Búho ================= -->
      <g *ngSwitchCase="'buho'">
        <path class="ala ala-izq" d="M30 62c-12 4-17 18-13 30 8-2 15-9 18-18z" fill="#0F766E"/>
        <path class="ala ala-der" d="M90 62c12 4 17 18 13 30-8-2-15-9-18-18z" fill="#0F766E"/>
        <ellipse cx="60" cy="68" rx="32" ry="36" fill="url(#asis-buho)"/>
        <ellipse cx="60" cy="82" rx="20" ry="20" fill="url(#asis-panza)"/>
        <path d="M52 78q4 3 8 0q4 3 8 0M52 86q4 3 8 0q4 3 8 0" stroke="#6EE7B7" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M34 40l4-14 10 10z" fill="#10B981"/>
        <path d="M86 40l-4-14-10 10z" fill="#10B981"/>
        <ng-container *ngTemplateOutlet="birrete"></ng-container>
        <circle cx="47" cy="56" r="13" fill="#FFFFFF"/><circle cx="73" cy="56" r="13" fill="#FFFFFF"/>
        <g class="pupilas"><circle cx="48" cy="57" r="6" fill="#0F172A"/><circle cx="74" cy="57" r="6" fill="#0F172A"/><circle cx="50" cy="55" r="2" fill="#FFFFFF"/><circle cx="76" cy="55" r="2" fill="#FFFFFF"/></g>
        <g class="parpados"><rect x="33" y="42" width="28" height="28" rx="14" fill="#10B981"/><rect x="59" y="42" width="28" height="28" rx="14" fill="#10B981"/></g>
        <path d="M56 66l4 6 4-6z" fill="#F59E0B"/>
        <circle cx="38" cy="68" r="3.5" fill="#F472B6" opacity=".45"/><circle cx="82" cy="68" r="3.5" fill="#F472B6" opacity=".45"/>
        <path d="M50 102v5M54 102v5M66 102v5M70 102v5" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
      </g>

      <!-- ================= Gato ================= -->
      <g *ngSwitchCase="'gato'">
        <path d="M86 92c14 0 20-10 16-22" stroke="#EA580C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="ala ala-izq" d="M34 74c-8 4-10 14-6 20 6 0 11-5 12-12z" fill="#C2410C"/>
        <path class="ala ala-der" d="M86 74c8 4 10 14 6 20-6 0-11-5-12-12z" fill="#C2410C"/>
        <ellipse cx="60" cy="74" rx="30" ry="30" fill="url(#asis-gato)"/>
        <ellipse cx="60" cy="86" rx="16" ry="14" fill="#FFF7ED"/>
        <path d="M32 50l2-22 18 12z" fill="#F97316"/><path d="M36 46l1-11 9 6z" fill="#FED7AA"/>
        <path d="M88 50l-2-22-18 12z" fill="#F97316"/><path d="M84 46l-1-11-9 6z" fill="#FED7AA"/>
        <path d="M48 46q3-4 6 0M66 46q3-4 6 0" stroke="#C2410C" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ng-container *ngTemplateOutlet="birrete"></ng-container>
        <ellipse cx="48" cy="60" rx="9" ry="10" fill="#FFFFFF"/><ellipse cx="72" cy="60" rx="9" ry="10" fill="#FFFFFF"/>
        <g class="pupilas"><ellipse cx="49" cy="61" rx="3.5" ry="6" fill="#065F46"/><ellipse cx="73" cy="61" rx="3.5" ry="6" fill="#065F46"/><circle cx="50.5" cy="58" r="1.6" fill="#FFFFFF"/><circle cx="74.5" cy="58" r="1.6" fill="#FFFFFF"/></g>
        <g class="parpados"><ellipse cx="48" cy="60" rx="10" ry="11" fill="#F97316"/><ellipse cx="72" cy="60" rx="10" ry="11" fill="#F97316"/></g>
        <path d="M57 70h6l-3 4z" fill="#F472B6"/>
        <path d="M60 74q-3 4-6 2M60 74q3 4 6 2" stroke="#9A3412" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M40 70h-12M40 74l-11 3M80 70h12M80 74l11 3" stroke="#9A3412" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M50 102v4M56 102v4M64 102v4M70 102v4" stroke="#FFF7ED" stroke-width="4" stroke-linecap="round"/>
      </g>

      <!-- ================= Perro ================= -->
      <g *ngSwitchCase="'perro'">
        <path d="M88 90q14-4 12-18" stroke="#9A6B43" stroke-width="6" fill="none" stroke-linecap="round"/>
        <ellipse cx="60" cy="74" rx="30" ry="30" fill="url(#asis-perro)"/>
        <ellipse cx="60" cy="86" rx="15" ry="14" fill="#FDF6EC"/>
        <path class="ala ala-izq" d="M33 42c-10 4-12 24-4 34 6-2 9-12 10-24z" fill="#6B4423"/>
        <path class="ala ala-der" d="M87 42c10 4 12 24 4 34-6-2-9-12-10-24z" fill="#6B4423"/>
        <ng-container *ngTemplateOutlet="birrete"></ng-container>
        <ellipse cx="48" cy="58" rx="8.5" ry="9" fill="#FFFFFF"/><ellipse cx="72" cy="58" rx="8.5" ry="9" fill="#FFFFFF"/>
        <g class="pupilas"><circle cx="49" cy="59" r="4.5" fill="#1F2937"/><circle cx="73" cy="59" r="4.5" fill="#1F2937"/><circle cx="50.5" cy="57" r="1.6" fill="#FFFFFF"/><circle cx="74.5" cy="57" r="1.6" fill="#FFFFFF"/></g>
        <g class="parpados"><ellipse cx="48" cy="58" rx="9.5" ry="10" fill="#B8865A"/><ellipse cx="72" cy="58" rx="9.5" ry="10" fill="#B8865A"/></g>
        <ellipse cx="60" cy="72" rx="9" ry="7" fill="#F5E6D3"/>
        <ellipse cx="60" cy="69" rx="4.5" ry="3.2" fill="#1F2937"/>
        <path d="M60 72v3q-3 4-6 2M60 75q3 4 6 2" stroke="#4B2E16" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M57 79q3 7 6 0z" fill="#F472B6"/>
        <path d="M50 102v4M56 102v4M64 102v4M70 102v4" stroke="#6B4423" stroke-width="4" stroke-linecap="round"/>
      </g>

      <!-- ================= Pingüino ================= -->
      <g *ngSwitchCase="'pinguino'">
        <path class="ala ala-izq" d="M31 64c-10 8-12 22-8 30 6-3 10-11 11-22z" fill="#1E293B"/>
        <path class="ala ala-der" d="M89 64c10 8 12 22 8 30-6-3-10-11-11-22z" fill="#1E293B"/>
        <ellipse cx="60" cy="68" rx="30" ry="37" fill="url(#asis-pinguino)"/>
        <ellipse cx="60" cy="78" rx="20" ry="25" fill="#F8FAFC"/>
        <path d="M60 46c-12 0-20 8-20 17h40c0-9-8-17-20-17z" fill="#F8FAFC"/>
        <ng-container *ngTemplateOutlet="birrete"></ng-container>
        <ellipse cx="51" cy="58" rx="7" ry="7.5" fill="#FFFFFF"/><ellipse cx="69" cy="58" rx="7" ry="7.5" fill="#FFFFFF"/>
        <g class="pupilas"><circle cx="52" cy="59" r="3.8" fill="#0F172A"/><circle cx="70" cy="59" r="3.8" fill="#0F172A"/><circle cx="53.3" cy="57.3" r="1.3" fill="#FFFFFF"/><circle cx="71.3" cy="57.3" r="1.3" fill="#FFFFFF"/></g>
        <g class="parpados"><ellipse cx="51" cy="58" rx="8" ry="8.5" fill="#E2E8F0"/><ellipse cx="69" cy="58" rx="8" ry="8.5" fill="#E2E8F0"/></g>
        <path d="M54 66h12l-6 7z" fill="#F59E0B"/>
        <circle cx="44" cy="68" r="3.2" fill="#F472B6" opacity=".45"/><circle cx="76" cy="68" r="3.2" fill="#F472B6" opacity=".45"/>
        <path d="M46 104h10l-5-4zM64 104h10l-5-4z" fill="#F59E0B"/>
      </g>

      <ng-template #birrete>
        <svg:g class="birrete">
          <svg:path d="M40 30l20-9 20 9-20 9z" fill="#1E293B"/>
          <svg:rect x="52" y="33" width="16" height="6" rx="2" fill="#1E293B"/>
          <svg:path d="M78 30v9" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
          <svg:circle cx="78" cy="40" r="2.4" fill="#FBBF24"/>
        </svg:g>
      </ng-template>
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class AsisAnimalComponent {
  @Input() animal: AnimalAsis = 'buho';
  @Input() tam = 74;
}
