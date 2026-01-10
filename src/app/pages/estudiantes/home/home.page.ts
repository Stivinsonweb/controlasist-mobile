import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonBadge,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  addOutline,
  schoolOutline,
  personCircleOutline,
  logOutOutline,
  bookOutline,
  codeOutline,
  peopleOutline,
  calendarOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { SupabaseService } from "../../../services/supabase/supabase.service";
import { DetalleAsignaturaEstudianteComponent } from "../../../components/detalle-asignatura-estudiante/detalle-asignatura-estudiante.component";

@Component({
  selector: "app-home-estudiante",
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonBadge,
  ],
})
export class HomeEstudiantePage implements OnInit, ViewWillEnter {
  estudiante: any = null;
  asignaturas: any[] = [];
  loading = true;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private modalCtrl: ModalController
  ) {
    addIcons({
      addOutline,
      schoolOutline,
      personCircleOutline,
      logOutOutline,
      bookOutline,
      codeOutline,
      peopleOutline,
      calendarOutline,
      chevronForwardOutline,
    });
  }

  async ionViewWillEnter() {
    this.loading = true;
    await this.loadEstudiante();
    await this.loadAsignaturas();
    this.loading = false;
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    await this.loadEstudiante();
    await this.loadAsignaturas();
    this.loading = false;
    this.cdr.detectChanges();
  }

  async loadEstudiante() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (user) {
        console.log("Cargando estudiante con ID:", user.id);

        const { data, error } = await this.supabase
          .from("estudiantes")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error cargando estudiante:", error);
          return;
        }

        console.log("Estudiante cargado:", data);
        this.estudiante = data;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error("Error en loadEstudiante:", error);
    }
  }

  async loadAsignaturas() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (user) {
        console.log("Buscando asignaturas para estudiante:", user.id);

        const { data: inscripciones, error: errorInscripciones } =
          await this.supabase
            .from("estudiantes_asignaturas")
            .select("asignatura_id")
            .eq("estudiante_id", user.id)
            .eq("activo", true);

        if (errorInscripciones) {
          console.error("Error obteniendo inscripciones:", errorInscripciones);
          return;
        }

        if (!inscripciones || inscripciones.length === 0) {
          console.log("No hay inscripciones");
          this.asignaturas = [];
          this.cdr.detectChanges();
          return;
        }

        const asignaturasIds = inscripciones.map((i) => i.asignatura_id);

        const { data: asignaturasData, error: errorAsignaturas } =
          await this.supabase
            .from("asignaturas")
            .select(
              `
          id,
          nombre,
          codigo,
          grupo,
          periodo,
          nivel,
          creditos,
          modalidad,
          aula,
          facultad,
          programa,
          cds,
          color,
          docente_id,
          activa
        `
            )
            .in("id", asignaturasIds);

        if (errorAsignaturas) {
          console.error("Error obteniendo asignaturas:", errorAsignaturas);
          return;
        }

        const docentesIds = [
          ...new Set(asignaturasData?.map((a) => a.docente_id)),
        ];

        const { data: docentesData } = await this.supabase
          .from("docentes")
          .select("id, nombres, apellidos, foto_url, avatar_color")
          .in("id", docentesIds);

        this.asignaturas =
          asignaturasData?.map((asignatura: any) => ({
            ...asignatura,
            docente: docentesData?.find((d) => d.id === asignatura.docente_id),
          })) || [];

        console.log("Asignaturas procesadas:", this.asignaturas);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error("Error cargando asignaturas:", error);
    }
  }

  async verDetalleAsignatura(asignatura: any) {
    const modal = await this.modalCtrl.create({
      component: DetalleAsignaturaEstudianteComponent,
      componentProps: { asignatura },
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.9,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.desinscrito) {
      await this.loadAsignaturas();
    }
  }

  inscribirAsignatura() {
    this.router.navigate(["/estudiante/inscribir"]);
  }

  irAPerfil() {
    this.router.navigate(["/estudiante/perfil"]);
  }

  async cerrarSesion() {
    await this.supabase.auth.signOut();
    this.router.navigate(["/auth/login"]);
  }
}
