import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
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
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonBackButton,
  IonButtons,
  LoadingController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  checkmarkCircleOutline,
  cardOutline,
  callOutline,
  schoolOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { SupabaseService } from "../../../services/supabase/supabase.service";

@Component({
  selector: "app-datos-inscripcion",
  templateUrl: "./datos-inscripcion.page.html",
  styleUrls: ["./datos-inscripcion.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonBackButton,
    IonButtons,
  ],
})
export class DatosInscripcionPage implements OnInit {
  asignatura: any = null;
  estudiante: any = null;
  datosForm: FormGroup;
  necesitaDatos = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      checkmarkCircleOutline,
      cardOutline,
      callOutline,
      schoolOutline,
      alertCircleOutline,
    });

    const navigation = this.router.getCurrentNavigation();
    this.asignatura = navigation?.extras?.state?.["asignatura"];

    this.datosForm = this.fb.group({
      tipo_documento: ["CC", [Validators.required]],
      cedula: ["", [Validators.required]],
      telefono: ["", [Validators.required]],
      programa: ["", [Validators.required]],
    });
  }

  async ngOnInit() {
    if (!this.asignatura) {
      await this.showToast(
        "No se encontró información de la asignatura",
        "danger"
      );
      this.router.navigate(["/estudiante/inscribir"]);
      return;
    }

    await this.loadEstudiante();
    this.verificarDatos();
  }

  async loadEstudiante() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (user) {
        const { data } = await this.supabase
          .from("estudiantes")
          .select("*")
          .eq("id", user.id)
          .single();

        this.estudiante = data;
      }
    } catch (error) {
      console.error("Error cargando estudiante:", error);
    }
  }

  verificarDatos() {
    if (!this.estudiante) return;

    const tieneCedula = !!this.estudiante.cedula;
    const tieneTelefono = !!this.estudiante.telefono;
    const tienePrograma = !!this.estudiante.programa;

    this.necesitaDatos = !tieneCedula || !tieneTelefono || !tienePrograma;

    if (this.necesitaDatos) {
      this.datosForm.patchValue({
        tipo_documento: this.estudiante.tipo_documento || "CC",
        cedula: this.estudiante.cedula || "",
        telefono: this.estudiante.telefono || "",
        programa: this.estudiante.programa || "",
      });
    }
  }

  async inscribirse() {
    if (this.necesitaDatos) {
      if (this.datosForm.invalid) {
        await this.showToast(
          "Completa todos los campos obligatorios",
          "warning"
        );
        return;
      }

      await this.actualizarDatosEstudiante();
    }

    await this.crearInscripcion();
  }

  async actualizarDatosEstudiante() {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (user) {
        const cedulaNueva = this.datosForm.value.cedula;

        const { data: existente } = await this.supabase
          .from("estudiantes")
          .select("id")
          .eq("cedula", cedulaNueva)
          .neq("id", user.id)
          .single();

        if (existente) {
          throw new Error("Esta cédula ya está registrada por otro estudiante");
        }

        const { error } = await this.supabase
          .from("estudiantes")
          .update(this.datosForm.value)
          .eq("id", user.id);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error actualizando estudiante:", error);
      throw error;
    }
  }

  async crearInscripcion() {
    const loading = await this.loadingCtrl.create({
      message: "Inscribiéndote a la asignatura...",
    });
    await loading.present();

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const { data: existente } = await this.supabase
        .from("estudiantes_asignaturas")
        .select("id, activo")
        .eq("estudiante_id", user.id)
        .eq("asignatura_id", this.asignatura.id)
        .single();

      if (existente) {
        if (existente.activo) {
          await loading.dismiss();
          await this.showToast(
            "Ya estás inscrito en esta asignatura",
            "warning"
          );
          this.router.navigate(["/estudiante/home"]);
          return;
        } else {
          const { error: updateError } = await this.supabase
            .from("estudiantes_asignaturas")
            .update({ activo: true })
            .eq("id", existente.id);

          await loading.dismiss();

          if (updateError) throw updateError;

          await this.showToast("Te has reinscrito exitosamente", "success");
          this.router.navigate(["/estudiante/home"]);
          return;
        }
      }

      const { error } = await this.supabase
        .from("estudiantes_asignaturas")
        .insert({
          estudiante_id: user.id,
          asignatura_id: this.asignatura.id,
          activo: true,
        });

      await loading.dismiss();

      if (error) throw error;

      await this.showToast("Inscripción exitosa", "success");
      this.router.navigate(["/estudiante/home"]);
    } catch (error: any) {
      await loading.dismiss();
      console.error("Error en inscripción:", error);
      await this.showToast("Error al inscribirse: " + error.message, "danger");
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
}
