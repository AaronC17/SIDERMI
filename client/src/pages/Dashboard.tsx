import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Download,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { getDashboard, descargarCompletos } from '../services/api';
import type { DashboardStats } from '../types';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => { if (!IS_DEMO) addToast('Error al cargar estadísticas', 'error'); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-utn-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || stats.totalEstudiantes === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Upload size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sin datos aún</h2>
        <p className="text-slate-500 mb-8">Cargue un archivo Excel de Aspirantes o Matriculados para comenzar a trabajar</p>
        <button
          onClick={() => navigate('/cargar')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-utn-blue text-white rounded-xl font-medium hover:bg-utn-blue-light transition-colors shadow-lg shadow-utn-blue/25"
        >
          <Upload size={18} /> Cargar primer archivo
        </button>
      </div>
    );
  }

  const { porEstado } = stats;

  const handleDownload = async () => {
    try {
      await descargarCompletos();
      addToast('Archivo ZIP descargado', 'success');
    } catch {
      addToast('Error al generar ZIP', 'error');
    }
  };

  const statCards = [
    { label: 'Total Estudiantes', value: stats.totalEstudiantes, icon: Users, color: 'bg-slate-100 text-utn-blue', ring: 'ring-slate-50' },
    { label: 'Matriculados', value: stats.matriculados || 0, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-50' },
    { label: 'Solo Aspirantes', value: stats.aspirantesSinMatricula || 0, icon: UserX, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-50' },
    { label: 'Completos', value: porEstado?.COMPLETO || 0, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-50' },
    { label: 'Pendientes', value: porEstado?.PENDIENTE || 0, icon: Clock, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-50' },
    { label: 'Expedientes OK', value: stats.documentos?.todosCompletos || 0, icon: FileText, color: 'bg-slate-100 text-utn-blue', ring: 'ring-slate-50' },
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mt-0.5">Resumen del proceso de matrícula</p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
        >
          <Download size={16} /> Descargar Completos (ZIP)
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3 ring-4 ${s.ring}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two column grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Documents card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-utn-blue" /> Estado de Documentos
            </h3>
          </div>
          <div className="p-6">
            {stats.documentos && (
              <div className="space-y-4">
                {[
                  { label: 'Título de Bachillerato', key: 'titulo' as const },
                  { label: 'Cédula (Frente)', key: 'cedulaFrente' as const },
                  { label: 'Cédula (Reverso)', key: 'cedulaReverso' as const },
                ].map(d => {
                  const doc = stats.documentos[d.key];
                  const total = doc.completo + doc.faltante;
                  const pct = total > 0 ? (doc.completo / total) * 100 : 0;
                  return (
                    <div key={d.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{d.label}</span>
                        <span className="text-xs text-slate-400">{doc.completo}/{total}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Careers card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-utn-blue" /> Por Carrera
            </h3>
            <button
              onClick={() => navigate('/estadisticas')}
              className="text-xs text-utn-blue hover:underline flex items-center gap-1"
            >
              Ver todo <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="p-6">
            {stats.porCarrera?.length ? (
              <div className="space-y-3">
                {stats.porCarrera.map(c => {
                  const pct = (c.cantidad / stats.totalEstudiantes) * 100;
                  return (
                    <div key={c.carrera} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28 truncate" title={c.carrera || '(sin código)'}>
                        {c.carrera || '(sin código)'}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-utn-blue to-sky-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-10 text-right">{c.cantidad}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin datos de carreras</p>
            )}
          </div>
        </div>
      </div>

      {/* Matrícula type + recent uploads */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Tipo de Matrícula</h3>
          <div className="flex gap-6">
            {Object.entries(stats.porTipoMatricula || {}).map(([tipo, count]) => (
              <div key={tipo} className="text-center">
                <p className="text-3xl font-bold text-slate-800">{count}</p>
                <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-xs font-semibold
                  ${tipo === 'ORDINARIA' ? 'bg-utn-blue/10 text-utn-blue' : 'bg-slate-100 text-slate-600'}`}>
                  {tipo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent uploads */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Últimas Cargas</h3>
          </div>
          <div className="overflow-x-auto">
            {stats.ultimosUploads?.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-medium text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Fecha</th>
                    <th className="text-left font-medium text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Tipo</th>
                    <th className="text-left font-medium text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Archivo</th>
                    <th className="text-right font-medium text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Nuevos</th>
                    <th className="text-right font-medium text-slate-500 px-6 py-3 text-xs uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ultimosUploads.map(u => (
                    <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-slate-600">{new Date(u.fecha).toLocaleDateString('es-CR')}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-utn-blue/10 text-utn-blue text-xs font-medium">{u.tipoArchivo}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 truncate max-w-[200px]">{u.nombreArchivo}</td>
                      <td className="px-6 py-3 text-right font-medium text-emerald-600">{u.registrosNuevos}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800">{u.registrosTotales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-400">No hay cargas recientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
