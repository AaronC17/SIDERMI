import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search, ChevronLeft, ChevronRight, Loader2, Filter, X } from 'lucide-react';
import { getAuditLogs } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AuditEntry {
  _id: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: string;
  ip?: string;
  fecha: string;
}

const ACCION_BADGE: Record<string, string> = {
  EDITAR:     'bg-amber-50 text-amber-700 border-amber-200',
  CREAR:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  ELIMINAR:   'bg-red-50 text-red-700 border-red-200',
  IMPORTAR:   'bg-blue-50 text-blue-700 border-blue-200',
  EXPORTAR:   'bg-violet-50 text-violet-700 border-violet-200',
  LOGIN:      'bg-slate-50 text-slate-700 border-slate-200',
  SUBIR_ARCHIVO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ACTUALIZAR_DOCUMENTOS: 'bg-amber-50 text-amber-700 border-amber-200',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

const ENTIDADES_CEDULA = new Set(['estudiante', 'documento']);

function formatEntidadId(entidad: string, id: string): string {
  if (ENTIDADES_CEDULA.has(entidad.toLowerCase())) {
    const c = id.replace(/\D/g, '');
    if (c.length === 9) return `${c[0]}-${c.slice(1, 5)}-${c.slice(5)}`;
  }
  return id;
}

export default function AuditLog() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';

  const [logs, setLogs]         = useState<AuditEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  // Filtros
  const [filterUser, setFilterUser]     = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 25 };
      if (filterUser) params.usuario = filterUser;
      if (filterAccion) params.accion = filterAccion;
      if (filterEntidad) params.entidad = filterEntidad;
      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch { /* interceptor handles 401 */ }
    finally { setLoading(false); }
  }, [page, filterUser, filterAccion, filterEntidad]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function clearFilters() {
    setFilterUser('');
    setFilterAccion('');
    setFilterEntidad('');
    setPage(1);
  }

  const hasFilters = filterUser || filterAccion || filterEntidad;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <ScrollText size={40} strokeWidth={1.5} />
        <p className="text-sm">Solo los administradores pueden ver el registro de auditoría</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ScrollText size={20} className="text-utn-blue" />
            Registro de Auditoría
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} {total === 1 ? 'registro' : 'registros'} en el historial
          </p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || hasFilters
              ? 'bg-utn-blue/5 border-utn-blue/20 text-utn-blue'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={14} />
          Filtros
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-utn-blue" />
          )}
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200/70 p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Usuario</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filterUser}
                onChange={e => { setFilterUser(e.target.value); setPage(1); }}
                placeholder="admin"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-utn-blue focus:ring-1 focus:ring-utn-blue/10"
              />
            </div>
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Acción</label>
            <select
              value={filterAccion}
              onChange={e => { setFilterAccion(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-utn-blue bg-white"
            >
              <option value="">Todas</option>
              <option value="LOGIN">Login</option>
              <option value="EDITAR">Editar</option>
              <option value="CREAR">Crear</option>
              <option value="ELIMINAR">Eliminar</option>
              <option value="IMPORTAR">Importar</option>
              <option value="EXPORTAR">Exportar</option>
              <option value="SUBIR_ARCHIVO">Subir archivo</option>
              <option value="ACTUALIZAR_DOCUMENTOS">Act. documentos</option>
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Entidad</label>
            <select
              value={filterEntidad}
              onChange={e => { setFilterEntidad(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-utn-blue bg-white"
            >
              <option value="">Todas</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="USUARIO">Usuario</option>
              <option value="SESION">Sesión</option>
              <option value="IMPORTACION">Importación</option>
              <option value="DOCUMENTO">Documento</option>
              <option value="REPORTE">Reporte</option>
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entidad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">{formatDate(log.fecha)}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-slate-700">{log.usuario}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      ACCION_BADGE[log.accion] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {log.entidad}
                    {log.entidadId && <span className="text-slate-400 ml-1">({formatEntidadId(log.entidad, log.entidadId)})</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-[300px] truncate">{log.detalle || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Cargando registros…
          </div>
        )}
        {!loading && logs.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">No hay registros de auditoría</div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
