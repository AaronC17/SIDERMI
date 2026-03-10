import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Minus,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Edit,
  SlidersHorizontal,
  FileText,
  GraduationCap,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import { getStudents, notificarEstudiante, getDashboard } from '../services/api';
import type { Student, PaginatedResponse, DashboardStats } from '../types';
import { useToast } from '../components/Toast';
import StudentEditModal from './StudentEdit';

/* ── Style maps ── */
const ESTADO_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  PENDIENTE:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200' },
  COMPLETO:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200' },
  ARCHIVADO:  { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   border: 'border-slate-200' },
  LLAMAR:     { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   border: 'border-slate-200' },
  NOTIFICADO: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200' },
};

/* ── Small helpers ── */
function DocDot({ estado, label }: { estado: string; label: string }) {
  const cfg =
    estado === 'COMPLETO'   ? { icon: CheckCircle, cls: 'text-emerald-500' } :
    estado === 'FALTANTE'   ? { icon: XCircle, cls: 'text-red-400' } :
    estado === 'INCOMPLETO' ? { icon: Clock, cls: 'text-amber-400' } :
    { icon: Minus, cls: 'text-slate-300' };
  return (
    <span title={`${label}: ${estado.replace('_', ' ')}`} className={`${cfg.cls} cursor-help`}>
      <cfg.icon size={12} />
    </span>
  );
}

function formatCedula(ced: string): string {
  const c = ced.replace(/\D/g, '');
  if (c.length === 9) return `${c[0]}-${c.slice(1, 5)}-${c.slice(5)}`;
  return ced;
}

function EstadoBadge({ estado }: { estado: string }) {
  const s = ESTADO_STYLE[estado] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {estado}
    </span>
  );
}

/* ══════════════════════════════════════════════ */
export default function Students() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [matriculado, setMatriculado] = useState<'' | 'true' | 'false'>('');
  const [estado, setEstado] = useState('');
  const [tipoMat, setTipoMat] = useState('');
  const [carrera, setCarrera] = useState('');
  const [docFiltro, setDocFiltro] = useState(''); // formato: "falta:titulo" o "tiene:titulo"
  const [sort, setSort] = useState('primerApellido');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const [page, setPage] = useState(1);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { addToast } = useToast();

  /* ── Fetch ── */
  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 10 };
    if (search.trim()) params.buscar = search.trim();
    if (matriculado) params.matriculado = matriculado;
    if (estado) params.estado = estado;
    if (tipoMat) params.tipoMatricula = tipoMat;
    if (carrera) params.carrera = carrera;
    if (docFiltro) {
      const [modo, doc] = docFiltro.split(':');
      if (modo === 'falta') params.docFaltante = doc;
      else if (modo === 'tiene') params.docPresente = doc;
    }
    if (sort) { params.sort = sort; params.order = order; }
    getStudents(params)
      .then(setData)
      .catch(() => addToast('Error al cargar estudiantes', 'error'))
      .finally(() => setLoading(false));
  }, [page, search, matriculado, estado, tipoMat, carrera, docFiltro, sort, order]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getDashboard().then(setStats).catch(() => {});
  }, []);

  /* ── Derived ── */
  const activeFilters = [estado, tipoMat, carrera, docFiltro].filter(Boolean).length;
  const [filtersOpen, setFiltersOpen] = useState(true);

  const clearAll = () => {
    setSearch(''); setMatriculado(''); setEstado(''); setTipoMat(''); setCarrera(''); setDocFiltro('');
    setSort('primerApellido'); setOrder('asc'); setPage(1);
  };

  const handleNotify = async (ced: string) => {
    try { await notificarEstudiante(ced); addToast('Notificación enviada', 'success'); fetchData(); }
    catch { addToast('Error al notificar', 'error'); }
  };

  const toggleSort = (field: string) => {
    if (sort === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort !== field) return <ArrowUpDown size={11} className="text-slate-300" />;
    return order === 'asc'
      ? <ArrowUp size={11} className="text-utn-blue" />
      : <ArrowDown size={11} className="text-utn-blue" />;
  };

  /* ═══ Render ═══ */
  return (
    <div className="space-y-4 fade-up">
      {/* ── Header + métricas ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Estudiantes</h2>
          <p className="text-sm text-slate-400 mt-0.5">Consulta y administración del estado documental de estudiantes</p>
        </div>
        <button
          onClick={() => { setPage(1); fetchData(); getDashboard().then(setStats).catch(() => {}); }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-utn-blue transition-colors self-start mt-1"
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* ── Mini metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total estudiantes', value: stats?.totalEstudiantes ?? data?.pagination.total ?? '—', icon: Users },
          { label: 'Aspirantes',        value: stats?.aspirantesSinMatricula ?? '—',                    icon: UserX },
          { label: 'Matriculados',      value: stats?.matriculados ?? '—',                              icon: UserCheck },
          { label: 'Docs completos',    value: stats?.documentos?.todosCompletos ?? '—',                icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-utn-blue/[0.05] rounded-2xl border border-utn-blue/20 p-3.5 shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-utn-blue/70 uppercase tracking-wider truncate">{label}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-0.5 tracking-tight leading-none">{value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-utn-blue/15 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-utn-blue" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Matriculado / Aspirante segmented control ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-utn-blue/15 shadow-sm w-full sm:w-fit">
        {([
          { val: '' as const,      label: 'Todos',        icon: Users,     count: null },
          { val: 'true' as const,  label: 'Matriculados', icon: UserCheck, count: null },
          { val: 'false' as const, label: 'Aspirantes',   icon: UserX,     count: null },
        ]).map(tab => (
          <button
            key={tab.val}
            onClick={() => { setMatriculado(tab.val); setPage(1); }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
              ${matriculado === tab.val
                ? tab.val === 'true'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : tab.val === 'false'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-utn-blue text-white shadow-md shadow-utn-blue/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-utn-blue/10 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-utn-blue/[0.025]">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-utn-blue/70" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtros</span>
            {activeFilters > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-utn-blue text-white text-[10px] font-bold leading-none">{activeFilters}</span>
            )}
            <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {activeFilters > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={11} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className={`p-3 space-y-2.5 ${filtersOpen ? 'block' : 'hidden'}`}>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-utn-blue/40" />
            <input
              type="text"
              placeholder="Buscar por cédula o nombre…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/15 outline-none transition-all placeholder:text-slate-300"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter selects grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <ClipboardList size={10} /> Estado
              </label>
              <div className={`relative rounded-xl border transition-all ${estado ? 'border-utn-blue/40 bg-utn-blue/[0.04]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                <select
                  value={estado}
                  onChange={e => { setEstado(e.target.value); setPage(1); }}
                  className={`w-full px-3 py-2 text-xs font-medium outline-none cursor-pointer bg-transparent appearance-none pr-7 rounded-xl transition-colors
                    ${estado ? 'text-utn-blue font-semibold' : 'text-slate-500'}`}
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="COMPLETO">Completo</option>
                  <option value="NOTIFICADO">Notificado</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>

            {/* Tipo matrícula */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <ClipboardList size={10} /> Tipo matrícula
              </label>
              <div className={`relative rounded-xl border transition-all ${tipoMat ? 'border-utn-blue/40 bg-utn-blue/[0.04]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                <select
                  value={tipoMat}
                  onChange={e => { setTipoMat(e.target.value); setPage(1); }}
                  className={`w-full px-3 py-2 text-xs font-medium outline-none cursor-pointer bg-transparent appearance-none pr-7 rounded-xl transition-colors
                    ${tipoMat ? 'text-utn-blue font-semibold' : 'text-slate-500'}`}
                >
                  <option value="">Todos</option>
                  <option value="ORDINARIA">Ordinaria</option>
                  <option value="EXTRAORDINARIA">Extraordinaria</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>

            {/* Carrera */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <GraduationCap size={10} /> Carrera
              </label>
              <div className={`relative rounded-xl border transition-all ${carrera ? 'border-utn-blue/40 bg-utn-blue/[0.04]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                <select
                  value={carrera}
                  onChange={e => { setCarrera(e.target.value); setPage(1); }}
                  className={`w-full px-3 py-2 text-xs font-medium outline-none cursor-pointer bg-transparent appearance-none pr-7 rounded-xl transition-colors
                    ${carrera ? 'text-utn-blue font-semibold' : 'text-slate-500'}`}
                >
                  <option value="">Todas</option>
                  {['IEA','IEL','ILE','IPRI','GEHG','GAE','GEC','ITI','COFI','DG','CC-AA','AA'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>

            {/* Documento */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <FileText size={10} /> Documento
              </label>
              <div className={`relative rounded-xl border transition-all ${docFiltro ? 'border-utn-blue/40 bg-utn-blue/[0.04]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                <select
                  value={docFiltro}
                  onChange={e => { setDocFiltro(e.target.value); setPage(1); }}
                  className={`w-full px-3 py-2 text-xs font-medium outline-none cursor-pointer bg-transparent appearance-none pr-7 rounded-xl transition-colors
                    ${docFiltro ? 'text-utn-blue font-semibold' : 'text-slate-500'}`}
                >
                  <option value="">Cualquiera</option>
                  <optgroup label="── Tiene ──">
                    <option value="tiene:titulo">Tiene: Título</option>
                    <option value="tiene:cedulaFrente">Tiene: Céd. Frente</option>
                    <option value="tiene:cedulaReverso">Tiene: Céd. Reverso</option>
                    <option value="tiene:fotoCarnet">Tiene: Foto</option>
                  </optgroup>
                  <optgroup label="── Le falta ──">
                    <option value="falta:titulo">Le falta: Título</option>
                    <option value="falta:cedulaFrente">Le falta: Céd. Frente</option>
                    <option value="falta:cedulaReverso">Le falta: Céd. Reverso</option>
                    <option value="falta:fotoCarnet">Le falta: Foto</option>
                  </optgroup>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden" style={{borderTop: '2px solid rgba(20,45,92,0.15)'}}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-utn-blue rounded-full animate-spin" />
          </div>
        ) : !data?.students.length ? (
          <div className="py-20 text-center">
            <Users size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">No se encontraron estudiantes</p>
            <p className="text-xs text-slate-400 mt-0.5">Ajuste los criterios de búsqueda</p>
          </div>
        ) : (
          <>
            {/* ══ Vista tarjetas — móvil ══ */}
            <div className="md:hidden divide-y divide-slate-100">
              {data.students.map(s => {
                const carreraCode = s.codigoCarrera || s.codigoCarreraAvatar || '—';
                const docs = [
                  s.documentos?.titulo?.estado,
                  s.documentos?.cedulaFrente?.estado,
                  s.documentos?.cedulaReverso?.estado,
                  s.documentos?.fotoCarnet?.estado,
                ];
                const docsTotal = docs.length;
                const docsCompletos = docs.filter(d => d === 'COMPLETO').length;
                const docsPct = Math.round((docsCompletos / docsTotal) * 100);
                return (
                  <div key={s._id} className="px-4 py-3 hover:bg-blue-50/30 transition-colors">
                    {/* Row 1: name + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-[13px] leading-tight truncate">
                          {s.primerApellido} {s.segundoApellido}, {s.nombre}
                        </p>
                        <span className="font-mono text-[11px] font-bold text-utn-blue/80 bg-utn-blue/[0.06] border border-utn-blue/15 px-1.5 py-0.5 rounded-md tracking-wide">
                          {formatCedula(s.cedula)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="Editar estudiante"
                          onClick={() => setEditStudent(s)}
                          className="p-1.5 rounded-lg hover:bg-utn-blue/10 text-slate-400 hover:text-utn-blue transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Notificar por correo"
                          onClick={() => handleNotify(s.cedula)}
                          disabled={!s.correoElectronico}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <Mail size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Row 2: badges */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] border ${
                        s.matriculado
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>{s.matriculado ? 'MATRICULADO' : 'ASPIRANTE'}</span>
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">{carreraCode}</span>
                      <EstadoBadge estado={s.estadoAvatar} />
                      {s.sexo && <span className="text-[11px] font-bold text-slate-500">{s.sexo}</span>}
                    </div>
                    {/* Row 3: docs */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-bold ${
                            docsCompletos === docsTotal ? 'text-emerald-600' :
                            docsCompletos >= 3 ? 'text-amber-600' : 'text-red-500'
                          }`}>{docsCompletos}/{docsTotal} docs</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <DocDot estado={s.documentos?.titulo?.estado || 'NO_REVISADO'} label="Título" />
                          <DocDot estado={s.documentos?.cedulaFrente?.estado || 'NO_REVISADO'} label="Céd. F" />
                          <DocDot estado={s.documentos?.cedulaReverso?.estado || 'NO_REVISADO'} label="Céd. R" />
                          <DocDot estado={s.documentos?.fotoCarnet?.estado || 'NO_REVISADO'} label="Foto" />
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            docsCompletos === docsTotal ? 'bg-emerald-400' :
                            docsCompletos >= 3 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${docsPct}%` }}
                        />
                      </div>
                    </div>
                    {s.correoElectronico && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{s.correoElectronico}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ══ Vista tabla — desktop ══ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)'}} className="border-y border-slate-200">
                    {[
                      { label: 'Cédula', field: 'cedula', w: 'w-36' },
                      { label: 'Estudiante', field: 'primerApellido', w: '' },
                      { label: 'Carrera', field: 'codigoCarrera', w: 'w-20' },
                      { label: 'Sexo', field: 'sexo', w: 'w-14' },
                      { label: 'Estado', field: 'estadoAvatar', w: 'w-28' },
                      { label: 'Documentos', field: '', w: 'w-32' },
                      { label: 'Acciones', field: '', w: 'w-20 text-center' },
                    ].map((col, i) => (
                      <th
                        key={i}
                        className={`text-left font-bold text-slate-500 px-4 py-2.5 text-[10px] uppercase tracking-widest ${col.w} ${col.field ? 'cursor-pointer hover:text-utn-blue select-none' : ''}`}
                        onClick={() => col.field && toggleSort(col.field)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {col.field && <SortIcon field={col.field} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.students.map(s => {
                    const carreraCode = s.codigoCarrera || s.codigoCarreraAvatar || '—';
                    const docs = [
                      s.documentos?.titulo?.estado,
                      s.documentos?.cedulaFrente?.estado,
                      s.documentos?.cedulaReverso?.estado,
                      s.documentos?.fotoCarnet?.estado,
                    ];
                    const docsTotal = docs.length;
                    const docsCompletos = docs.filter(d => d === 'COMPLETO').length;
                    const docsPct = Math.round((docsCompletos / docsTotal) * 100);
                    return (
                      <tr key={s._id} className="h-14 hover:bg-blue-50/40 transition-colors duration-100 group">
                        {/* Cédula */}
                        <td className="px-4 py-2.5 align-middle">
                          <span className="font-mono text-[11px] font-bold text-utn-blue/80 bg-utn-blue/[0.06] border border-utn-blue/15 px-2 py-0.5 rounded-md tracking-wide whitespace-nowrap">
                            {formatCedula(s.cedula)}
                          </span>
                        </td>

                        {/* Estudiante — name + meta line */}
                        <td className="px-4 py-2.5 align-middle">
                          <p className="font-semibold text-slate-800 text-[12px] leading-tight">
                            {s.primerApellido} {s.segundoApellido}, {s.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 overflow-hidden">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] border min-w-[84px] text-center shrink-0 ${
                              s.matriculado
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {s.matriculado ? 'MATRICULADO' : 'ASPIRANTE'}
                            </span>
                            {s.correoElectronico && <span className="truncate max-w-[160px]">{s.correoElectronico}</span>}
                            {s.tipoMatricula && (
                              <span className="font-semibold text-slate-400 min-w-[28px] text-center shrink-0">
                                {s.tipoMatricula === 'ORDINARIA' ? 'Ord.' : 'Ext.'}
                              </span>
                            )}
                          </p>
                        </td>

                        {/* Carrera */}
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">{carreraCode}</span>
                        </td>

                        {/* Sexo */}
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] font-bold text-slate-500">{s.sexo || '—'}</span>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-2.5 align-middle">
                          <EstadoBadge estado={s.estadoAvatar} />
                        </td>

                        {/* Docs */}
                        <td className="px-4 py-2.5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold ${
                                docsCompletos === docsTotal ? 'text-emerald-600' :
                                docsCompletos >= 3 ? 'text-amber-600' : 'text-red-500'
                              }`}>{docsCompletos}/{docsTotal}</span>
                              <div className="flex items-center gap-0.5 ml-2">
                                <DocDot estado={s.documentos?.titulo?.estado || 'NO_REVISADO'} label="Título" />
                                <DocDot estado={s.documentos?.cedulaFrente?.estado || 'NO_REVISADO'} label="Céd. F" />
                                <DocDot estado={s.documentos?.cedulaReverso?.estado || 'NO_REVISADO'} label="Céd. R" />
                                <DocDot estado={s.documentos?.fotoCarnet?.estado || 'NO_REVISADO'} label="Foto" />
                              </div>
                            </div>
                            <div className="h-1 rounded-full bg-slate-100 overflow-hidden w-full">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  docsCompletos === docsTotal ? 'bg-emerald-400' :
                                  docsCompletos >= 3 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${docsPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-1">
                            <button
                              title="Editar estudiante"
                              onClick={() => setEditStudent(s)}
                              className="p-1.5 rounded-lg hover:bg-utn-blue/10 text-slate-400 hover:text-utn-blue transition-colors"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              title="Notificar por correo"
                              onClick={() => handleNotify(s.cedula)}
                              disabled={!s.correoElectronico}
                              className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <Mail size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-[11px] text-slate-500 font-medium">
              {((page - 1) * 10) + 1}–{Math.min(page * 10, data.pagination.total)} de <strong>{data.pagination.total}</strong> estudiantes
            </span>
            <div className="flex items-center gap-0.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(data.pagination.pages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p > data.pagination.pages || p < 1) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all ${p === page ? 'bg-utn-blue text-white' : 'text-slate-500 hover:bg-white'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editStudent && (
        <StudentEditModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={() => { setEditStudent(null); fetchData(); getDashboard().then(setStats).catch(() => {}); }}
        />
      )}
    </div>
  );
}
