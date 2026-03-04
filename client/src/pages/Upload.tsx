import { useState, useRef, type DragEvent } from 'react';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  CloudUpload,
  Info,
} from 'lucide-react';
import {
  uploadAspirantes,
  uploadCorte,
  uploadAvatar,
  uploadAuto,
  getUploadHistory,
} from '../services/api';
import type { UploadResult, UploadHistory } from '../types';
import { useToast } from '../components/Toast';
import { useEffect } from 'react';

type UploadMode = 'aspirantes' | 'corte' | 'avatar' | 'auto';

const MODES = [
  { key: 'auto' as const, label: 'Auto-detectar', desc: 'Detecta hojas automáticamente' },
  { key: 'aspirantes' as const, label: 'Aspirantes', desc: 'Lista inicial SIGU' },
  { key: 'corte' as const, label: 'Corte', desc: 'Corte de matriculados' },
  { key: 'avatar' as const, label: 'Avatar', desc: 'Reporte Avatar' },
];

export default function Upload() {
  const [mode, setMode] = useState<UploadMode>('auto');
  const [file, setFile] = useState<File | null>(null);
  const [tipoMatricula, setTipoMatricula] = useState('ORDINARIA');
  const [corte, setCorte] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    getUploadHistory().then(setHistory).catch(() => {});
  }, [result]);

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
        case 'aspirantes':
          res = await uploadAspirantes(file);
          break;
        case 'corte':
          res = await uploadCorte(file, tipoMatricula, corte);
          break;
        case 'avatar':
          res = await uploadAvatar(file, tipoMatricula);
          break;
        default:
          res = await uploadAuto(file, tipoMatricula, corte);
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

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 mt-0.5">Importe datos de Aspirantes, Matriculados o Avatar</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setResult(null); }}
            className={`relative p-4 rounded-2xl text-left transition-all border-2
              ${mode === m.key
                ? 'bg-utn-blue text-white border-utn-blue shadow-lg shadow-utn-blue/20'
                : 'bg-white text-slate-700 border-slate-100 hover:border-utn-blue/30'}`}
          >
            <p className={`font-semibold text-sm ${mode === m.key ? 'text-white' : 'text-slate-800'}`}>{m.label}</p>
            <p className={`text-xs mt-0.5 ${mode === m.key ? 'text-white/70' : 'text-slate-400'}`}>{m.desc}</p>
            {mode === m.key && (
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Upload zone (3/5 width) */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-utn-blue" />
              {mode === 'auto' ? 'Excel Maestro (auto-detectar hojas)' :
               mode === 'aspirantes' ? 'Lista de Aspirantes' :
               mode === 'corte' ? 'Corte de Matriculados / Limpieado' :
               'Reporte Avatar'}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Configuration fields - solo para avatar/auto */}
            {(mode === 'avatar' || mode === 'auto') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo de Matrícula</label>
                  <select
                    value={tipoMatricula}
                    onChange={e => setTipoMatricula(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                  >
                    <option value="ORDINARIA">Ordinaria</option>
                    <option value="EXTRAORDINARIA">Extraordinaria</option>
                  </select>
                </div>
                {mode === 'auto' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Identificador de Corte</label>
                    <input
                      placeholder="Ej: CORTE-01, 2026-02-15"
                      value={corte}
                      onChange={e => setCorte(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                    />
                  </div>
                )}
              </div>
            )}
            {mode === 'corte' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Identificador de Corte</label>
                  <input
                    placeholder="Ej: CORTE-01, 2026-02-15"
                    value={corte}
                    onChange={e => setCorte(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                  />
                </div>
                <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100">
                  El tipo se determina automáticamente: aspirantes que matriculan → <strong>Ordinaria</strong>. Nuevos en corte → <strong>Extraordinaria</strong>.
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                ${dragging
                  ? 'border-utn-blue bg-utn-blue/5 scale-[1.01]'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <CloudUpload size={28} />
              </div>
              {file ? (
                <>
                  <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                  <p className="text-xs text-emerald-500">{(file.size / 1024).toFixed(0)} KB — Clic para cambiar</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-600">
                    Arrastre un archivo aquí o <span className="text-utn-blue underline">haga clic</span>
                  </p>
                  <p className="text-xs text-slate-400">.xlsx, .xls, .csv — máximo 50 MB</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setResult(null); }
                }}
              />
            </div>

            {/* Upload button */}
            <div className="text-center">
              <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-8 py-3 bg-utn-blue text-white rounded-xl font-medium hover:bg-utn-blue-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-utn-blue/20"
              >
                {uploading ? (
                  <><Clock size={16} className="animate-spin" /> Procesando…</>
                ) : (
                  <><UploadIcon size={16} /> Cargar y Procesar</>
                )}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="p-5 bg-emerald-50 rounded-xl ring-1 ring-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle size={16} /> Carga completada
                  </h4>
                  {uploadedAt && (
                    <span className="text-xs text-emerald-600 font-medium">
                      {uploadedAt.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' '}
                      {uploadedAt.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total', value: result.registrosTotales, cls: 'text-slate-800' },
                    { label: 'Nuevos', value: result.nuevos, cls: 'text-emerald-600' },
                    { label: 'Existentes', value: result.existentes, cls: 'text-slate-500' },
                    { label: 'Actualizados', value: result.actualizados, cls: 'text-utn-blue' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions (2/5 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Info size={16} className="text-utn-blue" /> Instrucciones
            </h3>
          </div>
          <div className="p-6 text-sm text-slate-600 space-y-5 leading-relaxed">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Modo Auto-detectar</h4>
              <p>Sube el archivo maestro <strong className="text-utn-blue">"Listado de personas matriculadas"</strong> y el sistema detectará automáticamente las hojas:</p>
              <ul className="mt-2 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-utn-blue rounded-full mt-2 shrink-0" />
                  <span><strong>Aspirantes</strong> — Lista inicial de SIGU</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-utn-blue rounded-full mt-2 shrink-0" />
                  <span><strong>Matriculados / Limpieado</strong> — Corte con datos de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-utn-blue rounded-full mt-2 shrink-0" />
                  <span><strong>AVATAR</strong> — Reporte de Avatar</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Flujo de trabajo</h4>
              <ol className="space-y-1.5 pl-4">
                {[
                  'Cargar Aspirantes (una vez al inicio)',
                  'Cargar Corte cada vez que hay nuevo corte',
                  'Cargar Avatar para cruzar datos',
                  'Verificar documentos en la Pizarra',
                  'Descargar expedientes completos en ZIP',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-utn-blue/10 text-utn-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl ring-1 ring-amber-200 text-xs">
              <p className="font-semibold text-amber-700 mb-1">Nota importante</p>
              <p className="text-amber-600">
                La comparación se realiza por <strong>cédula</strong>. Asegúrese de que las cédulas estén correctas en los archivos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload history */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Historial de Cargas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Tipo</th>
                  <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Matrícula</th>
                  <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Archivo</th>
                  <th className="text-right font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Nuevos</th>
                  <th className="text-right font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Actual.</th>
                  <th className="text-right font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map(h => (
                  <tr key={h._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-slate-600">{new Date(h.fecha).toLocaleString('es-CR')}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-utn-blue/10 text-utn-blue text-xs font-medium">{h.tipoArchivo}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium
                        ${h.tipoMatricula === 'ORDINARIA' ? 'bg-utn-blue/10 text-utn-blue' : 'bg-slate-100 text-slate-600'}`}>
                        {h.tipoMatricula || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[200px]">{h.nombreArchivo}</td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600">{h.registrosNuevos}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{h.registrosActualizados}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">{h.registrosTotales}</td>
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
