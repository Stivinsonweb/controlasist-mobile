import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonBadge,
  IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline,
  statsChartOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  downloadOutline,
  filterOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service';

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  estado?: string;
  fecha_ultima_actualizacion?: string;
  created_at: string;
}

interface ReporteSemanal {
  semana: number;
  fechaInicio: string;
  fechaFin: string;
  totalClases: number;
  realizadas: number;
  canceladas: number;
  aplazadas: number;
  pendientes: number;
  clases: any[];
}

interface ReporteMensual {
  mes: string;
  anio: number;
  totalClases: number;
  realizadas: number;
  canceladas: number;
  aplazadas: number;
  pendientes: number;
  semanas: ReporteSemanal[];
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonBadge,
    IonList
  ]
})
export class ReportesPage implements OnInit {
  asignaturaId: string = '';
  asignatura: any = null;
  horarios: Horario[] = [];
  
  vistaActual: 'semana' | 'mes' = 'mes';
  
  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;
  semanaSeleccionada: number = 1;
  
  anios: number[] = [];
  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];
  
  reporteMensual: ReporteMensual | null = null;
  reporteSemanal: ReporteSemanal | null = null;
  
  loading = false;
  
  diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService
  ) {
    addIcons({
      calendarOutline,
      statsChartOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      downloadOutline,
      filterOutline
    });
  }

  async ngOnInit() {
    this.asignaturaId = this.route.snapshot.paramMap.get('id') || '';
    
    await this.loadAsignatura();
    await this.loadHorarios();
    await this.generarAniosDisponibles();
    await this.generarReporte();
  }

  async loadAsignatura() {
    try {
      const { data, error } = await this.supabase
        .from('asignaturas')
        .select('*')
        .eq('id', this.asignaturaId)
        .single();

      if (error) throw error;
      this.asignatura = data;
    } catch (error) {
      console.error('Error cargando asignatura:', error);
    }
  }

  async loadHorarios() {
    try {
      const { data, error } = await this.supabase
        .from('horarios')
        .select('*')
        .eq('asignatura_id', this.asignaturaId)
        .eq('activo', true);

      if (error) throw error;
      this.horarios = data || [];
    } catch (error) {
      console.error('Error cargando horarios:', error);
    }
  }

  async generarAniosDisponibles() {
    const aniosSet = new Set<number>();

    this.horarios.forEach(horario => {
      const anioCreacion = new Date(horario.created_at).getFullYear();
      aniosSet.add(anioCreacion);
    });

    this.anios = Array.from(aniosSet).sort((a, b) => b - a);

    if (this.anios.length === 0) {
      this.anios = [new Date().getFullYear()];
    }
  }

  async generarReporte() {
    this.loading = true;
    
    if (this.vistaActual === 'mes') {
      await this.generarReporteMensual();
    } else {
      await this.generarReporteSemanal();
    }
    
    this.loading = false;
  }

  async generarReporteMensual() {
    const primerDia = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, 1);
    const ultimoDia = new Date(this.anioSeleccionado, this.mesSeleccionado, 0);
    
    const clasesDelMes = this.obtenerClasesEnRango(primerDia, ultimoDia);
    const semanas = this.dividirEnSemanas(clasesDelMes, primerDia, ultimoDia);
    
    let totalRealizadas = 0;
    let totalCanceladas = 0;
    let totalAplazadas = 0;
    let totalPendientes = 0;
    
    semanas.forEach(semana => {
      totalRealizadas += semana.realizadas;
      totalCanceladas += semana.canceladas;
      totalAplazadas += semana.aplazadas;
      totalPendientes += semana.pendientes;
    });
    
    this.reporteMensual = {
      mes: this.meses[this.mesSeleccionado - 1].nombre,
      anio: this.anioSeleccionado,
      totalClases: clasesDelMes.length,
      realizadas: totalRealizadas,
      canceladas: totalCanceladas,
      aplazadas: totalAplazadas,
      pendientes: totalPendientes,
      semanas: semanas
    };
  }

  async generarReporteSemanal() {
    const primerDia = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, 1);
    const { inicio, fin } = this.obtenerRangoSemana(primerDia, this.semanaSeleccionada);
    
    const clasesDeLaSemana = this.obtenerClasesEnRango(inicio, fin);
    
    this.reporteSemanal = this.calcularEstadisticasSemana(
      this.semanaSeleccionada,
      inicio,
      fin,
      clasesDeLaSemana
    );
  }

  obtenerClasesEnRango(inicio: Date, fin: Date): any[] {
    const clases: any[] = [];
    
    const fechaInicio = new Date(inicio);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fin);
    fechaFin.setHours(23, 59, 59, 999);
    
    this.horarios.forEach(horario => {
      const fechaCreacion = new Date(horario.created_at);
      fechaCreacion.setHours(0, 0, 0, 0);
      
      let fechaClase = new Date(fechaCreacion);
      
      while (fechaClase.getDay() !== horario.dia_semana) {
        fechaClase.setDate(fechaClase.getDate() + 1);
      }
      
      while (fechaClase <= fechaFin) {
        if (fechaClase >= fechaInicio && fechaClase >= fechaCreacion) {
          const fechaClaseStr = this.dateToString(fechaClase);
          
          let estado = 'pendiente';
          if (horario.fecha_ultima_actualizacion === fechaClaseStr && horario.estado) {
            estado = horario.estado;
          }
          
          clases.push({
            fecha: fechaClaseStr,
            diaSemana: horario.dia_semana,
            horario: horario,
            estado: estado
          });
        }
        
        fechaClase.setDate(fechaClase.getDate() + 7);
      }
    });
    
    return clases;
  }

  dividirEnSemanas(clases: any[], primerDia: Date, ultimoDia: Date): ReporteSemanal[] {
    const semanas: ReporteSemanal[] = [];
    let semanaNum = 1;
    
    let inicioSemana = new Date(primerDia);
    
    while (inicioSemana <= ultimoDia) {
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      
      if (finSemana > ultimoDia) {
        finSemana.setTime(ultimoDia.getTime());
      }
      
      const clasesDelaSemana = clases.filter(clase => {
        const fechaClase = new Date(clase.fecha + 'T00:00:00');
        return fechaClase >= inicioSemana && fechaClase <= finSemana;
      });
      
      if (clasesDelaSemana.length > 0) {
        const semana = this.calcularEstadisticasSemana(
          semanaNum,
          inicioSemana,
          finSemana,
          clasesDelaSemana
        );
        
        semanas.push(semana);
      }
      
      inicioSemana = new Date(finSemana);
      inicioSemana.setDate(inicioSemana.getDate() + 1);
      semanaNum++;
    }
    
    return semanas;
  }

  calcularEstadisticasSemana(
    numSemana: number,
    inicio: Date,
    fin: Date,
    clases: any[]
  ): ReporteSemanal {
    const realizadas = clases.filter(c => c.estado === 'realizada').length;
    const canceladas = clases.filter(c => c.estado === 'cancelada').length;
    const aplazadas = clases.filter(c => c.estado === 'aplazada').length;
    const pendientes = clases.filter(c => c.estado === 'pendiente').length;
    
    return {
      semana: numSemana,
      fechaInicio: this.formatearFecha(inicio),
      fechaFin: this.formatearFecha(fin),
      totalClases: clases.length,
      realizadas,
      canceladas,
      aplazadas,
      pendientes,
      clases
    };
  }

  obtenerRangoSemana(primerDia: Date, numSemana: number): { inicio: Date; fin: Date } {
    const inicio = new Date(primerDia);
    inicio.setDate(inicio.getDate() + ((numSemana - 1) * 7));
    
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    
    return { inicio, fin };
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  dateToString(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onVistaChange(event: any) {
    this.vistaActual = event.detail.value;
    this.generarReporte();
  }

  onFiltroChange() {
    this.generarReporte();
  }

  getPorcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'realizada': return '#10b981';
      case 'cancelada': return '#ef4444';
      case 'aplazada': return '#f59e0b';
      default: return '#94a3b8';
    }
  }
}