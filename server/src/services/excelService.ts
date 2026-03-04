import * as XLSX from 'xlsx';
import path from 'path';

export interface AspiranteRow {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  correoElectronico: string;
  telefono: string;
  sede: string;
  codigoCarrera: string;
  citaOrdinaria: string;
  citaExtraordinaria: string;
}

export interface MatriculadoRow {
  boleta: string;
  cedula: string;
  nombre: string;
  moneda: string;
  monto: number;
  fechaPago: string;
  estadoPago: string;
  tipoPago: string;
  recibo: string;
  montoPagado: number;
}

export interface AvatarRow {
  carnet: string;
  cedula: string;
  nombre: string;
  correoElectronico: string;
  telefono: string;
  codigoCarrera: string;
}

// Limpia un valor para obtener string
function cleanStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// Limpia un valor para obtener número
function cleanNum(val: any): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// Normaliza cédula: quita espacios, guiones, y rellena a 9 dígitos si es nacional
function normalizeCedula(val: any): string {
  let cedula = cleanStr(val).replace(/[\s\-\.]/g, '');
  // Si es numérica y tiene menos de 9 dígitos, rellenar con ceros
  if (/^\d+$/.test(cedula) && cedula.length < 9) {
    cedula = cedula.padStart(9, '0');
  }
  return cedula;
}

/**
 * Parsea la hoja de Aspirantes del Excel
 */
export function parseAspirantesSheet(filePath: string): AspiranteRow[] {
  const workbook = XLSX.readFile(filePath);
  // Buscar hoja "Aspirantes" o la primera
  const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('aspirante')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

  const results: AspiranteRow[] = [];

  for (const row of rawData) {
    // Intentar mapear por diferentes nombres de columna posibles
    const cedula = normalizeCedula(
      row['Identificación'] || row['Identificacion'] || row['Cedula'] || row['CEDULA'] || row['cedula'] || ''
    );

    if (!cedula || cedula === '0' || cedula.length < 5) continue;

    results.push({
      cedula,
      nombre: cleanStr(row['Nombre'] || row['NOMBRE'] || ''),
      primerApellido: cleanStr(row['Primer Apellido'] || row['PrimerApellido'] || ''),
      segundoApellido: cleanStr(row['Segundo Apellido'] || row['SegundoApellido'] || ''),
      correoElectronico: cleanStr(row['Correo Electrónico'] || row['Correo'] || row['Email'] || ''),
      telefono: cleanStr(row['Teléfono'] || row['Telefono'] || row['Tel'] || ''),
      sede: cleanStr(row['Sede'] || row['SEDE'] || ''),
      codigoCarrera: cleanStr(row['Código de Carrera'] || row['CodigoCarrera'] || row['Carrera'] || ''),
      citaOrdinaria: cleanStr(row['Cita de Matrícula Ordinaria'] || row['CitaOrdinaria'] || ''),
      citaExtraordinaria: cleanStr(row['Cita de Matrícula Extraordinaria'] || row['CitaExtraordinaria'] || ''),
    });
  }

  return results;
}

/**
 * Parsea la hoja de Matriculados / Cortes del Excel (datos del SIGU)
 * Maneja tanto la estructura limpia como la de "Limpieado de datos"
 */
export function parseMatriculadosSheet(filePath: string): MatriculadoRow[] {
  const workbook = XLSX.readFile(filePath);

  // Priorizar hoja "Limpieado de datos" que tiene datos reales, 
  // luego "Matriculados", luego la primera hoja
  const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('limpi')) ||
    workbook.SheetNames.find(s => s.toLowerCase().includes('matric')) ||
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: true });

  const results: MatriculadoRow[] = [];

  for (const row of rawData) {
    // Datos pueden venir con encabezados nombrados o como Unnamed:XX
    // Intentar ambos formatos
    let boleta = cleanStr(row['Boleta'] || row['__EMPTY_1'] || '');
    let cedula = normalizeCedula(row['Carnet'] || row['Identificación'] || row['Identificacion'] || row['Cedula'] || row['CEDULA'] || row['__EMPTY_2'] || '');
    let nombre = cleanStr(row['Nombre'] || row['__EMPTY_3'] || '');
    let moneda = cleanStr(row['Mon'] || row['Moneda'] || row['__EMPTY_4'] || 'COL');
    let monto = cleanNum(row['Monto'] || row['__EMPTY_5'] || 0);
    let fechaPago = cleanStr(row['Fecha'] || row['Fecha de Pago'] || row['__EMPTY_6'] || '');
    let estadoPago = cleanStr(row['Est.'] || row['Estado'] || row['Estado de Pago'] || row['__EMPTY_7'] || '');
    let tipoPago = cleanStr(row['Tipo'] || row['Tipo de Pago'] || row['__EMPTY_8'] || '');
    let recibo = cleanStr(row['Recibo'] || row['__EMPTY_10'] || '');
    let montoPagado = cleanNum(row['Pagado'] || row['Monto Pagado'] || row['__EMPTY_11'] || 0);

    // Si los datos no se encontraron en las columnas principales,
    // buscar en las columnas Unnamed (formato "Limpieado de datos")
    if (!cedula || cedula.length < 5) {
      // Iterar por las claves buscando datos en columnas sin nombre
      const keys = Object.keys(row);
      for (const key of keys) {
        const val = row[key];
        if (key.includes('Unnamed') || key.startsWith('__EMPTY')) {
          const numVal = Number(val);
          // Detectar cédula (número de 8-12 dígitos)
          if (!isNaN(numVal) && String(numVal).length >= 8 && String(numVal).length <= 12) {
            if (!cedula || cedula.length < 5) {
              cedula = normalizeCedula(val);
            }
          }
          // Detectar nombre (texto con letras)
          if (typeof val === 'string' && val.length > 5 && /[A-ZÁÉÍÓÚÑ]{2,}/.test(val) && !nombre) {
            nombre = val.trim();
          }
        }
      }
    }

    if (!cedula || cedula.length < 5) continue;

    results.push({
      boleta,
      cedula,
      nombre,
      moneda,
      monto,
      fechaPago,
      estadoPago,
      tipoPago,
      recibo,
      montoPagado,
    });
  }

  return results;
}

/**
 * Parsea la hoja de Avatar del Excel
 */
export function parseAvatarSheet(filePath: string): AvatarRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('avatar')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

  const results: AvatarRow[] = [];

  for (const row of rawData) {
    const carnet = cleanStr(row['Carnet'] || row['CARNET'] || '');
    const cedula = normalizeCedula(row['Identificación'] || row['Identificacion'] || row['Cedula'] || row['Cédula'] || row['CEDULA'] || '');
    const nombre = cleanStr(row['Nombre'] || row['NOMBRE'] || '');

    if ((!cedula || cedula.length < 5) && !carnet) continue;

    results.push({
      carnet: carnet || cedula,
      cedula: cedula || carnet,
      nombre,
      correoElectronico: cleanStr(row['Correo Electrónico'] || row['Correo'] || row['Email'] || ''),
      telefono: cleanStr(row['Teléfono'] || row['Telefono'] || ''),
      codigoCarrera: cleanStr(row['Código de Carrera'] || row['CodigoCarrera'] || row['Carrera'] || ''),
    });
  }

  return results;
}

/**
 * Auto-detecta el tipo de Excel y parsea todas las hojas disponibles
 */
export function parseExcelAutoDetect(filePath: string) {
  const workbook = XLSX.readFile(filePath);
  const sheets = workbook.SheetNames;

  return {
    sheets,
    hasAspirantes: sheets.some(s => s.toLowerCase().includes('aspirante')),
    hasMatriculados: sheets.some(s => s.toLowerCase().includes('matric') || s.toLowerCase().includes('limpi')),
    hasAvatar: sheets.some(s => s.toLowerCase().includes('avatar')),
  };
}
