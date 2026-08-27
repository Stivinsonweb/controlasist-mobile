export type LogoPosicion = 'izquierda' | 'centro' | 'derecha';
export type LogoTamano = 'pequeno' | 'mediano' | 'grande';
export type SeccionReporteId = 'info_general' | 'tabla_asistencia' | 'listado_estudiantes' | 'estadisticas_resumen' | 'observaciones' | 'firmas';

/**
 * 'historial_clases' = una fila por sesión dictada (fecha, tema, horas...) — el formato original.
 * 'matriz_estudiantes' = una fila por estudiante, una columna por fecha de clase, con el estado
 * de cada uno (P/T/J/A) — el formato de "lista de asistencia" clásico (el más común en plantillas
 * reales de universidades/colegios: estudiantes en filas, fechas en columnas).
 */
export type TipoTablaAsistencia = 'historial_clases' | 'matriz_estudiantes';
export type TamanoFuenteTabla = 'compacta' | 'normal' | 'grande';
export type ColorTablaModo = 'acento' | 'personalizado';

/**
 * Cambia solo terminología y qué campos de la asignatura se muestran en "Información general" —
 * el esquema real de datos (grupo/nivel/programa/facultad) no cambia, un colegio simplemente usa
 * esos mismos campos con otro nombre (nivel -> grado, programa -> jornada) y no usa facultad.
 */
export type TipoInstitucion = 'universidad' | 'escolar';

export interface LabelsInstitucion {
  docente: string;
  asignatura: string;
  nivel: string;
  segundoCampo: string;
  segundaFirmaSugerida: string;
  tituloSugerido: string;
}

export const LABELS_INSTITUCION: Record<TipoInstitucion, LabelsInstitucion> = {
  universidad: {
    docente: 'Docente',
    asignatura: 'Asignatura',
    nivel: 'Nivel',
    segundoCampo: 'Programa',
    segundaFirmaSugerida: 'Coordinador Académico',
    tituloSugerido: 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE',
  },
  escolar: {
    docente: 'Profesor',
    asignatura: 'Área / Asignatura',
    nivel: 'Grado',
    segundoCampo: 'Jornada',
    segundaFirmaSugerida: 'Director de Grupo',
    tituloSugerido: 'PLANILLA DE ASISTENCIA ESCOLAR',
  },
};

export interface SeccionReporteDescriptor {
  id: SeccionReporteId;
  label: string;
  /** Las secciones no opcionales siempre están activas — el docente solo puede reordenarlas. */
  opcional: boolean;
}

/** El título del formato y la segunda firma viven en formato_reporte_titulo / formato_reporte_segunda_firma
 *  (ya existentes, compartidos con la config institucional de la página de reportes) — no se duplican aquí. */
export interface PlantillaReporte {
  tipo_institucion: TipoInstitucion;
  logo_posicion: LogoPosicion;
  logo_tamano: LogoTamano;
  subtitulo_formato: string;
  orden_secciones: SeccionReporteId[];
  secciones_activas: SeccionReporteId[];
  observaciones_texto: string;

  tipo_tabla_asistencia: TipoTablaAsistencia;
  /** Columnas opcionales de la tabla "Historial de clases" — No. y Fecha siempre se muestran. */
  columnas_historial: { tema: boolean; horas: boolean; firma: boolean };
  /** Columnas opcionales de la tabla "Matriz de estudiantes" — No. y Nombre siempre se muestran. */
  columnas_matriz: { cedula: boolean; porcentaje: boolean };
  /** Muestra la leyenda de convenciones (P=Presente, T=Tarde, J=Justificado, A=Ausente). */
  mostrar_leyenda: boolean;
  tamano_fuente: TamanoFuenteTabla;
  color_tabla_modo: ColorTablaModo;
  /** Solo se usa cuando color_tabla_modo = 'personalizado'. */
  color_tabla_hex: string;

  updated_at: string;
}

export const SECCIONES_REPORTE: SeccionReporteDescriptor[] = [
  { id: 'info_general', label: 'Información general', opcional: false },
  { id: 'tabla_asistencia', label: 'Tabla de asistencia', opcional: false },
  { id: 'listado_estudiantes', label: 'Listado de estudiantes matriculados', opcional: true },
  { id: 'estadisticas_resumen', label: 'Estadísticas resumen del periodo', opcional: true },
  { id: 'observaciones', label: 'Observaciones generales', opcional: true },
  { id: 'firmas', label: 'Firmas', opcional: false },
];

export function defaultPlantillaReporte(): PlantillaReporte {
  return {
    tipo_institucion: 'universidad',
    logo_posicion: 'izquierda',
    logo_tamano: 'mediano',
    subtitulo_formato: '',
    orden_secciones: SECCIONES_REPORTE.map((s) => s.id),
    secciones_activas: [],
    observaciones_texto: '',

    tipo_tabla_asistencia: 'historial_clases',
    columnas_historial: { tema: true, horas: true, firma: true },
    columnas_matriz: { cedula: true, porcentaje: true },
    mostrar_leyenda: true,
    tamano_fuente: 'normal',
    color_tabla_modo: 'acento',
    color_tabla_hex: '#10b981',

    updated_at: new Date().toISOString(),
  };
}

/**
 * Combina la plantilla guardada del docente con los defaults, y además repara `orden_secciones`:
 * como es un array, el spread `{ ...defaultPlantillaReporte(), ...guardada }` lo reemplaza entero
 * en vez de fusionarlo — así que una plantilla guardada ANTES de agregar una sección nueva (ej.
 * "listado_estudiantes") nunca la incluiría, aunque exista en el sistema. Aquí se le agrega al
 * final cualquier sección nueva que falte, y se quitan ids que ya no existan.
 */
export function normalizarPlantilla(guardada: Partial<PlantillaReporte> | null | undefined): PlantillaReporte {
  const base = defaultPlantillaReporte();
  const combinada: PlantillaReporte = { ...base, ...(guardada || {}) };

  const idsValidos = SECCIONES_REPORTE.map((s) => s.id);
  const ordenExistente = (combinada.orden_secciones || []).filter((id) => idsValidos.includes(id));
  const faltantes = idsValidos.filter((id) => !ordenExistente.includes(id));
  combinada.orden_secciones = [...ordenExistente, ...faltantes];

  return combinada;
}

/** Una sección está visible en el reporte si no es opcional, o si el docente la activó explícitamente. */
export function seccionActiva(plantilla: PlantillaReporte, id: SeccionReporteId): boolean {
  const descriptor = SECCIONES_REPORTE.find((s) => s.id === id);
  return !descriptor?.opcional || plantilla.secciones_activas.includes(id);
}

export const LOGO_TAMANO_MM: Record<LogoTamano, number> = { pequeno: 14, mediano: 20, grande: 26 };

export const TAMANO_FUENTE_PT: Record<TamanoFuenteTabla, number> = { compacta: 7, normal: 8, grande: 9.5 };

/** RGB para jsPDF (headStyles.fillColor) — deriva del hex elegido por el docente o del acento por defecto. */
export function hexToRgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '');
  const bigint = parseInt(limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
