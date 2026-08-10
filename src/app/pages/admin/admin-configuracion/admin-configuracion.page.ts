import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ConfiguracionApp, ConfiguracionAppService } from '../../../core/services/configuracion-app.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configuracion.page.html',
})
export class AdminConfiguracionPage implements OnInit {
  loading = signal(true);
  config = signal<ConfiguracionApp | null>(null);
  savingMantenimiento = false;
  savingActualizacion = false;
  savingGeneral = false;

  puedeCerrarApp = false;
  puedeForzarActualizacion = false;
  puedeModificarConfig = false;

  // Copias editables por sección (para no mutar el signal directamente).
  mantenimiento = { app_activa: true, permitir_login: true, mostrar_mensaje: false, titulo_mensaje: '', mensaje: '' };
  actualizacion = { requiere_actualizacion: false, version_actual: '', version_minima_requerida: '' };
  general = { permitir_registro: true, permitir_tomar_asistencia: true, url_soporte: '', url_documentacion: '' };

  constructor(
    private authService: AuthService,
    private configuracionService: ConfiguracionAppService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const perfil = this.authService.currentProfileValue;
    this.puedeCerrarApp = !!perfil?.puede_cerrar_app;
    this.puedeForzarActualizacion = !!perfil?.puede_forzar_actualizacion;
    this.puedeModificarConfig = !!perfil?.puede_modificar_config;

    this.loading.set(true);
    try {
      const config = await this.configuracionService.obtener();
      this.config.set(config);
      if (config) {
        this.mantenimiento = {
          app_activa: config.app_activa,
          permitir_login: config.permitir_login,
          mostrar_mensaje: config.mostrar_mensaje,
          titulo_mensaje: config.titulo_mensaje || '',
          mensaje: config.mensaje || '',
        };
        this.actualizacion = {
          requiere_actualizacion: config.requiere_actualizacion,
          version_actual: config.version_actual || '',
          version_minima_requerida: config.version_minima_requerida || '',
        };
        this.general = {
          permitir_registro: config.permitir_registro,
          permitir_tomar_asistencia: config.permitir_tomar_asistencia,
          url_soporte: config.url_soporte || '',
          url_documentacion: config.url_documentacion || '',
        };
      }
    } catch (e) {
      console.error('Error cargando configuración:', e);
      this.toast.error('No se pudo cargar la configuración del sistema');
    } finally {
      this.loading.set(false);
    }
  }

  async guardarMantenimiento() {
    const config = this.config();
    if (!config) return;
    this.savingMantenimiento = true;
    try {
      const actualizado = await this.configuracionService.actualizar(config.id, this.mantenimiento);
      this.config.set(actualizado);
      this.toast.success('Configuración de mantenimiento guardada');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar la configuración');
    } finally {
      this.savingMantenimiento = false;
    }
  }

  async guardarActualizacion() {
    const config = this.config();
    if (!config) return;
    this.savingActualizacion = true;
    try {
      const actualizado = await this.configuracionService.actualizar(config.id, {
        requiere_actualizacion: this.actualizacion.requiere_actualizacion,
        version_actual: this.actualizacion.version_actual || null,
        version_minima_requerida: this.actualizacion.version_minima_requerida || null,
      });
      this.config.set(actualizado);
      this.toast.success('Los usuarios recibirán la nueva versión en su próxima visita');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar la configuración');
    } finally {
      this.savingActualizacion = false;
    }
  }

  async guardarGeneral() {
    const config = this.config();
    if (!config) return;
    this.savingGeneral = true;
    try {
      const actualizado = await this.configuracionService.actualizar(config.id, {
        permitir_registro: this.general.permitir_registro,
        permitir_tomar_asistencia: this.general.permitir_tomar_asistencia,
        url_soporte: this.general.url_soporte || null,
        url_documentacion: this.general.url_documentacion || null,
      });
      this.config.set(actualizado);
      this.toast.success('Configuración general guardada');
    } catch (e: any) {
      this.toast.error(e.message || 'No se pudo guardar la configuración');
    } finally {
      this.savingGeneral = false;
    }
  }
}
