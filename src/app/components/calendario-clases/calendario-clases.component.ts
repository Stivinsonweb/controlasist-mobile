import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  IonCard,
  IonIcon,
  IonButton,
  IonBadge,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  checkmarkCircleOutline,
  timeOutline,
  closeCircleOutline,
  ellipsisHorizontalOutline,
  locationOutline,
} from "ionicons/icons";

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  activo: boolean;
  estado?: string;
  fecha_ultima_actualizacion?: string;
}

interface RegistroClase {
  id: string;
  horario_id: string;
  fecha: string;
  estado: "pendiente" | "realizada" | "cancelada";
  observaciones?: string;
  temas_tratados?: string;
  asistencia_tomada?: boolean;
}

@Component({
  selector: "app-calendario-clases",
  templateUrl: "./calendario-clases.component.html",
  styleUrls: ["./calendario-clases.component.scss"],
  standalone: true,
  imports: [CommonModule, IonCard, IonIcon, IonButton, IonBadge],
})
export class CalendarioClasesComponent implements OnInit, OnChanges {
  @Input() horarios: Horario[] = [];
  @Input() registros: RegistroClase[] = [];
  @Output() claseClick = new EventEmitter<{
    horario: Horario;
    estado: string;
    esHoy: boolean;
  }>();

  diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  // Día actual
  diaActual: number = 0;
  horaActual: string = "";
  fechaActual: string = "";

  // Mapa de estados por horario
  estadosHorarios: Map<string, string> = new Map();

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      closeCircleOutline,
      ellipsisHorizontalOutline,
      locationOutline,
    });
  }

  ngOnInit() {
    this.actualizarFechaHora();
    this.procesarEstados();

    // Actualizar cada minuto
    setInterval(() => {
      this.actualizarFechaHora();
      this.procesarEstados();
    }, 60000);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["horarios"] || changes["registros"]) {
      this.procesarEstados();
    }
  }

  actualizarFechaHora() {
    const ahora = new Date();
    this.diaActual = ahora.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    this.horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(
      ahora.getMinutes()
    ).padStart(2, "0")}`;
    this.fechaActual = ahora.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  procesarEstados() {
    this.estadosHorarios.clear();

    this.horarios.forEach((horario) => {
      const estado = this.calcularEstadoHorario(horario);
      this.estadosHorarios.set(horario.id, estado);
    });
  }

  calcularEstadoHorario(horario: Horario): string {
    // 1. Si el horario tiene estado guardado, usarlo
    if (horario.estado && horario.estado !== "pendiente") {
      // Verificar si es de hoy
      if (horario.fecha_ultima_actualizacion === this.fechaActual) {
        return horario.estado; // 'realizada', 'cancelada', 'aplazada'
      }
    }

    // 2. Si no hay estado guardado, determinar por hora actual
    const esHoy = horario.dia_semana === this.diaActual;

    if (!esHoy) {
      return "programada";
    }

    // Es hoy, comparar horas
    const horaInicio = horario.hora_inicio;
    const horaFin = horario.hora_fin;

    if (this.horaActual < horaInicio) {
      return "pendiente";
    } else if (this.horaActual >= horaInicio && this.horaActual <= horaFin) {
      return "en_curso";
    } else if (this.horaActual > horaFin) {
      return "sin_registrar";
    }

    return "pendiente";
  }

  getHorariosPorDia(dia: number): Horario[] {
    return this.horarios
      .filter((h) => h.dia_semana === dia && h.activo)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }

  getEstadoClase(horario: Horario): string {
    return this.estadosHorarios.get(horario.id) || "pendiente";
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "#10b981"; // Verde - Clase realizada
      case "cancelada":
        return "#ef4444"; // Rojo - Clase cancelada
      case "en_curso":
        return "#3b82f6"; // Azul - Clase en curso ahora
      case "pendiente":
        return "#f59e0b"; // Amarillo - Clase pendiente hoy
      case "sin_registrar":
        return "#f97316"; // Naranja - Clase pasada sin registrar
      case "programada":
      default:
        return "#94a3b8"; // Gris - Clase programada (otro día)
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "checkmark-circle-outline";
      case "cancelada":
        return "close-circle-outline";
      case "en_curso":
        return "time-outline";
      case "pendiente":
        return "time-outline";
      case "sin_registrar":
        return "ellipsis-horizontal-outline";
      case "programada":
      default:
        return "time-outline";
    }
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "Realizada";
      case "cancelada":
        return "Cancelada";
      case "en_curso":
        return "En curso";
      case "pendiente":
        return "Pendiente";
      case "sin_registrar":
        return "Sin registrar";
      case "programada":
      default:
        return "Programada";
    }
  }

  formatHora(hora: string): string {
    if (!hora) return "";
    const [h, m] = hora.split(":");
    const horas = parseInt(h);
    const ampm = horas >= 12 ? "PM" : "AM";
    const h12 = horas % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  esHoy(horario: Horario): boolean {
    return horario.dia_semana === this.diaActual;
  }

  getObservaciones(horario: Horario): string | undefined {
    const registroHoy = this.registros.find(
      (r) => r.horario_id === horario.id && r.fecha === this.fechaActual
    );
    return registroHoy?.observaciones;
  }

  onClaseClick(horario: Horario) {
    const estado = this.getEstadoClase(horario);
    const esHoy = this.esHoy(horario);

    this.claseClick.emit({
      horario,
      estado,
      esHoy,
    });
  }
}
