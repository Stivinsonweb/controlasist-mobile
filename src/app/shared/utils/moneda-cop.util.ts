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
  // Los centavos al final ("20.000,00" o "20,000.50") se descartan: el peso no usa decimales y,
  // si se dejaran, sus dígitos se sumarían al número ("20.000,00" daría 2.000.000).
  const sinCentavos = valor.trim().replace(/[^\d.,]/g, '').replace(/[.,]\d{1,2}$/, '');
  const soloDigitos = sinCentavos.replace(/[^\d]/g, '');
  if (!soloDigitos) return null;
  return parseInt(soloDigitos, 10);
}

/** Ningún precio ni pago de Premium es menor a esto: un valor así casi siempre es "20" en vez de "20.000". */
export const PRECIO_MINIMO_COP = 1000;

/** Mensaje de error si el precio es sospechosamente bajo; null si está bien. */
export function validarPrecioCOP(precio: number | null): string | null {
  if (precio === null || precio >= PRECIO_MINIMO_COP) return null;
  return `El valor debe ser de al menos $${PRECIO_MINIMO_COP.toLocaleString('es-CO')}. ¿Quisiste escribir ${(precio * 1000).toLocaleString('es-CO')}?`;
}

/** Formatea un entero como texto editable con puntos de miles al estilo colombiano (20000 -> "20.000"). */
export function formatearPesosCOP(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return valor.toLocaleString('es-CO');
}
