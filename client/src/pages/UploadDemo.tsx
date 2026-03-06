import { useState, useRef, type DragEvent } from 'react';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  CloudUpload,
  Info,
  Users,
  Scissors,
  UserSquare2,
  Sparkles,
} from 'lucide-react';

type UploadMode = 'aspirantes' | 'corte' | 'avatar';

const MODES = [
  { key: 'aspirantes' as const, label: 'Aspirantes',  desc: 'Lista inicial SIGU',    icon: Users },
  { key: 'corte'      as const, label: 'Corte',        desc: 'Corte de matriculados', icon: Scissors },
  { key: 'avatar'     as const, label: 'Avatar',       desc: 'Reporte Avatar',        icon: UserSquare2 },
];

interface FakeResult {
  registrosTotales: number;
  nuevos: number;
  existentes: number;
  actualizados: number;
}

const DEMO_RESULTS: Record<UploadMode, FakeResult> = {
  aspirantes: { registrosTotales: 412, nuevos: 412, existentes: 0,   actualizados: 0   },
  corte:      { registrosTotales: 350, nuevos: 89,  existentes: 261, actualizados: 261 },
  avatar:     { registrosTotales: 320, nuevos: 0,   existentes: 320, actualizados: 198 },
};

interface FakeHistory {
  _id: string;
  tipoArchivo: string;
  tipoMatricula: string;
  nombreArchivo: string;
  registrosNuevos: number;
  registrosActualizados: number;
  registrosTotales: number;
  fecha: string;
}

const INITIAL_HISTORY: FakeHistory[] = [
  {
    _id: '1',
    tipoArchivo: 'AVATAR',
    tipoMatricula: 'ORDINARIA',
    nombreArchivo: 'avatar_marzo_2026.xlsx',
    registrosNuevos: 0,
    registrosActualizados: 198,
    registrosTotales: 320,
    fecha: '2026-03-04T14:22:00Z',
  },
  {
    _id: '2',
    tipoArchivo: 'CORTE',
    tipoMatricula: 'ORDINARIA',
    nombreArchivo: 'corte_01_matriculados.xlsx',
    registrosNuevos: 89,
    registrosActualizados: 261,
    registrosTotales: 350,
    fecha: '2026-03-01T09:05:00Z',
  },
  {
    _id: '3',
    tipoArchivo: 'ASPIRANTES',
    tipoMatricula: '—',
    nombreArchivo: 'lista_aspirantes_sigu_2026.xlsx',
    registrosNuevos: 412,
    registrosActualizados: 0,
    registrosTotales: 412,
    fecha: '2026-02-28T08:30:00Z',
  },
];

export default function UploadDemo() {
  const [mode, setMode]               = useState<UploadMode>('aspirantes');
  const [file, setFile]               = useState<File | null>(null);
  const [tipoMatricula, setTipoMatricula] = useState('ORDINARIA');
  const [corte, setCorte]             = useState('');
  const [uploading, setUploading]     = useState(false);
  const [result, setResult]           = useState<FakeResult | null>(null);
  const [uploadedAt, setUploadedAt]   = useState<Date | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [history, setHistory]         = useState<FakeHistory[]>(INITIAL_HISTORY);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(xlsx?|csv)$/i.test(f.name)) {
      setFile(f);
      setResult(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    // Simular procesamiento (~1.8 s)
    setTimeout(() => {
      const res = DEMO_RESULTS[mode];
      const now = new Date();

      setResult(res);
      setUploadedAt(now);
      setUploading(false);

      // Agregar al historial demo
      const newEntry: FakeHistory = {
        _id: String(Date.now()),
        tipoArchivo: mode.toUpperCase(),
        tipoMatricula: mode === 'aspirantes' ? '—' : tipoMatricula,
        nombreArchivo: file.name,
        registrosNuevos: res.nuevos,
        registrosActualizados: res.actualizados,
        registrosTotales: res.registrosTotales,
        fecha: now.toISOString(),
      };
      setHistory(prev => [newEntry, ...prev]);
    }, 1800);
  };

  const modeLabel = MODES.find(m => m.key === mode);

  return (
    <div className="space-y-3 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Importe datos de Aspirantes, Corte o Avatar</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
          <Sparkles size={11} />
          Modo Demo
        </span>
      </div>

      {/* Mode selector — 3 cards */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setResult(null); setFile(null); }}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all border-2
                ${active
                  ? 'bg-utn-blue text-white border-utn-blue shadow-lg shadow-utn-blue/25'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-utn-blue/40 hover:shadow-sm'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${active ? 'bg-white/20' : 'bg-utn-blue/8'}`}>
                <Icon size={18} className={active ? 'text-white' : 'text-utn-blue'} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm leading-tight ${active ? 'text-white' : 'text-slate-800'}`}>{m.label}</p>
                <p className={`text-xs mt-0.5 truncate ${active ? 'text-white/65' : 'text-slate-400'}`}>{m.desc}</p>
              </div>
              {active && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-white rounded-full opacity-80" />}
            </button>
          );
        })}
      </div>

      {/* Main grid — equal columns */}
      <div className="grid lg:grid-cols-2 gap-3 min-h-0">

        {/* ── Upload card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)'}}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-utn-blue" />
            <h3 className="font-semibold text-slate-800 text-sm">
              {mode === 'aspirantes' ? 'Lista de Aspirantes (SIGU)' :
               mode === 'corte'      ? 'Corte de Matriculados' :
                                       'Reporte Avatar'}
            </h3>
          </div>

          <div className="p-4 flex flex-col gap-3 flex-1">
            {/* Config fields */}
            {mode === 'corte' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo de Matrícula</label>
                  <select
                    value={tipoMatricula}
                    onChange={e => setTipoMatricula(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                  >
                    <option value="ORDINARIA">Ordinaria</option>
                    <option value="EXTRAORDINARIA">Extraordinaria</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ID de Corte</label>
                  <input
                    placeholder="Ej: CORTE-01"
                    value={corte}
                    onChange={e => setCorte(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                  />
                </div>
              </div>
            )}
            {mode === 'avatar' && (
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo de Matrícula</label>
                <select
                  value={tipoMatricula}
                  onChange={e => setTipoMatricula(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                >
                  <option value="ORDINARIA">Ordinaria</option>
                  <option value="EXTRAORDINARIA">Extraordinaria</option>
                </select>
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center gap-2 py-4 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all flex-1
                ${dragging
                  ? 'border-utn-blue bg-utn-blue/5 scale-[1.01]'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50/60 hover:border-utn-blue/40 hover:bg-utn-blue/[0.02]'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-utn-blue/8 text-utn-blue'}`}>
                <CloudUpload size={20} />
              </div>
              {file ? (
                <>
                  <p className="text-sm font-semibold text-emerald-700 text-center">{file.name}</p>
                  <p className="text-xs text-emerald-500">{(file.size / 1024).toFixed(0)} KB · clic para cambiar</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-600 text-center">
                    Arrastre un archivo aquí o{' '}
                    <span className="text-utn-blue font-semibold underline underline-offset-2">haga clic</span>
                  </p>
                  <p className="text-xs text-slate-400">.xlsx · .xls · .csv — máx. 50 MB</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }}
              />
            </div>

            {/* Button */}
            <button
              disabled={!file || uploading}
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-utn-blue text-white rounded-xl font-semibold text-sm hover:bg-utn-blue-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md shadow-utn-blue/25"
            >
              {uploading
                ? <><Clock size={15} className="animate-spin" /> Procesando…</>
                : <><UploadIcon size={15} /> Cargar y Procesar</>
              }
            </button>

            {/* Result */}
            {result && (
              <div className="p-4 bg-emerald-50 rounded-xl ring-1 ring-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Carga completada
                  </p>
                  {uploadedAt && (
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {uploadedAt.toLocaleString('es-CR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Total',        value: result.registrosTotales, cls: 'text-slate-800' },
                    { label: 'Nuevos',       value: result.nuevos,           cls: 'text-emerald-600' },
                    { label: 'Existentes',   value: result.existentes,       cls: 'text-slate-500' },
                    { label: 'Actualizados', value: result.actualizados,     cls: 'text-utn-blue' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-xl font-extrabold ${s.cls}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Instructions card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)'}}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Info size={15} className="text-utn-blue" />
            <h3 className="font-semibold text-slate-800 text-sm">Instrucciones — {modeLabel?.label}</h3>
          </div>
          <div className="p-4 flex flex-col gap-3 flex-1 text-sm text-slate-600">

            {mode === 'aspirantes' && (
              <div className="p-4 bg-utn-blue/[0.04] border border-utn-blue/15 rounded-xl space-y-1.5">
                <p className="font-semibold text-utn-blue text-xs uppercase tracking-wide">Aspirantes · SIGU</p>
                <p className="text-xs leading-relaxed">Sube el <strong>listado inicial de aspirantes</strong> exportado desde SIGU. Se crea la base de datos con todos los aspirantes del período.</p>
              </div>
            )}
            {mode === 'corte' && (
              <div className="p-4 bg-utn-blue/[0.04] border border-utn-blue/15 rounded-xl space-y-1.5">
                <p className="font-semibold text-utn-blue text-xs uppercase tracking-wide">Corte de Matriculados</p>
                <p className="text-xs leading-relaxed">El tipo se determina automáticamente: aspirantes que ya pagaron → <strong>Ordinaria</strong>. Nuevos en el corte → <strong>Extraordinaria</strong>.</p>
              </div>
            )}
            {mode === 'avatar' && (
              <div className="p-4 bg-utn-blue/[0.04] border border-utn-blue/15 rounded-xl space-y-1.5">
                <p className="font-semibold text-utn-blue text-xs uppercase tracking-wide">Reporte Avatar</p>
                <p className="text-xs leading-relaxed">Sube el reporte exportado de Avatar para cruzar documentación y actualizar el estado de expedientes.</p>
              </div>
            )}

            {/* Flujo de trabajo */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Flujo de trabajo</p>
              <ol className="space-y-2">
                {[
                  { step: 'Cargar Aspirantes',    note: 'una vez al inicio' },
                  { step: 'Cargar Corte',          note: 'en cada nuevo corte' },
                  { step: 'Cargar Avatar',         note: 'para cruzar datos' },
                  { step: 'Verificar Estudiantes', note: 'revisar documentos' },
                  { step: 'Descargar ZIP',         note: 'expedientes completos' },
                ].map(({ step, note }, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-utn-blue text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs">
                      <span className="font-semibold text-slate-700">{step}</span>
                      <span className="text-slate-400"> — {note}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Nota demo */}
            <div className="mt-auto p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <span className="font-bold">✦ Modo Demo:</span> El procesamiento es simulado con datos de ejemplo. En producción los archivos se envían al servidor y actualizan la base de datos en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)'}}>
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Historial de Cargas</h3>
            {history.length > 5 && (
              <span className="text-xs text-slate-400">Mostrando últimas 5 de {history.length}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-utn-blue/[0.04] border-b border-utn-blue/10">
                  <th className="text-left font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Fecha</th>
                  <th className="text-left font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Tipo</th>
                  <th className="text-left font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Matrícula</th>
                  <th className="text-left font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Archivo</th>
                  <th className="text-right font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Nuevos</th>
                  <th className="text-right font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Actual.</th>
                  <th className="text-right font-semibold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.slice(0, 5).map(h => (
                  <tr key={h._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(h.fecha).toLocaleString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-utn-blue/10 text-utn-blue text-[11px] font-semibold">{h.tipoArchivo}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium
                        ${h.tipoMatricula === 'ORDINARIA' ? 'bg-utn-blue/10 text-utn-blue' : 'bg-slate-100 text-slate-500'}`}>
                        {h.tipoMatricula || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[180px] text-xs">{h.nombreArchivo}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 text-xs">{h.registrosNuevos}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{h.registrosActualizados}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700 text-xs">{h.registrosTotales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
