import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  FileText,
  Upload,
  Download,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
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

  return (
    <div className="space-y-3 fade-up">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Resumen general del proceso de matrícula</p>
        </div>
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-utn-blue text-white rounded-xl text-sm font-semibold hover:bg-utn-blue-light transition-colors shadow-md shadow-utn-blue/30"
        >
          <Download size={15} /> Descargar Completos
        </button>
      </div>

      {/* ═══ Hero stat row  ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total */}
        <div className="bg-utn-blue/[0.05] rounded-2xl border border-utn-blue/20 p-3.5 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-utn-blue/70 uppercase tracking-wider">Total Estudiantes</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5 tracking-tight">{stats.totalEstudiantes}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-utn-blue/15 flex items-center justify-center">
              <Users size={20} className="text-utn-blue" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="px-2.5 py-1.5 bg-utn-blue/10 border border-utn-blue/15 rounded-lg">
              <p className="text-base font-bold text-slate-800">{stats.matriculados || 0}</p>
              <p className="text-[10px] text-utn-blue font-bold">Matriculados</p>
            </div>
            <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg">
              <p className="text-base font-bold text-slate-800">{stats.aspirantesSinMatricula || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Aspirantes</p>
            </div>
          </div>
        </div>

        {/* Matriculados */}
        <div className="bg-utn-blue/[0.05] rounded-2xl border border-utn-blue/20 p-3.5 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-utn-blue/70 uppercase tracking-wider">Matriculados</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5 tracking-tight">{stats.matriculados || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-utn-blue/15 flex items-center justify-center">
              <UserCheck size={20} className="text-utn-blue" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="px-2.5 py-1.5 bg-utn-blue/10 border border-utn-blue/15 rounded-lg">
              <p className="text-base font-bold text-slate-800">{stats.porTipoMatricula?.ORDINARIA || 0}</p>
              <p className="text-[10px] text-utn-blue font-bold">Ordinaria</p>
            </div>
            <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg">
              <p className="text-base font-bold text-slate-800">{stats.porTipoMatricula?.EXTRAORDINARIA || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Extraordinaria</p>
            </div>
          </div>
        </div>

        {/* Aspirantes */}
        <div className="bg-utn-blue/[0.05] rounded-2xl border border-utn-blue/20 p-3.5 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-utn-blue/70 uppercase tracking-wider">Aspirantes</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-0.5 tracking-tight">{stats.aspirantesSinMatricula || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-utn-blue/15 flex items-center justify-center">
              <UserX size={20} className="text-utn-blue" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="px-2.5 py-1.5 bg-utn-blue/10 border border-utn-blue/15 rounded-lg">
              <p className="text-base font-bold text-slate-800">{porEstado?.COMPLETO || 0}</p>
              <p className="text-[10px] text-utn-blue font-bold">Completos</p>
            </div>
            <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg">
              <p className="text-base font-bold text-slate-800">{porEstado?.PENDIENTE || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Middle row: Documents + Careers ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Documents — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText size={14} className="text-utn-blue" />
            <h3 className="font-semibold text-slate-800 text-sm">Documentos</h3>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-center">
            {stats.documentos && (
              <div className="space-y-3.5">
                {[
                  { label: 'Título bachillerato', key: 'titulo' as const },
                  { label: 'Cédula (frente)', key: 'cedulaFrente' as const },
                  { label: 'Cédula (reverso)', key: 'cedulaReverso' as const },
                ].map(d => {
                  const doc = stats.documentos[d.key];
                  const total = doc.completo + doc.faltante;
                  const pct = total > 0 ? Math.round((doc.completo / total) * 100) : 0;
                  return (
                    <div key={d.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{d.label}</span>
                        <span className="text-[11px] font-bold text-slate-600">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-utn-blue to-sky-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{doc.completo} de {total} completos</p>
                    </div>
                  );
                })}
                {/* Summary pill */}
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle size={13} className="text-utn-blue" />
                  <span className="text-xs text-slate-600 font-medium">
                    <strong className="text-utn-blue">{stats.documentos.todosCompletos}</strong> expedientes con todos los documentos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Careers — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-utn-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Distribución por Carrera</h3>
            </div>
            <button
              onClick={() => navigate('/estadisticas')}
              className="text-[11px] text-utn-blue hover:underline flex items-center gap-0.5 font-medium"
            >
              Ver más <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="p-3.5 flex-1 overflow-y-auto max-h-52">
            {stats.porCarrera?.length ? (
              <div className="space-y-2">
                {stats.porCarrera.map((c, i) => {
                  const pct = (c.cantidad / stats.totalEstudiantes) * 100;
                  // Alternate between blue and sky tones
                  const barColor = i % 2 === 0
                    ? 'bg-gradient-to-r from-utn-blue to-utn-blue/70'
                    : 'bg-gradient-to-r from-sky-500 to-sky-400';
                  return (
                    <div key={c.carrera} className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-slate-600 w-14 text-right shrink-0 tabular-nums">
                        {c.carrera || '—'}
                      </span>
                      <div className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8 text-right tabular-nums">{c.cantidad}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos de carreras</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Recent uploads ═══ */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-utn-blue" />
            <h3 className="font-semibold text-slate-800 text-sm">Últimas Cargas</h3>
          </div>
          <button
            onClick={() => navigate('/cargar')}
            className="text-[11px] text-utn-blue hover:underline flex items-center gap-0.5 font-medium"
          >
            Cargar datos <ArrowUpRight size={11} />
          </button>
        </div>
        {stats.ultimosUploads?.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {stats.ultimosUploads.map(u => (
                <div key={u._id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-utn-blue/10 text-utn-blue text-[11px] font-semibold">{u.tipoArchivo}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{new Date(u.fecha).toLocaleDateString('es-CR')}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-1">{u.nombreArchivo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-slate-500">Nuevos: <strong className="text-slate-700">{u.registrosNuevos}</strong></span>
                    <span className="text-[11px] text-slate-500">Total: <strong className="text-slate-700">{u.registrosTotales}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-utn-blue/[0.06]">
                    <th className="text-left font-semibold text-slate-500 px-4 py-2 text-[11px] uppercase tracking-wider">Fecha</th>
                    <th className="text-left font-semibold text-slate-500 px-4 py-2 text-[11px] uppercase tracking-wider">Tipo</th>
                    <th className="text-left font-semibold text-slate-500 px-4 py-2 text-[11px] uppercase tracking-wider">Archivo</th>
                    <th className="text-right font-semibold text-slate-500 px-4 py-2 text-[11px] uppercase tracking-wider">Nuevos</th>
                    <th className="text-right font-semibold text-slate-500 px-4 py-2 text-[11px] uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.ultimosUploads.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 text-slate-600 text-xs font-medium">{new Date(u.fecha).toLocaleDateString('es-CR')}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-md bg-utn-blue/10 text-utn-blue text-[11px] font-semibold">{u.tipoArchivo}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-600 truncate max-w-[220px] text-xs">{u.nombreArchivo}</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-700 text-xs">{u.registrosNuevos}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-700 text-xs">{u.registrosTotales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No hay cargas recientes</div>
        )}
      </div>
    </div>
  );
}
