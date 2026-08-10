import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

interface ProgramaCount {
  programa: string;
  total: number;
}

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-estadisticas.page.html',
})
export class AdminEstadisticasPage implements OnInit {
  loading = signal(true);
  resumen = signal({ docentes: 0, estudiantes: 0, administradores: 0, asignaturas: 0 });
  programas = signal<ProgramaCount[]>([]);
  maxPrograma = signal(1);

  constructor(private adminService: AdminService, private toast: ToastService) {}

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [resumen, programas] = await Promise.all([
        this.adminService.resumenGeneral(),
        this.adminService.programasMasPoblados(),
      ]);
      this.resumen.set(resumen);
      const top = programas.slice(0, 8);
      this.programas.set(top);
      this.maxPrograma.set(Math.max(1, ...top.map((p) => p.total)));
    } catch (e) {
      console.error(e);
      this.toast.error('Error al cargar las estadísticas');
    } finally {
      this.loading.set(false);
    }
  }

  barWidth(total: number) {
    return `${Math.max(4, (total / this.maxPrograma()) * 100)}%`;
  }
}
