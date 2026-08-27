import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Docente } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { VerificadoBadgeComponent } from '../../../shared/components/verificado-badge/verificado-badge.component';
import { VerificacionDocenteService, SolicitudVerificacion } from '../../../core/services/verificacion-docente.service';

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, VerificadoBadgeComponent],
  templateUrl: './admin-docentes.page.html',
})
export class AdminDocentesPage implements OnInit {
  loading = signal(true);
  docentes = signal<Docente[]>([]);
  solicitudesVerificacion = signal<SolicitudVerificacion[]>([]);
  procesandoVerificacionId = signal<string | null>(null);
  notaRechazoVerificacion: Record<string, string> = {};
  searchText = signal('');
  programaFiltro = signal('');
  expandedId = signal<string | null>(null);

  currentPage = signal(1);
  itemsPerPage = 8;

  programas = computed(() => [...new Set(this.docentes().map((d) => d.programa).filter(Boolean))].sort() as string[]);

  filtrados = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const programa = this.programaFiltro();
    return this.docentes().filter((d) => {
      const matchSearch = !search || `${d.nombres} ${d.apellidos}`.toLowerCase().includes(search) || d.email?.toLowerCase().includes(search);
      const matchPrograma = !programa || d.programa === programa;
      return matchSearch && matchPrograma;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.itemsPerPage)));

  paginados = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filtrados().slice(start, start + this.itemsPerPage);
  });

  constructor(private adminService: AdminService, private toast: ToastService, private verificacionService: VerificacionDocenteService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [data, solicitudes] = await Promise.all([this.adminService.listarDocentes(), this.verificacionService.pendientes()]);
      this.docentes.set(data);
      this.solicitudesVerificacion.set(solicitudes);
    } catch (e) {
      console.error(e);
      this.toast.error('Error al cargar los docentes');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(v: string) {
    this.searchText.set(v);
    this.currentPage.set(1);
  }

  onProgramaChange(v: string) {
    this.programaFiltro.set(v);
    this.currentPage.set(1);
  }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.currentPage.set(p);
  }

  iniciales(d: Docente) {
    return `${(d.nombres?.[0] ?? '').toUpperCase()}${(d.apellidos?.[0] ?? '').toUpperCase()}`;
  }

  async aprobarVerificacion(s: SolicitudVerificacion) {
    this.procesandoVerificacionId.set(s.id);
    try {
      await this.verificacionService.aprobar(s.id);
      this.toast.success('Cuenta verificada');
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo aprobar la verificación');
    } finally {
      this.procesandoVerificacionId.set(null);
    }
  }

  async rechazarVerificacion(s: SolicitudVerificacion) {
    this.procesandoVerificacionId.set(s.id);
    try {
      await this.verificacionService.rechazar(s.id, this.notaRechazoVerificacion[s.id] || '');
      this.toast.success('Solicitud de verificación rechazada');
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo rechazar la solicitud');
    } finally {
      this.procesandoVerificacionId.set(null);
    }
  }

  async verificarManual(d: Docente) {
    this.procesandoVerificacionId.set(d.id);
    try {
      await this.verificacionService.verificarManual(d.id);
      this.toast.success(`${d.nombres} quedó verificado`);
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo verificar al docente');
    } finally {
      this.procesandoVerificacionId.set(null);
    }
  }

  async revocarVerificacion(d: Docente) {
    this.procesandoVerificacionId.set(d.id);
    try {
      await this.verificacionService.revocar(d.id);
      this.toast.success(`Verificación revocada a ${d.nombres}`);
      await this.load();
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo revocar la verificación');
    } finally {
      this.procesandoVerificacionId.set(null);
    }
  }
}
