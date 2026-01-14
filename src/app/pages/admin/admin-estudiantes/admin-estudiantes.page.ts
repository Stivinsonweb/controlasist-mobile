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
  chevronUpOutline,
  idCardOutline,
  locationOutline,
  calendarOutline,
  chatboxOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  searchOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  cedula: string;
  foto_url: string;
  avatar_color: string;
  iniciales: string;
  email: string;
  telefono: string;
  programa: string;
  fecha_nacimiento: string;
  direccion: string;
  ciudad: string;
  observaciones: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  expanded?: boolean;
}

interface FilterOptions {
  searchText: string;
  programa: string;
  estado: string;
}

@Component({
  selector: 'app-admin-estudiantes',
  templateUrl: './admin-estudiantes.page.html',
  styleUrls: ['./admin-estudiantes.page.scss'],
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
export class AdminEstudiantesPage implements OnInit {
  loading = false;
  estudiantes: Estudiante[] = [];
  estudiantesFiltrados: Estudiante[] = [];
  programas: string[] = [];
  estados = [
    { label: 'Activo', value: 'true' },
    { label: 'Inactivo', value: 'false' }
  ];

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Filtros
  filters: FilterOptions = {
    searchText: '',
    programa: '',
    estado: ''
  };

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
      chevronUpOutline,
      idCardOutline,
      locationOutline,
      calendarOutline,
      chatboxOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      searchOutline
    });
  }

  ngOnInit() {
    console.log('✅ Admin Estudiantes cargado');
    this.loadEstudiantes();
  }

  async loadEstudiantes() {
    try {
      this.loading = true;
      console.log('🔄 Iniciando carga de estudiantes...');

      // Obtener todos los estudiantes
      const { data, error } = await this.supabaseService.supabase
        .from('estudiantes')
        .select('*')
        .order('nombres', { ascending: true });

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      console.log('📊 Datos recibidos:', data);

      this.estudiantes = (data || []).map(e => ({ ...e, expanded: false }));
      console.log('✅ Estudiantes asignados:', this.estudiantes.length);

      // Extraer programas únicos
      this.programas = [...new Set(this.estudiantes.map(e => e.programa))].filter(Boolean).sort();
      console.log('📚 Programas encontrados:', this.programas);

      // Aplicar filtros iniciales
      this.applyFilters();
      console.log('✅ Filtros aplicados');
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      this.toastService.showError('Error al cargar los estudiantes');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      console.log('🎉 Loading completado:', this.loading);
    }
  }

  applyFilters() {
    console.log('🔍 Aplicando filtros...');
    console.log('Filtros:', this.filters);
    console.log('Total estudiantes:', this.estudiantes.length);

    let resultado = [...this.estudiantes];

    // Filtro por búsqueda (nombre, email o cédula)
    if (this.filters.searchText && this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      console.log('Buscando:', search);
      
      resultado = resultado.filter(e => {
        const nombreCompleto = `${e.nombres} ${e.apellidos}`.toLowerCase();
        const email = e.email?.toLowerCase() || '';
        const cedula = e.cedula?.toLowerCase() || '';
        
        const coincide = nombreCompleto.includes(search) || email.includes(search) || cedula.includes(search);
        
        if (coincide) {
          console.log('✅ Coincide:', e.nombres, e.apellidos);
        }
        
        return coincide;
      });
      
      console.log('Después de búsqueda:', resultado.length);
    }

    // Filtro por programa
    if (this.filters.programa && this.filters.programa.trim()) {
      console.log('Filtrando por programa:', this.filters.programa);
      resultado = resultado.filter(e => e.programa === this.filters.programa);
      console.log('Después de programa:', resultado.length);
    }

    // Filtro por estado
    if (this.filters.estado && this.filters.estado.trim()) {
      const estado = this.filters.estado === 'true';
      console.log('Filtrando por estado:', estado);
      resultado = resultado.filter(e => e.activo === estado);
      console.log('Después de estado:', resultado.length);
    }

    // Calcular paginación
    this.totalPages = Math.ceil(resultado.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    // Aplicar paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.estudiantesFiltrados = resultado.slice(start, start + this.itemsPerPage);

    // Resetear expand de todos
    this.estudiantesFiltrados.forEach(e => e.expanded = false);

    console.log(`📊 Estudiantes filtrados: ${this.estudiantesFiltrados.length} de ${this.estudiantes.length}`);
    console.log('✅ Filtros aplicados exitosamente');
    
    this.cdr.detectChanges();
  }

  // 🆕 Método para expandir/contraer estudiante
  toggleExpand(estudiante: Estudiante) {
    estudiante.expanded = !estudiante.expanded;
  }

  onSearchChange() {
    console.log('🔍 Cambio en búsqueda:', this.filters.searchText);
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    console.log('🎯 Cambio en filtro');
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    console.log('🧹 Limpiando filtros');
    this.filters = {
      searchText: '',
      programa: '',
      estado: ''
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

  getAvatarStyle(estudiante: Estudiante) {
    return {
      'background-color': estudiante.avatar_color || '#10b981',
      'color': '#ffffff'
    };
  }

  getInitials(estudiante: Estudiante): string {
    return estudiante.iniciales || `${estudiante.nombres[0]}${estudiante.apellidos[0]}`.toUpperCase();
  }

  getEstadoBadgeClass(activo: boolean): string {
    return activo ? 'estado-activo' : 'estado-inactivo';
  }

  getEstadoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.searchText?.trim() !== '' ||
      this.filters.programa !== '' ||
      this.filters.estado !== ''
    );
  }

  // Detectar si es mobile
  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  // Formatear fecha de nacimiento
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}