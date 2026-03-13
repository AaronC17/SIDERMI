import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { UserPlus, Pencil, Trash2, ShieldCheck, UserCog, Eye, EyeOff, X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUserApi, deleteUserApi } from '../services/api';

interface BackendUser {
  username: string;
  nombre: string;
  rol: string;
  activo: boolean;
  ultimoLogin?: string;
  creadoEn?: string;
}

const ROLES = ['Administrador', 'Registro', 'Consulta'];

const ROLE_CONFIG: Record<string, {
  badge: string;
  avatar: string;
  dot: string;
  icon: ReactElement;
  label: string;
}> = {
  Administrador: {
    badge: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    avatar: 'from-violet-500 to-violet-700',
    dot: 'bg-violet-500',
    icon: <ShieldCheck size={11} />,
    label: 'Admin',
  },
  Registro: {
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    avatar: 'from-sky-500 to-sky-700',
    dot: 'bg-sky-500',
    icon: <UserCog size={11} />,
    label: 'Registro',
  },
  Consulta: {
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    avatar: 'from-slate-400 to-slate-600',
    dot: 'bg-slate-400',
    icon: <UserCog size={11} />,
    label: 'Consulta',
  },
};

type FormData = { username: string; nombre: string; password: string; rol: string };
const EMPTY: FormData = { username: '', nombre: '', password: '', rol: 'Registro' };

function getInitials(nombre: string) {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState<BackendUser[]>([]);
  const [fetching, setFetching] = useState(true);

  const [modal, setModal]       = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing]   = useState<BackendUser | null>(null);
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [showPwd, setShowPwd]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackendUser | null>(null);
  const [errors, setErrors]     = useState<Partial<FormData>>({});
  const [saving, setSaving]     = useState(false);

  const isAdmin = currentUser?.rol === 'Administrador';

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch { /* handled by interceptor */ }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function validate(data: FormData, isEdit: boolean): boolean {
    const e: Partial<FormData> = {};
    if (!data.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!isEdit) {
      if (!data.username.trim()) e.username = 'El usuario es requerido';
      else if (!/^[a-z0-9_]{3,20}$/.test(data.username))
        e.username = 'Solo letras minúsculas, números y _, 3-20 caracteres';
      else if (users.some(u => u.username === data.username))
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

  function openEdit(u: BackendUser) {
    setForm({ username: u.username, nombre: u.nombre, password: '', rol: u.rol });
    setEditing(u);
    setErrors({});
    setShowPwd(false);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave() {
    const isEdit = modal === 'edit';
    if (!validate(form, isEdit)) return;
    setSaving(true);
    try {
      if (isEdit && editing) {
        const patch: Record<string, string> = { nombre: form.nombre, rol: form.rol };
        if (form.password) patch.password = form.password;
        await updateUserApi(editing.username, patch);
      } else {
        await createUser({ username: form.username.toLowerCase().trim(), nombre: form.nombre.trim(), password: form.password, rol: form.rol });
      }
      await fetchUsers();
      closeModal();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al guardar';
      setErrors({ username: msg });
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteUserApi(deleteTarget.username);
      await fetchUsers();
      setDeleteTarget(null);
    } catch { /* handled by interceptor */ }
    finally { setSaving(false); }
  }

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.rol === r).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuarios del sistema</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestione quién puede acceder a SIDERMI</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-utn-blue text-white text-sm font-semibold rounded-lg hover:bg-utn-blue/90 transition-colors shadow-sm shadow-utn-blue/20 shrink-0"
          >
            <UserPlus size={15} />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Role summary strip */}
      {!fetching && users.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {ROLES.map(r => {
            const cfg = ROLE_CONFIG[r];
            return (
              <div key={r} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-3.5 py-2 shadow-xs">
                <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                <span className="text-xs font-semibold text-slate-600">{r}</span>
                <span className="text-sm font-extrabold text-slate-800 tabular-nums ml-0.5">{roleCounts[r] ?? 0}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 shadow-xs ml-auto">
            <span className="text-xs font-semibold text-slate-300">Total</span>
            <span className="text-sm font-extrabold text-white tabular-nums">{users.length}</span>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50">Usuario</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50">Nombre completo</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50">Rol</th>
                {isAdmin && <th className="px-5 py-3 bg-slate-50 w-20" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const cfg = ROLE_CONFIG[u.rol] ?? ROLE_CONFIG['Consulta'];
                return (
                  <tr
                    key={u.username}
                    className={`group transition-colors border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-utn-blue/[0.025]`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${cfg.avatar} flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0`}>
                          {getInitials(u.nombre)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-slate-700 font-semibold text-[13px] leading-tight">{u.username}</span>
                          {u.username === currentUser?.username && (
                            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-px rounded font-bold tracking-wide w-fit">TÚ</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium text-[13px]">{u.nombre}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.icon}
                        {u.rol}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-utn-blue hover:bg-utn-blue/8 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          {u.username !== currentUser?.username && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !fetching && (
          <div className="py-16 text-center text-slate-400 text-sm">No hay usuarios registrados</div>
        )}
        {fetching && (
          <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Cargando usuarios…
          </div>
        )}
      </div>

      {/* ═══════ Modal crear / editar ═══════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-utn-blue/10 flex items-center justify-center">
                  {modal === 'create' ? <UserPlus size={14} className="text-utn-blue" /> : <Pencil size={13} className="text-utn-blue" />}
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  {modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {modal === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nombre de usuario</label>
                  <input
                    {...field('username')}
                    placeholder="ej: jperez"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors
                      ${errors.username ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10'}`}
                  />
                  {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Nombre completo</label>
                <input
                  {...field('nombre')}
                  placeholder="ej: Juan Pérez"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors
                    ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10'}`}
                />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                  Contraseña {modal === 'edit' && <span className="text-slate-400 normal-case font-normal text-xs">(vacío = sin cambios)</span>}
                </label>
                <div className="relative">
                  <input
                    {...field('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder={modal === 'create' ? 'Mínimo 6 caracteres' : '••••••••'}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors
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

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Rol</label>
                <select
                  {...field('rol')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/10 transition-colors bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-utn-blue text-white text-sm font-semibold hover:bg-utn-blue/90 transition-colors disabled:opacity-60 shadow-sm shadow-utn-blue/20"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {modal === 'create' ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Modal confirmar eliminación ═══════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Eliminar usuario</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                <p className="text-sm text-slate-600">
                  Se eliminará el usuario <span className="font-mono font-bold text-slate-800">@{deleteTarget.username}</span>
                  {' '}y toda su configuración de acceso.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
