import { useEffect, useState, useMemo } from 'react';
import {
  Download, FileText, Users, Filter, BarChart3, AlertTriangle,
  ClipboardList, UserCheck, UserX, Building2, GraduationCap, ShieldCheck,
  ChevronLeft, ChevronRight, PieChart, TrendingUp,
} from 'lucide-react';
import { getDashboard, getPendientes, getPorDocumento, descargarCompletos } from '../services/api';
import type { DashboardStats } from '../types';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 10;

function formatName(nombre?: string, primerApellido?: string, segundoApellido?: string): string {
  const apellidos = [primerApellido, segundoApellido].filter(Boolean).join(' ');
  if (apellidos && nombre) return `${apellidos}, ${nombre}`;
  return nombre || apellidos || '—';
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
      <span className="text-xs text-slate-500 font-medium">
        Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={12} /> Anterior
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let p = i + 1;
          if (pages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= pages - 2) p = pages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-utn-blue text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

interface PendienteItem {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  correoElectronico: string;
  estadoAvatar: string;
  faltantes: string[];
}

const DONUT_COLORS: Record<string, string> = {
  PENDIENTE: '#F59E0B',
  COMPLETO: '#10B981',
  ARCHIVADO: '#94A3B8',
  LLAMAR: '#F97316',
  NOTIFICADO: '#142D5C',
};

function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const R = 52, cx = 70, cy = 70, circ = 2 * Math.PI * R;
  let accumulated = 0;
  const segments = data.filter(d => d.value > 0).map(d => {
    const dash = total > 0 ? (d.value / total) * circ : 0;
    const seg = { ...d, dash, offset: accumulated };
    accumulated += dash;
    return seg;
  });
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={20} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={R}
          fill="none"
          strokeWidth={20}
          stroke={s.color}
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#1e293b" fontSize="22" fontWeight="800">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">TOTAL</text>
    </svg>
  );
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
    <div className="bg-white rounded-2xl border border-slate-200 card p-4 flex items-center gap-3">
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
    <div className="bg-white rounded-2xl card border border-slate-200 overflow-hidden">
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
  const [view, setView] = useState<'resumen' | 'carreras' | 'genero' | 'grafica' | 'porDocumento'>('resumen');
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [pendientesLoaded, setPendientesLoaded] = useState(false);
  const [docFilter, setDocFilter] = useState('titulo');
  const [docResults, setDocResults] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendientesSearch, setPendientesSearch] = useState('');
  const [pendientesPage, setPendientesPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
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
          setPendientesPage(1);
        })
        .catch(() => addToast('Error cargando pendientes', 'error'));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'porDocumento') {
      setDocLoading(true);
      setDocPage(1);
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
    } catch (err: any) {
      let msg = 'Error al generar ZIP';
      const data = err?.response?.data;
      if (data instanceof Blob) {
        try { const json = JSON.parse(await data.text()); if (json?.error) msg = json.error; } catch {}
      } else if (data?.error) {
        msg = data.error;
      }
      addToast(msg, 'error');
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

  const pagedPendientes = useMemo(() => {
    const start = (pendientesPage - 1) * PAGE_SIZE;
    return filteredPendientes.slice(start, start + PAGE_SIZE);
  }, [filteredPendientes, pendientesPage]);

  const pagedDocResults = useMemo(() => {
    const start = (docPage - 1) * PAGE_SIZE;
    return docResults.slice(start, start + PAGE_SIZE);
  }, [docResults, docPage]);

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
    { key: 'grafica' as const, label: 'Gráfica', icon: PieChart },
    { key: 'porDocumento' as const, label: 'Por Documento', icon: FileText },
  ];

  const maxEstado = Math.max(...Object.values(stats.porEstado || {}), 1);
  const maxCarrera = Math.max(...(stats.porCarrera || []).map(c => c.cantidad), 1);
  const maxSede = Math.max(...(stats.porSede || []).map(s => s.cantidad), 1);
  const maxTipo = Math.max(...Object.values(stats.porTipoMatricula || {}), 1);
  const totalDocs = stats.totalEstudiantes || 1;
  const donutData = Object.entries(stats.porEstado || {}).map(([label, value]) => ({
    label, value, color: DONUT_COLORS[label] || '#94A3B8',
  }));

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-500">Análisis de avance del proceso de matrícula</p>
        <button
          onClick={handleDownloadZip}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-utn-blue text-white rounded-xl text-xs font-semibold hover:bg-utn-blue-light transition-colors shadow-sm shadow-utn-blue/20"
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
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-0.5">
              {Object.entries(stats.porTipoMatricula || {}).map(([tipo, count]) => (
                <HBar key={tipo} label={tipo} value={count} max={maxTipo}
                  color={tipo === 'ORDINARIA' ? 'bg-utn-blue' : 'bg-slate-400'} />
              ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Distribución por Género" icon={Users}>
            {(stats.porSexo || []).length ? (
              <div className="space-y-4">
                {stats.porSexo.map(s => {
                  const pct = stats.totalEstudiantes > 0 ? Math.round((s.cantidad / stats.totalEstudiantes) * 100) : 0;
                  const colorBar = s.sexo === 'Masculino' ? 'bg-utn-blue' : s.sexo === 'Femenino' ? 'bg-violet-400' : 'bg-slate-400';
                  const colorBg = s.sexo === 'Masculino' ? 'bg-utn-blue/8 text-utn-blue' : s.sexo === 'Femenino' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600';
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

      {/* GRÁFICA */}
      {view === 'grafica' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section title="Distribución por Estado" icon={PieChart}
              badge={<span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg">{stats.totalEstudiantes} estudiantes</span>}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                <DonutChart data={donutData} total={stats.totalEstudiantes} />
                <div className="space-y-2.5 flex-1 w-full">
                  {donutData.map(d => {
                    const pct = stats.totalEstudiantes > 0 ? Math.round((d.value / stats.totalEstudiantes) * 100) : 0;
                    return (
                      <div key={d.label} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-600 font-medium flex-1">{d.label}</span>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">{d.value}</span>
                        <span className="text-[10px] text-slate-400 w-9 text-right tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                  {donutData.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>}
                </div>
              </div>
            </Section>

            <Section title="Avance del Proceso" icon={TrendingUp}>
              <div className="space-y-5">
                {[
                  { label: 'Matriculados', value: stats.matriculados || 0, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                  { label: 'Docs Completos', value: stats.documentos?.todosCompletos || 0, color: 'bg-sky-500', textColor: 'text-sky-600' },
                  { label: 'Aspirantes sin matrícula', value: stats.aspirantesSinMatricula || 0, color: 'bg-amber-400', textColor: 'text-amber-600' },
                ].map(({ label, value, color, textColor }) => {
                  const pct = stats.totalEstudiantes > 0 ? Math.round((value / stats.totalEstudiantes) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold ${textColor}`}>{value}</span>
                          <span className="text-[10px] text-slate-400">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
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
            </select>
            {docLoading ? (
              <div className="w-4 h-4 border-2 border-slate-200 border-t-utn-blue rounded-full animate-spin" />
            ) : (
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-lg border border-red-100">
                {docResults.length} sin documento
              </span>
            )}
          </div>
          <div className="bg-white rounded-2xl card border border-slate-200 overflow-hidden">
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
                    {pagedDocResults.map((s: any, i: number) => (
                      <tr key={s.cedula ?? i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{s.cedula}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{formatName(s.nombre, s.primerApellido, s.segundoApellido)}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{s.correo || s.correoElectronico || '—'}</td>
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
            <Pagination page={docPage} total={docResults.length} onChange={setDocPage} />
          </div>
        </div>
      )}
    </div>
  );
}
