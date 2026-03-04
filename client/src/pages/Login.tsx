import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-[#0A1E3D] relative overflow-hidden flex items-center justify-center p-4">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-utn-blue/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-utn-blue-light/8 rounded-full blur-[100px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] fade-up">
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/[0.08] p-8 sm:p-10">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-9">
            <img
              src="/24-UTN.png"
              alt="UTN"
              className="w-10 h-10 rounded-lg object-contain"
            />
            <div className="h-6 w-px bg-white/10" />
            <div>
              <p className="text-sm font-bold text-white/90 leading-none tracking-wide">SIDERMI</p>
              <p className="text-[10px] text-white/30 mt-0.5">UTN — Sede Pacífico</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white/90">Iniciar sesión</h2>
            <p className="text-[13px] text-white/30 mt-1">Ingrese sus credenciales para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 text-red-400 rounded-lg text-[13px] border border-red-500/15">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-white/40 mb-2">Usuario</label>
              <div className="relative">
                <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'user' ? 'text-white/60' : 'text-white/20'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] rounded-lg text-sm text-white/80 border border-white/[0.08] hover:border-white/15 focus:border-white/25 focus:ring-[3px] focus:ring-white/[0.06] focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-white/40 mb-2">Contraseña</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'pass' ? 'text-white/60' : 'text-white/20'}`} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-white/[0.05] rounded-lg text-sm text-white/80 border border-white/[0.08] hover:border-white/15 focus:border-white/25 focus:ring-[3px] focus:ring-white/[0.06] focus:bg-white/[0.07] outline-none transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/25 hover:text-white/50 transition-colors rounded"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-700 rounded-full animate-spin" />
                  Verificando…
                </span>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={15} className="opacity-60" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Version footer */}
        <p className="text-center text-[10px] text-white/15 mt-6">
          SIDERMI v1.0 — © 2026 Universidad Técnica Nacional
        </p>
      </div>
    </div>
  );
}
