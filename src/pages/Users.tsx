import { useState } from 'react';
import type { ReactElement } from 'react';
import { UserPlus, Pencil, Trash2, ShieldCheck, UserCog, Eye, EyeOff, X, Save, AlertTriangle } from 'lucide-react';
import { useAuth, type SystemUser } from '../context/AuthContext';

const ROLES = ['Administrador', 'Registro', 'Consulta'];

const ROLE_BADGE: Record<string, string> = {
  Administrador: 'bg-violet-100 text-violet-700 border-violet-200',
  Registro:      'bg-sky-100 text-sky-700 border-sky-200',
  Consulta:      'bg-slate-100 text-slate-600 border-slate-200',
};

const ROLE_ICON: Record<string, ReactElement> = {
  Administrador: <ShieldCheck size={12} />,
  Registro:      <UserCog size={12} />,
  Consulta:      <UserCog size={12} />,
};

type FormData = { username: string; nombre: string; password: string; rol: string };
const EMPTY: FormData = { username: '', nombre: '', password: '', rol: 'Registro' };

export default function Users() {
  const { systemUsers, addUser, updateUser, deleteUser, user: currentUser } = useAuth();

  const [modal, setModal]       = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]   = useState<SystemUser | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [showPwd, setShowPwd]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [errors, setErrors]     = useState<Partial<FormData>>({});

  const isAdmin = currentUser?.rol === 'Administrador';

  /* ── validación ── */
  function validate(data: FormData, isEdit: boolean): boolean {
    const e: Partial<FormData> = {};
    if (!data.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!isEdit) {
      if (!data.username.trim()) e.username = 'El usuario es requerido';
      else if (!/^[a-z0-9_]{3,20}$/.test(data.username))
        e.username = 'Solo letras minúsculas, números y _, 3-20 caracteres';
      else if (systemUsers.some(u => u.username === data.username && u.username !== editing?.username))
        e.username = 'Ese nombre de usuario ya existe';
      if (!data.password) e.password = 'La contraseña es requerida';
    }
    if (data.password && data.password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setErrors({});
    setShowPwd(false);
    setModal('create');
  }

  function openEdit(u: SystemUser) {
    setForm({ username: u.username, nombre: u.nombre, password: '', rol: u.rol });
    setEditing(u);
    setErrors({});
    setShowPwd(false);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditing(null); }

  function handleSave() {
    const isEdit = modal === 'edit';
    if (!validate(form, isEdit)) return;
    if (isEdit && editing) {
      const patch: Partial<SystemUser> = { nombre: form.nombre, rol: form.rol };
      if (form.password) patch.password = form.password;
      updateUser(editing.username, patch);
    } else {
      addUser({ username: form.username.toLowerCase().trim(), nombre: form.nombre.trim(), password: form.password, rol: form.rol });
    }
    closeModal();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.username);
    setDeleteTarget(null);
  }

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuarios del sistema</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestione quién puede acceder a SIDERMI</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-utn-blue text-white text-sm font-semibold rounded-xl hover:bg-utn-blue/90 transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
              {isAdmin && <th className="px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {systemUsers.map(u => (
              <tr key={u.username} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-utn-blue/10 flex items-center justify-center text-utn-blue text-xs font-bold uppercase">
                      {u.nombre.charAt(0)}
                    </div>
                    <span className="font-mono text-slate-700 font-medium">{u.username}</span>
                    {u.username === currentUser?.username && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">Tú</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-700">{u.nombre}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_BADGE[u.rol] ?? ROLE_BADGE['Consulta']}`}>
                    {ROLE_ICON[u.rol]}
                    {u.rol}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-utn-blue hover:bg-utn-blue/8 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      {u.username !== currentUser?.username && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {systemUsers.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">No hay usuarios registrados</div>
        )}
      </div>

      {/* ═══════ Modal crear / editar ═══════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Username (solo en creación) */}
              {modal === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre de usuario</label>
                  <input
                    {...field('username')}
                    placeholder="ej: jperez"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors
                      ${errors.username ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10'}`}
                  />
                  {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                </div>
              )}

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre completo</label>
                <input
                  {...field('nombre')}
                  placeholder="ej: Juan Pérez"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors
                    ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10'}`}
                />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Contraseña {modal === 'edit' && <span className="text-slate-400 normal-case font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <div className="relative">
                  <input
                    {...field('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder={modal === 'create' ? 'Mínimo 6 caracteres' : '••••••••'}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-colors
                      ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Rol */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rol</label>
                <select
                  {...field('rol')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10 transition-colors bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-utn-blue text-white text-sm font-semibold hover:bg-utn-blue/90 transition-colors"
              >
                <Save size={15} />
                {modal === 'create' ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Modal confirmar eliminación ═══════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-800">Eliminar usuario</h3>
              <p className="text-sm text-slate-500">
                ¿Eliminar a <span className="font-semibold text-slate-700">@{deleteTarget.username}</span>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
