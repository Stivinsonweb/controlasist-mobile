/**
 * Helpers de formato para las exportaciones a Excel del proyecto. Usa `xlsx-js-style` (fork
 * de SheetJS con soporte de estilos de celda) en vez del paquete `xlsx` community plano, que
 * NO puede escribir negrita/color de fondo — solo leerlos. La API es 100% compatible con
 * `xlsx`, es un reemplazo directo del import.
 *
 * Limitación conocida: ni `xlsx` ni `xlsx-js-style` soportan escribir "freeze panes" (congelar
 * fila de encabezado) al generar el archivo — es una función de solo lectura en ambas
 * librerías. No se pudo implementar; queda documentado igual que la limitación ya conocida de
 * que xlsx no soporta incrustar imágenes (logo institucional).
 */
import * as XLSX from 'xlsx-js-style';

export const EXCEL_HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '10B981' } },
  alignment: { horizontal: 'center' as const, vertical: 'center' as const },
};

/** Aplica el estilo de encabezado (negrita, fondo verde, texto blanco) a una fila completa. */
export function styleHeaderRow(ws: XLSX.WorkSheet, rowIndex: number, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const ref = XLSX.utils.encode_cell({ r: rowIndex, c });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = EXCEL_HEADER_STYLE;
  }
}

/** Zebra striping: fondo gris muy sutil en filas pares del cuerpo (a partir de bodyStartRow). */
export function applyZebraStripes(ws: XLSX.WorkSheet, bodyStartRow: number, bodyEndRow: number, colCount: number) {
  for (let r = bodyStartRow; r <= bodyEndRow; r++) {
    if ((r - bodyStartRow) % 2 !== 1) continue;
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) continue;
      ws[ref].s = { ...(ws[ref].s || {}), fill: { fgColor: { rgb: 'F3F4F6' } } };
    }
  }
}

/** Autofit de columnas según el contenido más largo de cada una (con tope para no desbordar). */
export function autofitColumns(ws: XLSX.WorkSheet, data: any[][], minWidth = 8, maxWidth = 45) {
  const colCount = data.reduce((m, row) => Math.max(m, row.length), 0);
  const widths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let w = minWidth;
    for (const row of data) {
      const val = row[c];
      const len = val == null ? 0 : String(val).length;
      w = Math.max(w, Math.min(len + 2, maxWidth));
    }
    widths.push(w);
  }
  ws['!cols'] = widths.map((wch) => ({ wch }));
}

/** Marca una columna (0-indexed) del cuerpo como porcentaje real (valor 0-100 -> celda 0-1 con formato %). */
export function formatPercentColumn(ws: XLSX.WorkSheet, col: number, bodyStartRow: number, bodyEndRow: number) {
  for (let r = bodyStartRow; r <= bodyEndRow; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: col });
    const cell = ws[ref];
    if (!cell || typeof cell.v !== 'number') continue;
    cell.v = cell.v / 100;
    cell.z = '0%';
  }
}

/** Marca una columna (0-indexed) del cuerpo con formato de fecha (celda ya debe tener un Date válido). */
export function formatDateColumn(ws: XLSX.WorkSheet, col: number, bodyStartRow: number, bodyEndRow: number) {
  for (let r = bodyStartRow; r <= bodyEndRow; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: col });
    const cell = ws[ref];
    if (!cell) continue;
    cell.z = 'dd/mm/yyyy';
  }
}

export { XLSX };
