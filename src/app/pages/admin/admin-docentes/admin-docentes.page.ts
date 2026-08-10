import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Docente } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './admin-docentes.page.html',
})
export class AdminDocentesPage implements OnInit {
  loading = signal(true);
  docentes = signal<Docente[]>([]);
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

  constructor(private adminService: AdminService, private toast: ToastService) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const data = await this.adminService.listarDocentes();
      this.docentes.set(data);
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
}
