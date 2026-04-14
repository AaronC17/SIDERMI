import archiver from 'archiver';
import ExcelJS from 'exceljs';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import path from 'path';
import Student, { IStudent } from '../models/Student';
import { decryptFile, isEncrypted } from './cryptoService';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Lee un archivo, descifrándolo si está cifrado.
 * Retorna null si el archivo no existe.
 */
function leerArchivoSeguro(filePath: string): Buffer | null {
  if (!fs.existsSync(filePath)) return null;

  // Verificar path traversal
  const docsDir = path.resolve(path.join(__dirname, '../../documents'));
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(docsDir) && !resolvedPath.startsWith(path.resolve(path.join(__dirname, '../../')))) {
    console.warn(`Intento de acceso a ruta no autorizada: ${filePath}`);
    return null;
  }

  try {
    if (isEncrypted(filePath)) {
      return decryptFile(filePath);
    }
    return fs.readFileSync(filePath);
  } catch (err) {
    console.error(`Error leyendo archivo ${filePath}:`, err);
    return null;
  }
}

/**
 * Obtiene la extensión original de un archivo (quitando .enc si existe)
 */
function getOriginalExt(filePath: string): string {
  let ext = path.extname(filePath).toLowerCase();
  if (ext === '.enc') {
    // El nombre tiene formato: nombre.ext.enc
    const baseName = path.basename(filePath, '.enc');
    ext = path.extname(baseName).toLowerCase();
  }
  return ext;
}

/**
 * Convierte un archivo de imagen a un buffer PDF de una página (A4).
 * Si el archivo ya es PDF lo devuelve tal cual.
 * Soporta archivos cifrados.
 */
async function imagenAPdf(imagePath: string, titulo?: string): Promise<Buffer | null> {
  const ext = getOriginalExt(imagePath);
  const contenido = leerArchivoSeguro(imagePath);
  if (!contenido) return null;

  if (ext === '.pdf') return contenido;

  // Para imágenes, necesitamos escribir temporalmente para que pdfkit pueda leerlas
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, `temp_${Date.now()}${ext}`);

  try {
    fs.writeFileSync(tempFile, contenido);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        // Limpiar archivo temporal
        try { fs.unlinkSync(tempFile); } catch { /* ignorar */ }
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        try { fs.unlinkSync(tempFile); } catch { /* ignorar */ }
        reject(err);
      });

      doc.addPage({ size: 'A4', margin: 20 });

      if (titulo) {
        doc.fontSize(11).fillColor('#142D5C').font('Helvetica-Bold')
          .text(titulo, { align: 'center' });
        doc.moveDown(0.5);
      }

      const margen = 20;
      const anchoDisp = doc.page.width - margen * 2;
      const yInicio   = titulo ? doc.y : margen;
      const altoDisp  = doc.page.height - yInicio - margen;

      doc.image(tempFile, margen, yInicio, {
        fit: [anchoDisp, altoDisp],
        align: 'center',
        valign: 'center',
      });

      doc.end();
    });
  } catch (err) {
    // Limpiar archivo temporal si hay error
    try { fs.unlinkSync(tempFile); } catch { /* ignorar */ }
    console.error('Error convirtiendo imagen a PDF:', err);
    return null;
  }
}

/**
 * Crea un PDF de dos páginas: página 1 = cédula frente, página 2 = cédula reverso.
 * Soporta archivos cifrados.
 */
async function cedulaAPdf(frentePath: string, reversoPath: string): Promise<Buffer | null> {
  // Preparar archivos temporales si están cifrados
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempFiles: string[] = [];
  let frenteTempPath = frentePath;
  let reversoTempPath = reversoPath;

  // Descifrar frente si existe y está cifrado
  if (frentePath && fs.existsSync(frentePath)) {
    const contenido = leerArchivoSeguro(frentePath);
    if (contenido) {
      const ext = getOriginalExt(frentePath);
      frenteTempPath = path.join(tempDir, `frente_${Date.now()}${ext}`);
      fs.writeFileSync(frenteTempPath, contenido);
      tempFiles.push(frenteTempPath);
    }
  }

  // Descifrar reverso si existe y está cifrado
  if (reversoPath && fs.existsSync(reversoPath)) {
    const contenido = leerArchivoSeguro(reversoPath);
    if (contenido) {
      const ext = getOriginalExt(reversoPath);
      reversoTempPath = path.join(tempDir, `reverso_${Date.now()}${ext}`);
      fs.writeFileSync(reversoTempPath, contenido);
      tempFiles.push(reversoTempPath);
    }
  }

  const cleanup = () => {
    for (const tf of tempFiles) {
      try { fs.unlinkSync(tf); } catch { /* ignorar */ }
    }
  };

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => {
      cleanup();
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', (err) => {
      cleanup();
      reject(err);
    });

    const agregarPagina = (filePath: string, etiqueta: string) => {
      if (!fs.existsSync(filePath)) return;
      const ext = getOriginalExt(filePath);
      doc.addPage({ size: 'A4', margin: 20 });
      doc.fontSize(11).fillColor('#142D5C').font('Helvetica-Bold')
        .text(etiqueta, { align: 'center' });
      doc.moveDown(0.5);

      const margen  = 20;
      const anchoDisp = doc.page.width - margen * 2;
      const altoDisp  = doc.page.height - doc.y - margen;

      if (IMAGE_EXTS.has(ext)) {
        doc.image(filePath, margen, doc.y, {
          fit: [anchoDisp, altoDisp],
          align: 'center',
          valign: 'center',
        });
      } else {
        // Si ya es PDF, avisamos (pdfkit no puede incrustar PDFs)
        doc.fontSize(10).fillColor('#64748B').font('Helvetica')
          .text('(El archivo original ya es un PDF — ver archivo cedula_frente.pdf o cedula_reverso.pdf)', {
            align: 'center',
          });
      }
    };

    if (frenteTempPath && fs.existsSync(frenteTempPath))  agregarPagina(frenteTempPath,  'CÉDULA — FRENTE');
    if (reversoTempPath && fs.existsSync(reversoTempPath)) agregarPagina(reversoTempPath, 'CÉDULA — REVERSO');

    doc.end();
  });
}

/** Formatea cédula en formato X-XXXX-XXXX (9 dígitos) */
function formatCedula(ced: string): string {
  const c = ced.replace(/\D/g, '');
  if (c.length === 9) return `${c[0]}-${c.slice(1, 5)}-${c.slice(5)}`;
  return ced;
}

/**
 * Genera un ZIP con carpetas por estudiante que tienen todos los requisitos completos.
 * Cada carpeta: CEDULA_NOMBRE_TIPOMATRICULA/
 *   - titulo.xxx
 *   - cedula_frente.xxx
 *   - cedula_reverso.xxx
 *   - etc.
 */
export async function generarZipCompletos(outputPath: string): Promise<{
  totalEstudiantes: number;
  archivoZip: string;
}> {
  // Solo estudiantes con todos los documentos COMPLETOS
  const estudiantes = await Student.find({
    activo: true,
    'documentos.titulo.estado': 'COMPLETO',
    'documentos.cedulaFrente.estado': 'COMPLETO',
    'documentos.cedulaReverso.estado': 'COMPLETO',
  });

  const zipFileName = `expedientes_completos_${new Date().toISOString().split('T')[0]}.zip`;
  const zipPath = path.join(outputPath, zipFileName);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const docsDir = path.join(__dirname, '../../documents');

  // ── Pre-generar todo el contenido ANTES de abrir el stream del ZIP ──────
  // (archiver no tolera awaits dentro de su callback sincrónico)
  const excelBuffer = await generarExcelReporte(estudiantes);

  type EntradaEstudiante = {
    folderName: string;
    tituloPdfName: string;
    cedulaPdfName: string;
    tituloPdf?: Buffer | null;
    cedulaPdf?: Buffer | null;
    otrosArchivos: Array<{ buffer: Buffer; archiveName: string }>;
    resumen: string;
  };

  const entradas: EntradaEstudiante[] = [];

  for (const est of estudiantes) {
    // Nombre de carpeta: solo la cédula sin guiones (ej: 604860288)
    const folderName = est.cedula.replace(/\D/g, '');
    const tituloPdfName = `${folderName}_Título.pdf`;
    const cedulaPdfName = `${folderName}_Cédula.pdf`;

    const nombreCompleto = `${est.nombre} ${est.primerApellido} ${est.segundoApellido || ''}`.trim();

    // 1. título.pdf
    let tituloPdf: Buffer | undefined;
    const tituloDoc = est.documentos.titulo;
    if (tituloDoc?.archivo) {
      const tituloPath = path.join(docsDir, tituloDoc.archivo);
      if (fs.existsSync(tituloPath)) {
        const pdfResult = await imagenAPdf(
          tituloPath,
          `TÍTULO — ${nombreCompleto}  |  Cédula: ${formatCedula(est.cedula)}`,
        );
        tituloPdf = pdfResult ?? undefined;
      }
    }

    // 2. cedula.pdf (frente página 1, reverso página 2)
    let cedulaPdf: Buffer | undefined;
    const frentePath  = est.documentos.cedulaFrente?.archivo
      ? path.join(docsDir, est.documentos.cedulaFrente.archivo) : null;
    const reversoPath = est.documentos.cedulaReverso?.archivo
      ? path.join(docsDir, est.documentos.cedulaReverso.archivo) : null;
    if (frentePath || reversoPath) {
      const pdfResult = await cedulaAPdf(frentePath ?? '', reversoPath ?? '');
      cedulaPdf = pdfResult ?? undefined;
    }

    // 3. Resto sin conversión (pero descifrar si es necesario)
    // Ya no hay otros documentos, solo título y cédula
    const otrosArchivos: EntradaEstudiante['otrosArchivos'] = [];

    // 4. Resumen
    const resumen = [
      `EXPEDIENTE COMPLETO — ${new Date().toLocaleDateString('es-CR')}`,
      ``,
      `Cédula:         ${formatCedula(est.cedula)}`,
      `Nombre:         ${nombreCompleto}`,
      `Tipo Matrícula: ${est.tipoMatricula}`,
      `Estado Avatar:  ${est.estadoAvatar}`,
      `Correo:         ${est.correoElectronico || '—'}`,
      ``,
      `DOCUMENTOS:`,
      `  Título:         ${est.documentos.titulo.estado}${tituloDoc?.archivo ? ` (incluido en ${tituloPdfName})` : ' (sin archivo digital)'}`,
      `  Cédula Frente:  ${est.documentos.cedulaFrente.estado}${frentePath ? ` (incluido en ${cedulaPdfName})` : ' (sin archivo digital)'}`,
      `  Cédula Reverso: ${est.documentos.cedulaReverso.estado}${reversoPath ? ` (incluido en ${cedulaPdfName})` : ' (sin archivo digital)'}`,
    ].join('\n');

    entradas.push({
      folderName,
      tituloPdfName,
      cedulaPdfName,
      tituloPdf,
      cedulaPdf,
      otrosArchivos,
      resumen,
    });
  }

  // ── Construir el ZIP (sin awaits) ────────────────────────────────────────
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve({ totalEstudiantes: estudiantes.length, archivoZip: zipPath }));
    archive.on('error', reject);
    archive.pipe(output);

    // Excel va primero y con prefijo numérico para aparecer arriba en orden alfabético
    archive.append(excelBuffer, { name: '00_Reporte_Expedientes_Completos.xlsx' });

    for (const { folderName, tituloPdfName, cedulaPdfName, tituloPdf, cedulaPdf, otrosArchivos, resumen } of entradas) {
      if (tituloPdf) archive.append(tituloPdf, { name: `${folderName}/${tituloPdfName}` });
      if (cedulaPdf) archive.append(cedulaPdf, { name: `${folderName}/${cedulaPdfName}` });
      for (const { buffer, archiveName } of otrosArchivos) {
        archive.append(buffer, { name: archiveName });
      }
      archive.append(resumen, { name: `${folderName}/datos.txt` });
    }

    archive.finalize();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Genera el Excel profesional del reporte de expedientes completos
// ─────────────────────────────────────────────────────────────────────────────
async function generarExcelReporte(estudiantes: IStudent[]): Promise<Buffer> {
  // Paleta UTN
  const BLUE        = 'FF142D5C';
  const GOLD        = 'FFC4972A';
  const GOLD_DARK   = 'FF8B6A1A';
  const LIGHT_BLUE  = 'FFD4E0F0';
  const ROW_ALT     = 'FFF0F4FB';
  const WHITE       = 'FFFFFFFF';
  const TEXT_DARK   = 'FF1E293B';
  const TEXT_MID    = 'FF64748B';
  const GREEN       = 'FF15803D';
  const GREEN_BG    = 'FFD1FAE5';
  const AMBER       = 'FFB45309';
  const AMBER_BG    = 'FFFEF3C7';
  const RED         = 'FFB91C1C';
  const RED_BG      = 'FFFEE2E2';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIDERMI — Universidad Técnica Nacional';
  workbook.created  = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Expedientes Completos', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage:   true,
      fitToWidth:  1,
      paperSize:   9, // A4
    },
    headerFooter: {
      oddHeader: '&C&B&14 SIDERMI — Sistema de Registro UTN   &R&D',
      oddFooter: '&LConfidencial — UTN&CPágina &P de &N&RSIDERMI',
    },
  });

  sheet.columns = [
    { key: 'num',      width: 5  },
    { key: 'cedula',   width: 14 },
    { key: 'nombre',   width: 34 },
    { key: 'tipo',     width: 16 },
    { key: 'avatar',   width: 14 },
    { key: 'correo',   width: 36 },
    { key: 'titulo',   width: 12 },
    { key: 'cFrente',  width: 14 },
    { key: 'cRev',     width: 15 },
    { key: 'archivos', width: 14 },
  ];

  // ── Fila 1: Título principal ──────────────────────────────────────────────
  sheet.addRow(['SISTEMA DE REGISTRO DE DOCUMENTOS — UTN', '', '', '', '', '', '', '', '', '']);
  sheet.mergeCells('A1:J1');
  sheet.getRow(1).height = 36;
  const titleCell = sheet.getCell('A1');
  titleCell.font      = { name: 'Calibri', size: 16, bold: true, color: { argb: WHITE } };
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── Fila 2: Subtítulo / fecha ─────────────────────────────────────────────
  const fecha = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
  sheet.addRow([
    `Universidad Técnica Nacional  ·  Expedientes con documentación completa  ·  ${fecha}`,
    '', '', '', '', '', '', '', '', '',
  ]);
  sheet.mergeCells('A2:J2');
  sheet.getRow(2).height = 20;
  const subtitleCell = sheet.getCell('A2');
  subtitleCell.font      = { name: 'Calibri', size: 10, italic: true, color: { argb: BLUE } };
  subtitleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── Fila 3: Contador ──────────────────────────────────────────────────────
  sheet.addRow([`   Total de expedientes completos: ${estudiantes.length}`, '', '', '', '', '', '', '', '', '']);
  sheet.mergeCells('A3:J3');
  sheet.getRow(3).height = 18;
  const countCell = sheet.getCell('A3');
  countCell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: BLUE } };
  countCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF4FA' } };
  countCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Fila 4: Espaciador ────────────────────────────────────────────────────
  sheet.addRow(['']);
  sheet.getRow(4).height = 6;

  // ── Fila 5: Encabezados de columna ────────────────────────────────────────
  const headerRow = sheet.addRow([
    '#', 'Cédula', 'Nombre Completo', 'Tipo Matrícula', 'Estado Avatar',
    'Correo Electrónico', 'Título', 'Cédula Frente', 'Cédula Reverso', 'Archivos Digitales',
  ]);
  headerRow.height = 26;
  headerRow.eachCell(cell => {
    cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = {
      top:    { style: 'thin',   color: { argb: GOLD_DARK } },
      bottom: { style: 'medium', color: { argb: GOLD_DARK } },
      left:   { style: 'thin',   color: { argb: GOLD_DARK } },
      right:  { style: 'thin',   color: { argb: GOLD_DARK } },
    };
  });

  // ── Filas de datos ────────────────────────────────────────────────────────
  const centerCols = new Set([1, 4, 7, 8, 9, 10]);

  estudiantes.forEach((est, i) => {
    const nombreCompleto = `${est.nombre} ${est.primerApellido} ${est.segundoApellido || ''}`.trim();
    const tieneArchivos  = (['titulo', 'cedulaFrente', 'cedulaReverso'] as const)
      .some(d => est.documentos[d]?.archivo);

    const row = sheet.addRow([
      i + 1,
      est.cedula,
      nombreCompleto,
      est.tipoMatricula,
      est.estadoAvatar,
      est.correoElectronico || '—',
      est.documentos.titulo.estado,
      est.documentos.cedulaFrente.estado,
      est.documentos.cedulaReverso.estado,
      tieneArchivos ? 'Sí' : 'No',
    ]);
    row.height = 18;

    const isEven = i % 2 === 0;
    const bg = isEven ? ROW_ALT : WHITE;

    row.eachCell((cell, col) => {
      cell.font      = { name: 'Calibri', size: 10, color: { argb: TEXT_DARK } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border    = {
        top:    { style: 'hair', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
        left:   { style: 'thin', color: { argb: 'FFD0D8E8' } },
        right:  { style: 'thin', color: { argb: 'FFD0D8E8' } },
      };
      cell.alignment = { horizontal: centerCols.has(col) ? 'center' : 'left', vertical: 'middle' };

      // Color estado de documento (cols 7, 8, 9)
      if (col >= 7 && col <= 9) {
        const val = String(cell.value);
        if (val === 'COMPLETO') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: GREEN } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
        } else if (val === 'PENDIENTE' || val === 'INCOMPLETO') {
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: AMBER } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMBER_BG } };
        } else {
          cell.font = { name: 'Calibri', size: 9, color: { argb: RED } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_BG } };
        }
      }

      // Color archivos digitales (col 10)
      if (col === 10) {
        const sí = cell.value === 'Sí';
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: sí ? GREEN : TEXT_MID } };
      }

      // Color tipo matrícula (col 4)
      if (col === 4) {
        const val = String(cell.value);
        cell.font = {
          name: 'Calibri', size: 10,
          color: { argb: val === 'ORDINARIA' ? 'FF1D4ED8' : val === 'EXTRAORDINARIA' ? 'FF7C3AED' : TEXT_DARK },
        };
      }
    });
  });

  // ── Freeze desde fila 6 (después del encabezado) ──────────────────────────
  sheet.views = [{ state: 'frozen', ySplit: 5, xSplit: 0 }];

  // ── Auto-filtro en encabezados ────────────────────────────────────────────
  sheet.autoFilter = { from: 'A5', to: 'J5' };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/**
 * Genera resumen de estudiantes pendientes (no completos)
 */
export async function getEstudiantesPendientes() {
  const pendientes = await Student.find({
    activo: true,
    $or: [
      { 'documentos.titulo.estado': { $ne: 'COMPLETO' } },
      { 'documentos.cedulaFrente.estado': { $ne: 'COMPLETO' } },
      { 'documentos.cedulaReverso.estado': { $ne: 'COMPLETO' } },
    ]
  }).select('cedula nombre primerApellido segundoApellido documentos estadoAvatar correoElectronico');

  return pendientes.map(est => {
    const faltantes: string[] = [];
    if (est.documentos.titulo.estado !== 'COMPLETO') faltantes.push('Título');
    if (est.documentos.cedulaFrente.estado !== 'COMPLETO') faltantes.push('Cédula (frente)');
    if (est.documentos.cedulaReverso.estado !== 'COMPLETO') faltantes.push('Cédula (reverso)');

    return {
      cedula: est.cedula,
      nombreCompleto: `${est.nombre} ${est.primerApellido} ${est.segundoApellido}`.trim(),
      correo: est.correoElectronico,
      estado: est.estadoAvatar,
      documentosFaltantes: faltantes,
    };
  });
}
