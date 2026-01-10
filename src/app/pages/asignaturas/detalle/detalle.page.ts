import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonBadge,
  IonList,
  IonItem,
  IonAvatar,
  IonSpinner,
  LoadingController,
  AlertController,
  ActionSheetController,
  ModalController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  timeOutline,
  peopleOutline,
  addOutline,
  cloudUploadOutline,
  personAddOutline,
  calendarOutline,
  trashOutline,
  createOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  bookOutline,
  codeOutline,
  locationOutline,
  ellipsisVerticalOutline,
  closeOutline,
  statsChartOutline,
  ellipseOutline,
  qrCodeOutline,
  lockClosedOutline
} from "ionicons/icons";
import { SupabaseService } from "../../../services/supabase/supabase.service";
import { AgregarHorariosMultiplePage } from "../agregar-horarios-multiple/agregar-horarios-multiple.page";
import { CalendarioClasesComponent } from "../../../components/calendario-clases/calendario-clases.component";
import { EstadoClasePage } from "../estado-clase/estado-clase.page";
import { EditarPage } from "../editar/editar.page";
import { ConfirmDeleteComponent } from "src/app/components/confirm-delete/confirm-delete.component";
import { CodigoAccesoModalComponent } from "src/app/components/codigo-acceso-modal/codigo-acceso-modal.component";

interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  grupo: string;
  nivel: string;
  periodo: string;
  creditos: number;
  modalidad: string;
  color: string;
  facultad?: string;
  programa?: string;
  aula?: string;
  cds?: string;
  docente_id?: string;
  activa?: boolean;
  codigo_acceso?: string;
  codigo_expira?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Horario {
  id: string;
  asignatura_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  activo: boolean;
  estado?: string;
  fecha_ultima_actualizacion?: string;
  fecha_inicio?: string;
  created_at?: string;
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  tipo_documento?: string;
  email?: string;
  telefono?: string;
  foto_url?: string;
  programa?: string;
  activo?: boolean;
  created_at?: string;
}

@Component({
  selector: "app-detalle",
  templateUrl: "./detalle.page.html",
  styleUrls: ["./detalle.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonBadge,
    IonList,
    IonItem,
    IonAvatar,
    IonSpinner,
    CalendarioClasesComponent,
  ],
})
export class DetallePage implements OnInit {
  asignaturaId: string = "";
  asignatura: Asignatura | null = null;
  horarios: Horario[] = [];
  estudiantes: Estudiante[] = [];

  loadingAsignatura = true;
  loadingHorarios = true;
  loadingEstudiantes = true;

  segmentValue: string = "horarios";

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
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      timeOutline,
      peopleOutline,
      addOutline,
      cloudUploadOutline,
      personAddOutline,
      calendarOutline,
      trashOutline,
      createOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      bookOutline,
      codeOutline,
      locationOutline,
      ellipsisVerticalOutline,
      closeOutline,
      statsChartOutline,
      ellipseOutline,
      qrCodeOutline,
      lockClosedOutline
    });
  }

  async ngOnInit() {
    this.asignaturaId = this.route.snapshot.paramMap.get("id") || "";

    if (!this.asignaturaId) {
      this.router.navigate(["/home"]);
      return;
    }

    await this.loadAsignatura();

    setTimeout(() => this.loadHorarios(), 100);
    setTimeout(() => this.loadEstudiantes(), 200);
  }

  async loadAsignatura() {
    this.loadingAsignatura = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.supabase
        .from("asignaturas")
        .select("*")
        .eq("id", this.asignaturaId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No se encontró la asignatura");
      }

      this.asignatura = data;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error("Error cargando asignatura:", error);
      await this.showAlert("Error", "No se pudo cargar la asignatura");
      this.router.navigate(["/home"]);
    } finally {
      this.loadingAsignatura = false;
      this.cdr.detectChanges();
    }
  }

  async gestionarCodigoAcceso() {
    const modal = await this.modalController.create({
      component: CodigoAccesoModalComponent,
      componentProps: {
        asignatura: this.asignatura,
      },
      cssClass: "codigo-acceso-modal",
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.updated) {
      await this.loadAsignatura();
    }
  }

  async editarAsignatura() {
    if (!this.asignatura) {
      await this.showToast("Error: no se pudo cargar la asignatura", "danger");
      return;
    }

    const asignaturaParaEditar = { ...this.asignatura };

    const modal = await this.modalController.create({
      component: EditarPage,
      componentProps: {
        asignatura: asignaturaParaEditar,
      },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.updated) {
      await this.loadAsignatura();
      this.cdr.detectChanges();
    }
  }

  async eliminarAsignatura() {
    const modal = await this.modalController.create({
      component: ConfirmDeleteComponent,
      componentProps: {
        asignaturaNombre: this.asignatura?.nombre,
      },
      cssClass: "confirm-delete-modal",
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.confirmed) {
      await this.confirmarEliminacion();
    }
  }

  async confirmarEliminacion() {
    const loading = await this.loadingController.create({
      message: "Eliminando asignatura...",
    });
    await loading.present();

    try {
      const { error } = await this.supabase.rpc("desactivar_asignatura", {
        asignatura_id: this.asignaturaId,
      });

      await loading.dismiss();

      if (error) {
        console.error("Error:", error);
        throw error;
      }

      await this.showToast("Asignatura eliminada exitosamente", "success");
      this.router.navigate(["/home"]);
    } catch (error: any) {
      await loading.dismiss();
      console.error("Error eliminando:", error);
      await this.showToast(`Error: ${error.message}`, "danger");
    }
  }

  async loadHorarios() {
    this.loadingHorarios = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.supabase
        .from("horarios")
        .select("*")
        .eq("asignatura_id", this.asignaturaId)
        .eq("activo", true)
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true });

      if (error) throw error;

      this.horarios = data || [];
    } catch (error) {
      console.error("Error cargando horarios:", error);
      await this.showToast("Error al cargar horarios", "danger");
    } finally {
      this.loadingHorarios = false;
      this.cdr.detectChanges();
    }
  }

  async onClaseClick(evento: any) {
    const modal = await this.modalController.create({
      component: EstadoClasePage,
      componentProps: {
        horario: evento.horario,
        asignaturaId: this.asignaturaId,
        estadoActual: evento.estado,
      },
      breakpoints: [0, 0.75, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.saved) {
      await this.loadHorarios();
      this.cdr.detectChanges();
    }
  }

  irAReportes() {
    this.router.navigate(["/reportes", this.asignaturaId]);
  }

  async loadEstudiantes() {
    this.loadingEstudiantes = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.supabase
        .from("estudiantes_asignaturas")
        .select(
          `
          estudiante_id,
          estudiantes (
            id,
            nombres,
            apellidos,
            cedula,
            email,
            telefono,
            foto_url
          )
        `
        )
        .eq("asignatura_id", this.asignaturaId)
        .eq("activo", true);

      if (error) {
        this.estudiantes = [];
      } else {
        this.estudiantes =
          data
            ?.map((item: any) => item.estudiantes)
            .filter((e: any) => e !== null) || [];
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error("Error en loadEstudiantes:", error);
      this.estudiantes = [];
    } finally {
      this.loadingEstudiantes = false;
      this.cdr.detectChanges();
    }
  }

  onSegmentChange(event: any) {
    this.segmentValue = event.detail.value;
    this.cdr.detectChanges();
  }

  async agregarHorario() {
    const modal = await this.modalController.create({
      component: AgregarHorariosMultiplePage,
      componentProps: {
        asignaturaId: this.asignaturaId,
      },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.created) {
      await this.loadHorarios();
    }
  }

  async agregarEstudiantes() {
    const actionSheet = await this.actionSheetController.create({
      header: "¿Cómo deseas agregar estudiantes?",
      buttons: [
        {
          text: "Cargar desde archivo",
          icon: "cloud-upload-outline",
          handler: () => {
            this.cargarDesdeArchivo();
          },
        },
        {
          text: "Agregar manualmente",
          icon: "person-add-outline",
          handler: () => {
            this.agregarManual();
          },
        },
        {
          text: "Cancelar",
          icon: "close-outline",
          role: "cancel",
        },
      ],
    });

    await actionSheet.present();
  }

  async cargarDesdeArchivo() {
    console.log("Cargar desde archivo");
  }

  async agregarManual() {
    console.log("Agregar manual");
  }

  getHorariosPorDia(dia: number): Horario[] {
    return this.horarios.filter((h) => h.dia_semana === dia);
  }

  formatHora(hora: string): string {
    if (!hora) return "";
    const [hours, minutes] = hora.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  getInitials(estudiante: Estudiante): string {
    const firstInitial = estudiante.nombres?.charAt(0)?.toUpperCase() || "";
    const lastInitial = estudiante.apellidos?.charAt(0)?.toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  }

  getAvatarUrl(estudiante: Estudiante): string {
    if (estudiante.foto_url) {
      return estudiante.foto_url;
    }
    const initials = this.getInitials(estudiante);
    return `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ["OK"],
    });
    await alert.present();
  }

  getDiaNombre(dia: number): string {
    return this.diasSemana[dia];
  }

  formatFecha(fecha: string): string {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  getTextoEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "Realizada";
      case "cancelada":
        return "Cancelada";
      case "aplazada":
        return "Aplazada";
      default:
        return "Pendiente";
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "checkmark-circle-outline";
      case "cancelada":
        return "close-circle-outline";
      case "aplazada":
        return "time-outline";
      default:
        return "ellipse-outline";
    }
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case "realizada":
        return "#10b981";
      case "cancelada":
        return "#ef4444";
      case "aplazada":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  }

  async cambiarEstadoHorario(horario: Horario) {
    const modal = await this.modalController.create({
      component: EstadoClasePage,
      componentProps: {
        horario: horario,
        asignaturaId: this.asignaturaId,
        estadoActual: horario.estado || "pendiente",
      },
      breakpoints: [0, 0.75, 0.95],
      initialBreakpoint: 0.95,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.saved) {
      await this.loadHorarios();
      this.cdr.detectChanges();
    }
  }

  async eliminarHorario(horario: Horario) {
    const alert = await this.alertController.create({
      header: "Eliminar Horario",
      message:
        "¿Estás seguro de eliminar este horario? Esta acción no se puede deshacer.",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            const loading = await this.loadingController.create({
              message: "Eliminando horario...",
              spinner: "crescent",
            });
            await loading.present();

            try {
              const { error } = await this.supabase
                .from("horarios")
                .update({ activo: false })
                .eq("id", horario.id);

              await loading.dismiss();

              if (error) throw error;

              await this.showToast(
                "Horario eliminado correctamente",
                "success"
              );
              await this.loadHorarios();
              this.cdr.detectChanges();
            } catch (error) {
              await loading.dismiss();
              console.error("Error eliminando horario:", error);
              await this.showToast("Error al eliminar el horario", "danger");
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: "top",
      color,
    });
    await toast.present();
  }
}
