import { useEffect, useState } from 'react';
import { Download, FileText, Users, Filter, BarChart3, AlertTriangle, ClipboardList } from 'lucide-react';
import { getDashboard, getPendientes, getPorDocumento, descargarCompletos } from '../services/api';
import type { DashboardStats } from '../types';
import { useToast } from '../components/Toast';

interface PendienteItem {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  correoElectronico: string;
  estadoAvatar: string;
  faltantes: string[];
}

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700',
  COMPLETO: 'bg-emerald-50 text-emerald-700',
  ARCHIVADO: 'bg-slate-100 text-slate-600',
  LLAMAR: 'bg-slate-100 text-slate-600',
  NOTIFICADO: 'bg-utn-blue/10 text-utn-blue',
};

export default function Stats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'resumen' | 'pendientes' | 'porDocumento'>('resumen');
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [docFilter, setDocFilter] = useState('titulo');
  const [docResults, setDocResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => addToast('Error cargando estadísticas', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'pendientes') {
      getPendientes().then(setPendientes).catch(() => {});
    }
  }, [view]);

  useEffect(() => {
    if (view === 'porDocumento') {
      getPorDocumento(docFilter).then(setDocResults).catch(() => {});
    }
  }, [view, docFilter]);

  const handleDownloadZip = async () => {
    try {
      await descargarCompletos();
      addToast('ZIP descargado correctamente', 'success');
    } catch {
      addToast('Error al generar ZIP', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-utn-blue rounded-full animate-spin" />
      </div>
    );
  }

  const VIEWS = [
    { key: 'resumen' as const, label: 'Resumen General', icon: BarChart3 },
    { key: 'pendientes' as const, label: 'Pendientes', icon: AlertTriangle },
    { key: 'porDocumento' as const, label: 'Por Documento', icon: FileText },
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-0.5">Análisis de avance del proceso de matrícula</p>
        </div>
        <button
          onClick={handleDownloadZip}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
        >
          <Download size={16} /> Descargar expedientes ZIP
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${view === v.key
                ? 'bg-utn-blue text-white shadow-md shadow-utn-blue/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
          >
            <v.icon size={15} />
            {v.label}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {view === 'resumen' && stats && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-5">
            {/* Estado breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Por Estado</h3>
              </div>
              <div className="p-5 space-y-2">
                {Object.entries(stats.porEstado || {}).map(([estado, count]) => (
                  <div key={estado} className="flex items-center justify-between py-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${ESTADO_STYLE[estado] || 'bg-slate-100 text-slate-600'}`}>
                      {estado}
                    </span>
                    <span className="font-bold text-slate-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipo matrícula */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Tipo Matrícula</h3>
              </div>
              <div className="p-5 space-y-2">
                {Object.entries(stats.porTipoMatricula || {}).map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between py-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold
                      ${tipo === 'ORDINARIA' ? 'bg-utn-blue/10 text-utn-blue' : 'bg-slate-100 text-slate-600'}`}>
                      {tipo}
                    </span>
                    <span className="font-bold text-slate-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documentos */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Documentos</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Todos completos</span>
                  <span className="font-bold text-emerald-600">{stats.documentos?.todosCompletos || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Incompletos</span>
                  <span className="font-bold text-red-500">{stats.documentos?.todosIncompletos || 0}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-2">
                  {stats.documentos && (['titulo', 'cedulaFrente', 'cedulaReverso'] as const).map(key => {
                    const d = stats.documentos[key];
                    if (!d) return null;
                    const labels: Record<string, string> = { titulo: 'Título', cedulaFrente: 'Céd. Frente', cedulaReverso: 'Céd. Reverso' };
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{labels[key]}</span>
                        <span className="flex gap-3">
                          <span className="text-emerald-600 font-semibold">&#10003; {d.completo}</span>
                          <span className="text-red-400 font-semibold">&#10007; {d.faltante}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Careers table */}
          {stats.porCarrera?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-utn-blue" /> Estudiantes por Carrera
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left font-semibold text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Código Carrera</th>
                      <th className="text-right font-semibold text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Cantidad</th>
                      <th className="font-semibold text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.porCarrera.map(c => {
                      const pct = (c.cantidad / stats.totalEstudiantes) * 100;
                      return (
                        <tr key={c.carrera} className="hover:bg-slate-50/60">
                          <td className="px-6 py-3 font-medium text-slate-700">{c.carrera || '(sin código)'}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-800">{c.cantidad}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-utn-blue to-sky-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400 w-12 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pendientes */}
      {view === 'pendientes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList size={16} className="text-utn-blue" />
              Estudiantes con documentos pendientes
            </h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">{pendientes.length}</span>
          </div>
          <div className="overflow-x-auto">
            {pendientes.length === 0 ? (
              <div className="py-20 text-center">
                <FileText size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">No hay estudiantes pendientes</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Cédula</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Nombre</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Correo</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Docs Faltantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendientes.map(p => (
                    <tr key={p.cedula} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{p.cedula}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{p.nombre} {p.primerApellido} {p.segundoApellido}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{p.correoElectronico || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${ESTADO_STYLE[p.estadoAvatar] || 'bg-slate-100 text-slate-500'}`}>
                          {p.estadoAvatar}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.faltantes?.map((f: string) => (
                            <span key={f} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold">{f}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Por Documento */}
      {view === 'porDocumento' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <select
              value={docFilter}
              onChange={e => setDocFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
            >
              <option value="titulo">Título de Bachillerato</option>
              <option value="cedulaFrente">Cédula (Frente)</option>
              <option value="cedulaReverso">Cédula (Reverso)</option>
              <option value="fotoCarnet">Foto Carnet</option>
              <option value="formularioMatricula">Formulario Matrícula</option>
            </select>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">
              {docResults.length} sin documento
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
            <div className="overflow-x-auto">
              {docResults.length === 0 ? (
                <div className="py-20 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-emerald-300" />
                  <p className="text-slate-500 font-medium">Todos tienen este documento completo</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Cédula</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Nombre</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Correo</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Estado</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-xs uppercase tracking-wider">Estado Doc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {docResults.map((s: any) => (
                      <tr key={s.cedula} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{s.cedula}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{s.nombre} {s.primerApellido} {s.segundoApellido}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{s.correoElectronico || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${ESTADO_STYLE[s.estadoAvatar] || 'bg-slate-100 text-slate-500'}`}>
                            {s.estadoAvatar}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">FALTANTE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
