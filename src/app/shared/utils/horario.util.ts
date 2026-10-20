import { DIAS_SEMANA, Horario } from '../../core/services/asignaturas.service';

/** Orden de la semana empezando en lunes (dia_semana: 0 = domingo ... 6 = sábado). */
export const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

const posicionDia = (dia: number) => ORDEN_DIAS.indexOf(dia);

/** "08:00:00" → "08:00". */
export function horaCorta(hora: string | null | undefined): string {
  return (hora || '').slice(0, 5);
}

/** De lunes a domingo y, dentro de cada día, por hora de inicio. */
export function ordenarHorarios<T extends Pick<Horario, 'dia_semana' | 'hora_inicio'>>(horarios: T[]): T[] {
  return [...horarios].sort((a, b) => posicionDia(a.dia_semana) - posicionDia(b.dia_semana) || a.hora_inicio.localeCompare(b.hora_inicio));
}

export interface DiaConHorarios<T> {
  dia: number;
  nombre: string;
  horarios: T[];
}

/** Agrupa por día (solo los días que tienen clases), en orden de lunes a domingo. */
export function agruparPorDia<T extends Pick<Horario, 'dia_semana' | 'hora_inicio'>>(horarios: T[]): DiaConHorarios<T>[] {
  const ordenados = ordenarHorarios(horarios);
  return ORDEN_DIAS.map((dia) => ({ dia, nombre: DIAS_SEMANA[dia], horarios: ordenados.filter((h) => h.dia_semana === dia) })).filter(
    (d) => d.horarios.length > 0
  );
}
