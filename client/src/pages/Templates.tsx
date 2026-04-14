import { useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  Users,
  UserCheck,
  ClipboardList,
  Download,
  Info,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../components/Toast';
import { getAllAspirants } from '../services/api';
import type { Student } from '../types';

/* ── Real UTN Sede del Pacífico careers ── */
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

/* ── Name pools for generating realistic sample data ── */
const NOMBRES_M = [
  'Carlos', 'José', 'Luis', 'Diego', 'Andrés', 'Juan', 'David', 'Kevin',
  'Erick', 'Fabián', 'Roberto', 'Bryan', 'Steven', 'Ricardo', 'Fernando',
  'Antonio', 'Manuel', 'Miguel', 'Alejandro', 'Jorge', 'Daniel', 'Sebastián',
  'Gabriel', 'Aarón', 'Cristian', 'Marco', 'Pablo', 'Esteban', 'Héctor', 'Adrián',
];
const NOMBRES_F = [
  'María', 'Ana', 'Laura', 'Sofía', 'Valentina', 'Daniela', 'Gabriela',
  'Natalia', 'Mónica', 'Isabella', 'Camila', 'Paola', 'Alejandra', 'Melissa',
  'Carolina', 'Lucía', 'Andrea', 'Fernanda', 'Valeria', 'Catalina', 'Nicole',
  'Kimberly', 'Stephanie', 'Priscilla', 'Karen', 'Jennifer', 'Tatiana', 'Wendy', 'Arianna', 'Fabiola',
];
const AP1 = [
  'Rodríguez', 'Jiménez', 'Mora', 'Solano', 'Vargas', 'Hernández', 'González',
  'Chacón', 'Calderón', 'Arias', 'Castillo', 'Rojas', 'Sánchez', 'López',
  'Ureña', 'Montero', 'Aguilar', 'Brenes', 'Esquivel', 'Cordero',
  'Ramírez', 'Gutiérrez', 'Villalobos', 'Bonilla', 'Castro', 'Barrantes',
  'Mena', 'Navarro', 'Pérez', 'Trejos',
];
const AP2 = [
  'Villalobos', 'Campos', 'Salazar', 'Espinoza', 'Retana', 'Picado', 'Bermúdez',
  'Alfaro', 'Quesada', 'Núñez', 'Zamora', 'Araya', 'Céspedes', 'Fonseca',
  'Madrigal', 'Porras', 'Zúñiga', 'Valverde', 'Chinchilla', 'Herrera',
  'Camacho', 'Leiva', 'Vega', 'Umaña', 'Bolaños', 'Elizondo', 'Segura',
  'Orozco', 'Murillo', 'Acuña',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const cedula = () => `${rndInt(1,9)}${String(rndInt(0,9999)).padStart(4,'0')}${String(rndInt(0,9999)).padStart(4,'0')}`;
const normalizeText = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
const firstTwo = (value: string) => normalizeText(value).slice(0, 2);
const buildTemplateEmail = (nombre: string, ap1: string, ap2: string) =>
  `${firstTwo(nombre)}.${normalizeText(ap1)}.${firstTwo(ap2)}@est.utn.ac.cr`;

/* ── Shared pool of students (generated once) ── */
interface StudentPool {
  cedula: string;
  nombre: string;
  ap1: string;
  ap2: string;
  sexo: 'M' | 'F';
  correo: string;
  telefono: string;
  carrera: typeof CARRERAS[number];
}

let _sharedPool: StudentPool[] | null = null;
const POOL_SIZE = 500;

function getSharedPool(): StudentPool[] {
  if (_sharedPool) return _sharedPool;
  const pool: StudentPool[] = [];
  const usedCedulas = new Set<string>();
  for (let i = 0; i < POOL_SIZE; i++) {
    let ced: string;
    do { ced = cedula(); } while (usedCedulas.has(ced));
    usedCedulas.add(ced);
    const isMale = Math.random() > 0.5;
    const nombre = isMale ? pick(NOMBRES_M) : pick(NOMBRES_F);
    const ap1 = pick(AP1);
    const ap2 = pick(AP2);
    pool.push({
      cedula: ced,
      nombre,
      ap1,
      ap2,
      sexo: isMale ? 'M' : 'F',
      correo: buildTemplateEmail(nombre, ap1, ap2),
      telefono: `8${rndInt(100,999)}-${rndInt(1000,9999)}`,
      carrera: pick(CARRERAS),
    });
  }
  _sharedPool = pool;
  return pool;
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ── Generate ~500 aspirantes sample rows (full pool) ── */
function genAspiranteRows(n: number) {
  const pool = getSharedPool();
  return pool.slice(0, n).map(s => {
    const ordDay = rndInt(10, 28);
    const ordHour = rndInt(8, 16);
    const hasExtra = Math.random() > 0.7;
    return {
      'Identificación': s.cedula,
      'Nombre': s.nombre,
      'Primer Apellido': s.ap1,
      'Segundo Apellido': s.ap2,
      'Correo Electrónico': s.correo,
      'Teléfono': s.telefono,
      'Sede': 'Pacífico',
      'Código de Carrera': s.carrera.codigo,
      'Cita de Matrícula Ordinaria': `2026-02-${String(ordDay).padStart(2,'0')} ${String(ordHour).padStart(2,'0')}:00`,
      'Cita de Matrícula Extraordinaria': hasExtra ? `2026-03-${String(rndInt(1,15)).padStart(2,'0')} ${String(rndInt(8,16)).padStart(2,'0')}:00` : '',
    };
  });
}

/* ── Generate ~70 avatar rows: ~55 from aspirantes pool + ~15 nuevos ── */
function genAvatarRows(n: number) {
  const pool = getSharedPool();
  const rows: Record<string, any>[] = [];
  // ~80% from existing aspirantes (cruzado)
  const fromPool = Math.round(n * 0.8);
  const picked = shuffled(pool).slice(0, fromPool);
  for (let i = 0; i < picked.length; i++) {
    const s = picked[i];
    rows.push({
      'Carnet': `UTN${String(2026000 + i).padStart(7, '0')}`,
      'Identificación': s.cedula,
      'Nombre': `${s.nombre} ${s.ap1} ${s.ap2}`,
      'Correo Electrónico': s.correo,
      'Teléfono': s.telefono,
      'Código de Carrera': s.carrera.codigo,
    });
  }
  // ~20% nuevos (extraordinarios — no están en aspirantes)
  const extras = n - fromPool;
  const usedCedulas = new Set(pool.map(s => s.cedula));
  for (let i = 0; i < extras; i++) {
    let ced: string;
    do { ced = cedula(); } while (usedCedulas.has(ced));
    usedCedulas.add(ced);
    const isMale = Math.random() > 0.5;
    const nombre = isMale ? pick(NOMBRES_M) : pick(NOMBRES_F);
    const ap1 = pick(AP1);
    const ap2 = pick(AP2);
    rows.push({
      'Carnet': `UTN${String(2026000 + fromPool + i).padStart(7, '0')}`,
      'Identificación': ced,
      'Nombre': `${nombre} ${ap1} ${ap2}`,
      'Correo Electrónico': buildTemplateEmail(nombre, ap1, ap2),
      'Teléfono': `8${rndInt(100,999)}-${rndInt(1000,9999)}`,
      'Código de Carrera': pick(CARRERAS).codigo,
    });
  }
  return rows;
}

/* ── Generate ~60 corte rows: ~50 from aspirantes pool + ~10 nuevos ── */
function genCorteRows(n: number) {
  const pool = getSharedPool();
  const rows: Record<string, any>[] = [];
  const estadosPago = ['PAG', 'PAG', 'PAG', 'PEN', 'ANU']; // mayoria pagados
  const tiposPago = ['SIN', 'TRA', 'DEP', 'VEN'];

  // ~80% from existing aspirantes (cruzado) — estos serán ORDINARIA automáticamente
  const fromPool = Math.round(n * 0.8);
  const picked = shuffled(pool).slice(0, fromPool);

  for (let i = 0; i < picked.length; i++) {
    const s = picked[i];
    const monto = [17500, 35000, 52500, 70000][rndInt(0, 3)];
    const estado = pick(estadosPago);
    const pagado = estado === 'PAG';
    rows.push({
      'Indice': i + 1,
      'Boleta': `BOL-${String(100001 + i).padStart(6, '0')}`,
      'Carnet': s.cedula,
      'Nombre': `${s.ap1} ${s.ap2} ${s.nombre}`,
      'Mon': 'CRC',
      'Monto': monto,
      'Fecha': pagado ? `${rndInt(5, 28)}/${rndInt(1,2)}/2026` : '',
      'Est.': estado,
      'Tipo': pagado ? pick(tiposPago) : '',
      '': '',
      'Recibo': pagado ? `REC-${String(200001 + i).padStart(6, '0')}` : '',
      'Pagado': pagado ? monto : 0,
    });
  }

  // ~20% nuevos (no están en aspirantes — serán EXTRAORDINARIA automáticamente)
  const extras = n - fromPool;
  const usedCedulas = new Set(pool.map(s => s.cedula));
  for (let i = 0; i < extras; i++) {
    let ced: string;
    do { ced = cedula(); } while (usedCedulas.has(ced));
    usedCedulas.add(ced);
    const isMale = Math.random() > 0.5;
    const nombre = isMale ? pick(NOMBRES_M) : pick(NOMBRES_F);
    const ap1 = pick(AP1);
    const ap2 = pick(AP2);
    const monto = [17500, 35000, 52500, 70000][rndInt(0, 3)];
    const estado = pick(estadosPago);
    const pagado = estado === 'PAG';
    rows.push({
      'Indice': fromPool + i + 1,
      'Boleta': `BOL-${String(100001 + fromPool + i).padStart(6, '0')}`,
      'Carnet': ced,
      'Nombre': `${ap1} ${ap2} ${nombre}`,
      'Mon': 'CRC',
      'Monto': monto,
      'Fecha': pagado ? `${rndInt(5, 28)}/${rndInt(1,2)}/2026` : '',
      'Est.': estado,
      'Tipo': pagado ? pick(tiposPago) : '',
      '': '',
      'Recibo': pagado ? `REC-${String(200001 + fromPool + i).padStart(6, '0')}` : '',
      'Pagado': pagado ? monto : 0,
    });
  }

  return rows;
}

/* ── Build corte rows from real aspirants in DB ── */
function buildCorteRowsFromAspirants(aspirants: Student[]): Record<string, any>[] {
  const estadosPago = ['PAG', 'PAG', 'PAG', 'PEN'];
  const tiposPago = ['SIN', 'TRA', 'DEP', 'VEN'];
  return aspirants.map((s, i) => {
    const monto = [17500, 35000, 52500, 70000][rndInt(0, 3)];
    const estado = pick(estadosPago);
    const pagado = estado === 'PAG';
    return {
      'Indice': i + 1,
      'Boleta': `BOL-${String(100001 + i).padStart(6, '0')}`,
      'Carnet': s.cedula,
      'Nombre': `${s.primerApellido} ${s.segundoApellido} ${s.nombre}`,
      'Mon': 'CRC',
      'Monto': monto,
      'Fecha': pagado ? `${rndInt(5, 28)}/${rndInt(1, 2)}/2026` : '',
      'Est.': estado,
      'Tipo': pagado ? pick(tiposPago) : '',
      '': '',
      'Recibo': pagado ? `REC-${String(200001 + i).padStart(6, '0')}` : '',
      'Pagado': pagado ? monto : 0,
    };
  });
}

/* ── Template definitions ── */
interface TemplateConfig {
  key: string;
  label: string;
  icon: typeof FileSpreadsheet;
  color: string;
  description: string;
  sheetName: string;
  columns: string[];
  genRows: (n: number) => Record<string, any>[];
  sampleCount: number;
}

const TEMPLATES: TemplateConfig[] = [
  {
    key: 'aspirantes',
    label: 'Aspirantes',
    icon: Users,
    color: 'utn-blue',
    description: 'Lista de aspirantes exportada desde el sistema SIGU. Incluye datos de identificación, contacto, sede, carrera y citas de matrícula. El sexo se detecta automáticamente del nombre.',
    sheetName: 'Aspirantes',
    columns: [
      'Identificación', 'Nombre', 'Primer Apellido', 'Segundo Apellido',
      'Correo Electrónico', 'Teléfono', 'Sede', 'Código de Carrera',
      'Cita de Matrícula Ordinaria', 'Cita de Matrícula Extraordinaria',
    ],
    genRows: genAspiranteRows,
    sampleCount: 500,
  },
  {
    key: 'corte',
    label: 'Corte de Matrícula',
    icon: ClipboardList,
    color: 'amber',
    description: 'Boletas de Matrícula — Sede Pacífico. Los datos de ejemplo usan los aspirantes reales ya cargados en la base de datos, con sus cédulas exactas. Sirve para probar el cruzado automático.',
    sheetName: 'Limpieado de datos',
    columns: [
      'Indice', 'Boleta', 'Carnet', 'Nombre', 'Mon', 'Monto',
      'Fecha', 'Est.', 'Tipo', '', 'Recibo', 'Pagado',
    ],
    genRows: genCorteRows,
    sampleCount: 60,
  },
  {
    key: 'avatar',
    label: 'Avatar',
    icon: UserCheck,
    color: 'emerald',
    description: 'Reporte del sistema Avatar. ~80% de las cédulas coinciden con aspirantes (→ ORDINARIA), ~20% son nuevos (→ EXTRAORDINARIA). Cruzado por cédula o carnet.',
    sheetName: 'Avatar',
    columns: [
      'Carnet', 'Identificación', 'Nombre', 'Correo Electrónico', 'Teléfono', 'Código de Carrera',
    ],
    genRows: genAvatarRows,
    sampleCount: 70,
  },
];

/* ══════════════════════════════════════════════ */
export default function Templates() {
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const { addToast } = useToast();

  const generateExcel = async (tpl: TemplateConfig, withSample: boolean) => {
    const genKey = `${tpl.key}-${withSample ? 'sample' : 'empty'}`;
    setGenerating(genKey);
    try {
      const wb = XLSX.utils.book_new();

      // Build data rows
      let rows: Record<string, any>[] = [];
      if (withSample) {
        if (tpl.key === 'corte') {
          // Use real aspirants from the database if available, otherwise fall back silently
          try {
            const aspirants = await getAllAspirants();
            if (aspirants.length > 0) {
              rows = buildCorteRowsFromAspirants(aspirants);
            } else {
              rows = tpl.genRows(tpl.sampleCount);
            }
          } catch {
            rows = tpl.genRows(tpl.sampleCount);
          }
        } else {
          rows = tpl.genRows(tpl.sampleCount);
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows, { header: tpl.columns });

      // Set column widths for readability
      ws['!cols'] = tpl.columns.map(col => ({
        wch: Math.max(col.length + 4, 18),
      }));

      XLSX.utils.book_append_sheet(wb, ws, tpl.sheetName);

      // Add a "Carreras" reference sheet
      const carreraData = CARRERAS.map(c => ({
        'Código': c.codigo,
        'Nombre de Carrera': c.nombre,
      }));
      const wsCarreras = XLSX.utils.json_to_sheet(carreraData);
      wsCarreras['!cols'] = [{ wch: 12 }, { wch: 52 }];
      XLSX.utils.book_append_sheet(wb, wsCarreras, 'Carreras (Referencia)');

      // Generate and download
      const suffix = withSample ? '_ejemplo' : '_plantilla';
      const filename = `SIDERMI_${tpl.key}${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      setDownloaded(prev => [...prev, genKey]);
      if (tpl.key !== 'corte' || !withSample) {
        addToast(`${tpl.label} descargado: ${filename}`, 'success');
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          <FileDown size={14} />
          Genere plantillas Excel con el formato correcto para subir al sistema SIDERMI
        </p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 bg-utn-blue/5 rounded-xl border border-utn-blue/10">
        <Info size={16} className="text-utn-blue mt-0.5 shrink-0" />
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">¿Cómo usar las plantillas?</p>
          <ol className="space-y-1 text-xs text-slate-500 list-decimal pl-4">
            <li>Descargue la plantilla del tipo de archivo que necesita</li>
            <li>Complete los datos en la hoja principal (no modifique los encabezados)</li>
            <li>Vaya a <strong className="text-utn-blue">Cargar Datos</strong> y suba el archivo completado</li>
            <li>La hoja <em>"Carreras (Referencia)"</em> contiene los códigos válidos de carrera</li>
            <li>Las plantillas con datos de ejemplo incluyen registros <strong>realistas con cédulas cruzadas</strong> entre archivos</li>
              <li>La plantilla de <strong className="text-amber-600">Corte</strong> usa los aspirantes <strong>reales ya cargados</strong> en el sistema</li>
          </ol>
        </div>
      </div>

      {/* Template cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {TEMPLATES.map(tpl => {
          const Icon = tpl.icon;
          const downloaded1 = downloaded.includes(`${tpl.key}-empty`);
          const downloaded2 = downloaded.includes(`${tpl.key}-sample`);
          const bgColor =
            tpl.color === 'utn-blue' ? 'bg-utn-blue/10 text-utn-blue' :
            tpl.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            'bg-amber-50 text-amber-600';
          const borderActive =
            tpl.color === 'utn-blue' ? 'hover:border-utn-blue/30' :
            tpl.color === 'emerald' ? 'hover:border-emerald-200' :
            'hover:border-amber-200';

          return (
            <div key={tpl.key} className={`bg-white rounded-2xl card-flat border border-slate-200/60 flex flex-col transition-colors ${borderActive}`}>
              {/* Card header */}
              <div className="p-5 pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{tpl.label}</h3>
                    <p className="text-[11px] text-slate-400">
                      Hoja: <code className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">{tpl.sheetName}</code>
                      <span className="ml-2">
                        {tpl.key === 'corte' ? 'Aspirantes reales del sistema' : `${tpl.sampleCount} filas de ejemplo`}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-5 pt-3 flex-1">
                <p className="text-xs text-slate-500 leading-relaxed">{tpl.description}</p>

                {/* Column preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {tpl.columns.slice(0, 5).map(col => (
                    <span key={col} className="px-2 py-0.5 bg-slate-50 rounded text-[10px] text-slate-500 font-medium border border-slate-100">
                      {col}
                    </span>
                  ))}
                  {tpl.columns.length > 5 && (
                    <span className="px-2 py-0.5 text-[10px] text-slate-400 font-medium">
                      +{tpl.columns.length - 5} más
                    </span>
                  )}
                </div>
              </div>

              {/* Download buttons */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={() => generateExcel(tpl, false)}
                  disabled={generating !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-utn-blue text-white rounded-xl text-xs font-semibold hover:bg-utn-blue-light transition-colors shadow-sm shadow-utn-blue/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === `${tpl.key}-empty`
                    ? <Loader2 size={13} className="animate-spin" />
                    : downloaded1 ? <CheckCircle size={13} /> : <Download size={13} />}
                  Plantilla Vacía
                </button>
                <button
                  onClick={() => generateExcel(tpl, true)}
                  disabled={generating !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === `${tpl.key}-sample`
                    ? <><Loader2 size={13} className="animate-spin" /> Generando…</>
                    : downloaded2 ? <CheckCircle size={13} className="text-emerald-500" /> : <FileSpreadsheet size={13} />}
                  {generating !== `${tpl.key}-sample` && (
                    tpl.key === 'corte'
                      ? 'Con Aspirantes Reales'
                      : `Con ${tpl.sampleCount} Datos de Ejemplo`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Career reference table */}
      <div className="bg-white rounded-2xl card-flat border border-slate-200/60">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileSpreadsheet size={15} className="text-utn-blue" />
          <h3 className="font-semibold text-slate-800 text-sm">Códigos de Carrera — Sede del Pacífico</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CARRERAS.map(c => (
              <div key={c.codigo} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-100/60">
                <span className="font-mono text-[11px] font-bold text-utn-blue bg-utn-blue/10 px-2 py-0.5 rounded">{c.codigo}</span>
                <span className="text-xs text-slate-600 leading-tight">{c.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
