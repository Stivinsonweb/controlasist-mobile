/**
 * Fecha local del dispositivo en formato YYYY-MM-DD. No usar `toISOString().split('T')[0]`:
 * esa es la fecha en UTC, y en Colombia (UTC-5) después de las 7 p. m. ya da el día siguiente.
 */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
