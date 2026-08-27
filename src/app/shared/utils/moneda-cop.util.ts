/**
 * Los inputs type="number" usan el separador decimal del navegador (punto = decimales), así que
 * si el admin/docente escribe "20.000" pensando en el formato colombiano (punto = miles), el
 * navegador lo interpreta como 20 (veinte enteros, tres ceros decimales) — se guardaba mal.
 * Estos inputs ahora son type="text" y usan estas funciones: se ignora cualquier separador
 * (puntos o comas) y se toman solo los dígitos, así "20.000", "20,000" y "20000" dan lo mismo.
 */
export function parsearPesosCOP(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Math.round(valor);
  const soloDigitos = valor.replace(/[^\d]/g, '');
  if (!soloDigitos) return null;
  return parseInt(soloDigitos, 10);
}

/** Formatea un entero como texto editable con puntos de miles al estilo colombiano (20000 -> "20.000"). */
export function formatearPesosCOP(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return valor.toLocaleString('es-CO');
}
