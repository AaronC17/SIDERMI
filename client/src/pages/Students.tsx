import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
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
} from 'lucide-react';
import { getStudents, notificarEstudiante } from '../services/api';
import type { Student, PaginatedResponse } from '../types';
import { useToast } from '../components/Toast';
import StudentEditModal from './StudentEdit';

/* ── Style maps ── */
const ESTADO_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDIENTE:  { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  COMPLETO:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  ARCHIVADO:  { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  LLAMAR:     { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  NOTIFICADO: { bg: 'bg-utn-blue/10', text: 'text-utn-blue', dot: 'bg-utn-blue' },
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
      <cfg.icon size={13} />
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const s = ESTADO_STYLE[estado] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${s.bg} ${s.text}`}>
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
  const [docFaltante, setDocFaltante] = useState('');
  const [sort, setSort] = useState('primerApellido');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const [page, setPage] = useState(1);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const { addToast } = useToast();

  /* ── Fetch ── */
  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 25 };
    if (search.trim()) params.buscar = search.trim();
    if (matriculado) params.matriculado = matriculado;
    if (estado) params.estado = estado;
    if (tipoMat) params.tipoMatricula = tipoMat;
    if (carrera) params.carrera = carrera;
    if (docFaltante) params.docFaltante = docFaltante;
    if (sort) { params.sort = sort; params.order = order; }
    getStudents(params)
      .then(setData)
      .catch(() => addToast('Error al cargar estudiantes', 'error'))
      .finally(() => setLoading(false));
  }, [page, search, matriculado, estado, tipoMat, carrera, docFaltante, sort, order]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived ── */
  const activeFilters = [estado, tipoMat, carrera, docFaltante].filter(Boolean).length;

  const clearAll = () => {
    setSearch(''); setMatriculado(''); setEstado(''); setTipoMat(''); setCarrera(''); setDocFaltante('');
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
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {data ? (
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              <strong className="text-slate-700">{data.pagination.total}</strong> estudiantes
            </span>
          ) : 'Cargando…'}
        </p>
        <button
          onClick={() => { setPage(1); fetchData(); }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-utn-blue transition-colors"
        >
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* ── Matriculado / Aspirante segmented control ── */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/60 shadow-sm w-fit">
        {([
          { val: '' as const,      label: 'Todos',           icon: Users,     count: null },
          { val: 'true' as const,  label: 'Matriculados',    icon: UserCheck, count: null },
          { val: 'false' as const, label: 'Solo Aspirantes', icon: UserX,     count: null },
        ]).map(tab => (
          <button
            key={tab.val}
            onClick={() => { setMatriculado(tab.val); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-3 space-y-2">
        {/* Buscar por cédula */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtros en línea */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={estado}
            onChange={e => { setEstado(e.target.value); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
              ${estado ? 'bg-utn-blue/10 text-utn-blue border-utn-blue/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <option value="">Estado: Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="COMPLETO">Completo</option>
            <option value="NOTIFICADO">Notificado</option>
            <option value="LLAMAR">Llamar</option>
          </select>

          <select
            value={tipoMat}
            onChange={e => { setTipoMat(e.target.value); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
              ${tipoMat ? 'bg-utn-blue/10 text-utn-blue border-utn-blue/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <option value="">Tipo: Todos</option>
            <option value="ORDINARIA">Ordinaria</option>
            <option value="EXTRAORDINARIA">Extraordinaria</option>
          </select>

          <select
            value={carrera}
            onChange={e => { setCarrera(e.target.value); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
              ${carrera ? 'bg-utn-blue/10 text-utn-blue border-utn-blue/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <option value="">Carrera: Todas</option>
            {['IEA','IEL','ILE','IPRI','GEHG','GAE','GEC','ITI','COFI','DG','CC-AA','AA'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={docFaltante}
            onChange={e => { setDocFaltante(e.target.value); setPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
              ${docFaltante ? 'bg-utn-blue/10 text-utn-blue border-utn-blue/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <option value="">Doc: Cualquiera</option>
            <option value="titulo">Título</option>
            <option value="cedulaFrente">Céd. Frente</option>
            <option value="cedulaReverso">Céd. Reverso</option>
            <option value="fotoCarnet">Foto</option>
            <option value="formularioMatricula">Formulario</option>
          </select>

          {activeFilters > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {[
                    { label: 'Cédula', field: 'cedula', w: 'w-28' },
                    { label: 'Estudiante', field: 'primerApellido', w: '' },
                    { label: 'Carrera', field: 'codigoCarrera', w: 'w-24' },
                    { label: 'Sexo', field: 'sexo', w: 'w-16' },
                    { label: 'Estado', field: 'estadoAvatar', w: 'w-28' },
                    { label: 'Docs', field: '', w: 'w-24' },
                    { label: '', field: '', w: 'w-16' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`text-left font-semibold text-slate-400 px-4 py-3 text-[10px] uppercase tracking-wider ${col.w} ${col.field ? 'cursor-pointer hover:text-utn-blue select-none' : ''}`}
                      onClick={() => col.field && toggleSort(col.field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.students.map(s => {
                  const carreraCode = s.codigoCarrera || s.codigoCarreraAvatar || '—';
                  return (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      {/* Cédula */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.cedula}
                        </span>
                      </td>

                      {/* Estudiante — name + meta line */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 text-[13px] leading-tight">
                          {s.primerApellido} {s.segundoApellido}, {s.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${s.matriculado ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {s.matriculado ? 'MATRICULADO' : 'ASPIRANTE'}
                          </span>
                          {s.correoElectronico && <span className="truncate max-w-[160px]">{s.correoElectronico}</span>}
                          {s.tipoMatricula && (
                            <>
                              <span className="text-slate-200">·</span>
                              <span className="font-semibold text-slate-400">{s.tipoMatricula === 'ORDINARIA' ? 'Ord.' : 'Ext.'}</span>
                            </>
                          )}
                        </p>
                      </td>

                      {/* Carrera */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-slate-600">{carreraCode}</span>
                      </td>

                      {/* Sexo */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium text-slate-500">
                          {s.sexo === 'M' ? 'Masc.' : s.sexo === 'F' ? 'Fem.' : '—'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <EstadoBadge estado={s.estadoAvatar} />
                      </td>

                      {/* Docs */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <DocDot estado={s.documentos?.titulo?.estado || 'NO_REVISADO'} label="Título" />
                          <DocDot estado={s.documentos?.cedulaFrente?.estado || 'NO_REVISADO'} label="Céd. F" />
                          <DocDot estado={s.documentos?.cedulaReverso?.estado || 'NO_REVISADO'} label="Céd. R" />
                          <DocDot estado={s.documentos?.fotoCarnet?.estado || 'NO_REVISADO'} label="Foto" />
                          <DocDot estado={s.documentos?.formularioMatricula?.estado || 'NO_REVISADO'} label="Form" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Editar" onClick={() => setEditStudent(s)} className="p-1.5 rounded-lg hover:bg-utn-blue/10 text-slate-400 hover:text-utn-blue transition-colors">
                            <Edit size={13} />
                          </button>
                          <button
                            title="Notificar"
                            onClick={() => handleNotify(s.cedula)}
                            disabled={!s.correoElectronico}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
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
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] text-slate-400">
              {((page - 1) * 25) + 1}–{Math.min(page * 25, data.pagination.total)} de {data.pagination.total}
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
          onSaved={() => { setEditStudent(null); fetchData(); }}
        />
      )}
    </div>
  );
}
