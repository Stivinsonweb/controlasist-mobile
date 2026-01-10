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
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  AlertController,
  LoadingController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  peopleCircleOutline,
  mailOutline,
  mail,
  lockClosedOutline,
  lockClosed,
  eye,
  eyeOff,
  checkmarkDoneOutline,
  personAddOutline,
  shieldCheckmark,
  alertCircle,
  personOutline,
  schoolOutline,
  keyOutline,
} from "ionicons/icons";
import { AuthService } from "../../../services/auth/auth.service";
import { SupabaseService } from "../../../services/supabase/supabase.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
  ],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  tipoUsuario: "docente" | "estudiante" = "docente";

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private supabase: SupabaseService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      peopleCircleOutline,
      mailOutline,
      mail,
      lockClosedOutline,
      lockClosed,
      eye,
      eyeOff,
      checkmarkDoneOutline,
      personAddOutline,
      shieldCheckmark,
      alertCircle,
      personOutline,
      schoolOutline,
      keyOutline,
    });
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: "Iniciando sesión...",
        spinner: "crescent",
        cssClass: "custom-loading",
      });
      await loading.present();

      try {
        const { email, password } = this.loginForm.value;
        const result = await this.authService.login({ email, password });

        await loading.dismiss();

        if (result.success && result.profile) {
          const nombre = result.profile.nombres || "Usuario";
          const rol = result.profile.rol;

          console.log("Login exitoso. Rol:", rol);

          if (result.success && result.profile) {
            const nombre = result.profile.nombres || "Usuario";
            const rol = result.profile.rol as
              | "docente"
              | "administrador"
              | "estudiante";

            console.log("Login exitoso. Rol:", rol);

            if (this.tipoUsuario === "estudiante") {
              if (rol !== "estudiante") {
                await this.supabase.auth.signOut();
                await this.showAlert(
                  "Acceso denegado",
                  'Esta cuenta no es de estudiante. Por favor selecciona "Docente" para iniciar sesión.'
                );
                return;
              }

              await this.showToast(`Bienvenido ${nombre}`, "success");
              this.router.navigate(["/estudiante/home"]);
            } else {
              if (rol !== "administrador" && rol !== "docente") {
                await this.supabase.auth.signOut();
                await this.showAlert(
                  "Acceso denegado",
                  'Esta cuenta es de estudiante. Por favor selecciona "Estudiante" para iniciar sesión.'
                );
                return;
              }

              await this.showToast(`Bienvenido ${nombre}`, "success");

              if (rol === "administrador") {
                console.log("Redirigiendo a /admin/dashboard");
                this.router.navigate(["/admin/dashboard"]);
              } else {
                console.log("Redirigiendo a /home");
                this.router.navigate(["/home"]);
              }
            }
          }
        } else {
          let errorMessage = "Credenciales inválidas";

          if (result.error?.includes("Invalid login credentials")) {
            errorMessage =
              "Correo o contraseña incorrectos. Verifica tus datos.";
          } else if (result.error?.includes("Email not confirmed")) {
            errorMessage =
              "Debes confirmar tu correo electrónico antes de iniciar sesión.";
          } else if (result.error?.includes("Usuario no encontrado")) {
            errorMessage =
              "Tu cuenta no está registrada correctamente en el sistema.";
          } else {
            errorMessage = result.error || "Error al iniciar sesión";
          }

          await this.showAlert("Error de autenticación", errorMessage);
        }
      } catch (error: any) {
        await loading.dismiss();
        await this.showAlert(
          "Error",
          error.message || "Error inesperado al iniciar sesión"
        );
      }
    } else {
      if (this.email?.hasError("required")) {
        await this.showToast("El correo electrónico es requerido", "warning");
      } else if (this.email?.hasError("email")) {
        await this.showToast("Ingresa un correo electrónico válido", "warning");
      } else if (this.password?.hasError("required")) {
        await this.showToast("La contraseña es requerida", "warning");
      } else if (this.password?.hasError("minlength")) {
        await this.showToast(
          "La contraseña debe tener al menos 6 caracteres",
          "warning"
        );
      }
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: "Recuperar contraseña",
      message:
        "Ingresa tu correo electrónico registrado para recibir un enlace de recuperación.",
      inputs: [
        {
          name: "email",
          type: "email",
          placeholder: "correo@ejemplo.com",
          attributes: {
            autocomplete: "email",
            inputmode: "email",
          },
        },
      ],
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "alert-button-cancel",
        },
        {
          text: "Enviar",
          cssClass: "alert-button-confirm",
          handler: async (data) => {
            if (!data.email) {
              await this.showToast(
                "Por favor ingresa un correo electrónico",
                "warning"
              );
              return false;
            }

            if (!this.isValidEmail(data.email)) {
              await this.showToast(
                "Por favor ingresa un correo válido",
                "warning"
              );
              return false;
            }

            await alert.dismiss();

            const loading = await this.loadingController.create({
              message: "Verificando correo...",
              spinner: "crescent",
            });
            await loading.present();

            const result = await this.authService.forgotPassword(data.email);

            await loading.dismiss();

            if (result.success) {
              await this.showSuccessAlert(
                "Correo enviado",
                result.message ||
                  "Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y carpeta de spam."
              );
            } else {
              await this.showAlert(
                "Error",
                result.error ||
                  "No se pudo enviar el correo de recuperación. Verifica que el correo esté registrado."
              );
            }

            return false;
          },
        },
      ],
      cssClass: "custom-alert",
    });

    await alert.present();
  }

  goToRegister() {
    if (this.tipoUsuario === "estudiante") {
      this.router.navigate(["/auth/registro-estudiante"]);
    } else {
      this.router.navigate(["/auth/register"]);
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ["OK"],
      cssClass: "custom-alert",
    });
    await alert.present();
  }

  async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: "Entendido",
          role: "confirm",
        },
      ],
      cssClass: "custom-alert success-alert",
    });
    await alert.present();
  }

  async showToast(message: string, color: string = "success") {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: "top",
      color,
      cssClass: "custom-toast",
    });
    await toast.present();
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get email() {
    return this.loginForm.get("email");
  }

  get password() {
    return this.loginForm.get("password");
  }
}
