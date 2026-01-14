import { Component, OnInit, ChangeDetectorRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ToastService } from '../../../services/toast.service';

// 🔑 REGISTRAR TODAS LAS ESCALAS Y COMPONENTES DE CHART.JS
Chart.register(...registerables);

@Component({
  selector: 'app-admin-estadisticas',
  templateUrl: './admin-estadisticas.page.html',
  styleUrls: ['./admin-estadisticas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButtons,
    IonBackButton,
    BaseChartDirective
  ]
})
export class AdminEstadisticasPage implements OnInit {
  loading = false;
  
  @ViewChild('chartEstudiantes') chartEstudiantes: any;
  @ViewChild('chartDocentes') chartDocentes: any;
  @ViewChild('chartSemanal') chartSemanal: any;

  // Gráfica de Estudiantes
  chartEstudiantesData: any = {
    labels: ['Estudiantes'],
    datasets: [{
      label: 'Total',
      data: [0],
      backgroundColor: '#10b981',
      borderColor: '#059669',
      borderWidth: 2,
      borderRadius: 5
    }]
  };

  chartEstudiantesOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  };

  // Gráfica de Docentes
  chartDocentesData: any = {
    labels: ['Docentes'],
    datasets: [{
      label: 'Total',
      data: [0],
      backgroundColor: '#a855f7',
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: 5
    }]
  };

  chartDocentesOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  };

  // Gráfica de Registros Semanales
  chartSemanalData: any = {
    labels: [],
    datasets: [
      {
        label: 'Estudiantes',
        data: [],
        backgroundColor: '#10b98166',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 5,
        tension: 0.4
      },
      {
        label: 'Docentes',
        data: [],
        backgroundColor: '#a855f766',
        borderColor: '#a855f7',
        borderWidth: 2,
        borderRadius: 5,
        tension: 0.4
      }
    ]
  };

  chartSemanalOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  totalEstudiantes = 0;
  totalDocentes = 0;

  constructor(
    private supabaseService: SupabaseService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    console.log('✅ Admin Estadísticas cargado');
    this.loadEstadisticas();
  }

  async loadEstadisticas() {
    try {
      this.loading = true;
      
      // Cargar total de estudiantes
      const { count: countEstudiantes } = await this.supabaseService.supabase
        .from('estudiantes')
        .select('id', { count: 'exact', head: true });

      // Cargar total de docentes
      const { count: countDocentes } = await this.supabaseService.supabase
        .from('docentes')
        .select('id', { count: 'exact', head: true });

      // Cargar registros semanales
      const { data: estudiantes } = await this.supabaseService.supabase
        .from('estudiantes')
        .select('created_at');

      const { data: docentes } = await this.supabaseService.supabase
        .from('docentes')
        .select('created_at');

      // Actualizar totales
      this.totalEstudiantes = countEstudiantes || 0;
      this.totalDocentes = countDocentes || 0;

      // Actualizar gráficas de totales
      this.chartEstudiantesData.datasets[0].data = [this.totalEstudiantes];
      this.chartDocentesData.datasets[0].data = [this.totalDocentes];

      // Procesar registros semanales
      this.procesarRegistrosSemenal(estudiantes, docentes);

      console.log('✅ Estadísticas cargadas');
      
      // 🔧 ARREGLO: Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }, 100);

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.toastService.showError('Error al cargar las estadísticas');
      this.loading = false;
    }
  }

  procesarRegistrosSemenal(estudiantes: any[], docentes: any[]) {
    const semanas = new Map<string, { semana: string; estudiantes: number; docentes: number }>();

    // Procesar estudiantes
    if (estudiantes) {
      estudiantes.forEach(est => {
        const fecha = new Date(est.created_at);
        const semana = this.obtenerSemana(fecha);
        
        if (!semanas.has(semana)) {
          semanas.set(semana, { semana, estudiantes: 0, docentes: 0 });
        }
        
        const data = semanas.get(semana)!;
        data.estudiantes += 1;
      });
    }

    // Procesar docentes
    if (docentes) {
      docentes.forEach(doc => {
        const fecha = new Date(doc.created_at);
        const semana = this.obtenerSemana(fecha);
        
        if (!semanas.has(semana)) {
          semanas.set(semana, { semana, estudiantes: 0, docentes: 0 });
        }
        
        const data = semanas.get(semana)!;
        data.docentes += 1;
      });
    }

    // Convertir a array y ordenar
    const datosOrdenados = Array.from(semanas.values()).sort((a, b) => a.semana.localeCompare(b.semana));

    // Actualizar gráfica semanal
    this.chartSemanalData.labels = datosOrdenados.map(d => d.semana);
    this.chartSemanalData.datasets[0].data = datosOrdenados.map(d => d.estudiantes);
    this.chartSemanalData.datasets[1].data = datosOrdenados.map(d => d.docentes);

    console.log('📊 Registros semanales:', datosOrdenados);
  }

  obtenerSemana(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }
}