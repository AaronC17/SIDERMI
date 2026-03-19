import { X, User, Mail, Phone, FileText, Eye } from 'lucide-react';
import type { Student } from '../types';

interface Props {
  student: Student;
  onClose: () => void;
}

/* ── Carreras reales UTN Sede del Pacífico ── */
const CARRERAS = [
  { codigo: 'IEA', nombre: 'Ingeniería Eléctrica' },
  { codigo: 'IEL', nombre: 'Ingeniería Electrónica' },
  { codigo: 'ILE', nombre: 'Inglés como Lengua Extranjera' },
  { codigo: 'IPRI', nombre: 'Ingeniería en Producción Industrial' },
  { codigo: 'GEHG', nombre: 'Gestión De Empresas De Hospedaje y Gastronómicas' },
  { codigo: 'GAE', nombre: 'Gestión Empresarial - Gestión y Administración Empresarial' },
  { codigo: 'GEC', nombre: 'Gestión de Grupos Turísticos - Gestión Ecoturística' },
  { codigo: 'ITI', nombre: 'Ingeniería En Tecnologías De Información' },
  { codigo: 'COFI', nombre: 'Contabilidad y Finanzas - Contaduría Pública' },
  { codigo: 'DG', nombre: 'Diseño Gráfico' },
  { codigo: 'CC-AA', nombre: 'Campus Coto - Administración Aduanera' },
  { codigo: 'AA', nombre: 'Administración Aduanera' },
];

const DOC_LABELS: Record<string, string> = {
  titulo: 'Título de Bachillerato',
  cedulaFrente: 'Cédula (Frente)',
  cedulaReverso: 'Cédula (Reverso)',
  fotoCarnet: 'Foto Carnet',
  formularioMatricula: 'Formulario de Matrícula',
  otros: 'Otros',
};

const DOC_ESTADO_STYLE: Record<string, string> = {
  NO_REVISADO: 'bg-slate-100 text-slate-600',
  COMPLETO: 'bg-emerald-50 text-emerald-700',
  INCOMPLETO: 'bg-amber-50 text-amber-700',
  FALTANTE: 'bg-red-50 text-red-600',
};

export default function StudentViewModal({ student, onClose }: Props) {
  const carreraNombre = CARRERAS.find(c =>
    c.codigo === student.codigoCarrera ||
    c.codigo === student.codigoCarreraAvatar ||
    c.codigo === student.codigoCarreraManual
  )?.nombre;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-2xl"
        style={{ boxShadow: '0 25px 60px rgba(20,45,92,0.22), 0 8px 24px rgba(20,45,92,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — azul */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(120deg, #142D5C 0%, #1E4680 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">
                {student.nombre} {student.primerApellido} {student.segundoApellido}
              </h3>
              <span className="text-xs font-mono text-white/50">{student.cedula}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">

          {/* ── Información Académica ── */}
          <div>
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-utn-blue/10 flex items-center justify-center">
                <User size={11} className="text-utn-blue" />
              </div>
              Información Académica
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Carrera</p>
                <p className="text-sm font-medium text-slate-700">{student.codigoCarrera || student.codigoCarreraAvatar || student.codigoCarreraManual || '—'}</p>
                {carreraNombre && <p className="text-xs text-slate-500 mt-1">{carreraNombre}</p>}
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Carnet</p>
                <p className="text-sm font-medium text-slate-700">{student.carnet || '—'}</p>
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Tipo Matrícula</p>
                <p className="text-sm font-medium text-slate-700">{student.tipoMatricula || '—'}</p>
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Sexo</p>
                <p className="text-sm font-medium text-slate-700">{student.sexo === 'M' ? 'Masculino' : student.sexo === 'F' ? 'Femenino' : '—'}</p>
              </div>
            </div>
          </div>

          {/* ── Contacto ── */}
          <div>
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3">Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-utn-blue/[0.03] rounded-xl border border-utn-blue/[0.08]">
                <Mail size={14} className="text-utn-blue/50 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold">Correo</p>
                  <p className="text-sm text-slate-700">{student.correoElectronico || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-utn-blue/[0.03] rounded-xl border border-utn-blue/[0.08]">
                <Phone size={14} className="text-utn-blue/50 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold">Teléfono</p>
                  <p className="text-sm text-slate-700">{student.telefono || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Estado ── */}
          <div>
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3">Estado</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Avatar</p>
                <p className="text-sm font-medium text-slate-700">{student.estadoAvatar}</p>
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Fuente</p>
                <p className="text-sm font-medium text-slate-700">{student.fuenteDatos}</p>
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Sede</p>
                <p className="text-sm font-medium text-slate-700">{student.sede || '—'}</p>
              </div>
              <div className="p-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
                <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Verificado</p>
                <p className="text-sm font-medium text-slate-700">{student.verificacionRegistro ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* ── Pago (si existe) ── */}
          {student.monto > 0 && (
            <div className="px-4 py-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10] text-sm text-slate-600">
              <span className="font-semibold text-utn-blue/80">Pago:</span> {student.moneda} {student.monto?.toLocaleString()} —{' '}
              <span className="font-semibold text-utn-blue/80">Recibo:</span> {student.recibo || '—'}
            </div>
          )}

          {/* ── Observaciones ── */}
          {student.observaciones && (
            <div>
              <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-2">Observaciones</h4>
              <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
                {student.observaciones}
              </div>
            </div>
          )}

          {/* ── Documentos ── */}
          <div>
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-utn-blue/10 flex items-center justify-center">
                <FileText size={11} className="text-utn-blue" />
              </div>
              Estado de Documentos
            </h4>
            <div className="space-y-2">
              {Object.entries(DOC_LABELS).map(([key, label]) => {
                const doc = (student.documentos as any)?.[key];
                const estado = doc?.estado || 'NO_REVISADO';
                const tieneArchivo = doc?.tieneArchivo ?? !!doc?.archivo;

                return (
                  <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-xl border bg-utn-blue/[0.025] border-utn-blue/[0.07]">
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-utn-blue/50 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        {doc?.observacion && (
                          <p className="text-xs text-slate-500 mt-0.5">{doc.observacion}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${DOC_ESTADO_STYLE[estado]}`}>
                        {estado.replace('_', ' ')}
                      </span>
                      {tieneArchivo && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Con archivo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact history */}
          {student.historialContactos?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Historial de Contactos</h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {student.historialContactos.map((c, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-400 whitespace-nowrap">
                      {new Date(c.fecha).toLocaleString('es-CR')}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{c.medio}</span>
                    <span className="text-slate-600">{c.detalle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-utn-blue/[0.08] bg-utn-blue/[0.03] rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-utn-blue text-white rounded-xl text-sm font-medium hover:bg-utn-blue-light transition-colors shadow-md shadow-utn-blue/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
