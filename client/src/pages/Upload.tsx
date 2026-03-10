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
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  uploadAspirantes,
  uploadCorte,
  uploadAvatar,
  getUploadHistory,
  deleteUploadHistory,
} from '../services/api';
import type { UploadResult, UploadHistory } from '../types';
import { useToast } from '../components/Toast';
import { useEffect } from 'react';

type UploadMode = 'aspirantes' | 'corte' | 'avatar';

const MODES = [
  { key: 'aspirantes' as const, label: 'Aspirantes',  desc: 'Lista inicial SIGU',    icon: Users },
  { key: 'corte'      as const, label: 'Corte',        desc: 'Corte de matriculados', icon: Scissors },
  { key: 'avatar'     as const, label: 'Avatar',       desc: 'Reporte Avatar',        icon: UserSquare2 },
];

export default function Upload() {
  const [mode, setMode] = useState<UploadMode>('aspirantes');
  const [file, setFile] = useState<File | null>(null);
  const [tipoMatricula, setTipoMatricula] = useState('ORDINARIA');
  const [corte, setCorte] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    getUploadHistory().then(setHistory).catch(() => {});
  }, [result]);

  const handleDeleteHistory = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteUploadHistory(id);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch {
      addToast('Error al eliminar registro', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(xlsx?|csv)$/i.test(f.name)) {
      setFile(f);
      setResult(null);
    } else {
      addToast('Solo archivos Excel (.xlsx, .xls) o CSV', 'error');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      let res: UploadResult;
      switch (mode) {
        case 'corte':
          res = await uploadCorte(file, tipoMatricula, corte);
          break;
        case 'avatar':
          res = await uploadAvatar(file, tipoMatricula);
          break;
        default:
          res = await uploadAspirantes(file);
      }
      setResult(res);
      setUploadedAt(new Date());
      addToast(`Carga exitosa: ${res.nuevos} nuevos, ${res.actualizados} actualizados`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al procesar archivo';
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const modeLabel = MODES.find(m => m.key === mode);

  return (
    <div className="space-y-3 fade-up">
      {/* Header */}
      <p className="text-sm text-slate-500">Importe datos de Aspirantes, Corte o Avatar</p>

      {/* Mode selector — 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setResult(null); setFile(null); }}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border-2
                ${active
                  ? 'bg-utn-blue text-white border-utn-blue shadow-lg shadow-utn-blue/25'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-utn-blue/40 hover:shadow-sm'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${active ? 'bg-white/20' : 'bg-utn-blue/8'}`}>
                <Icon size={18} className={active ? 'text-white' : 'text-utn-blue'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm leading-tight ${active ? 'text-white' : 'text-slate-800'}`}>{m.label}</p>
                <p className={`text-xs mt-0.5 ${active ? 'text-white/65' : 'text-slate-400'}`}>{m.desc}</p>
              </div>
              {active && <div className="w-2 h-2 bg-white rounded-full opacity-80 shrink-0" />}
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
                    { label: 'Total',       value: result.registrosTotales, cls: 'text-slate-800' },
                    { label: 'Nuevos',      value: result.nuevos,           cls: 'text-emerald-600' },
                    { label: 'Existentes',  value: result.existentes,       cls: 'text-slate-500' },
                    { label: 'Actualizados',value: result.actualizados,     cls: 'text-utn-blue' },
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

            {/* Per-mode tips */}
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
                  { step: 'Cargar Aspirantes', note: 'una vez al inicio' },
                  { step: 'Cargar Corte',      note: 'en cada nuevo corte' },
                  { step: 'Cargar Avatar',     note: 'para cruzar datos' },
                  { step: 'Verificar Estudiantes', note: 'revisar documentos' },
                  { step: 'Descargar ZIP',     note: 'expedientes completos' },
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
          </div>
        </div>
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06)'}}>
          <button
            onClick={() => setHistoryExpanded(v => !v)}
            className="w-full px-5 py-3.5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <h3 className="font-semibold text-slate-800 text-sm">Historial de Cargas</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">{history.length}</span>
            </div>
            {historyExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
          </button>

          {historyExpanded && (
            <div className="divide-y divide-slate-50">
              {history.map(h => (
                <div key={h._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors group">
                  {/* Tipo badge */}
                  <div className="shrink-0">
                    <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide
                      ${ h.tipoArchivo === 'ASPIRANTES' ? 'bg-utn-blue/10 text-utn-blue'
                       : h.tipoArchivo === 'AVATAR'     ? 'bg-violet-50 text-violet-600'
                       :                                  'bg-emerald-50 text-emerald-700'}`}>
                      {h.tipoArchivo}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{h.nombreArchivo}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(h.fecha).toLocaleString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      {h.tipoMatricula && <span className="ml-2 text-slate-300">·</span>}
                      {h.tipoMatricula && <span className="ml-2">{h.tipoMatricula}</span>}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-emerald-600">{h.registrosNuevos}</p>
                      <p className="text-[10px] text-slate-400">Nuevos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-500">{h.registrosActualizados}</p>
                      <p className="text-[10px] text-slate-400">Actual.</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">{h.registrosTotales}</p>
                      <p className="text-[10px] text-slate-400">Total</p>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteHistory(h._id)}
                    disabled={deletingId === h._id}
                    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Eliminar registro"
                  >
                    {deletingId === h._id
                      ? <Clock size={14} className="animate-spin" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!historyExpanded && (
            <div className="px-4 py-3">
              <p className="text-xs text-slate-400">
                Última carga: <span className="font-semibold text-slate-600">{history[0]?.tipoArchivo}</span> — {new Date(history[0]?.fecha).toLocaleString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
