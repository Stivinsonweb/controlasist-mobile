/**
 * Deriva un tema visual (degradado de 2 tonos + sombra a juego) a partir del campo
 * `color` de una asignatura. Los 8 valores del selector de color del formulario
 * (ver asignaturas/crear/crear.page.ts `colores`) mapean a un degradado curado y
 * vibrante; cualquier otro hex (datos antiguos, etc.) cae a un degradado genérico
 * derivado del mismo tono.
 */
export interface SubjectTheme {
  from: string;
  to: string;
  shadow: string;
}

const CURATED_GRADIENTS: Record<string, SubjectTheme> = {
  '#3b82f6': { from: '#3b82f6', to: '#6366f1', shadow: 'rgba(59, 130, 246, 0.45)' },   // azul -> índigo
  '#10b981': { from: '#10b981', to: '#0d9488', shadow: 'rgba(16, 185, 129, 0.45)' },   // verde -> teal
  '#f59e0b': { from: '#f59e0b', to: '#f97316', shadow: 'rgba(245, 158, 11, 0.45)' },   // ámbar -> naranja
  '#ef4444': { from: '#ef4444', to: '#f43f5e', shadow: 'rgba(239, 68, 68, 0.45)' },    // rojo -> rosa
  '#8b5cf6': { from: '#8b5cf6', to: '#3b82f6', shadow: 'rgba(139, 92, 246, 0.45)' },   // púrpura -> azul
  '#06b6d4': { from: '#06b6d4', to: '#2563eb', shadow: 'rgba(6, 182, 212, 0.45)' },    // cian -> azul
  '#ec4899': { from: '#ec4899', to: '#a855f7', shadow: 'rgba(236, 72, 153, 0.45)' },   // rosa -> púrpura
  '#64748b': { from: '#64748b', to: '#475569', shadow: 'rgba(100, 116, 139, 0.35)' },  // pizarra (neutro)
};

export function getSubjectTheme(color: string | null | undefined): SubjectTheme {
  const hex = (color || '#3b82f6').toLowerCase();
  return CURATED_GRADIENTS[hex] ?? { from: hex, to: hex, shadow: 'rgba(15, 23, 42, 0.35)' };
}

export function subjectGradientStyle(color: string | null | undefined): Record<string, string> {
  const theme = getSubjectTheme(color);
  return {
    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
  };
}

export function subjectShadowStyle(color: string | null | undefined, elevated = false): Record<string, string> {
  const theme = getSubjectTheme(color);
  return {
    'box-shadow': elevated
      ? `0 20px 40px -12px ${theme.shadow}`
      : `0 10px 28px -10px ${theme.shadow}`,
  };
}

/** Paletas curadas de "tema de acento" para personalización de perfil (docente). */
export interface AccentPalette {
  id: string;
  label: string;
  from: string;
  to: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  { id: 'emerald-teal', label: 'Esmeralda', from: '#10b981', to: '#0d9488' },
  { id: 'blue-indigo', label: 'Océano', from: '#3b82f6', to: '#6366f1' },
  { id: 'purple-blue', label: 'Violeta', from: '#8b5cf6', to: '#3b82f6' },
  { id: 'amber-orange', label: 'Ámbar', from: '#f59e0b', to: '#f97316' },
  { id: 'pink-purple', label: 'Fucsia', from: '#ec4899', to: '#a855f7' },
];

export function getAccentPalette(id: string | null | undefined): AccentPalette {
  return ACCENT_PALETTES.find((p) => p.id === id) ?? ACCENT_PALETTES[0];
}
