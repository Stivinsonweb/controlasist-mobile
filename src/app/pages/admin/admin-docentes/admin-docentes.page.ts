<<<<<<< HEAD
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonAvatar,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  people,
  eyeOutline,
  refreshOutline,
  mailOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  briefcaseOutline,
  calendarOutline,
  searchOutline,
  statsChartOutline,
  trendingUpOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

interface Docente {
  id: string;
  user_id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  entidad?: string;
  programa?: string;
  area?: string;
  foto_url?: string;
  created_at: string;
}

type TimePeriod = 'day' | 'week' | 'month';
=======
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
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f

@Component({
  selector: 'app-admin-docentes',
  templateUrl: './admin-docentes.page.html',
  styleUrls: ['./admin-docentes.page.scss'],
  standalone: true,
  imports: [
<<<<<<< HEAD
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonAvatar,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    CommonModule,
    FormsModule
  ]
})
export class AdminDocentesPage implements OnInit, OnDestroy {
  docentes: Docente[] = [];
  docentesFiltrados: Docente[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  selectedPeriod: TimePeriod = 'week';

  // Chart data
  docentesChart: Chart | null = null;
  entidadesChart: Chart | null = null;

  // Stats
  totalDocentes: number = 0;
  docentesPorEntidad: { [key: string]: number } = {};
  docentesPorPeriodo: { date: string; count: number }[] = [];

  constructor(private supabase: SupabaseService) {
    Chart.register(...registerables);

    addIcons({
      peopleOutline,
      people,
      eyeOutline,
      refreshOutline,
      mailOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      briefcaseOutline,
      calendarOutline,
      searchOutline,
      statsChartOutline,
      trendingUpOutline
    });
  }

  async ngOnInit() {
    await this.loadDocentes();
    setTimeout(() => this.initCharts(), 500);
  }

  async ionViewWillEnter() {
    await this.loadDocentes();
  }

  ngOnDestroy() {
    if (this.docentesChart) this.docentesChart.destroy();
    if (this.entidadesChart) this.entidadesChart.destroy();
  }

  async loadDocentes() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase
        .from('docentes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.docentes = data || [];
      this.docentesFiltrados = this.docentes;
      this.calculateStats();
      console.log('✅ Docentes cargados:', this.docentes.length);
    } catch (error) {
      console.error('❌ Error cargando docentes:', error);
      this.docentes = [];
      this.docentesFiltrados = [];
    } finally {
      this.loading = false;
    }
  }

  calculateStats() {
    this.totalDocentes = this.docentes.length;

    // Docentes por entidad
    this.docentesPorEntidad = {};
    this.docentes.forEach(d => {
      const entidad = d.entidad || 'Sin entidad';
      this.docentesPorEntidad[entidad] = (this.docentesPorEntidad[entidad] || 0) + 1;
    });

    // Docentes por período
    this.calculatePeriodStats();
  }

  calculatePeriodStats() {
    const now = new Date();
    let startDate: Date;
    let labels: string[] = [];

    switch (this.selectedPeriod) {
      case 'day':
        startDate = subDays(now, 7);
        for (let i = 6; i >= 0; i--) {
          const date = subDays(now, i);
          labels.push(format(date, 'dd/MM'));
        }
        break;
      case 'week':
        startDate = subWeeks(now, 4);
        for (let i = 3; i >= 0; i--) {
          const date = subWeeks(now, i);
          labels.push(`Sem ${format(date, 'w')}`);
        }
        break;
      case 'month':
        startDate = subMonths(now, 6);
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(now, i);
          labels.push(format(date, 'MMM', { locale: es }));
        }
        break;
    }

    // Contar docentes por período
    this.docentesPorPeriodo = labels.map((label, index) => {
      let periodStart: Date;
      let periodEnd: Date;

      switch (this.selectedPeriod) {
        case 'day':
          periodStart = startOfDay(subDays(now, 6 - index));
          periodEnd = endOfDay(subDays(now, 6 - index));
          break;
        case 'week':
          periodStart = subWeeks(now, 3 - index);
          periodEnd = subWeeks(now, 2 - index);
          break;
        case 'month':
          periodStart = subMonths(now, 5 - index);
          periodEnd = subMonths(now, 4 - index);
          break;
      }

      const count = this.docentes.filter(d => {
        const createdAt = new Date(d.created_at);
        return createdAt >= periodStart && createdAt < periodEnd;
      }).length;

      return { date: label, count };
    });
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.calculatePeriodStats();
    this.updateCharts();
  }

  initCharts() {
    this.initDocentesChart();
    this.initEntidadesChart();
  }

  initDocentesChart() {
    const canvas = document.getElementById('docentesChart') as HTMLCanvasElement;
    if (!canvas) {
      setTimeout(() => this.initDocentesChart(), 500);
      return;
    }

    if (this.docentesChart) this.docentesChart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.docentesPorPeriodo.map(d => d.date),
        datasets: [{
          label: 'Docentes Registrados',
          data: this.docentesPorPeriodo.map(d => d.count),
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.docentesChart = new Chart(ctx, config);
  }

  initEntidadesChart() {
    const canvas = document.getElementById('entidadesChart') as HTMLCanvasElement;
    if (!canvas) {
      setTimeout(() => this.initEntidadesChart(), 500);
      return;
    }

    if (this.entidadesChart) this.entidadesChart.destroy();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const entidades = Object.keys(this.docentesPorEntidad);
    const counts = Object.values(this.docentesPorEntidad);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: entidades,
        datasets: [{
          label: 'Docentes por Entidad',
          data: counts,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.entidadesChart = new Chart(ctx, config);
  }

  updateCharts() {
    if (this.docentesChart) {
      this.docentesChart.data.labels = this.docentesPorPeriodo.map(d => d.date);
      this.docentesChart.data.datasets[0].data = this.docentesPorPeriodo.map(d => d.count);
      this.docentesChart.update();
    }
  }

  filterDocentes() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.docentesFiltrados = this.docentes;
      return;
    }

    this.docentesFiltrados = this.docentes.filter(docente => {
      const nombreCompleto = `${docente.nombres} ${docente.apellidos}`.toLowerCase();
      const email = docente.email.toLowerCase();
      const entidad = docente.entidad?.toLowerCase() || '';
      const programa = docente.programa?.toLowerCase() || '';

      return nombreCompleto.includes(term) ||
        email.includes(term) ||
        entidad.includes(term) ||
        programa.includes(term);
    });
  }

  async handleRefresh(event?: any) {
    await this.loadDocentes();
    this.updateCharts();
    if (event) {
      event.target.complete();
    }
  }

  getNombreCompleto(docente: Docente): string {
    return `${docente.nombres} ${docente.apellidos}`;
  }

  getAvatarUrl(docente: Docente): string {
    if (docente.foto_url) {
      return docente.foto_url;
    }
    const initials = `${docente.nombres.charAt(0)}${docente.apellidos.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=200&bold=true&rounded=true`;
  }

  formatDate(dateString: string): string {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  }
}
=======
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
>>>>>>> 12b5483e3a772962cb6c43c35c1e4be0fc4d057f
