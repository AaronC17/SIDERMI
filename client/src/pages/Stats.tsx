import { useEffect, useState, useMemo } from 'react';
import {
  Download, FileText, Users, Filter, BarChart3, AlertTriangle,
  ClipboardList, UserCheck, UserX, Building2, GraduationCap, ShieldCheck
} from 'lucide-react';
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
  PENDIENTE: 'bg-amber-100 text-amber-700',
  COMPLETO: 'bg-emerald-100 text-emerald-700',
  ARCHIVADO: 'bg-slate-100 text-slate-600',
  LLAMAR: 'bg-slate-100 text-slate-600',
  NOTIFICADO: 'bg-utn-blue/10 text-utn-blue',
};

const ESTADO_BAR: Record<string, string> = {
  PENDIENTE: 'bg-amber-400',
  COMPLETO: 'bg-emerald-500',
  ARCHIVADO: 'bg-slate-400',
  LLAMAR: 'bg-orange-400',
  NOTIFICADO: 'bg-utn-blue',
};

function HBar({ label, value, max, color = 'bg-utn-blue' }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-semibold text-slate-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[9px] bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-10 text-right tabular-nums">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-utn-blue', bg = 'bg-utn-blue/8' }: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; color?: string; bg?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, badge }: {
  title: string; icon: React.ElementType; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-utn-blue" />
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DocRow({ label, completo, faltante }: { label: string; completo: number; faltante: number }) {
  const total = completo + faltante;
  const pct = total > 0 ? Math.round((completo / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="text-emerald-600">&#10003; {completo}</span>
          <span className="text-red-500">&#10007; {faltante}</span>
          <span className="text-slate-500">{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-utn-blue to-sky-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [view, setView] = useState<'resumen' | 'carreras' | 'genero' | 'pendientes' | 'porDocumento'>('resumen');
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [pendientesLoaded, setPendientesLoaded] = useState(false);
  const [docFilter, setDocFilter] = useState('titulo');
  const [docResults, setDocResults] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendientesSearch, setPendientesSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => addToast('Error cargando estadísticas', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'pendientes' && !pendientesLoaded) {
      getPendientes()
        .then((data: any) => {
          setPendientes(Array.isArray(data) ? data : (data?.estudiantes ?? []));
          setPendientesLoaded(true);
        })
        .catch(() => addToast('Error cargando pendientes', 'error'));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'porDocumento') {
      setDocLoading(true);
      getPorDocumento(docFilter)
        .then((data: any) => {
          setDocResults(Array.isArray(data) ? data : (data?.estudiantes ?? []));
        })
        .catch(() => addToast('Error cargando datos', 'error'))
        .finally(() => setDocLoading(false));
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

  const filteredPendientes = useMemo(() => {
    const q = pendientesSearch.trim().toLowerCase();
    if (!q) return pendientes;
    return pendientes.filter(p =>
      p.cedula.includes(q) ||
      `${p.nombre} ${p.primerApellido} ${p.segundoApellido}`.toLowerCase().includes(q)
    );
  }, [pendientes, pendientesSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-utn-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-3">
        <AlertTriangle size={36} className="text-amber-400" />
        <p className="font-semibold">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const VIEWS = [
    { key: 'resumen' as const, label: 'Resumen', icon: BarChart3 },
    { key: 'carreras' as const, label: 'Carreras', icon: GraduationCap },
    { key: 'genero' as const, label: 'Género & Sede', icon: Building2 },
    { key: 'pendientes' as const, label: 'Pendientes', icon: AlertTriangle },
    { key: 'porDocumento' as const, label: 'Por Documento', icon: FileText },
  ];

  const maxEstado = Math.max(...Object.values(stats.porEstado || {}), 1);
  const maxCarrera = Math.max(...(stats.porCarrera || []).map(c => c.cantidad), 1);
  const maxSede = Math.max(...(stats.porSede || []).map(s => s.cantidad), 1);
  const totalDocs = stats.totalEstudiantes || 1;

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-500">Análisis de avance del proceso de matrícula</p>
        <button
          onClick={handleDownloadZip}
          className="inline-flex items-center gap-2 px-4 py-2 bg-utn-blue text-white rounded-xl text-xs font-semibold hover:bg-utn-blue-light transition-colors shadow-sm shadow-utn-blue/20"
        >
          <Download size={14} /> Descargar expedientes ZIP
        </button>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total" value={stats.totalEstudiantes} />
        <StatCard
          icon={UserCheck} label="Matriculados" value={stats.matriculados || 0}
          color="text-emerald-600" bg="bg-emerald-50"
          sub={`${stats.totalEstudiantes > 0 ? Math.round(((stats.matriculados || 0) / stats.totalEstudiantes) * 100) : 0}% del total`}
        />
        <StatCard
          icon={UserX} label="Aspirantes" value={stats.aspirantesSinMatricula || 0}
          color="text-amber-600" bg="bg-amber-50"
        />
        <StatCard
          icon={ShieldCheck} label="Docs Completos" value={stats.documentos?.todosCompletos || 0}
          color="text-sky-600" bg="bg-sky-50"
          sub={`${stats.totalEstudiantes > 0 ? Math.round(((stats.documentos?.todosCompletos || 0) / stats.totalEstudiantes) * 100) : 0}% del total`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all
              ${view === v.key
                ? 'bg-utn-blue text-white shadow-md shadow-utn-blue/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
          >
            <v.icon size={13} />
            {v.label}
          </button>
        ))}
      </div>

      {/* RESUMEN */}
      {view === 'resumen' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Section title="Por Estado Avatar" icon={BarChart3}>
            <div className="space-y-0.5">
              {Object.entries(stats.porEstado || {}).map(([estado, count]) => (
                <HBar key={estado} label={estado} value={count} max={maxEstado} color={ESTADO_BAR[estado] || 'bg-slate-400'} />
              ))}
              {Object.keys(stats.porEstado || {}).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </Section>

          <Section title="Tipo Matrícula" icon={ClipboardList}>
            <div className="space-y-5">
              {Object.entries(stats.porTipoMatricula || {}).map(([tipo, count]) => {
                const pct = stats.totalEstudiantes > 0 ? Math.round((count / stats.totalEstudiantes) * 100) : 0;
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${tipo === 'ORDINARIA' ? 'bg-utn-blue/10 text-utn-blue' : 'bg-slate-100 text-slate-600'}`}>{tipo}</span>
                      <span className="text-2xl font-extrabold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${tipo === 'ORDINARIA' ? 'bg-utn-blue' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 text-right">{pct}%</p>
                  </div>
                );
              })}
              {Object.keys(stats.porTipoMatricula || {}).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
              )}
            </div>
          </Section>

          <Section title="Documentos" icon={FileText}>
            {stats.documentos ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-emerald-700">{stats.documentos.todosCompletos}</p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">Todos completos</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-red-600">{stats.documentos.todosIncompletos}</p>
                    <p className="text-[10px] font-semibold text-red-500 mt-0.5">Incompletos</p>
                  </div>
                </div>
                <DocRow label="Título Bachillerato" completo={stats.documentos.titulo.completo} faltante={stats.documentos.titulo.faltante} />
                <DocRow label="Cédula (Frente)" completo={stats.documentos.cedulaFrente.completo} faltante={stats.documentos.cedulaFrente.faltante} />
                <DocRow label="Cédula (Reverso)" completo={stats.documentos.cedulaReverso.completo} faltante={stats.documentos.cedulaReverso.faltante} />
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
            )}
          </Section>
        </div>
      )}

      {/* CARRERAS */}
      {view === 'carreras' && (
        <Section title="Distribución por Carrera" icon={GraduationCap}
          badge={<span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg">{stats.porCarrera?.length || 0} carreras</span>}
        >
          {stats.porCarrera?.length ? (
            <div className="space-y-2.5">
              {stats.porCarrera.map((c, i) => {
                const pct = totalDocs > 0 ? ((c.cantidad / totalDocs) * 100).toFixed(1) : '0.0';
                const barColor = i % 2 === 0 ? 'bg-gradient-to-r from-utn-blue to-utn-blue/60' : 'bg-gradient-to-r from-sky-500 to-sky-400';
                return (
                  <div key={c.carrera} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-600 w-20 shrink-0 text-right tabular-nums">{c.carrera || ''}</span>
                    <div className="flex-1 h-[10px] bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${(c.cantidad / maxCarrera) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 w-10 text-right tabular-nums">{c.cantidad}</span>
                    <span className="text-[10px] text-slate-500 font-medium w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <GraduationCap size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">Sin datos de carreras</p>
            </div>
          )}
        </Section>
      )}

      {/* GÉNERO & SEDE */}
      {view === 'genero' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Section title="Distribución por Género" icon={Users}>
            {(stats.porSexo || []).length ? (
              <div className="space-y-4">
                {stats.porSexo.map(s => {
                  const pct = stats.totalEstudiantes > 0 ? Math.round((s.cantidad / stats.totalEstudiantes) * 100) : 0;
                  const colorBar = s.sexo === 'Masculino' ? 'bg-utn-blue' : s.sexo === 'Femenino' ? 'bg-pink-400' : 'bg-slate-400';
                  const colorBg = s.sexo === 'Masculino' ? 'bg-utn-blue/8 text-utn-blue' : s.sexo === 'Femenino' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-600';
                  return (
                    <div key={s.sexo}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${colorBg}`}>{s.sexo}</span>
                        <span className="text-2xl font-extrabold text-slate-800">{s.cantidad}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colorBar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 text-right">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos de género</p>
            )}
          </Section>

          <div className="space-y-5">
            <Section title="Distribución por Sede" icon={Building2}>
              {(stats.porSede || []).filter(s => s.sede && s.sede !== 'Sin sede').length ? (
                <div className="space-y-1">
                  {stats.porSede.filter(s => s.sede && s.sede !== 'Sin sede').map(s => (
                    <HBar key={s.sede} label={s.sede} value={s.cantidad} max={maxSede} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos de sede</p>
              )}
            </Section>

            <Section title="Verificación de Registro" icon={ShieldCheck}>
              {stats.verificacionRegistro ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-emerald-700">{stats.verificacionRegistro.verificados}</p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1">Verificados</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-red-600">{stats.verificacionRegistro.noVerificados}</p>
                    <p className="text-[11px] font-semibold text-red-500 mt-1">Sin verificar</p>
                  </div>
                  <div className="col-span-2">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${stats.totalEstudiantes > 0 ? Math.round((stats.verificacionRegistro.verificados / stats.totalEstudiantes) * 100) : 0}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 text-center">
                      {stats.totalEstudiantes > 0 ? Math.round((stats.verificacionRegistro.verificados / stats.totalEstudiantes) * 100) : 0}% verificados
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* PENDIENTES */}
      {view === 'pendientes' && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-utn-blue" />
              <h3 className="font-semibold text-slate-800 text-sm">Estudiantes con documentos pendientes</h3>
              <span className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2.5 py-0.5 rounded-lg">{pendientes.length}</span>
            </div>
            <input
              type="text"
              placeholder="Buscar por cédula o nombre..."
              value={pendientesSearch}
              onChange={e => setPendientesSearch(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none w-full sm:w-60"
            />
          </div>
          <div className="overflow-x-auto">
            {pendientes.length === 0 ? (
              <div className="py-20 text-center">
                <FileText size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 font-medium">No hay estudiantes pendientes</p>
              </div>
            ) : filteredPendientes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Sin resultados para "{pendientesSearch}"</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-utn-blue/[0.03] border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Cédula</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Nombre</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Correo</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Estado</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Docs Faltantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPendientes.map(p => (
                    <tr key={p.cedula} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{p.cedula}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{p.primerApellido} {p.segundoApellido}, {p.nombre}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{p.correoElectronico || ''}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${ESTADO_STYLE[p.estadoAvatar] || 'bg-slate-100 text-slate-500'}`}>
                          {p.estadoAvatar}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.faltantes?.map((f: string) => (
                            <span key={f} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">{f}</span>
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

      {/* POR DOCUMENTO */}
      {view === 'porDocumento' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={15} className="text-slate-400" />
            <select
              value={docFilter}
              onChange={e => setDocFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none shadow-sm"
            >
              <option value="titulo">Título de Bachillerato</option>
              <option value="cedulaFrente">Cédula (Frente)</option>
              <option value="cedulaReverso">Cédula (Reverso)</option>
              <option value="fotoCarnet">Foto Carnet</option>
              <option value="formularioMatricula">Formulario Matrícula</option>
            </select>
            {docLoading ? (
              <div className="w-4 h-4 border-2 border-slate-200 border-t-utn-blue rounded-full animate-spin" />
            ) : (
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-lg border border-red-100">
                {docResults.length} sin documento
              </span>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              {docResults.length === 0 && !docLoading ? (
                <div className="py-20 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-emerald-300" />
                  <p className="text-slate-500 font-medium">Todos tienen este documento completo</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-utn-blue/[0.03] border-b border-slate-100">
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Cédula</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Nombre</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Correo</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Estado</th>
                      <th className="text-left font-semibold text-slate-500 px-5 py-3 text-[11px] uppercase tracking-wider">Doc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {docResults.map((s: any, i: number) => (
                      <tr key={s.cedula ?? i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{s.cedula}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{(s.primerApellido ?? '')} {(s.segundoApellido ?? '')}, {s.nombre ?? ''}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{s.correo || s.correoElectronico || ''}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-semibold ${ESTADO_STYLE[s.estado ?? s.estadoAvatar] || 'bg-slate-100 text-slate-500'}`}>
                            {s.estado ?? s.estadoAvatar}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100">
                            {s.estadoDocumento ?? 'FALTANTE'}
                          </span>
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
