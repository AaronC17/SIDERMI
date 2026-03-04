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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-utn-blue-dark">
      {/* ── Dark textured background ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070e1a] via-utn-blue-dark to-[#0d1b33]" />
        {/* Ambient glow spots */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-utn-blue/[0.12] rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-utn-blue-light/[0.06] rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-utn-blue/[0.05] rounded-full blur-[100px]" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ═══ Centered Card ═══ */}
      <div className="relative z-10 w-full max-w-[440px] mx-4">
        {/* Logo above card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg shadow-black/20">
            <img
              src="/24-UTN.png"
              alt="UTN"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Accede a SIDERMI</h1>
          <p className="text-[13px] text-white/40 mt-1.5">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Card — dark glass */}
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/30 overflow-hidden">
          <div className="px-8 sm:px-9 py-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl text-[13px] border border-red-500/20">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-white/70">Usuario</label>
                <div className={`relative rounded-xl transition-all duration-200 ${
                  focused === 'user'
                    ? 'bg-white/[0.08] border border-utn-blue-light/60 shadow-[0_0_0_3px_rgba(30,70,128,0.2)]'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                }`}>
                  <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === 'user' ? 'text-white/70' : 'text-white/25'
                  }`} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocused('user')}
                    onBlur={() => setFocused(null)}
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent rounded-xl text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-white/70">Contraseña</label>
                <div className={`relative rounded-xl transition-all duration-200 ${
                  focused === 'pass'
                    ? 'bg-white/[0.08] border border-utn-blue-light/60 shadow-[0_0_0_3px_rgba(30,70,128,0.2)]'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]'
                }`}>
                  <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                    focused === 'pass' ? 'text-white/70' : 'text-white/25'
                  }`} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent rounded-xl text-sm text-white outline-none placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 transition-all"
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
                className="group w-full py-3.5 bg-gradient-to-r from-utn-blue to-utn-blue-light text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all duration-200 hover:shadow-[0_0_24px_rgba(30,70,128,0.4)] hover:brightness-125 active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando…
                  </span>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Credentials below card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px]">
          {[
            { role: 'Admin', user: 'admin', pass: 'utn2026' },
            { role: 'Registro', user: 'registro', pass: 'registro2026' },
          ].map((cred) => (
            <div key={cred.role} className="flex items-center gap-1.5 text-white/25">
              <span className="font-semibold text-white/40">{cred.role}:</span>
              <code className="font-mono text-white/30">{cred.user} / {cred.pass}</code>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-white/15">© 2026 SIDERMI — Universidad Técnica Nacional</p>
        </div>
      </div>
    </div>
  );
}
