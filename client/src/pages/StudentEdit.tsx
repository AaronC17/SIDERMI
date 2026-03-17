import { useState } from 'react';
import { X, Save, Upload as UploadIcon, FileText, User, Mail, Phone, ClipboardList, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { updateStudent, updateDocumentos, uploadDocument, deleteDocument } from '../services/api';
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string | null>>(
    Object.fromEntries(
      Object.entries(student.documentos || {}).map(([k, v]) => [k, v?.archivo ?? null])
    )
  );
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
      const result = await uploadDocument(student.cedula, tipoDoc, file);
      addToast(`Archivo ${DOC_LABELS[tipoDoc] || tipoDoc} subido`, 'success');
      setUploadedFiles(prev => ({ ...prev, [tipoDoc]: result.archivo }));
      setDocs(prev => ({
        ...prev,
        [tipoDoc]: { ...prev[tipoDoc], estado: 'COMPLETO' },
      }));
    } catch {
      addToast('Error al subir archivo', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = async (tipoDoc: string) => {
    setDeleting(tipoDoc);
    try {
      await deleteDocument(student.cedula, tipoDoc);
      addToast('Archivo eliminado', 'success');
      setUploadedFiles(prev => ({ ...prev, [tipoDoc]: null }));
      setDocs(prev => ({
        ...prev,
        [tipoDoc]: { ...prev[tipoDoc], estado: 'NO_REVISADO', observacion: '' },
      }));
    } catch {
      addToast('Error al eliminar archivo', 'error');
    } finally {
      setDeleting(null);
    }
  };

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
              <User size={20} />
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

          {/* ── Info de solo lectura ── */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3 sm:p-4 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Carrera</p>
              <p className="text-sm font-medium text-slate-700">{student.codigoCarrera || student.codigoCarreraAvatar || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Carnet</p>
              <p className="text-sm font-medium text-slate-700">{student.carnet || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Tipo</p>
              <p className="text-sm font-medium text-slate-700">{student.tipoMatricula || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Sexo</p>
              <p className="text-sm font-medium text-slate-700">{student.sexo === 'M' ? 'Masculino' : student.sexo === 'F' ? 'Femenino' : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-utn-blue/50 font-semibold mb-0.5">Fuente</p>
              <p className="text-sm font-medium text-slate-700">{student.fuenteDatos}</p>
            </div>
          </div>

          {/* ── Contacto (solo lectura) ── */}
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

          {student.monto > 0 && (
            <div className="px-4 py-3 bg-utn-blue/[0.04] rounded-xl border border-utn-blue/[0.10] text-sm text-slate-600">
              <span className="font-semibold text-utn-blue/80">Pago:</span> {student.moneda} {student.monto?.toLocaleString()} —{' '}
              <span className="font-semibold text-utn-blue/80">Recibo:</span> {student.recibo || '—'}
            </div>
          )}

          {/* ── Datos editables ── */}
          <div>
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-utn-blue/10 flex items-center justify-center">
                <ClipboardList size={11} className="text-utn-blue" />
              </div>
              Datos Editables
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-utn-blue/70 mb-1 block">Estado Avatar</label>
                <select
                  value={form.estadoAvatar}
                  onChange={e => setForm(f => ({ ...f, estadoAvatar: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 outline-none"
                >
                  {AVATAR_ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-utn-blue/70 mb-1 block">Código Carrera</label>
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
                <label className="text-xs font-medium text-utn-blue/70 mb-1 block">Sexo</label>
                <select
                  value={student.sexo || ''}
                  disabled
                  className="w-full px-3 py-2.5 bg-slate-100 rounded-xl text-sm border border-slate-200 text-slate-500 cursor-not-allowed"
                >
                  <option value="">— Sin especificar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-utn-blue/70 mb-1 block">Observaciones</label>
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
            <h4 className="text-xs font-bold text-utn-blue/70 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-utn-blue/10 flex items-center justify-center">
                <FileText size={11} className="text-utn-blue" />
              </div>
              Verificación de Documentos
            </h4>
            <div className="space-y-2">
              {Object.entries(DOC_LABELS).map(([key, label]) => {
                const tieneArchivo = !!uploadedFiles[key];
                const accionCol = (shrink = false) => (
                  uploading === key ? (
                    <div className={`flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-slate-50 border border-slate-200 ${shrink ? 'shrink-0' : ''}`}>
                      <Loader2 size={12} className="animate-spin text-slate-400" />
                    </div>
                  ) : tieneArchivo ? (
                    <div className={`flex items-center gap-1.5 ${shrink ? 'shrink-0' : ''}`}>
                      <div className="flex items-center justify-center w-[30px] h-[30px] rounded-lg text-emerald-600 bg-emerald-50 border-2 border-emerald-325 shadow-sm">
                        <CheckCircle size={14} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(key)}
                        disabled={deleting === key}
                        className="flex items-center justify-center w-[30px] h-[30px] rounded-lg text-red-500 bg-white border-2 border-red-325 hover:bg-red-50 hover:text-red-600 hover:border-red-400 transition-all disabled:opacity-40 shadow-sm"
                      >
                        {deleting === key ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-1.5 px-3 h-[30px] text-xs font-semibold text-utn-blue bg-utn-blue/5 rounded-lg border border-utn-blue/30 hover:bg-utn-blue/10 hover:border-utn-blue/50 cursor-pointer transition-all shadow-sm whitespace-nowrap ${shrink ? 'shrink-0' : 'w-full'}`}>
                      <UploadIcon size={11} />
                      Subir
                      <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(key, f); e.target.value = ''; }} />
                    </label>
                  )
                );

                return (
                  <div key={key}>
                    {/* Mobile */}
                    <div className={`sm:hidden p-3 rounded-xl border space-y-2 transition-colors ${tieneArchivo ? 'bg-emerald-50/25 border-emerald-200/60' : 'bg-utn-blue/[0.025] border-utn-blue/[0.07]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-700 leading-tight">{label}</span>
                        <select
                          value={docs[key]?.estado || 'NO_REVISADO'}
                          onChange={e => setDocs(d => ({ ...d, [key]: { ...d[key], estado: e.target.value as typeof DOC_ESTADOS[number] } }))}
                          className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${DOC_ESTADO_STYLE[docs[key]?.estado || 'NO_REVISADO']}`}
                        >
                          {DOC_ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          placeholder="Observación…"
                          value={docs[key]?.observacion || ''}
                          onChange={e => setDocs(d => ({ ...d, [key]: { ...d[key], observacion: e.target.value } }))}
                          className="flex-1 px-2.5 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:border-utn-blue outline-none min-w-0"
                        />
                        {accionCol(true)}
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className={`hidden sm:grid grid-cols-[1fr_120px_1fr_68px] gap-2 items-center py-2.5 px-3 rounded-xl border transition-colors ${tieneArchivo ? 'bg-emerald-50/25 border-emerald-200/60' : 'bg-utn-blue/[0.025] border-utn-blue/[0.07] hover:bg-utn-blue/[0.05]'}`}>
                      <span className="text-sm text-slate-700 font-semibold">{label}</span>
                      <select
                        value={docs[key]?.estado || 'NO_REVISADO'}
                        onChange={e => setDocs(d => ({ ...d, [key]: { ...d[key], estado: e.target.value as typeof DOC_ESTADOS[number] } }))}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${DOC_ESTADO_STYLE[docs[key]?.estado || 'NO_REVISADO']}`}
                      >
                        {DOC_ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                      </select>
                      <input
                        placeholder="Observación…"
                        value={docs[key]?.observacion || ''}
                        onChange={e => setDocs(d => ({ ...d, [key]: { ...d[key], observacion: e.target.value } }))}
                        className="px-2 py-1.5 bg-white rounded-lg text-xs border border-slate-200 focus:border-utn-blue outline-none"
                      />
                      {accionCol()}
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
