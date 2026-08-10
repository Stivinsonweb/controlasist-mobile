import jsPDF from 'jspdf';

/**
 * Encabezado consistente para todos los PDF exportables del proyecto: logo (si aplica),
 * título en negrita, subtítulo gris, y una línea de marca separadora. Devuelve el `startY`
 * sugerido para la tabla que sigue.
 */
export interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  logoDataUrl?: string | null;
}

export function addPdfHeader(doc: jsPDF, opts: PdfHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const textX = opts.logoDataUrl ? 38 : 14;

  if (opts.logoDataUrl) {
    try {
      doc.addImage(opts.logoDataUrl, 'PNG', 14, 8, 18, 18);
    } catch (e) {
      console.error('No se pudo incrustar el logo en el encabezado del PDF:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(opts.title, textX, 15, { maxWidth: pageWidth - textX - 14 });

  let cursorY = 21;
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(opts.subtitle, textX, cursorY, { maxWidth: pageWidth - textX - 14 });
    cursorY += 5;
  }

  const lineY = Math.max(cursorY + 3, opts.logoDataUrl ? 30 : cursorY + 3);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.7);
  doc.line(14, lineY, pageWidth - 14, lineY);

  return lineY + 8;
}

/** Título de sección intermedio (para PDFs con varias secciones: resumen + detalle, etc.). */
export function addPdfSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(title, 14, y);
  return y + 6;
}

/** Pie de página consistente en TODAS las páginas: fecha de generación, número de página, logo pequeño. */
export function addPdfFooter(doc: jsPDF, opts: { logoDataUrl?: string | null } = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    if (opts.logoDataUrl) {
      try {
        doc.addImage(opts.logoDataUrl, 'PNG', 14, pageHeight - 13, 9, 9);
      } catch {
        // No crítico si falla en una página adicional.
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado el ${fecha}`, opts.logoDataUrl ? 26 : 14, pageHeight - 9);
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - 14, pageHeight - 9, { align: 'right' });
  }
}

/** Config base de jspdf-autotable con estilo de marca: encabezado verde/blanco, zebra striping, márgenes generosos. */
export function brandTableOptions(startY: number) {
  return {
    startY,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59] as [number, number, number],
      lineColor: [226, 232, 240] as [number, number, number],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [16, 185, 129] as [number, number, number],
      textColor: 255,
      fontStyle: 'bold' as const,
      fontSize: 9.5,
      halign: 'left' as const,
    },
    alternateRowStyles: { fillColor: [243, 244, 246] as [number, number, number] },
    margin: { left: 14, right: 14, bottom: 22 },
  };
}
