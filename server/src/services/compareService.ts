import Student, { IStudent } from '../models/Student';
import { detectarSexo } from './genderService';
import {
  AspiranteRow,
  MatriculadoRow,
  AvatarRow,
} from './excelService';

/** Normaliza texto para comparación: minúsculas, sin tildes, sin espacios extra */
function normText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Dada la columna "Nombre" del corte (formato: "AP1 AP2 NOMBRE..."),
 * intenta localizar un estudiante por nombre completo normalizado.
 */
async function findByFullName(rawNombre: string): Promise<IStudent | null> {
  if (!rawNombre) return null;
  const partes = rawNombre.split(' ').filter(p => p.length > 0);
  if (partes.length < 2) return null;

  // El corte viene como "AP1 AP2 NOMBRE" — probamos con 2 apellidos + nombre
  const ap1 = partes[0];
  const ap2 = partes.length >= 3 ? partes[1] : '';
  const nombre = partes.length >= 3 ? partes.slice(2).join(' ') : partes[1];

  // Buscar con regex insensible a mayúsculas/tildes usando los valores normalizados
  const candidates = await Student.find({
    activo: true,
    primerApellido: { $exists: true, $ne: '' },
  }).select('cedula nombre primerApellido segundoApellido');

  const nAp1 = normText(ap1);
  const nAp2 = normText(ap2);
  const nNombre = normText(nombre);

  for (const c of candidates) {
    const cAp1 = normText(c.primerApellido || '');
    const cAp2 = normText(c.segundoApellido || '');
    const cNombre = normText(c.nombre || '');

    // Coincidencia exacta AP1 + AP2 + inicio del nombre
    if (cAp1 === nAp1 && (ap2 === '' || cAp2 === nAp2) && cNombre.startsWith(nNombre.split(' ')[0])) {
      return c;
    }
  }
  return null;
}

/** Parsea fechas en formato dd/mm/yyyy, mm/dd/yyyy, ISO, o serial Excel */
function parseDate(val: any): Date | null {
  if (!val) return null;

  // Ya es Date
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // Serial numérico de Excel (días desde 1900-01-01)
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }

  const s = String(val).trim();
  if (!s) return null;

  // dd/mm/yyyy o d/m/yyyy
  const dmMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmMatch) {
    const [, d, m, y] = dmMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }

  // Intento genérico (ISO, etc.)
  const generic = new Date(s);
  return isNaN(generic.getTime()) ? null : generic;
}

export interface CompareResult {
  nuevos: number;
  existentes: number;
  actualizados: number;
  detalles: string[];
}

/**
 * Importa aspirantes: si la cédula ya existe, lo ignora. Si no, lo crea.
 */
export async function importarAspirantes(rows: AspiranteRow[]): Promise<CompareResult> {
  const result: CompareResult = { nuevos: 0, existentes: 0, actualizados: 0, detalles: [] };

  for (const row of rows) {
    try {
    const existing = await Student.findOne({ cedula: row.cedula });

    if (existing) {
      result.existentes++;
      continue;
    }

    // Separar nombre completo si viene junto
    let nombre = row.nombre;
    let primerApellido = row.primerApellido;
    let segundoApellido = row.segundoApellido;

    await Student.create({
      cedula: row.cedula,
      nombre,
      primerApellido,
      segundoApellido,
      correoElectronico: row.correoElectronico,
      telefono: row.telefono,
      sede: row.sede,
      codigoCarrera: row.codigoCarrera,
      citaOrdinaria: row.citaOrdinaria,
      citaExtraordinaria: row.citaExtraordinaria,
      sexo: detectarSexo(nombre),
      tipoMatricula: 'ORDINARIA',
      matriculado: false,
      fuenteDatos: 'ASPIRANTES',
      estadoAvatar: 'PENDIENTE',
    });

    result.nuevos++;
    result.detalles.push(`Nuevo aspirante: ${nombre} ${primerApellido} (${row.cedula})`);
    } catch (err: any) {
      result.detalles.push(`Error fila ${row.cedula}: ${err.message?.split(':')[0]}`);
    }
  }

  return result;
}

/**
 * Importa corte de matriculados (SIGU):
 * - Si la cédula ya existe → actualiza datos de pago
 * - Si no existe → crea nuevo con tag de tipo matrícula
 */
export async function importarCorteMatriculados(
  rows: MatriculadoRow[],
  tipoMatricula: 'ORDINARIA' | 'EXTRAORDINARIA',
  corte: string
): Promise<CompareResult> {
  const result: CompareResult = { nuevos: 0, existentes: 0, actualizados: 0, detalles: [] };

  for (const row of rows) {
    try {
    // 1er intento: buscar por cédula
    let existing: IStudent | null = await Student.findOne({ cedula: row.cedula });
    let matchedBy = 'cédula';

    // 2do intento: si la cédula no coincide, buscar por nombre completo normalizado
    if (!existing && row.nombre) {
      existing = await findByFullName(row.nombre);
      if (existing) matchedBy = 'nombre';
    }

    if (existing) {
      const updateData: any = {};

      // Aspirante que aparece en corte = ORDINARIA (matriculó por vía ordinaria)
      updateData.matriculado = true;
      updateData.tipoMatricula = 'ORDINARIA';
      updateData.fuenteDatos = 'SIGU';
      if (!existing.sexo) {
        const sexo = detectarSexo(existing.nombre);
        if (sexo) updateData.sexo = sexo;
      }

      // Si se encontró por nombre y la cédula del corte parece válida, actualizarla
      if (matchedBy === 'nombre' && row.cedula && row.cedula.length >= 8 && /^\d+$/.test(row.cedula)) {
        updateData.cedula = row.cedula;
      }

      if (!existing.boleta && row.boleta) updateData.boleta = row.boleta;
      if (!existing.monto && row.monto) updateData.monto = row.monto;
      if (!existing.fechaPago && row.fechaPago) updateData.fechaPago = parseDate(row.fechaPago);
      if (!existing.estadoPago && row.estadoPago) updateData.estadoPago = row.estadoPago;
      if (!existing.tipoPago && row.tipoPago) updateData.tipoPago = row.tipoPago;
      if (!existing.recibo && row.recibo) updateData.recibo = row.recibo;
      if (!existing.montoPagado && row.montoPagado) updateData.montoPagado = row.montoPagado;
      if (row.moneda) updateData.moneda = row.moneda;
      if (corte) updateData.corteMatricula = corte;

      // Completar apellidos si el registro no los tiene
      if (row.nombre && !existing.primerApellido) {
        const partes = row.nombre.split(' ').filter(p => p.length > 0);
        if (partes.length >= 3) {
          updateData.primerApellido = partes[0];
          updateData.segundoApellido = partes[1];
          updateData.nombre = partes.slice(2).join(' ');
        } else if (partes.length === 2) {
          updateData.primerApellido = partes[0];
          updateData.nombre = partes[1];
        }
      }

      if (Object.keys(updateData).length > 0) {
        await Student.updateOne({ _id: existing._id }, { $set: updateData });
        result.actualizados++;
        result.detalles.push(`Actualizado (por ${matchedBy}): ${row.nombre || existing.nombre} (${row.cedula})`);
      } else {
        result.existentes++;
      }
    } else {
      // Ni cédula ni nombre coinciden → se omite
      result.detalles.push(`Omitido (sin coincidencia): ${row.nombre} (${row.cedula})`);
    }
    } catch (err: any) {
      result.detalles.push(`Error fila ${row.cedula}: ${err.message?.split(':')[0]}`);
    }
  }

  return result;
}

/**
 * Importa datos de Avatar:
 * - Si la cédula/carnet ya existe → actualiza datos de Avatar
 * - Si no existe → crea nuevo con tag extraordinaria
 */
export async function importarAvatar(
  rows: AvatarRow[],
  tipoMatricula: 'ORDINARIA' | 'EXTRAORDINARIA'
): Promise<CompareResult> {
  const result: CompareResult = { nuevos: 0, existentes: 0, actualizados: 0, detalles: [] };

  for (const row of rows) {
    try {
    // Buscar por cédula o por carnet
    let existing = await Student.findOne({ cedula: row.cedula });
    if (!existing && row.carnet) {
      existing = await Student.findOne({ carnet: row.carnet });
    }

    if (existing) {
      const updateData: any = {};
      // Aspirante que aparece en Avatar = ORDINARIA (ya matriculado)
      updateData.matriculado = true;
      updateData.tipoMatricula = 'ORDINARIA';
      updateData.fuenteDatos = 'AVATAR';
      if (!existing.sexo) {
        const sexo = detectarSexo(existing.nombre);
        if (sexo) updateData.sexo = sexo;
      }
      if (row.carnet && !existing.carnet) updateData.carnet = row.carnet;
      if (row.correoElectronico && !existing.correoElectronico) updateData.correoElectronico = row.correoElectronico;
      if (row.telefono && !existing.telefono) updateData.telefono = row.telefono;
      if (row.codigoCarrera) updateData.codigoCarreraAvatar = row.codigoCarrera;

      if (Object.keys(updateData).length > 0) {
        await Student.updateOne({ _id: existing._id }, { $set: updateData });
        result.actualizados++;
      } else {
        result.existentes++;
      }
    } else {
      // Nuevo desde Avatar (no estaba en aspirantes ni en SIGU)
      const partes = row.nombre.split(' ').filter(p => p.length > 0);
      let nombre = row.nombre;
      let primerApellido = '';
      let segundoApellido = '';

      if (partes.length >= 3) {
        primerApellido = partes[0];
        segundoApellido = partes[1];
        nombre = partes.slice(2).join(' ');
      }

      await Student.create({
        cedula: row.cedula,
        carnet: row.carnet,
        nombre,
        primerApellido,
        segundoApellido,
        correoElectronico: row.correoElectronico,
        telefono: row.telefono,
        codigoCarreraAvatar: row.codigoCarrera,
        sexo: detectarSexo(nombre),
        tipoMatricula: 'EXTRAORDINARIA',  // Nuevo en Avatar = no estaba en aspirantes = extraordinaria
        matriculado: true,
        fuenteDatos: 'AVATAR',
        estadoAvatar: 'PENDIENTE',
      });

      result.nuevos++;
      result.detalles.push(`Nuevo desde Avatar (${tipoMatricula}): ${row.nombre} (${row.cedula})`);
    }
    } catch (err: any) {
      result.detalles.push(`Error fila ${row.cedula}: ${err.message?.split(':')[0]}`);
    }
  }

  return result;
}
