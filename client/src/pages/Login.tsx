import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, GraduationCap, FileCheck, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-utn-blue-dark to-utn-blue relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-utn-gold/[0.04] rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] bg-utn-blue-light/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-white/[0.02] rounded-full blur-2xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Main centered card */}
      <div className="relative z-10 w-full max-w-[920px]">
        <div className="bg-white/[0.97] backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            {/* ── Left: Form ── */}
            <div className="flex-1 p-8 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="relative">
                  <div className="absolute -inset-1 bg-utn-blue/10 rounded-xl blur-sm" />
                  <img
                    src="/24-UTN.png"
                    alt="UTN"
                    className="relative w-12 h-12 rounded-xl object-contain bg-white p-1.5 shadow-md ring-1 ring-slate-200/60"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800 leading-tight">SIDERMI</h1>
                  <p className="text-[11px] text-slate-400">Sistema de Matrícula — UTN Pacífico</p>
                </div>
              </div>

              {/* Title */}
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Iniciar Sesión</h2>
                <p className="text-sm text-slate-400 mt-1">Ingrese sus credenciales para acceder</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm ring-1 ring-red-100">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Usuario</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Nombre de usuario"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/80 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50/80 rounded-xl text-sm border border-slate-200 focus:border-utn-blue focus:ring-2 focus:ring-utn-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-utn-blue text-white rounded-xl text-sm font-semibold hover:bg-utn-blue-light disabled:opacity-60 transition-all shadow-lg shadow-utn-blue/20 active:scale-[0.99] mt-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verificando…
                    </span>
                  ) : (
                    'Ingresar al Sistema'
                  )}
                </button>
              </form>

              {/* Test credentials — compact */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Credenciales de prueba</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                  <span><span className="font-semibold text-slate-600">Admin:</span> <code className="text-[11px] font-mono text-utn-blue/70">admin / utn2026</code></span>
                  <span><span className="font-semibold text-slate-600">Registro:</span> <code className="text-[11px] font-mono text-utn-blue/70">registro / registro2026</code></span>
                </div>
              </div>
            </div>

            {/* ── Right: Info panel ── */}
            <div className="hidden lg:flex lg:w-[360px] bg-gradient-to-br from-utn-blue via-utn-blue to-utn-blue-dark relative flex-col overflow-hidden">
              {/* Decorative */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-utn-gold/[0.07] rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/[0.04] rounded-full blur-xl" />

              <div className="relative z-10 flex flex-col h-full p-10">
                {/* Top badge */}
                <div className="flex items-center gap-2 mb-8">
                  <div className="px-3 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.08] text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                    2026-I
                  </div>
                  <div className="w-1 h-1 rounded-full bg-utn-gold/40" />
                  <div className="px-3 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.08] text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                    Sede Pacífico
                  </div>
                </div>

                {/* Title */}
                <div className="mb-8">
                  <p className="text-[10px] text-utn-gold/50 font-semibold uppercase tracking-[0.2em] mb-2">Universidad Técnica Nacional</p>
                  <h2 className="text-3xl font-extrabold text-white leading-none tracking-tight">
                    SIDERMI
                  </h2>
                  <div className="w-10 h-0.5 bg-gradient-to-r from-utn-gold/50 to-transparent mt-3 rounded-full" />
                  <p className="text-xs text-white/30 mt-3 leading-relaxed">
                    Sistema Integrado de Datos y Requisitos de Matrícula de Ingreso
                  </p>
                </div>

                {/* Feature list */}
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {[
                    { icon: Users, label: 'Gestión de aspirantes', desc: 'Seguimiento completo del proceso' },
                    { icon: FileCheck, label: 'Verificación documental', desc: 'Control de requisitos y expedientes' },
                    { icon: GraduationCap, label: 'Cruzado automático', desc: 'SIGU, Avatar y cortes integrados' },
                    { icon: Shield, label: 'Auditoría de cambios', desc: 'Historial de cargas y acciones' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.1] transition-colors">
                        <f.icon size={14} className="text-utn-gold/60" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white/80 leading-tight">{f.label}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <p className="text-[10px] text-white/15 mt-6">
                  © 2026 Universidad Técnica Nacional
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile branding below card */}
        <div className="lg:hidden text-center mt-6">
          <p className="text-xs text-white/30 font-medium">SIDERMI — UTN Sede del Pacífico</p>
          <p className="text-[10px] text-white/15 mt-1">© 2026 Universidad Técnica Nacional</p>
        </div>
      </div>
    </div>
  );
}
