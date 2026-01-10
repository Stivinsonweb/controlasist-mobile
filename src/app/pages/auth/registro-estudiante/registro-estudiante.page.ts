import { Component } from "@angular/core";
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
  IonItem,
  IonLabel,
  IonInput,
  LoadingController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline,
  schoolOutline,
} from "ionicons/icons";
import { SupabaseService } from "../../../services/supabase/supabase.service";

@Component({
  selector: "app-registro-estudiante",
  templateUrl: "./registro-estudiante.page.html",
  styleUrls: ["./registro-estudiante.page.scss"],
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
    IonItem,
    IonLabel,
    IonInput,
  ],
})
export class RegistroEstudiantePage {
  registroForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowBackOutline,
      schoolOutline,
    });

    this.registroForm = this.fb.group(
      {
        nombres: ["", [Validators.required, Validators.minLength(2)]],
        apellidos: ["", [Validators.required, Validators.minLength(2)]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get("password")?.value;
    const confirmPassword = group.get("confirmPassword")?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async registrar() {
    if (this.registroForm.invalid) {
      await this.showToast(
        "Completa todos los campos correctamente",
        "warning"
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: "Creando cuenta...",
    });
    await loading.present();

    try {
      const { nombres, apellidos, email, password } = this.registroForm.value;

      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombres,
              apellidos,
              tipo_usuario: "estudiante",
            },
          },
        });

      if (authError) {
        await loading.dismiss();

        if (authError.message.includes("User already registered")) {
          await this.showToast("Este correo ya está registrado", "warning");
        } else {
          await this.showToast(
            authError.message || "Error al crear cuenta",
            "danger"
          );
        }
        return;
      }

      if (authData.user) {
        const iniciales = this.generarIniciales(nombres, apellidos);
        const colorAvatar = this.generarColorAleatorio();

        const { error: dbError } = await this.supabase
          .from("estudiantes")
          .insert({
            id: authData.user.id,
            nombres: nombres,
            apellidos: apellidos,
            email: email,
            iniciales: iniciales,
            avatar_color: colorAvatar,
            activo: true,
          });

        if (dbError) {
          console.error("Error insertando estudiante:", dbError);
          throw dbError;
        }

        await loading.dismiss();
        await this.showToast(
          "Cuenta creada exitosamente. Por favor inicia sesión",
          "success"
        );

        this.router.navigate(["/auth/login"]);
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error("Error:", error);
      await this.showToast(error.message || "Error al crear cuenta", "danger");
    }
  }

  generarIniciales(nombres: string, apellidos: string): string {
    const inicial1 = nombres.trim().charAt(0).toUpperCase();
    const inicial2 = apellidos.trim().charAt(0).toUpperCase();
    return inicial1 + inicial2;
  }

  generarColorAleatorio(): string {
    const colores = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
    return colores[Math.floor(Math.random() * colores.length)];
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }

  volverLogin() {
    this.router.navigate(["/login"]);
  }

  get nombres() {
    return this.registroForm.get("nombres");
  }
  get apellidos() {
    return this.registroForm.get("apellidos");
  }
  get email() {
    return this.registroForm.get("email");
  }
  get password() {
    return this.registroForm.get("password");
  }
  get confirmPassword() {
    return this.registroForm.get("confirmPassword");
  }
}
