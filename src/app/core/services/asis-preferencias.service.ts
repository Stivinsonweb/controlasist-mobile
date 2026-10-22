import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AnimalAsis = 'buho' | 'gato' | 'perro' | 'pinguino';
export type SonidoAsis = AnimalAsis | 'campana' | 'burbuja' | 'ninguno';

export const ANIMALES_ASIS: { valor: AnimalAsis; nombre: string }[] = [
  { valor: 'buho', nombre: 'Búho' },
  { valor: 'gato', nombre: 'Gato' },
  { valor: 'perro', nombre: 'Perro' },
  { valor: 'pinguino', nombre: 'Pingüino' },
];

export const SONIDOS_ASIS: { valor: SonidoAsis; nombre: string }[] = [
  { valor: 'buho', nombre: 'Ulular de búho' },
  { valor: 'gato', nombre: 'Maullido' },
  { valor: 'perro', nombre: 'Ladrido' },
  { valor: 'pinguino', nombre: 'Graznido de pingüino' },
  { valor: 'campana', nombre: 'Campanita' },
  { valor: 'burbuja', nombre: 'Burbuja' },
  { valor: 'ninguno', nombre: 'Sin sonido' },
];

/** Copia local para que el login (sin sesión) muestre el animal elegido la última vez. */
const CLAVE_LOCAL = 'controlasist_asis_preferencias';

/**
 * Personalización de Asis (animal y sonido). Se guarda en `asistente_preferencias` para que siga
 * al usuario en todos sus dispositivos, con una copia en localStorage para el login. Los sonidos
 * se sintetizan con Web Audio, así que no hay archivos que descargar.
 */
@Injectable({ providedIn: 'root' })
export class AsisPreferenciasService {
  animal = signal<AnimalAsis>('buho');
  sonido = signal<SonidoAsis>('buho');
  private audio: AudioContext | null = null;
  private cargadas = false;

  constructor(private supabaseService: SupabaseService) {
    try {
      const local = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null');
      if (local?.animal) this.animal.set(local.animal);
      if (local?.sonido) this.sonido.set(local.sonido);
    } catch {}
  }

  /** Lee las preferencias de la cuenta (una vez por sesión). */
  async cargar() {
    if (this.cargadas) return;
    this.cargadas = true;
    const { data } = await this.supabaseService.client.from('asistente_preferencias').select('animal, sonido').maybeSingle();
    if (data) {
      this.animal.set(data.animal);
      this.sonido.set(data.sonido);
      this.guardarLocal();
    }
  }

  async guardar(animal: AnimalAsis, sonido: SonidoAsis) {
    this.animal.set(animal);
    this.sonido.set(sonido);
    this.guardarLocal();
    const { error } = await this.supabaseService.client
      .from('asistente_preferencias')
      .upsert([{ animal, sonido, updated_at: new Date().toISOString() }], { onConflict: 'usuario_id' });
    if (error) throw error;
  }

  private guardarLocal() {
    try {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ animal: this.animal(), sonido: this.sonido() }));
    } catch {}
  }

  /** Reproduce el sonido elegido (o el indicado). Necesita una interacción previa del usuario. */
  reproducir(sonido: SonidoAsis = this.sonido()) {
    if (sonido === 'ninguno') return;
    try {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') this.audio.resume();
      const ctx = this.audio;
      const t = ctx.currentTime + 0.02;
      const salida = ctx.createGain();
      salida.gain.value = 0.28;
      salida.connect(ctx.destination);
      switch (sonido) {
        case 'buho': this.buho(ctx, salida, t); break;
        case 'gato': this.gato(ctx, salida, t); break;
        case 'perro': this.perro(ctx, salida, t); break;
        case 'pinguino': this.pinguino(ctx, salida, t); break;
        case 'campana': this.campana(ctx, salida, t); break;
        case 'burbuja': this.burbuja(ctx, salida, t); break;
      }
    } catch {
      // Sin soporte de audio: Asis sigue funcionando en silencio.
    }
  }

  // ---------------------------------------------------------------- síntesis
  private nota(ctx: AudioContext, destino: AudioNode, tipo: OscillatorType, inicio: number, dur: number, f0: number, f1: number, ataque = 0.03, pico = 1) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(f0, inicio);
    osc.frequency.exponentialRampToValueAtTime(f1, inicio + dur);
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(pico, inicio + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    osc.connect(g).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + dur + 0.05);
    return osc;
  }

  /** "Hu-huuu": dos notas graves y suaves. */
  private buho(ctx: AudioContext, d: AudioNode, t: number) {
    this.nota(ctx, d, 'sine', t, 0.28, 420, 380, 0.06);
    this.nota(ctx, d, 'sine', t + 0.36, 0.55, 400, 330, 0.08);
  }

  /** "Miau": diente de sierra filtrado que sube y baja. */
  private gato(ctx: AudioContext, d: AudioNode, t: number) {
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 6;
    filtro.frequency.setValueAtTime(900, t);
    filtro.frequency.linearRampToValueAtTime(1800, t + 0.25);
    filtro.frequency.linearRampToValueAtTime(800, t + 0.65);
    filtro.connect(d);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.linearRampToValueAtTime(760, t + 0.25);
    osc.frequency.linearRampToValueAtTime(480, t + 0.65);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.4, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(g).connect(filtro);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  /** "Guau guau": dos golpes graves con un poco de ruido. */
  private perro(ctx: AudioContext, d: AudioNode, t: number) {
    for (const inicio of [t, t + 0.22]) {
      const filtro = ctx.createBiquadFilter();
      filtro.type = 'lowpass';
      filtro.frequency.value = 1100;
      filtro.connect(d);
      this.nota(ctx, filtro, 'square', inicio, 0.14, 260, 140, 0.01, 0.8);
      const ruido = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const canal = buffer.getChannelData(0);
      for (let i = 0; i < canal.length; i++) canal[i] = (Math.random() * 2 - 1) * (1 - i / canal.length);
      ruido.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      ruido.connect(g).connect(filtro);
      ruido.start(inicio);
    }
  }

  /** Graznido corto y repetido. */
  private pinguino(ctx: AudioContext, d: AudioNode, t: number) {
    [0, 0.11, 0.22].forEach((s, i) => this.nota(ctx, d, 'square', t + s, 0.09, 950 - i * 80, 620 - i * 60, 0.01, 0.5));
  }

  private campana(ctx: AudioContext, d: AudioNode, t: number) {
    this.nota(ctx, d, 'sine', t, 0.9, 1318, 1310, 0.005);
    this.nota(ctx, d, 'sine', t, 0.6, 1976, 1970, 0.005, 0.4);
  }

  private burbuja(ctx: AudioContext, d: AudioNode, t: number) {
    this.nota(ctx, d, 'sine', t, 0.16, 320, 980, 0.01);
  }
}
