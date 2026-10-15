import jsPDF from 'jspdf';
import { EstiloDiseno, LogoPosicion } from '../../core/services/plantilla-reporte.model';

/**
 * Dibujo del PDF institucional según el diseño de la plantilla. Todo es monocromático (negro y
 * grises) — el mismo criterio que la vista previa de la página Premium.
 */

type Rgb = [number, number, number];

const NEGRO: Rgb = [17, 17, 17];
const GRIS_TEXTO: Rgb = [90, 90, 90];
const GRIS_CABECERA: Rgb = [226, 226, 226];
const GRIS_ZEBRA: Rgb = [245, 245, 245];
const GRIS_LINEA: Rgb = [170, 170, 170];
const MARGEN = 14;

export interface EncabezadoPdf {
  titulo: string;
  subtitulo?: string;
  codigo?: string;
  version?: string;
  logoDataUrl?: string | null;
  logoSize: number;
  logoPosicion: LogoPosicion;
}

function dibujarLogo(doc: jsPDF, dataUrl: string | null | undefined, x: number, y: number, size: number) {
  if (!dataUrl) return;
  try {
    doc.addImage(dataUrl, 'PNG', x, y, size, size);
  } catch (e) {
    console.error('No se pudo incrustar el logo en el PDF:', e);
  }
}

function logoX(pos: LogoPosicion, size: number, pageWidth: number): number {
  if (pos === 'centro') return pageWidth / 2 - size / 2;
  if (pos === 'derecha') return pageWidth - MARGEN - size;
  return MARGEN;
}

/** Dibuja el encabezado del formato y devuelve la Y donde empieza el contenido. */
export function dibujarEncabezadoPlantilla(doc: jsPDF, estilo: EstiloDiseno, e: EncabezadoPdf): number {
  const W = doc.internal.pageSize.getWidth();
  const fuente = estilo.fuente;
  const codigo = e.codigo || '—';
  const version = e.version || '—';
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (estilo.encabezado === 'caja') {
    // Recuadro de 3 casillas: logo | título | código, versión y fecha (formato ISO institucional).
    const alto = Math.max(e.logoSize + 6, 24);
    const y0 = 10;
    const anchoLogo = 34;
    const anchoDatos = 46;
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.4);
    doc.rect(MARGEN, y0, W - MARGEN * 2, alto);
    doc.line(MARGEN + anchoLogo, y0, MARGEN + anchoLogo, y0 + alto);
    doc.line(W - MARGEN - anchoDatos, y0, W - MARGEN - anchoDatos, y0 + alto);
    for (let i = 1; i < 3; i++) doc.line(W - MARGEN - anchoDatos, y0 + (alto / 3) * i, W - MARGEN, y0 + (alto / 3) * i);

    const tamLogo = Math.min(e.logoSize, alto - 6, anchoLogo - 6);
    if (e.logoDataUrl) {
      dibujarLogo(doc, e.logoDataUrl, MARGEN + (anchoLogo - tamLogo) / 2, y0 + (alto - tamLogo) / 2, tamLogo);
    } else {
      doc.setFont(fuente, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRIS_TEXTO);
      doc.text('LOGO', MARGEN + anchoLogo / 2, y0 + alto / 2 + 1, { align: 'center' });
    }

    const centroX = MARGEN + anchoLogo + (W - MARGEN * 2 - anchoLogo - anchoDatos) / 2;
    const anchoTitulo = W - MARGEN * 2 - anchoLogo - anchoDatos - 6;
    doc.setFont(fuente, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NEGRO);
    const lineasTitulo = doc.splitTextToSize(e.titulo.toUpperCase(), anchoTitulo);
    const altoTexto = lineasTitulo.length * 4.4 + (e.subtitulo ? 4.5 : 0);
    let ty = y0 + (alto - altoTexto) / 2 + 3.4;
    doc.text(lineasTitulo, centroX, ty, { align: 'center' });
    ty += lineasTitulo.length * 4.4;
    if (e.subtitulo) {
      doc.setFont(fuente, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(e.subtitulo, centroX, ty, { align: 'center', maxWidth: anchoTitulo });
    }

    doc.setFont(fuente, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...NEGRO);
    const filas = [`Código: ${codigo}`, `Versión: ${version}`, `Fecha: ${fecha}`];
    filas.forEach((t, i) => doc.text(t, W - MARGEN - anchoDatos + 3, y0 + (alto / 3) * i + alto / 6 + 1.2));
    return y0 + alto + 8;
  }

  if (estilo.encabezado === 'banda') {
    // Banda negra a todo lo ancho con el título en blanco; el logo va sobre un recuadro blanco.
    const alto = Math.max(e.logoSize + 8, 28);
    doc.setFillColor(...NEGRO);
    doc.rect(0, 0, W, alto, 'F');
    const tamLogo = Math.min(e.logoSize, alto - 8);
    const conLogo = !!e.logoDataUrl;
    const xLogo = e.logoPosicion === 'derecha' ? W - MARGEN - tamLogo - 2 : MARGEN;
    if (conLogo) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(xLogo - 1, (alto - tamLogo) / 2 - 1, tamLogo + 2, tamLogo + 2, 1.5, 1.5, 'F');
      dibujarLogo(doc, e.logoDataUrl, xLogo, (alto - tamLogo) / 2, tamLogo);
    }
    const xTexto = conLogo && e.logoPosicion !== 'derecha' ? MARGEN + tamLogo + 6 : MARGEN;
    doc.setFont(fuente, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(e.titulo.toUpperCase(), xTexto, alto / 2 - (e.subtitulo ? 1 : -1.5), { maxWidth: W - xTexto - 60 });
    if (e.subtitulo) {
      doc.setFont(fuente, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(210, 210, 210);
      doc.text(e.subtitulo, xTexto, alto / 2 + 5, { maxWidth: W - xTexto - 60 });
    }
    if (!(conLogo && e.logoPosicion === 'derecha')) {
      doc.setFont(fuente, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(220, 220, 220);
      doc.text(`Código: ${codigo}`, W - MARGEN, alto / 2 - 2, { align: 'right' });
      doc.text(`Versión: ${version}`, W - MARGEN, alto / 2 + 3, { align: 'right' });
    }
    return alto + 9;
  }

  if (estilo.encabezado === 'centrado') {
    let y = 10;
    if (e.logoDataUrl) {
      const x = e.logoPosicion === 'centro' ? W / 2 - e.logoSize / 2 : logoX(e.logoPosicion, e.logoSize, W);
      dibujarLogo(doc, e.logoDataUrl, x, y, e.logoSize);
      if (e.logoPosicion === 'centro') y += e.logoSize + 5;
      else y += 5;
    } else {
      y += 4;
    }
    doc.setFont(fuente, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NEGRO);
    const lineas = doc.splitTextToSize(e.titulo.toUpperCase(), W - 80);
    doc.text(lineas, W / 2, y, { align: 'center' });
    y += lineas.length * 5;
    if (e.subtitulo) {
      doc.setFont(fuente, 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(e.subtitulo, W / 2, y, { align: 'center', maxWidth: W - 80 });
      y += 5;
    }
    doc.setFont(fuente, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(`Código: ${codigo}     Versión: ${version}     Fecha: ${fecha}`, W / 2, y, { align: 'center' });
    y = Math.max(y + 4, e.logoDataUrl && e.logoPosicion !== 'centro' ? 10 + e.logoSize + 3 : 0);
    // Doble línea (gruesa + fina), típica de actas y formatos oficiales.
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.8);
    doc.line(MARGEN, y, W - MARGEN, y);
    doc.setLineWidth(0.25);
    doc.line(MARGEN, y + 1.4, W - MARGEN, y + 1.4);
    return y + 9;
  }

  // 'linea': título alineado a la izquierda, datos a la derecha y una línea fina.
  let y = 10;
  const tieneLogo = !!e.logoDataUrl;
  if (tieneLogo) dibujarLogo(doc, e.logoDataUrl, logoX(e.logoPosicion, e.logoSize, W), y, e.logoSize);
  const xTexto = tieneLogo && e.logoPosicion === 'izquierda' ? MARGEN + e.logoSize + 5 : MARGEN;
  const yTexto = tieneLogo && e.logoPosicion === 'centro' ? y + e.logoSize + 6 : y + 6;
  doc.setFont(fuente, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NEGRO);
  doc.text(e.titulo, xTexto, yTexto, { maxWidth: W - xTexto - 50 });
  if (e.subtitulo) {
    doc.setFont(fuente, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(e.subtitulo, xTexto, yTexto + 5.5, { maxWidth: W - xTexto - 50 });
  }
  if (!(tieneLogo && e.logoPosicion === 'derecha')) {
    doc.setFont(fuente, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(`Código: ${codigo}`, W - MARGEN, y + 3, { align: 'right' });
    doc.text(`Versión: ${version}`, W - MARGEN, y + 8, { align: 'right' });
  }
  const lineaY = Math.max(yTexto + (e.subtitulo ? 9 : 4), tieneLogo ? y + e.logoSize + (e.logoPosicion === 'centro' ? 16 : 3) : 0);
  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, lineaY, W - MARGEN, lineaY);
  return lineaY + 8;
}

/** Opciones de jspdf-autotable según el diseño (cabecera negra/gris/blanca, rejilla o líneas, zebra). */
export function opcionesTablaPlantilla(estilo: EstiloDiseno, fontSize: number, startY: number) {
  const cabecera =
    estilo.cabeceraTabla === 'negro'
      ? { fillColor: NEGRO, textColor: 255 }
      : estilo.cabeceraTabla === 'gris'
        ? { fillColor: GRIS_CABECERA, textColor: NEGRO }
        : { fillColor: false as const, textColor: NEGRO, lineWidth: { bottom: 0.5 }, lineColor: NEGRO };
  const rejilla = estilo.bordes === 'rejilla';
  return {
    startY,
    theme: rejilla ? ('grid' as const) : ('plain' as const),
    styles: {
      font: estilo.fuente,
      fontSize,
      cellPadding: 2.6,
      textColor: NEGRO,
      lineColor: rejilla ? NEGRO : GRIS_LINEA,
      lineWidth: rejilla ? 0.2 : { bottom: 0.15 },
    },
    headStyles: { ...cabecera, fontStyle: 'bold' as const, fontSize: fontSize + 0.5 },
    alternateRowStyles: estilo.zebra ? { fillColor: GRIS_ZEBRA } : {},
    margin: { top: startY, left: MARGEN, right: MARGEN, bottom: 22 },
  };
}

/** Título de sección en mayúsculas, negro, con una línea fina debajo. */
export function dibujarTituloSeccionPlantilla(doc: jsPDF, estilo: EstiloDiseno, titulo: string, y: number): number {
  const W = doc.internal.pageSize.getWidth();
  doc.setFont(estilo.fuente, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NEGRO);
  doc.text(titulo.toUpperCase(), MARGEN, y);
  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(0.25);
  doc.line(MARGEN, y + 1.6, W - MARGEN, y + 1.6);
  return y + 7;
}

/** Información general: en recuadro (etiqueta gris + valor) o como texto en dos columnas. */
export function dibujarInfoGeneralPlantilla(
  doc: jsPDF,
  estilo: EstiloDiseno,
  autoTable: (doc: jsPDF, opts: any) => void,
  pares: [string, string][],
  y: number
): number {
  const W = doc.internal.pageSize.getWidth();
  if (estilo.infoEnCaja) {
    const filas: string[][] = [];
    for (let i = 0; i < pares.length; i += 2) {
      const [l1, v1] = pares[i];
      const [l2, v2] = pares[i + 1] ?? ['', ''];
      filas.push([l1, v1, l2, v2]);
    }
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      body: filas,
      styles: { font: estilo.fuente, fontSize: 8.5, cellPadding: 2, textColor: NEGRO, lineColor: NEGRO, lineWidth: 0.2 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: GRIS_CABECERA, cellWidth: 30 },
        2: { fontStyle: 'bold', fillColor: GRIS_CABECERA, cellWidth: 30 },
      },
      margin: { left: MARGEN, right: MARGEN },
    });
    return ((doc as any).lastAutoTable?.finalY ?? y + 16) + 7;
  }

  doc.setFontSize(9);
  pares.forEach(([label, valor], i) => {
    const x = i % 2 === 0 ? MARGEN : W / 2 + 5;
    const fy = y + Math.floor(i / 2) * 6;
    doc.setFont(estilo.fuente, 'bold');
    doc.setTextColor(...NEGRO);
    doc.text(`${label}:`, x, fy);
    const ancho = doc.getTextWidth(`${label}: `);
    doc.setFont(estilo.fuente, 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(valor, x + ancho, fy, { maxWidth: W / 2 - 20 - ancho });
  });
  return y + Math.ceil(pares.length / 2) * 6 + 4;
}

/** Dos firmas con línea negra; bajo la primera va el nombre del docente. */
export function dibujarFirmasPlantilla(doc: jsPDF, estilo: EstiloDiseno, firma1: string, nombre1: string, firma2: string, y: number): number {
  const W = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(0.3);
  doc.line(22, y, 92, y);
  doc.line(W - 92, y, W - 22, y);
  doc.setFont(estilo.fuente, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NEGRO);
  doc.text(nombre1, 57, y + 4.5, { align: 'center' });
  doc.text(firma2, W - 57, y + 4.5, { align: 'center' });
  doc.setFont(estilo.fuente, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text(firma1, 57, y + 8.5, { align: 'center' });
  return y + 16;
}
