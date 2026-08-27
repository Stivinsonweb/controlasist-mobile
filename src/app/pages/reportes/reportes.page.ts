import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AsignaturasService, Asignatura } from '../../core/services/asignaturas.service';
import { ReportesService, ResumenEstudiante, ResumenGeneral } from '../../core/services/reportes.service';
import { Asistencia } from '../../core/services/asistencias.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { LogoService } from '../../core/services/logo.service';
import { addPdfHeader, addPdfFooter, addPdfSectionTitle, brandTableOptions } from '../../shared/utils/pdf-report.util';
import { XLSX, styleHeaderRow, autofitColumns, formatPercentColumn, applyZebraStripes } from '../../shared/utils/excel-report.util';
import { LOGO_TAMANO_MM, TAMANO_FUENTE_PT, PlantillaReporte, LABELS_INSTITUCION, defaultPlantillaReporte, normalizarPlantilla, seccionActiva, hexToRgb } from '../../core/services/plantilla-reporte.model';
import { getAccentPalette } from '../../shared/utils/subject-theme.util';
import { ESTADOS_ASISTENCIA } from '../../core/services/asistencias.service';
import { BarraEstadosComponent, SegmentoBarra } from '../../shared/components/charts/barra-estados.component';
import { RankingBarrasComponent, BarraRanking } from '../../shared/components/charts/ranking-barras.component';
import { TendenciaLineaComponent, PuntoTendencia } from '../../shared/components/charts/tendencia-linea.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BarraEstadosComponent, RankingBarrasComponent, TendenciaLineaComponent],
  templateUrl: './reportes.page.html',
})
export class ReportesPage implements OnInit {
  asignaturaId = '';
  asignatura = signal<Asignatura | null>(null);
  loading = signal(true);

  anios = signal<number[]>([]);
  anioSeleccionado = signal<number | null>(null);

  loadingDatos = signal(true);
  resumenGeneral = signal<ResumenGeneral | null>(null);
  resumenEstudiantes = signal<ResumenEstudiante[]>([]);
  clases = signal<Asistencia[]>([]);
  tendencia = signal<{ fecha: string; porcentaje: number }[]>([]);

  // ===== Formato institucional (punto 6) =====
  private docenteId = '';
  showFormatoConfig = signal(false);
  guardandoFormato = signal(false);
  subiendoLogo = signal(false);
  exportandoInstitucionalPDF = signal(false);
  exportandoInstitucionalExcel = signal(false);

  logoUrl = signal<string | null>(null);
  formatoCodigo = signal('');
  formatoVersion = signal('');
  formatoTitulo = signal('');
  formatoSegundaFirma = signal('');
  /** Premium (Parte 1): plantilla del docente si la ha configurado, o el default de siempre si no. */
  plantillaReporte = signal<PlantillaReporte>(defaultPlantillaReporte());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asignaturasService: AsignaturasService,
    private reportesService: ReportesService,
    private toast: ToastService,
    private authService: AuthService,
    private adminService: AdminService,
    private logoService: LogoService
  ) {}

  async ngOnInit() {
    this.asignaturaId = this.route.snapshot.paramMap.get('id') || '';
    this.loading.set(true);
    try {
      const [asignatura, anios] = await Promise.all([
        this.asignaturasService.obtenerPorId(this.asignaturaId),
        this.reportesService.aniosDisponibles(this.asignaturaId),
      ]);
      this.asignatura.set(asignatura);
      this.anios.set(anios);
      this.anioSeleccionado.set(anios[0] ?? null);
    } catch (e: any) {
      console.error(e);
      this.toast.error('No se pudo cargar la asignatura');
      this.router.navigate(['/home']);
      return;
    } finally {
      this.loading.set(false);
    }

    this.cargarConfigFormato();
    await this.cargarDatos();
  }

  async setAnio(anio: string) {
    this.anioSeleccionado.set(anio === 'todos' ? null : Number(anio));
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.loadingDatos.set(true);
    try {
      const anio = this.anioSeleccionado() ?? undefined;
      const [resumenGeneral, resumenEstudiantes, clases, tendencia] = await Promise.all([
        this.reportesService.resumenGeneral(this.asignaturaId, anio),
        this.reportesService.resumenPorEstudiante(this.asignaturaId, anio),
        this.reportesService.listarClases(this.asignaturaId, anio),
        this.reportesService.porcentajePorClase(this.asignaturaId, anio),
      ]);
      this.resumenGeneral.set(resumenGeneral);
      this.resumenEstudiantes.set(resumenEstudiantes);
      this.clases.set(clases);
      this.tendencia.set(tendencia);
    } catch (e: any) {
      console.error(e);
      this.toast.error('No se pudieron cargar los datos de asistencia');
    } finally {
      this.loadingDatos.set(false);
    }
  }

  segmentosDistribucionGeneral(): SegmentoBarra[] {
    const g = this.resumenGeneral();
    if (!g) return [];
    return ESTADOS_ASISTENCIA.map((e) => ({ label: e.label, valor: g[e.valor], color: e.color }));
  }

  tendenciaAsistencia(): PuntoTendencia[] {
    return this.tendencia().map((p) => ({ fecha: this.formatFecha(p.fecha), valor: p.porcentaje }));
  }

  rankingEstudiantes(): BarraRanking[] {
    return [...this.resumenEstudiantes()]
      .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia)
      .map((r) => ({ label: `${r.nombres} ${r.apellidos}`, valor: r.porcentajeAsistencia }));
  }

  formatFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async exportarPDF() {
    const a = this.asignatura();
    if (!a) return;
    if (this.resumenEstudiantes().length === 0) {
      this.toast.warning('No hay datos de asistencia para exportar');
      return;
    }

    const logoDataUrl = await this.cargarLogoSiHay();
    const anioTexto = this.anioSeleccionado() ? ` · Año ${this.anioSeleccionado()}` : '';

    const doc = new jsPDF();
    const startY = addPdfHeader(doc, {
      title: `Reporte de asistencia — ${a.nombre}`,
      subtitle: `${a.codigo} · Grupo ${a.grupo} · ${a.periodo}${anioTexto}`,
      logoDataUrl,
    });

    autoTable(doc, {
      ...brandTableOptions(startY),
      head: [['Estudiante', 'Cédula', 'Presente', 'Tarde', 'Justificado', 'Ausente', '% Asistencia']],
      body: this.resumenEstudiantes().map((r) => [
        `${r.nombres} ${r.apellidos}`,
        r.cedula || '—',
        r.presente,
        r.tarde,
        r.justificado,
        r.ausente,
        `${r.porcentajeAsistencia}%`,
      ]),
    });

    addPdfFooter(doc, { logoDataUrl });
    doc.save(`reporte-${a.codigo}.pdf`);
  }

  exportarExcel() {
    const a = this.asignatura();
    if (!a) return;
    if (this.resumenEstudiantes().length === 0) {
      this.toast.warning('No hay datos de asistencia para exportar');
      return;
    }

    const headers = ['Estudiante', 'Cédula', 'Presente', 'Tarde', 'Justificado', 'Ausente', 'Total clases', '% Asistencia'];
    const filas = this.resumenEstudiantes().map((r) => [
      `${r.nombres} ${r.apellidos}`,
      r.cedula || '',
      r.presente,
      r.tarde,
      r.justificado,
      r.ausente,
      r.total,
      r.porcentajeAsistencia,
    ]);
    const aoa = [headers, ...filas];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    styleHeaderRow(ws, 0, headers.length);
    applyZebraStripes(ws, 1, aoa.length - 1, headers.length);
    formatPercentColumn(ws, headers.length - 1, 1, aoa.length - 1);
    autofitColumns(ws, aoa);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, `reporte-${a.codigo}.xlsx`);
  }

  // ===== Formato institucional (punto 6) =====

  private cargarConfigFormato() {
    const perfil = this.authService.currentProfileValue;
    if (!perfil) return;
    this.docenteId = perfil.id;
    this.logoUrl.set(perfil.logo_institucional_url || null);
    this.formatoCodigo.set(perfil.formato_reporte_codigo || '');
    this.formatoVersion.set(perfil.formato_reporte_version || '');
    this.formatoTitulo.set(perfil.formato_reporte_titulo || 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE');
    this.formatoSegundaFirma.set(perfil.formato_reporte_segunda_firma || '');
    // TEMPORAL: se aplica en cuanto exista una plantilla guardada, sin chequear premium_activo
    // — ver PARTE 2 del contexto. Cuando Wompi esté conectado, añadir aquí `&& perfil.premium_activo`.
    this.plantillaReporte.set(normalizarPlantilla(perfil.plantilla_reporte));
  }

  toggleFormatoConfig() {
    this.showFormatoConfig.set(!this.showFormatoConfig());
  }

  async subirLogoInstitucional(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.docenteId) return;
    this.subiendoLogo.set(true);
    try {
      const url = await this.logoService.subirLogo(file, this.docenteId);
      await this.adminService.actualizarLogoInstitucional(this.docenteId, url);
      this.logoUrl.set(url);
      this.toast.success('Logo institucional actualizado');
    } catch (e: any) {
      console.error(e);
      this.toast.error(e.message || 'No se pudo subir el logo');
    } finally {
      this.subiendoLogo.set(false);
      input.value = '';
    }
  }

  async guardarConfigFormato() {
    if (!this.docenteId) return;
    this.guardandoFormato.set(true);
    try {
      await this.adminService.actualizarFormatoReporte(this.docenteId, {
        formato_reporte_codigo: this.formatoCodigo() || undefined,
        formato_reporte_version: this.formatoVersion() || undefined,
        formato_reporte_titulo: this.formatoTitulo() || undefined,
        formato_reporte_segunda_firma: this.formatoSegundaFirma() || undefined,
      });
      this.toast.success('Configuración del formato guardada');
    } catch (e: any) {
      console.error(e);
      this.toast.error(e.message || 'No se pudo guardar la configuración');
    } finally {
      this.guardandoFormato.set(false);
    }
  }

  private abreviaturaEstado(estado: string | undefined): string {
    if (!estado) return '—';
    const mapa: Record<string, string> = { presente: 'P', tarde: 'T', justificado: 'J', ausente: 'A' };
    return mapa[estado] || '—';
  }

  private calcularHoras(inicio: string, fin: string): number {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    const minutos = hf * 60 + mf - (hi * 60 + mi);
    return Math.round((minutos / 60) * 100) / 100;
  }

  /** Convierte la URL pública del logo (Storage) a data URL para poder incrustarla con jsPDF `addImage`. */
  private async cargarImagenComoDataUrl(url: string): Promise<string> {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private clasesOrdenadasParaExportar(): Asistencia[] {
    return [...this.clases()].sort((x, y) => x.fecha.localeCompare(y.fecha) || x.hora_inicio.localeCompare(y.hora_inicio));
  }

  /** Carga el logo institucional del docente como data URL para incrustarlo en un PDF; null si no hay logo o falla la descarga. */
  private async cargarLogoSiHay(): Promise<string | null> {
    if (!this.logoUrl()) return null;
    try {
      return await this.cargarImagenComoDataUrl(this.logoUrl()!);
    } catch (e) {
      console.error('No se pudo cargar el logo institucional para el PDF:', e);
      return null;
    }
  }

  async exportarHistorialInstitucionalPDF() {
    const a = this.asignatura();
    const perfil = this.authService.currentProfileValue;
    if (!a || !perfil) return;
    const clases = this.clasesOrdenadasParaExportar();
    if (clases.length === 0) {
      this.toast.warning('No hay clases registradas para exportar');
      return;
    }

    this.exportandoInstitucionalPDF.set(true);
    try {
      const logoDataUrl = await this.cargarLogoSiHay();
      const plantilla = this.plantillaReporte();

      const necesitaMatriz = plantilla.tipo_tabla_asistencia === 'matriz_estudiantes' && seccionActiva(plantilla, 'tabla_asistencia');
      const necesitaListado = seccionActiva(plantilla, 'listado_estudiantes');
      const [matriz, estudiantesInscritos] = await Promise.all([
        necesitaMatriz ? this.reportesService.matrizAsistencia(this.asignaturaId, this.anioSeleccionado() ?? undefined) : Promise.resolve(null),
        necesitaListado ? this.asignaturasService.listarEstudiantesInscritos(this.asignaturaId) : Promise.resolve([]),
      ]);

      const colorHex = plantilla.color_tabla_modo === 'personalizado' ? plantilla.color_tabla_hex : getAccentPalette(perfil.tema_acento).from;
      const colorTabla = hexToRgb(colorHex);
      const fontSize = TAMANO_FUENTE_PT[plantilla.tamano_fuente];

      const titulo = this.formatoTitulo() || 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE';
      const codigo = this.formatoCodigo();
      const version = this.formatoVersion();
      const labels = LABELS_INSTITUCION[plantilla.tipo_institucion];

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ===== Encabezado: logo en la posición/tamaño de la plantilla (Premium, Parte 1) =====
      const logoSize = LOGO_TAMANO_MM[plantilla.logo_tamano] ?? LOGO_TAMANO_MM.mediano;
      let logoX = 14;
      if (plantilla.logo_posicion === 'centro') logoX = pageWidth / 2 - logoSize / 2;
      if (plantilla.logo_posicion === 'derecha') logoX = pageWidth - 14 - logoSize;

      let cursorY = 14;
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', logoX, 8, logoSize, logoSize);
          if (plantilla.logo_posicion === 'centro') cursorY = 8 + logoSize + 6;
        } catch (e) {
          console.error('No se pudo incrustar el logo en el PDF:', e);
        }
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      doc.text(titulo, pageWidth / 2, cursorY, { align: 'center', maxWidth: pageWidth - 90 });
      cursorY += 5;

      if (plantilla.subtitulo_formato) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90);
        doc.text(plantilla.subtitulo_formato, pageWidth / 2, cursorY, { align: 'center', maxWidth: pageWidth - 90 });
        cursorY += 5;
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90);
      doc.text(`Código: ${codigo || '—'}`, pageWidth - 14, 11, { align: 'right' });
      doc.text(`Versión: ${version || '—'}`, pageWidth - 14, 16, { align: 'right' });

      const lineY = Math.max(cursorY + 3, 8 + logoSize + 4);
      doc.setDrawColor(210);
      doc.line(14, lineY, pageWidth - 14, lineY);

      // ===== Secciones, en el orden y con la activación configurados en la plantilla =====
      let y = lineY + 7;
      for (const seccionId of plantilla.orden_secciones) {
        if (!seccionActiva(plantilla, seccionId)) continue;

        if (seccionId === 'info_general') {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40);
          doc.text(`${labels.docente}: ${perfil.nombres} ${perfil.apellidos}`, 14, y);
          doc.text(`${labels.segundoCampo}: ${a.programa || perfil.programa || '—'}`, pageWidth / 2 + 5, y);
          y += 6;
          doc.text(`${labels.asignatura}: ${a.nombre} (${a.codigo})`, 14, y);
          doc.text(`${labels.nivel}: ${a.nivel}    Periodo: ${a.periodo}`, pageWidth / 2 + 5, y);
          y += 8;
        } else if (seccionId === 'tabla_asistencia' && plantilla.tipo_tabla_asistencia === 'historial_clases') {
          const cols = plantilla.columnas_historial;
          const head = ['No.', 'Fecha', 'Hora inicio', 'Hora final'];
          if (cols.tema) head.push('Tema');
          if (cols.horas) head.push('Total horas');
          if (cols.firma) head.push(`Firma ${labels.docente.toLowerCase()}`);

          autoTable(doc, {
            startY: y,
            head: [head],
            body: clases.map((c, i) => {
              const fila: (string | number)[] = [i + 1, this.formatFecha(c.fecha), c.hora_inicio, c.hora_fin];
              if (cols.tema) fila.push(c.temas_tratados || '—');
              if (cols.horas) fila.push(this.calcularHoras(c.hora_inicio, c.hora_fin));
              if (cols.firma) fila.push('');
              return fila;
            }),
            styles: { fontSize, cellPadding: 3, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.1 },
            headStyles: { fillColor: colorTabla, textColor: 255, fontStyle: 'bold', fontSize: fontSize + 0.5 },
            alternateRowStyles: { fillColor: [243, 244, 246] },
            columnStyles: { 0: { cellWidth: 10 } },
            margin: { top: y, bottom: 22 },
          });
          y = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 10;
        } else if (seccionId === 'tabla_asistencia' && plantilla.tipo_tabla_asistencia === 'matriz_estudiantes' && matriz) {
          const cols = plantilla.columnas_matriz;
          const head = ['No.', 'Nombre'];
          if (cols.cedula) head.push('Cédula');
          for (const c of matriz.clases) head.push(this.formatFecha(c.fecha));
          if (cols.porcentaje) head.push('%');

          autoTable(doc, {
            startY: y,
            head: [head],
            body: matriz.filas.map((f, i) => {
              const fila: (string | number)[] = [i + 1, `${f.nombres} ${f.apellidos}`];
              if (cols.cedula) fila.push(f.cedula || '—');
              for (const c of matriz.clases) fila.push(this.abreviaturaEstado(f.estadosPorClase[c.id!]));
              if (cols.porcentaje) fila.push(`${f.porcentajeAsistencia}%`);
              return fila;
            }),
            styles: { fontSize, cellPadding: 2.5, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.1, halign: 'center' },
            headStyles: { fillColor: colorTabla, textColor: 255, fontStyle: 'bold', fontSize: fontSize + 0.5 },
            alternateRowStyles: { fillColor: [243, 244, 246] },
            columnStyles: { 0: { cellWidth: 10 }, 1: { halign: 'left', cellWidth: 40 } },
            margin: { top: y, bottom: 22 },
          });
          y = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 4;
          if (plantilla.mostrar_leyenda) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text('P = Presente   T = Tarde   J = Justificado   A = Ausente', 14, y);
            y += 8;
          } else {
            y += 4;
          }
        } else if (seccionId === 'listado_estudiantes') {
          if (y > pageHeight - 40) { doc.addPage(); y = 20; }
          y = addPdfSectionTitle(doc, 'Listado de estudiantes matriculados', y);
          autoTable(doc, {
            startY: y,
            head: [['No.', 'Nombre', 'Cédula', 'Programa']],
            body: estudiantesInscritos.map((e: any, i: number) => [
              i + 1,
              `${e.estudiantes?.nombres ?? ''} ${e.estudiantes?.apellidos ?? ''}`.trim() || '—',
              e.estudiantes?.cedula || '—',
              e.estudiantes?.programa || a.programa || '—',
            ]),
            styles: { fontSize, cellPadding: 2.5, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.1 },
            headStyles: { fillColor: colorTabla, textColor: 255, fontStyle: 'bold', fontSize: fontSize + 0.5 },
            alternateRowStyles: { fillColor: [243, 244, 246] },
            columnStyles: { 0: { cellWidth: 10 } },
            margin: { top: y, bottom: 22 },
          });
          y = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 10;
        } else if (seccionId === 'estadisticas_resumen') {
          if (y > pageHeight - 40) { doc.addPage(); y = 20; }
          y = addPdfSectionTitle(doc, 'Estadísticas resumen del periodo', y);
          const g = this.resumenGeneral();
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60);
          const linea = g
            ? `Clases dictadas: ${g.totalClases}    Presentes: ${g.presente}    Tarde: ${g.tarde}    Justificados: ${g.justificado}    Ausentes: ${g.ausente}`
            : 'Sin datos disponibles para este periodo.';
          doc.text(linea, 14, y, { maxWidth: pageWidth - 28 });
          y += 10;
        } else if (seccionId === 'observaciones') {
          if (y > pageHeight - 40) { doc.addPage(); y = 20; }
          y = addPdfSectionTitle(doc, 'Observaciones generales', y);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60);
          const lineas = doc.splitTextToSize(plantilla.observaciones_texto || 'Sin observaciones registradas.', pageWidth - 28);
          doc.text(lineas, 14, y);
          y += lineas.length * 4.5 + 6;
        } else if (seccionId === 'firmas') {
          if (y > pageHeight - 30) { doc.addPage(); y = 30; }
          doc.setDrawColor(120);
          doc.line(20, y, 90, y);
          doc.line(pageWidth - 90, y, pageWidth - 20, y);
          doc.setFontSize(9);
          doc.setTextColor(60);
          doc.text(`Firma ${labels.docente.toLowerCase()}`, 55, y + 5, { align: 'center' });
          doc.text(this.formatoSegundaFirma() || labels.segundaFirmaSugerida, pageWidth - 55, y + 5, { align: 'center' });
          y += 15;
        }
      }

      // Pie de página consistente en todas las páginas: logo pequeño, fecha de generación y número de página.
      addPdfFooter(doc, { logoDataUrl });

      doc.save(`historial-clases-${a.codigo}.pdf`);
    } catch (e: any) {
      console.error(e);
      this.toast.error('No se pudo generar el PDF institucional');
    } finally {
      this.exportandoInstitucionalPDF.set(false);
    }
  }

  async exportarHistorialInstitucionalExcel() {
    const a = this.asignatura();
    const perfil = this.authService.currentProfileValue;
    if (!a || !perfil) return;
    const clases = this.clasesOrdenadasParaExportar();
    if (clases.length === 0) {
      this.toast.warning('No hay clases registradas para exportar');
      return;
    }

    this.exportandoInstitucionalExcel.set(true);
    try {
      await this.generarExcelInstitucional(a, perfil, clases);
    } catch (e: any) {
      console.error(e);
      this.toast.error('No se pudo generar el Excel institucional');
    } finally {
      this.exportandoInstitucionalExcel.set(false);
    }
  }

  private async generarExcelInstitucional(a: Asignatura, perfil: any, clases: Asistencia[]) {
    const plantilla = this.plantillaReporte();
    const titulo = this.formatoTitulo() || 'FORMATO PARA REGISTRO DE CLASES Y ASISTENCIA DOCENTE';
    const anioTexto = this.anioSeleccionado() ? String(this.anioSeleccionado()) : 'Todos';
    const labels = LABELS_INSTITUCION[plantilla.tipo_institucion];

    const encabezado: any[][] = [
      [titulo, '', '', '', '', 'Código:', this.formatoCodigo() || '—'],
      ['', '', '', '', '', 'Versión:', this.formatoVersion() || '—'],
      [],
      [`${labels.docente}: ${perfil.nombres} ${perfil.apellidos}`, '', '', `${labels.segundoCampo}: ${a.programa || perfil.programa || '—'}`],
      [`${labels.asignatura}: ${a.nombre} (${a.codigo})`, '', '', `Año: ${anioTexto}`, '', `${labels.nivel}: ${a.nivel} · Periodo: ${a.periodo}`],
      [],
    ];

    let filas: any[][];
    let numColumnas: number;
    let anchoColumnas: { wch: number }[];

    if (plantilla.tipo_tabla_asistencia === 'matriz_estudiantes') {
      const matriz = await this.reportesService.matrizAsistencia(this.asignaturaId, this.anioSeleccionado() ?? undefined);
      const cols = plantilla.columnas_matriz;
      const head = ['No.', 'Nombre'];
      if (cols.cedula) head.push('Cédula');
      for (const c of matriz.clases) head.push(this.formatFecha(c.fecha));
      if (cols.porcentaje) head.push('%');

      filas = [
        ...encabezado,
        head,
        ...matriz.filas.map((f, i) => {
          const fila: any[] = [i + 1, `${f.nombres} ${f.apellidos}`];
          if (cols.cedula) fila.push(f.cedula || '—');
          for (const c of matriz.clases) fila.push(this.abreviaturaEstado(f.estadosPorClase[c.id!]));
          if (cols.porcentaje) fila.push(f.porcentajeAsistencia);
          return fila;
        }),
      ];
      if (plantilla.mostrar_leyenda) filas.push([], ['P = Presente   T = Tarde   J = Justificado   A = Ausente']);
      filas.push([], [`Firma ${labels.docente.toLowerCase()}:`, '', '', `${this.formatoSegundaFirma() || labels.segundaFirmaSugerida}:`]);

      numColumnas = head.length;
      anchoColumnas = [{ wch: 6 }, { wch: 26 }, ...head.slice(2).map(() => ({ wch: 12 }))];
    } else {
      const cols = plantilla.columnas_historial;
      const head = ['No.', 'Fecha', 'Hora inicio', 'Hora final'];
      if (cols.tema) head.push('Tema');
      if (cols.horas) head.push('Total horas');
      if (cols.firma) head.push(`Firma ${labels.docente.toLowerCase()}`);

      filas = [
        ...encabezado,
        head,
        ...clases.map((c, i) => {
          const fila: any[] = [i + 1, this.formatFecha(c.fecha), c.hora_inicio, c.hora_fin];
          if (cols.tema) fila.push(c.temas_tratados || '');
          if (cols.horas) fila.push(this.calcularHoras(c.hora_inicio, c.hora_fin));
          if (cols.firma) fila.push('');
          return fila;
        }),
        [],
        [`Firma ${labels.docente.toLowerCase()}:`, '', '', `${this.formatoSegundaFirma() || labels.segundaFirmaSugerida}:`],
      ];
      numColumnas = head.length;
      anchoColumnas = [{ wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 42 }, { wch: 12 }, { wch: 20 }].slice(0, numColumnas);
    }

    const ws = XLSX.utils.aoa_to_sheet(filas);
    ws['!cols'] = anchoColumnas;

    const HEADER_ROW = encabezado.length;
    const bodyStart = HEADER_ROW + 1;
    const totalFilasBody = plantilla.tipo_tabla_asistencia === 'matriz_estudiantes'
      ? filas.length - encabezado.length - 1 - (plantilla.mostrar_leyenda ? 4 : 2)
      : clases.length;
    const bodyEnd = bodyStart + totalFilasBody - 1;
    if (ws['A1']) ws['A1'].s = { font: { bold: true, sz: 12 } };
    styleHeaderRow(ws, HEADER_ROW, numColumnas);
    applyZebraStripes(ws, bodyStart, bodyEnd, numColumnas);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, plantilla.tipo_tabla_asistencia === 'matriz_estudiantes' ? 'Matriz de asistencia' : 'Historial de clases');

    if (seccionActiva(plantilla, 'listado_estudiantes')) {
      const estudiantes = await this.asignaturasService.listarEstudiantesInscritos(this.asignaturaId);
      const filasEstudiantes = [
        ['No.', 'Nombre', 'Cédula', 'Programa'],
        ...estudiantes.map((e: any, i: number) => [
          i + 1,
          `${e.estudiantes?.nombres ?? ''} ${e.estudiantes?.apellidos ?? ''}`.trim() || '—',
          e.estudiantes?.cedula || '—',
          e.estudiantes?.programa || a.programa || '—',
        ]),
      ];
      const wsEstudiantes = XLSX.utils.aoa_to_sheet(filasEstudiantes);
      wsEstudiantes['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 26 }];
      styleHeaderRow(wsEstudiantes, 0, 4);
      applyZebraStripes(wsEstudiantes, 1, filasEstudiantes.length - 1, 4);
      XLSX.utils.book_append_sheet(wb, wsEstudiantes, 'Listado de estudiantes');
    }

    XLSX.writeFile(wb, `historial-clases-${a.codigo}.xlsx`);

    if (this.logoUrl()) {
      this.toast.info('El logo institucional no se incluye en el Excel (la librería xlsx no soporta imágenes); sí aparece en el PDF.');
    }
  }
}
