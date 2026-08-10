# ControlAsist Web

Migración del proyecto móvil **controlasist-mobile** (Ionic/Angular + Capacitor) hacia una
aplicación **web** con Angular 21 + Tailwind CSS + Supabase, instalable como PWA
(acceso directo en el celular).

## Estado actual (Fase 1)

✅ Completado:
- Estructura del proyecto Angular standalone + Tailwind (misma paleta de marca: verde `#10b981` / azul `#3b82f6`)
- Conexión a Supabase reutilizando tus credenciales (`SupabaseService`)
- `AuthService` migrado completo: login con detección de rol (docente/administrador/estudiante), registro de docente, recuperación de contraseña, actualización de contraseña
- Guards de ruta (`authGuard`, `guestGuard`)
- Layout profesional con sidebar de íconos, responsive (colapsa en móvil), menú dinámico según el rol del usuario
- Página de **Login** rediseñada (split-screen, selector docente/estudiante, recuperación de contraseña en modal)
- Página de **Registro de docente**
- **Dashboard de administrador** con estadísticas reales desde Supabase (conteo de docentes/estudiantes/administradores)
- Sistema de notificaciones tipo *toast* propio (reemplaza `ToastController` de Ionic)
- **PWA**: `manifest.webmanifest`, Service Worker (`@angular/service-worker`), íconos generados, y banner de instalación ("Agregar a inicio") que aparece automáticamente en navegadores compatibles

🚧 Pendiente (próxima fase — rutas ya registradas con página "en construcción"):
- Home docente (asignaturas)
- Home / perfil / inscripción de estudiante
- Gestión de docentes, estudiantes (admin)
- Estadísticas con gráficos (Chart.js)
- Crear / editar / detalle de asignaturas, horarios
- Registro de asistencia por clase
- Reportes (exportación PDF/Excel)
- Registro de estudiante, reset de contraseña

> Nota sobre el punto 3 de tu mensaje ("falta una sesión por mejorar"): el `AuthService`
> ya quedó migrado completo y probado en su lógica (login, registro, recuperación,
> logout, guards). Si te referías a una pantalla o flujo específico que fallaba en la
> app móvil, cuéntame cuál para revisarlo primero en la siguiente fase.

## Cómo correrlo

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

## Build de producción (con Service Worker activo)

```bash
npm run build
```

## Instalar como app (PWA)

Al entrar desde Chrome/Edge (Android o desktop) o Safari (iOS, "Compartir → Agregar a inicio"),
aparecerá un banner para instalar ControlAsist como acceso directo, sin pasar por ninguna tienda de apps.
