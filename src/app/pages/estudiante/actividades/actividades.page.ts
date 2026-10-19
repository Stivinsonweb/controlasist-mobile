import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EstudiantesPortalService, AsignaturaConDocente } from '../../../core/services/estudiantes-portal.service';
import { ActividadesService, Actividad, EntregaActividad, actividadVencida, entregaTardia, tipoActividadLabel } from '../../../core/services/actividades.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';

type EstadoMiActividad = 'pendiente' | 'vencida' | 'entregada' | 'calificada' | 'informativa';
type Pestana = 'pendientes' | 'entregadas' | 'todas';

interface MiActividad {
  actividad: Actividad;
  asignatura: AsignaturaConDocente | undefined;
  entrega: EntregaActividad | null;
  estado: EstadoMiActividad;
}

const ESTADOS: Record<EstadoMiActividad, { label: string; clase: string }> = {
  pendiente: { label: 'Pendiente', clase: 'bg-amber-100 text-amber-700' },
  vencida: { label: 'Vencida', clase: 'bg-red-100 text-red-700' },
  entregada: { label: 'Entregada', clase: 'bg-emerald-100 text-emerald-700' },
  calificada: { label: 'Calificada', clase: 'bg-blue-100 text-blue-700' },
  informativa: { label: 'Informativa', clase: 'bg-slate-100 text-slate-600' },
};

const MAX_ARCHIVO_MB = 20;

@Component({
  selector: 'app-estudiante-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './actividades.page.html',
})
export class EstudianteActividadesPage implements OnInit {
  loading = signal(true);
  items = signal<MiActividad[]>([]);
  pestana = signal<Pestana>('pendientes');
  private estudianteId = '';

  visibles = computed(() => {
    const p = this.pestana();
    const lista = this.items();
    if (p === 'pendientes') return lista.filter((i) => i.estado === 'pendiente' || i.estado === 'vencida');
    if (p === 'entregadas') return lista.filter((i) => i.estado === 'entregada' || i.estado === 'calificada');
    return lista;
  });
  pendientesCount = computed(() => this.items().filter((i) => i.estado === 'pendiente').length);

  seleccionada = signal<MiActividad | null>(null);
  form = { comentario: '', enlace: '' };
  archivo: File | null = null;
  enviando = false;

  constructor(
    private supabaseService: SupabaseService,
    private portalService: EstudiantesPortalService,
    private actividadesService: ActividadesService,
    private toast: ToastService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.estudianteId = user.id;
      const asignaturas = await this.portalService.misAsignaturas(user.id);
      const [actividades, entregas] = await Promise.all([
        this.actividadesService.listarPorAsignaturas(asignaturas.map((a) => a.id)),
        this.actividadesService.misEntregas(user.id),
      ]);
      const items = actividades.map((actividad) => {
        const entrega = entregas.find((e) => e.actividad_id === actividad.id) ?? null;
        return { actividad, asignatura: asignaturas.find((a) => a.id === actividad.asignatura_id), entrega, estado: this.estadoDe(actividad, entrega) };
      });
      // Primero lo que vence antes; las que no tienen fecha, al final.
      items.sort((a, b) => {
        const fa = a.actividad.fecha_entrega ? new Date(a.actividad.fecha_entrega).getTime() : Infinity;
        const fb = b.actividad.fecha_entrega ? new Date(b.actividad.fecha_entrega).getTime() : Infinity;
        return fa - fb;
      });
      this.items.set(items);
    } catch (e) {
      console.error('Error cargando mis actividades:', e);
      this.toast.error('No se pudieron cargar tus actividades');
    } finally {
      this.loading.set(false);
    }
  }

  private estadoDe(a: Actividad, e: EntregaActividad | null): EstadoMiActividad {
    if (e?.calificada_en) return 'calificada';
    if (e && (e.archivo_path || e.enlace || e.comentario)) return 'entregada';
    if (!a.permite_entregas) return 'informativa';
    return actividadVencida(a) ? 'vencida' : 'pendiente';
  }

  infoEstado(e: EstadoMiActividad) {
    return ESTADOS[e];
  }

  tipoLabel = tipoActividadLabel;

  fechaEntregaTexto(a: Actividad): string {
    if (!a.fecha_entrega) return 'Sin fecha de entrega';
    return new Date(a.fecha_entrega).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  /** "Vence en 3 h", "vence mañana"... solo para pendientes. */
  tiempoRestante(a: Actividad): string | null {
    if (!a.fecha_entrega) return null;
    const ms = new Date(a.fecha_entrega).getTime() - Date.now();
    if (ms <= 0) return null;
    const horas = Math.floor(ms / 3_600_000);
    if (horas < 1) return 'Vence en menos de 1 hora';
    if (horas < 24) return `Vence en ${horas} h`;
    const dias = Math.round(horas / 24);
    return dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
  }

  tardia(i: MiActividad) {
    return !!i.entrega && entregaTardia(i.actividad, i.entrega);
  }

  puedeEntregar(i: MiActividad) {
    return i.actividad.permite_entregas && !i.entrega?.calificada_en;
  }

  abrir(i: MiActividad) {
    this.seleccionada.set(i);
    this.form = { comentario: i.entrega?.comentario ?? '', enlace: i.entrega?.enlace ?? '' };
    this.archivo = null;
  }

  cerrar() {
    this.seleccionada.set(null);
  }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      this.toast.warning(`El archivo supera ${MAX_ARCHIVO_MB} MB`);
      input.value = '';
      return;
    }
    this.archivo = file;
  }

  async abrirArchivo(ruta: string | null) {
    if (!ruta) return;
    const ventana = window.open('', '_blank');
    try {
      const url = await this.actividadesService.urlArchivo(ruta);
      if (ventana) ventana.location.href = url;
      else window.location.href = url;
    } catch {
      ventana?.close();
      this.toast.error('No se pudo abrir el archivo');
    }
  }

  async entregar() {
    const i = this.seleccionada();
    if (!i) return;
    const tieneAlgo = this.archivo || this.form.enlace.trim() || this.form.comentario.trim() || i.entrega?.archivo_path;
    if (!tieneAlgo) {
      this.toast.warning('Adjunta un archivo, un enlace o escribe un comentario');
      return;
    }
    if (this.form.enlace.trim() && !/^https?:\/\//i.test(this.form.enlace.trim())) {
      this.toast.warning('El enlace debe empezar por http:// o https://');
      return;
    }
    this.enviando = true;
    try {
      const entrega = await this.actividadesService.entregar(i.actividad, this.estudianteId, this.form, this.archivo, i.entrega);
      const actualizado: MiActividad = { ...i, entrega, estado: this.estadoDe(i.actividad, entrega) };
      this.items.update((l) => l.map((x) => (x.actividad.id === i.actividad.id ? actualizado : x)));
      this.seleccionada.set(actualizado);
      this.archivo = null;
      this.toast.success(i.entrega ? 'Entrega actualizada' : 'Actividad entregada');
    } catch (e: any) {
      console.error('Error entregando la actividad:', e);
      this.toast.error(e.message || 'No se pudo enviar la entrega');
    } finally {
      this.enviando = false;
    }
  }
}
