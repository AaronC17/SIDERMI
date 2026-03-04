import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, GraduationCap, FileCheck, Users, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  const features = [
    { icon: Users, label: 'Gestión de aspirantes', desc: 'Seguimiento completo del proceso de ingreso' },
    { icon: FileCheck, label: 'Verificación documental', desc: 'Control de requisitos y expedientes' },
    { icon: GraduationCap, label: 'Cruzado automático', desc: 'SIGU, Avatar y cortes integrados' },
    { icon: Shield, label: 'Auditoría de cambios', desc: 'Historial de cargas y acciones' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ═══ LEFT PANEL — Branding ═══ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-utn-blue">
        {/* Layered background for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-utn-blue-dark via-utn-blue to-utn-blue-light" />

        {/* Geometric shapes for depth & structure */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle top-right */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border border-white/[0.06]" />
          <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full border border-white/[0.04]" />
          {/* Small circle bottom-left */}
          <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full border border-white/[0.05]" />
          {/* Gold accent glow */}
          <div className="absolute top-1/3 right-0 w-64 h-64 bg-utn-gold/[0.06] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-white/[0.03] rounded-full blur-[80px]" />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          {/* Top — Logo + period */}
          <div>
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-3">
                <img
                  src="/24-UTN.png"
                  alt="UTN"
                  className="w-11 h-11 rounded-xl object-contain bg-white/[0.1] p-1.5 backdrop-blur-sm border border-white/[0.1]"
                />
                <div>
                  <p className="text-sm font-bold text-white/90 leading-tight">UTN</p>
                  <p className="text-[10px] text-white/40">Sede del Pacífico</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-[10px] font-semibold text-utn-gold/80 bg-utn-gold/[0.1] rounded-full border border-utn-gold/[0.15] uppercase tracking-wider">
                  2026-I
                </span>
              </div>
            </div>

            {/* Main title */}
            <div className="max-w-md">
              <p className="text-[11px] text-utn-gold font-semibold uppercase tracking-[0.25em] mb-4">
                Universidad Técnica Nacional
              </p>
              <h1 className="text-5xl xl:text-6xl font-black text-white leading-[0.9] tracking-tight mb-4">
                SIDER<span className="text-utn-gold">MI</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-utn-gold to-utn-gold/20 rounded-full mb-5" />
              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                Sistema Integrado de Datos y Requisitos de Matrícula de Ingreso
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div>
            <div className="grid grid-cols-2 gap-4 mb-12">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-utn-gold/20 to-utn-gold/5 flex items-center justify-center mb-3 group-hover:from-utn-gold/30 group-hover:to-utn-gold/10 transition-all duration-300">
                    <f.icon size={16} className="text-utn-gold" />
                  </div>
                  <p className="text-[13px] font-semibold text-white/85 mb-0.5">{f.label}</p>
                  <p className="text-[11px] text-white/30 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/20">
                © 2026 Universidad Técnica Nacional
              </p>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
                <span className="text-[11px] text-white/30">Sistema activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Login Form ═══ */}
      <div className="flex-1 flex items-center justify-center relative bg-white">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #142D5C 0.5px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-utn-blue/[0.02] rounded-bl-[120px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-utn-gold/[0.02] rounded-tr-[80px]" />

        <div className="relative z-10 w-full max-w-[420px] px-8 sm:px-10">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src="/24-UTN.png"
              alt="UTN"
              className="w-10 h-10 rounded-xl object-contain bg-utn-blue/5 p-1.5"
            />
            <div>
              <h1 className="text-base font-bold text-slate-800">SIDERMI</h1>
              <p className="text-[10px] text-slate-400">UTN Sede del Pacífico</p>
            </div>
          </div>

          {/* Welcome section */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-utn-blue/[0.05] rounded-full mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-utn-blue" />
              <span className="text-[11px] font-medium text-utn-blue/70">Acceso al sistema</span>
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
              Bienvenido
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Ingrese sus credenciales para acceder al panel de gestión
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-slate-700">Usuario</label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'user'
                  ? 'border-utn-blue bg-white shadow-[0_0_0_3px_rgba(20,45,92,0.08)]'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              }`}>
                <User size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focused === 'user' ? 'text-utn-blue' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 bg-transparent rounded-xl text-sm outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-slate-700">Contraseña</label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focused === 'pass'
                  ? 'border-utn-blue bg-white shadow-[0_0_0_3px_rgba(20,45,92,0.08)]'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              }`}>
                <Lock size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
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
                  className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-xl text-sm outline-none placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 bg-utn-blue text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all duration-200 hover:bg-utn-blue-light hover:shadow-xl hover:shadow-utn-blue/15 active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando…
                </span>
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-3">Credenciales de prueba</p>
            <div className="space-y-2">
              {[
                { role: 'Administrador', user: 'admin', pass: 'utn2026' },
                { role: 'Registro', user: 'registro', pass: 'registro2026' },
              ].map((cred) => (
                <div key={cred.role} className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 size={14} className="text-utn-blue/40 shrink-0" />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-600">{cred.role}:</span>
                    <code className="font-mono text-[11px] text-utn-blue/60 bg-utn-blue/[0.04] px-1.5 py-0.5 rounded">{cred.user}</code>
                    <span className="text-slate-300">/</span>
                    <code className="font-mono text-[11px] text-utn-blue/60 bg-utn-blue/[0.04] px-1.5 py-0.5 rounded">{cred.pass}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-10 text-center">
            <p className="text-[10px] text-slate-300">© 2026 Universidad Técnica Nacional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
