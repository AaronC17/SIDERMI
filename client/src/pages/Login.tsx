import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError('Credenciales incorrectas');
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
      {/* Soft ambient background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-utn-blue/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-utn-blue/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* ═══ Centered Card ═══ */}
      <div className="relative z-10 w-full max-w-[440px] mx-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/60 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-utn-blue via-utn-blue-light to-utn-blue" />

          <div className="px-8 sm:px-10 pt-8 pb-9">
            {/* Logo + branding */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-utn-blue/[0.06] border border-utn-blue/[0.08] flex items-center justify-center mb-4">
                <img
                  src="/24-UTN.png"
                  alt="UTN"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">SIDERMI</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Sistema de Matrícula — UTN Sede Pacífico</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-7">
              <div className="flex-1 h-px bg-slate-150 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Iniciar sesión</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-[13px] border border-red-100">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-600">Usuario</label>
                <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                  focused === 'user'
                    ? 'border-utn-blue bg-white shadow-[0_0_0_3px_rgba(20,45,92,0.06)]'
                    : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300'
                }`}>
                  <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === 'user' ? 'text-utn-blue' : 'text-slate-350 text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocused('user')}
                    onBlur={() => setFocused(null)}
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    className="w-full pl-10.5 pl-11 pr-4 py-3 bg-transparent rounded-xl text-sm outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-600">Contraseña</label>
                <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                  focused === 'pass'
                    ? 'border-utn-blue bg-white shadow-[0_0_0_3px_rgba(20,45,92,0.06)]'
                    : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300'
                }`}>
                  <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === 'pass' ? 'text-utn-blue' : 'text-slate-400'
                  }`} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3 bg-transparent rounded-xl text-sm outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full py-3 bg-utn-blue text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all duration-200 hover:bg-utn-blue-light hover:shadow-lg hover:shadow-utn-blue/10 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando…
                  </span>
                ) : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2.5 text-center">Credenciales de prueba</p>
              <div className="flex items-center justify-center gap-5 text-xs text-slate-500">
                {[
                  { role: 'Admin', user: 'admin', pass: 'utn2026' },
                  { role: 'Registro', user: 'registro', pass: 'registro2026' },
                ].map((cred) => (
                  <div key={cred.role} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-utn-blue/30" />
                    <span className="font-semibold text-slate-500">{cred.role}:</span>
                    <code className="font-mono text-[11px] text-utn-blue/50">{cred.user} / {cred.pass}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer below card */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400">Universidad Técnica Nacional — Sede del Pacífico</p>
          <p className="text-[10px] text-slate-300 mt-1">© 2026 Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
