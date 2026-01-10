import { Component, Input, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonLabel,
  IonBadge,
  IonSpinner,
  ModalController,
  AlertController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  closeOutline,
  personOutline,
  codeOutline,
  peopleOutline,
  calendarOutline,
  timeOutline,
  locationOutline,
  schoolOutline,
  bookOutline,
  trashOutline,
} from "ionicons/icons";
import { SupabaseService } from "../../services/supabase/supabase.service";

@Component({
  selector: "app-detalle-asignatura-estudiante",
  templateUrl: "./detalle-asignatura-estudiante.component.html",
  styleUrls: ["./detalle-asignatura-estudiante.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonLabel,
    IonBadge,
    IonSpinner,
  ],
})
export class DetalleAsignaturaEstudianteComponent implements OnInit {
  @Input() asignatura: any;

  horarios: any[] = [];
  loadingHorarios = false;

  diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  constructor(
    private modalCtrl: ModalController,
    private supabase: SupabaseService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      closeOutline,
      personOutline,
      codeOutline,
      peopleOutline,
      calendarOutline,
      timeOutline,
      locationOutline,
      schoolOutline,
      bookOutline,
      trashOutline,
    });
  }

  async ngOnInit() {
    if (this.asignatura) {
      await this.loadHorarios();
    }
  }

  async loadHorarios() {
    this.loadingHorarios = true;
    this.cdr.detectChanges();

    console.log(
      "Iniciando carga de horarios para asignatura:",
      this.asignatura.id
    );

    try {
      const { data, error } = await this.supabase
        .from("horarios")
        .select("*")
        .eq("asignatura_id", this.asignatura.id)
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true });

      console.log("Data horarios:", data);
      console.log("Error horarios:", error);

      if (error) {
        console.error("Error cargando horarios:", error);
      }

      this.horarios = data || [];
      console.log("Horarios finales:", this.horarios);
    } catch (error) {
      console.error("Error en loadHorarios:", error);
    } finally {
      this.loadingHorarios = false;
      this.cdr.detectChanges();
      console.log("loadingHorarios cambiado a false");
    }
  }

  getHorariosPorDia(dia: number) {
    return this.horarios.filter((h) => h.dia_semana === dia);
  }

  getDiaNombre(dia: number): string {
    return this.diasSemana[dia] || "";
  }

  formatHora(hora: string): string {
    if (!hora) return "";
    return hora.substring(0, 5);
  }

  getColorEstado(estado: string): string {
    const colores: any = {
      activo: "#10b981",
      cancelado: "#ef4444",
      reprogramado: "#f59e0b",
      pendiente: "#6b7280",
    };
    return colores[estado] || "#6b7280";
  }

  getTextoEstado(estado: string): string {
    const textos: any = {
      activo: "Activo",
      cancelado: "Cancelado",
      reprogramado: "Reprogramado",
      pendiente: "Pendiente",
    };
    return textos[estado] || "Pendiente";
  }

  getIconoEstado(estado: string): string {
    const iconos: any = {
      activo: "checkmark-circle",
      cancelado: "close-circle",
      reprogramado: "time",
      pendiente: "ellipse",
    };
    return iconos[estado] || "ellipse";
  }

  async desinscribirse() {
    const alert = await this.alertCtrl.create({
      header: "Confirmar",
      message: `¿Estás seguro de que deseas desinscribirte de ${this.asignatura.nombre}?`,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Sí, desinscribirme",
          role: "destructive",
          handler: async () => {
            await this.confirmarDesinscripcion();
          },
        },
      ],
    });

    await alert.present();
  }

  async confirmarDesinscripcion() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) return;

      const { error } = await this.supabase
        .from("estudiantes_asignaturas")
        .update({ activo: false })
        .eq("estudiante_id", user.id)
        .eq("asignatura_id", this.asignatura.id);

      if (error) throw error;

      await this.showToast("Te has desinscrito exitosamente", "success");
      this.modalCtrl.dismiss({ desinscrito: true });
    } catch (error: any) {
      console.error("Error:", error);
      await this.showToast("Error al desinscribirse", "danger");
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
