/**
 * Set curado de íconos temáticos para asignaturas — identificadores de texto simples
 * (guardados en `asignaturas.icono`) que el SubjectIconComponent mapea a un SVG inline.
 * Sin emojis (inconsistentes entre SO) y sin librería externa de íconos: mismo patrón
 * de `stroke="currentColor"` que ya usan los íconos del sidebar/layout.
 */
export interface SubjectIconOption {
  id: string;
  label: string;
}

export const SUBJECT_ICONS: SubjectIconOption[] = [
  { id: 'libro', label: 'Libro' },
  { id: 'calculadora', label: 'Matemáticas' },
  { id: 'codigo', label: 'Programación' },
  { id: 'pincel', label: 'Arte' },
  { id: 'musica', label: 'Música' },
  { id: 'ciencia', label: 'Ciencia' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'deportes', label: 'Deportes' },
  { id: 'historia', label: 'Historia' },
  { id: 'negocios', label: 'Negocios' },
  { id: 'diseno', label: 'Diseño' },
  { id: 'ingenieria', label: 'Ingeniería' },
  { id: 'salud', label: 'Salud' },
  { id: 'otro', label: 'Otro' },
];

export const DEFAULT_SUBJECT_ICON = 'libro';
