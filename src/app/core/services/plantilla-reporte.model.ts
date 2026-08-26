export type LogoPosicion = 'izquierda' | 'centro' | 'derecha';
export type LogoTamano = 'pequeno' | 'mediano' | 'grande';
export type SeccionReporteId = 'info_general' | 'tabla_asistencia' | 'estadisticas_resumen' | 'observaciones' | 'firmas';

export interface SeccionReporteDescriptor {
  id: SeccionReporteId;
  label: string;
  /** Las secciones no opcionales siempre están activas — el docente solo puede reordenarlas. */
  opcional: boolean;
}

/** El título del formato y la segunda firma viven en formato_reporte_titulo / formato_reporte_segunda_firma
 *  (ya existentes, compartidos con la config institucional de la página de reportes) — no se duplican aquí. */
export interface PlantillaReporte {
  logo_posicion: LogoPosicion;
  logo_tamano: LogoTamano;
  subtitulo_formato: string;
  orden_secciones: SeccionReporteId[];
  secciones_activas: SeccionReporteId[];
  observaciones_texto: string;
  updated_at: string;
}

export const SECCIONES_REPORTE: SeccionReporteDescriptor[] = [
  { id: 'info_general', label: 'Información general', opcional: false },
  { id: 'tabla_asistencia', label: 'Tabla de clases', opcional: false },
  { id: 'estadisticas_resumen', label: 'Estadísticas resumen del periodo', opcional: true },
  { id: 'observaciones', label: 'Observaciones generales', opcional: true },
  { id: 'firmas', label: 'Firmas', opcional: false },
];

export function defaultPlantillaReporte(): PlantillaReporte {
  return {
    logo_posicion: 'izquierda',
    logo_tamano: 'mediano',
    subtitulo_formato: '',
    orden_secciones: SECCIONES_REPORTE.map((s) => s.id),
    secciones_activas: [],
    observaciones_texto: '',
    updated_at: new Date().toISOString(),
  };
}

/** Una sección está visible en el reporte si no es opcional, o si el docente la activó explícitamente. */
export function seccionActiva(plantilla: PlantillaReporte, id: SeccionReporteId): boolean {
  const descriptor = SECCIONES_REPORTE.find((s) => s.id === id);
  return !descriptor?.opcional || plantilla.secciones_activas.includes(id);
}

export const LOGO_TAMANO_MM: Record<LogoTamano, number> = { pequeno: 14, mediano: 20, grande: 26 };
