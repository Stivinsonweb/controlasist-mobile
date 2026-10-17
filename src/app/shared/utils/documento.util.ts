/**
 * Número de documento (cédula, TI, CE, pasaporte) sin separadores: "1.020.345.678" -> "1020345678".
 * Quita puntos, comas, espacios y guiones; conserva letras (pasaportes) y las pasa a mayúscula.
 * La base aplica la misma limpieza con un trigger, así que ningún camino guarda cédulas con puntos.
 */
export function limpiarDocumento(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/[.,\s-]/g, '').toUpperCase();
}
