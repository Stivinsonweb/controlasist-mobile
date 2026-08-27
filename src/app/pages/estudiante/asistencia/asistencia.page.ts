import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { EstudiantesPortalService, AsignaturaConDocente } from '../../../core/services/estudiantes-portal.service';
import { AsistenciasService, MiRegistroAsistencia, ESTADOS_ASISTENCIA, TIPOS_CLASE } from '../../../core/services/asistencias.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { SubjectIconComponent } from '../../../shared/components/subject-icon/subject-icon.component';
import { subjectGradientStyle, subjectShadowStyle } from '../../../shared/utils/subject-theme.util';
import { BarraEstadosComponent, SegmentoBarra } from '../../../shared/components/charts/barra-estados.component';

interface ResumenAsignatura {
  asignatura: AsignaturaConDocente;
  total: number;
  porEstado: Record<string, number>;
  porcentajePresente: number;
  clases: { fecha: string; tipo_clase: string | null; estado: string }[];
}

@Component({
  selector: 'app-estudiante-asistencia',
  standalone: true,
  imports: [CommonModule, DialogComponent, SubjectIconComponent, BarraEstadosComponent],
  templateUrl: './asistencia.page.html',
})
export class EstudianteAsistenciaPage implements OnInit {
  loading = signal(true);
  resumenes = signal<ResumenAsignatura[]>([]);
  seleccionado = signal<ResumenAsignatura | null>(null);

  estados = ESTADOS_ASISTENCIA;
  tipos = TIPOS_CLASE;

  constructor(
    private supabaseService: SupabaseService,
    private portalService: EstudiantesPortalService,
    private asistenciasService: AsistenciasService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.loading.set(true);
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      const [asignaturas, registros] = await Promise.all([
        this.portalService.misAsignaturas(user.id),
        this.asistenciasService.misRegistros(user.id),
      ]);
      this.resumenes.set(this.construirResumenes(asignaturas, registros));
    } catch (e: any) {
      console.error('Error cargando mi asistencia:', e);
      this.toast.error('No se pudo cargar tu asistencia');
    } finally {
      this.loading.set(false);
    }
  }

  private construirResumenes(asignaturas: AsignaturaConDocente[], registros: MiRegistroAsistencia[]): ResumenAsignatura[] {
    return asignaturas.map((asignatura) => {
      const propios = registros.filter((r) => r.asistencias.asignatura_id === asignatura.id);
      const porEstado: Record<string, number> = {};
      for (const e of this.estados) porEstado[e.valor] = 0;
      for (const r of propios) porEstado[r.estado] = (porEstado[r.estado] || 0) + 1;

      const total = propios.length;
      const presentes = porEstado['presente'] || 0;
      const porcentajePresente = total > 0 ? Math.round((presentes / total) * 100) : 0;

      const clases = propios
        .map((r) => ({ fecha: r.asistencias.fecha, tipo_clase: r.asistencias.tipo_clase, estado: r.estado }))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

      return { asignatura, total, porEstado, porcentajePresente, clases };
    });
  }

  abrir(r: ResumenAsignatura) {
    this.seleccionado.set(r);
  }

  cerrar() {
    this.seleccionado.set(null);
  }

  gradientStyle(color: string | null | undefined) {
    return subjectGradientStyle(color);
  }

  shadowStyle(color: string | null | undefined) {
    return subjectShadowStyle(color);
  }

  colorEstado(estado: string): string {
    return this.estados.find((e) => e.valor === estado)?.color || '#94a3b8';
  }

  labelEstado(estado: string): string {
    return this.estados.find((e) => e.valor === estado)?.label || estado;
  }

  labelTipo(tipo: string | null): string {
    return this.tipos.find((t) => t.valor === tipo)?.label || '—';
  }

  segmentosBarra(r: ResumenAsignatura): SegmentoBarra[] {
    return this.estados.map((e) => ({ label: e.label, valor: r.porEstado[e.valor] || 0, color: e.color }));
  }
}
