import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IllustratedSceneComponent, SceneVariant } from '../illustrated-scene/illustrated-scene.component';

export interface GuideStep {
  variant: SceneVariant;
  title: string;
  description: string;
}

/**
 * Guía paso a paso con puntos de progreso + Anterior/Siguiente, reutilizada tanto para la
 * instalación manual de la PWA (iOS/Android/escritorio) como base de navegación de la guía
 * completa del sistema. Recibe los pasos ya armados (variant + texto) — no sabe nada de PWA
 * ni de negocio, solo orquesta la navegación entre escenas ilustradas.
 */
@Component({
  selector: 'app-install-guide',
  standalone: true,
  imports: [CommonModule, IllustratedSceneComponent],
  template: `
    <div *ngIf="steps.length" class="flex flex-col items-center">
      <app-illustrated-scene
        [variant]="steps[current()].variant"
        [title]="steps[current()].title"
        [description]="steps[current()].description" />

      <div class="mt-4 flex items-center gap-1.5" *ngIf="steps.length > 1">
        <button *ngFor="let s of steps; let i = index" (click)="goTo(i)"
                [attr.aria-label]="'Paso ' + (i + 1)"
                class="h-1.5 rounded-full transition-all"
                [class.w-5]="i === current()" [class.bg-primary-600]="i === current()"
                [class.w-1.5]="i !== current()" [class.bg-slate-200]="i !== current()"></button>
      </div>

      <div class="mt-5 flex w-full gap-2" *ngIf="steps.length > 1">
        <button type="button" (click)="prev()" [disabled]="current() === 0" class="btn-outline btn-sm flex-1 disabled:opacity-40">Anterior</button>
        <button type="button" (click)="next()" [disabled]="current() === steps.length - 1" class="btn-primary btn-sm flex-1 disabled:opacity-40">Siguiente</button>
      </div>
    </div>
  `,
})
export class InstallGuideComponent {
  @Input() steps: GuideStep[] = [];
  current = signal(0);

  goTo(i: number) {
    this.current.set(i);
  }

  prev() {
    if (this.current() > 0) this.current.update((v) => v - 1);
  }

  next() {
    if (this.current() < this.steps.length - 1) this.current.update((v) => v + 1);
  }
}
