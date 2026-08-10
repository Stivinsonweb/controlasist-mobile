import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Estudiante } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-admin-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './admin-estudiantes.page.html',
})
export class AdminEstudiantesPage implements OnInit {
  loading = signal(true);
  estudiantes = signal<Estudiante[]>([]);
  searchText = signal('');
  programaFiltro = signal('');
  expandedId = signal<string | null>(null);

  currentPage = signal(1);
  itemsPerPage = 8;

  programas = computed(() => [...new Set(this.estudiantes().map((e) => e.programa).filter(Boolean))].sort() as string[]);

  filtrados = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const programa = this.programaFiltro();
    return this.estudiantes().filter((e) => {
      const matchSearch =
        !search ||
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(search) ||
        e.email?.toLowerCase().includes(search) ||
        e.cedula?.toLowerCase().includes(search);
      const matchPrograma = !programa || e.programa === programa;
      return matchSearch && matchPrograma;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.itemsPerPage)));

  paginados = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filtrados().slice(start, start + this.itemsPerPage);
  });

  constructor(private adminService: AdminService, private toast: ToastService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const data = await this.adminService.listarEstudiantes();
      this.estudiantes.set(data);
    } catch (e) {
      console.error(e);
      this.toast.error('Error al cargar los estudiantes');
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

  iniciales(e: Estudiante) {
    return `${(e.nombres?.[0] ?? '').toUpperCase()}${(e.apellidos?.[0] ?? '').toUpperCase()}`;
  }
}
