import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  mailOutline,
  callOutline,
  briefcaseOutline,
  schoolOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  programa: string;
  area: string;
  email: string;
  telefono: string;
  foto_url: string;
  avatar_color: string;
  iniciales: string;
  entidad: string;
  created_at: string;
  updated_at: string;
  expanded?: boolean; // 🆕 Para expandir/contraer
}

interface FilterOptions {
  searchText: string;
  programa: string;
  area: string;
}

@Component({
  selector: 'app-admin-docentes',
  templateUrl: './admin-docentes.page.html',
  styleUrls: ['./admin-docentes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton
  ]
})
export class AdminDocentesPage implements OnInit {
  loading = false;
  docentes: Docente[] = [];
  docentesFiltrados: Docente[] = [];
  programas: string[] = [];
  areas: string[] = [];

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Filtros
  filters: FilterOptions = {
    searchText: '',
    programa: '',
    area: ''
  };

  viewMode: 'table' | 'cards' = 'table';

  constructor(
    private supabaseService: SupabaseService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      closeOutline,
      mailOutline,
      callOutline,
      briefcaseOutline,
      schoolOutline,
      chevronDownOutline,
      chevronUpOutline
    });
  }

  ngOnInit() {
    console.log('✅ Admin Docentes cargado');
    this.loadDocentes();
  }

  async loadDocentes() {
    try {
      this.loading = true;

      // Obtener todos los docentes
      const { data, error } = await this.supabaseService.supabase
        .from('docentes')
        .select('*')
        .order('nombres', { ascending: true });

      if (error) throw error;

      this.docentes = (data || []).map(d => ({ ...d, expanded: false }));

      // Extraer programas y áreas únicos
      this.programas = [...new Set(this.docentes.map(d => d.programa))].filter(Boolean).sort();
      this.areas = [...new Set(this.docentes.map(d => d.area))].filter(Boolean).sort();

      console.log('✅ Docentes cargados:', this.docentes.length);
      console.log('📚 Programas:', this.programas);
      console.log('🏢 Áreas:', this.areas);

      // Aplicar filtros iniciales
      this.applyFilters();
    } catch (error) {
      console.error('Error cargando docentes:', error);
      this.toastService.showError('Error al cargar los docentes');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters() {
    let resultado = this.docentes;

    // Filtro por búsqueda (nombre o email)
    if (this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      resultado = resultado.filter(
        d =>
          `${d.nombres} ${d.apellidos}`.toLowerCase().includes(search) ||
          d.email.toLowerCase().includes(search)
      );
    }

    // Filtro por programa
    if (this.filters.programa) {
      resultado = resultado.filter(d => d.programa === this.filters.programa);
    }

    // Filtro por área
    if (this.filters.area) {
      resultado = resultado.filter(d => d.area === this.filters.area);
    }

    // Calcular paginación
    this.totalPages = Math.ceil(resultado.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    // Aplicar paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.docentesFiltrados = resultado.slice(start, start + this.itemsPerPage);

    // Resetear expand de todos
    this.docentesFiltrados.forEach(d => d.expanded = false);

    console.log(`📊 Docentes filtrados: ${this.docentesFiltrados.length} de ${this.docentes.length}`);
  }

  // 🆕 Método para expandir/contraer docente
  toggleExpand(docente: Docente) {
    docente.expanded = !docente.expanded;
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      searchText: '',
      programa: '',
      area: ''
    };
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  getAvatarStyle(docente: Docente) {
    return {
      'background-color': docente.avatar_color || '#a855f7',
      'color': '#ffffff'
    };
  }

  getInitials(docente: Docente): string {
    return docente.iniciales || `${docente.nombres[0]}${docente.apellidos[0]}`.toUpperCase();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.searchText.trim() !== '' ||
      this.filters.programa !== '' ||
      this.filters.area !== ''
    );
  }

  // Detectar si es mobile
  isMobile(): boolean {
    return window.innerWidth < 768;
  }
}