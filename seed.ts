/**
 * Seed script – Inserta datos de prueba en MongoDB para SIDERMI
 * Sistema Integrado de Datos y Requisitos de Matrícula de Ingreso
 * Uso: npx ts-node src/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student';
import UploadHistory from './models/UploadHistory';

dotenv.config();

/* ─── Datos base ─── */

const NOMBRES_M = [
  'Carlos', 'José', 'Luis', 'Diego', 'Andrés', 'Juan', 'David', 'Kevin',
  'Erick', 'Fabián', 'Roberto', 'Bryan', 'Steven', 'Ricardo', 'Fernando',
  'Antonio', 'Manuel', 'Miguel', 'Alejandro', 'Jorge',
];
const NOMBRES_F = [
  'María', 'Ana', 'Laura', 'Sofía', 'Valentina', 'Daniela', 'Gabriela',
  'Natalia', 'Mónica', 'Isabella', 'Camila', 'Paola', 'Alejandra', 'Melissa',
  'Carolina', 'Lucía', 'Andrea', 'Fernanda', 'Valeria', 'Catalina',
];

const APELLIDOS1 = [
  'Rodríguez', 'Jiménez', 'Mora', 'Solano', 'Vargas', 'Hernández', 'González',
  'Chacón', 'Calderón', 'Arias', 'Castillo', 'Rojas', 'Sánchez', 'López',
  'Ureña', 'Montero', 'Aguilar', 'Brenes', 'Esquivel', 'Cordero',
];

const APELLIDOS2 = [
  'Villalobos', 'Campos', 'Salazar', 'Espinoza', 'Retana', 'Picado', 'Bermúdez',
  'Alfaro', 'Quesada', 'Núñez', 'Zamora', 'Araya', 'Céspedes', 'Fonseca',
  'Madrigal', 'Porras', 'Zúñiga', 'Valverde', 'Chinchilla', 'Herrera',
];

const CARRERAS = [
  { codigo: 'IEA', nombre: 'Ingeniería Eléctrica' },
  { codigo: 'IEL', nombre: 'Ingeniería Electrónica' },
  { codigo: 'ILE', nombre: 'Inglés como Lengua Extranjera' },
  { codigo: 'IPRI', nombre: 'Ingeniería en Producción Industrial' },
  { codigo: 'GEHG', nombre: 'Gestión De Empresas De Hospedaje y Gastronómicas' },
  { codigo: 'GAE', nombre: 'Gestión Empresarial - Gestión y Administración Empresarial' },
  { codigo: 'GEC', nombre: 'Gestión de Grupos Turísticos - Gestión Ecoturística' },
  { codigo: 'ITI', nombre: 'Ingeniería En Tecnologías De Información' },
  { codigo: 'COFI', nombre: 'Contabilidad y Finanzas - Contaduría Pública' },
  { codigo: 'DG', nombre: 'Diseño Gráfico' },
  { codigo: 'CC-AA', nombre: 'Campus Coto - Administración Aduanera' },
  { codigo: 'AA', nombre: 'Administración Aduanera' },
];

const SEXOS: Array<'M' | 'F'> = ['M', 'F'];

const SEDES = ['Central Alajuela', 'San Carlos', 'Grecia', 'Pacífico', 'Atenas', 'Guanacaste'];

const ESTADOS_AVATAR: Array<'PENDIENTE' | 'ARCHIVADO' | 'LLAMAR' | 'NOTIFICADO' | 'COMPLETO'> =
  ['PENDIENTE', 'PENDIENTE', 'PENDIENTE', 'COMPLETO', 'NOTIFICADO', 'LLAMAR', 'ARCHIVADO'];

const DOC_ESTADOS: Array<'NO_REVISADO' | 'COMPLETO' | 'INCOMPLETO' | 'FALTANTE'> =
  ['COMPLETO', 'COMPLETO', 'COMPLETO', 'INCOMPLETO', 'FALTANTE', 'NO_REVISADO'];

const FUENTES: Array<'ASPIRANTES' | 'AVATAR' | 'SIGU' | 'MANUAL'> =
  ['ASPIRANTES', 'AVATAR', 'SIGU', 'MANUAL'];

/* ─── Utilidades ─── */

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const cedula = () => {
  const p1 = Math.floor(Math.random() * 9) + 1;
  const p2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const p3 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${p1}-${p2}-${p3}`;
};

const randomDate = (start: Date, end: Date) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const docEstado = () => ({
  estado: pick(DOC_ESTADOS),
  observacion: Math.random() > 0.7 ? pick([
    'Documento legible',
    'Foto borrosa, solicitar otra',
    'Falta firma',
    'Pendiente de apostilla',
    'Copia certificada requerida',
    'Documento vencido',
    '',
  ]) : '',
  fechaRevision: Math.random() > 0.5 ? randomDate(new Date('2025-01-01'), new Date()) : undefined,
});

/* ─── Generar estudiantes ─── */

function generateStudents(count: number) {
  const students = [];
  const usedCedulas = new Set<string>();

  for (let i = 0; i < count; i++) {
    let ced: string;
    do { ced = cedula(); } while (usedCedulas.has(ced));
    usedCedulas.add(ced);

    const sexo = pick(SEXOS);
    const nombre = sexo === 'M' ? pick(NOMBRES_M) : pick(NOMBRES_F);
    const ap1 = pick(APELLIDOS1);
    const ap2 = pick(APELLIDOS2);
    const carrera = pick(CARRERAS);
    const sede = pick(SEDES);
    const tipo: 'ORDINARIA' | 'EXTRAORDINARIA' = Math.random() > 0.3 ? 'ORDINARIA' : 'EXTRAORDINARIA';
    const estado = pick(ESTADOS_AVATAR);
    const monto = [17500, 35000, 52500, 70000][Math.floor(Math.random() * 4)];
    // ~65% of students are matriculados (confirmed via corte/Avatar)
    const esMatriculado = Math.random() > 0.35;
    const pagado = esMatriculado ? Math.random() > 0.15 : false;

    students.push({
      cedula: ced,
      nombre,
      primerApellido: ap1,
      segundoApellido: ap2,
      sexo,
      correoElectronico: `${nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${ap1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@est.utn.ac.cr`,
      telefono: `8${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,

      sede,
      codigoCarrera: carrera.codigo,
      codigoCarreraAvatar: carrera.codigo,
      codigoCarreraManual: '',
      carnet: `UTN${String(2024000 + i).padStart(7, '0')}`,

      tipoMatricula: tipo,
      matriculado: esMatriculado,
      corteMatricula: '2025-I',
      boleta: `BOL-${String(Math.floor(Math.random() * 900000 + 100000))}`,
      moneda: 'CRC',
      monto,
      fechaPago: pagado ? randomDate(new Date('2025-01-15'), new Date('2025-03-01')) : null,
      estadoPago: pagado ? 'PAGADO' : 'PENDIENTE',
      tipoPago: pagado ? pick(['SINPE', 'TRANSFERENCIA', 'DEPOSITO', 'VENTANILLA']) : '',
      recibo: pagado ? `REC-${Math.floor(Math.random() * 900000 + 100000)}` : '',
      montoPagado: pagado ? monto : 0,

      citaOrdinaria: tipo === 'ORDINARIA'
        ? `2025-02-${String(Math.floor(Math.random() * 15 + 10)).padStart(2, '0')} ${Math.floor(Math.random() * 4 + 8)}:00`
        : '',
      citaExtraordinaria: tipo === 'EXTRAORDINARIA'
        ? `2025-03-${String(Math.floor(Math.random() * 15 + 1)).padStart(2, '0')} ${Math.floor(Math.random() * 4 + 8)}:00`
        : '',

      estadoAvatar: estado,
      verificacionRegistro: estado === 'COMPLETO',
      identidad: Math.random() > 0.3 ? 'VERIFICADA' : 'PENDIENTE',
      observaciones: Math.random() > 0.6 ? pick([
        'Estudiante nuevo ingreso',
        'Requiere validación de documentos',
        'Se contactó por correo, sin respuesta',
        'Documentos incompletos, se notificó',
        'Trasladado de sede San Carlos',
        'Condicional por requisitos',
        'Matrícula condicionada a entrega de título',
        '',
      ]) : '',

      documentos: {
        titulo: docEstado(),
        cedulaFrente: docEstado(),
        cedulaReverso: docEstado(),
        fotoCarnet: docEstado(),
        formularioMatricula: docEstado(),
        otros: { estado: 'NO_REVISADO' as const, observacion: '', fechaRevision: undefined },
      },

      medioContacto: pick(['Correo', 'Teléfono', 'WhatsApp', 'Presencial', '']),
      fechaContactoCorreo: Math.random() > 0.5
        ? randomDate(new Date('2025-01-01'), new Date())
        : null,
      historialContactos: Math.random() > 0.5
        ? [{
            fecha: randomDate(new Date('2025-01-01'), new Date()),
            medio: pick(['Correo', 'Teléfono', 'WhatsApp']),
            detalle: pick([
              'Primer contacto, se indicó documentación faltante',
              'Se envió correo con instrucciones de matrícula',
              'Llamada telefónica, estudiante confirmó entrega',
              'WhatsApp leído, sin respuesta aún',
            ]),
          }]
        : [],

      fuenteDatos: esMatriculado ? pick(['AVATAR', 'SIGU', 'ASPIRANTES']) : 'ASPIRANTES',
      activo: Math.random() > 0.05,
    });
  }

  return students;
}

/* ─── Generar historial de subidas ─── */

function generateUploadHistory() {
  return [
    {
      tipoArchivo: 'ASPIRANTES' as const,
      tipoMatricula: 'ORDINARIA' as const,
      nombreArchivo: 'Listado_Aspirantes_2025-I.xlsx',
      registrosTotales: 85,
      registrosNuevos: 85,
      registrosExistentes: 0,
      registrosActualizados: 0,
      corte: '2025-I',
      detalles: 'Carga inicial de aspirantes para el período 2025-I',
      fecha: new Date('2025-01-20T10:30:00'),
    },
    {
      tipoArchivo: 'AVATAR' as const,
      tipoMatricula: 'ORDINARIA' as const,
      nombreArchivo: 'Reporte_Avatar_Febrero.xlsx',
      registrosTotales: 72,
      registrosNuevos: 12,
      registrosExistentes: 60,
      registrosActualizados: 60,
      corte: '2025-I',
      detalles: 'Actualización desde Avatar con 2 errores (cédula inválida fila 14, correo duplicado fila 38)',
      fecha: new Date('2025-02-05T14:15:00'),
    },
    {
      tipoArchivo: 'CORTE_MATRICULA' as const,
      tipoMatricula: 'EXTRAORDINARIA' as const,
      nombreArchivo: 'Corte_Matricula_Marzo.xlsx',
      registrosTotales: 65,
      registrosNuevos: 5,
      registrosExistentes: 60,
      registrosActualizados: 60,
      corte: '2025-I',
      detalles: 'Corte de matrícula extraordinaria periodo 2025-I',
      fecha: new Date('2025-03-01T09:00:00'),
    },
  ];
}

/* ─── Main ─── */

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/registro_utn';
  console.log('🔌 Conectando a MongoDB…', uri);
  await mongoose.connect(uri);
  console.log('✅ Conectado\n');

  // Limpiar datos previos
  console.log('🗑  Limpiando colecciones…');
  await Student.deleteMany({});
  await UploadHistory.deleteMany({});

  // Insertar estudiantes
  const students = generateStudents(35);
  console.log(`📥 Insertando ${students.length} estudiantes…`);
  await Student.insertMany(students);

  // Insertar historial de subidas
  const uploads = generateUploadHistory();
  console.log(`📥 Insertando ${uploads.length} registros de historial de subidas…`);
  await UploadHistory.insertMany(uploads);

  // Resumen
  const total = await Student.countDocuments();
  const pendientes = await Student.countDocuments({ estadoAvatar: 'PENDIENTE' });
  const completos = await Student.countDocuments({ estadoAvatar: 'COMPLETO' });

  console.log('\n════════════════════════════════════');
  console.log('   🎓 SIDERMI — Seed completado');
  console.log('════════════════════════════════════');
  console.log(`   Total estudiantes:  ${total}`);
  console.log(`   Pendientes:         ${pendientes}`);
  console.log(`   Completos:          ${completos}`);
  console.log(`   Subidas históricas: ${uploads.length}`);
  console.log('════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
