import { useState } from 'react';
import { X, Save, Upload as UploadIcon, FileText, User, Mail, Phone, ClipboardList } from 'lucide-react';
import { updateStudent, updateDocumentos, uploadDocument } from '../services/api';
import type { Student } from '../types';
import { useToast } from '../components/Toast';

interface Props {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
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
  formularioMatricula: 'Formulario Matrícula',
  otros: 'Otros',
};

const DOC_ESTADOS = ['NO_REVISADO', 'COMPLETO', 'INCOMPLETO', 'FALTANTE'] as const;
const AVATAR_ESTADOS = ['PENDIENTE', 'ARCHIVADO', 'LLAMAR', 'NOTIFICADO', 'COMPLETO'] as const;

const DOC_ESTADO_STYLE: Record<string, string> = {
  NO_REVISADO: 'bg-slate-100 text-slate-600',
  COMPLETO: 'bg-emerald-50 text-emerald-700',
  INCOMPLETO: 'bg-amber-50 text-amber-700',
  FALTANTE: 'bg-red-50 text-red-600',
};

export default function StudentEditModal({ student, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    estadoAvatar: student.estadoAvatar,
    observaciones: student.observaciones || '',
    codigoCarreraManual: student.codigoCarreraManual || student.codigoCarrera || student.codigoCarreraAvatar || '',
    sexo: (student.sexo || '') as '' | 'M' | 'F',
  });

  const [docs, setDocs] = useState(
    Object.fromEntries(
      Object.entries(student.documentos || {}).map(([k, v]) => [
        k,
        { estado: v?.estado || 'NO_REVISADO', observacion: v?.observacion || '' },
      ])
    )
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudent(student.cedula, form);
      await updateDocumentos(student.cedula, docs);
      addToast('Estudiante actualizado', 'success');
      onSaved();
    } catch {
      addToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (tipoDoc: string, file: File) => {
    setUploading(tipoDoc);
    try {
      await uploadDocument(student.cedula, tipoDoc, file);
      addToast(`Archivo ${DOC_LABELS[tipoDoc]} subido`, 'success');
      setDocs(prev => ({
        ...prev,
        [tipoDoc]: { ...prev[tipoDoc], estado: prev[tipoDoc].estado },
      }));
    } catch {
      addToast('Error al subir archivo', 'error');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-utn-blue/10 flex items-center justify-center text-utn-blue">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                {student.nombre} {student.primerApellido} {student.segundoApellido}
              </h3>
              <span className="text-xs font-mono text-slate-400">{student.cedula}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Info de solo lectura ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Carrera</p>
              <p className="text-sm font-medium text-slate-700">{student.codigoCarrera || student.codigoCarreraAvatar || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Carnet</p>
              <p className="text-sm font-medium text-slate-700">{student.carnet || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Tipo</p>
              <p className="text-sm font-medium text-slate-700">{student.tipoMatricula || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Sexo</p>
              <p className="text-sm font-medium text-slate-700">{student.sexo === 'M' ? 'Masculino' : student.sexo === 'F' ? 'Femenino' : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Fuente</p>
              <p className="text-sm font-medium text-slate-700">{student.fuenteDatos}</p>
            </div>
          </div>

          {/* ── Contacto (solo lectura) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Correo</p>
                <p className="text-sm text-slate-700">{student.correoElectronico || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Teléfono</p>
                <p className="text-sm text-slate-700">{student.telefono || '—'}</p>
              </div>
            </div>
          </div>

          {student.monto > 0 && (
            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
              <span className="font-semibold">Pago:</span> {student.moneda} {student.monto?.toLocaleString()} —{' '}
              <span className="font-semibold">Recibo:</span> {student.recibo || '—'}
            </div>
          )}

          {/* ── Datos editables ── */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardList size={13} /> Datos Editables
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Estado Avatar</label>
                <select
                  value={form.estadoAvatar}
                  onChange={e => setForm(f => ({ ...f, estadoAvatar: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                >
                  {AVATAR_ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Código Carrera</label>
                <select
                  value={form.codigoCarreraManual}
                  onChange={e => setForm(f => ({ ...f, codigoCarreraManual: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                >
                  <option value="">— Sin asignar —</option>
                  {CARRERAS.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Sexo</label>
                <select
                  value={form.sexo}
                  onChange={e => setForm(f => ({ ...f, sexo: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                >
                  <option value="">— Sin especificar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Observaciones</label>
              <textarea
                rows={2}
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Agregar notas sobre este estudiante…"
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none resize-none"
              />
            </div>
          </div>

          {/* ── Documentos ── */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={13} /> Verificación de Documentos
            </h4>
            <div className="space-y-1.5">
              {Object.entries(DOC_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_120px_1fr_70px] gap-2 items-center py-2.5 px-3 bg-slate-50/80 rounded-xl border border-slate-100/60"
                >
                  <span className="text-sm text-slate-700">{label}</span>
                  <select
                    value={docs[key]?.estado || 'NO_REVISADO'}
                    onChange={e =>
                      setDocs(d => ({
                        ...d,
                        [key]: { ...d[key], estado: e.target.value as typeof DOC_ESTADOS[number] },
                      }))
                    }
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${DOC_ESTADO_STYLE[docs[key]?.estado || 'NO_REVISADO']}`}
                  >
                    {DOC_ESTADOS.map(e => (
                      <option key={e} value={e}>{e.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Observación…"
                    value={docs[key]?.observacion || ''}
                    onChange={e =>
                      setDocs(d => ({
                        ...d,
                        [key]: { ...d[key], observacion: e.target.value },
                      }))
                    }
                    className="px-2 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:border-utn-blue outline-none"
                  />
                  <label className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-utn-blue bg-utn-blue/5 rounded-lg hover:bg-utn-blue/10 cursor-pointer transition-colors border border-utn-blue/10">
                    <UploadIcon size={11} />
                    {uploading === key ? '…' : 'Subir'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(key, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ))}
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-utn-blue text-white rounded-xl text-sm font-medium hover:bg-utn-blue-light disabled:opacity-50 transition-colors shadow-md shadow-utn-blue/20"
          >
            <Save size={16} /> {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
