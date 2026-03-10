import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Users, FileText, BarChart3, Mail, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Users,     label: 'Gestión de Estudiantes',  desc: 'Consulta y actualización del estado de documentos por estudiante' },
  { icon: FileText,  label: 'Carga de Datos SIGU',     desc: 'Importación del padrón oficial y detección de diferencias' },
  { icon: BarChart3, label: 'Reportes de Matrícula',   desc: 'Resumen de pendientes, completos e irregularidades' },
  { icon: Mail,      label: 'Notificaciones',          desc: 'Envío de correos a estudiantes con documentación incompleta' },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Complete todos los campos')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const ok = login(username, password)
      if (!ok) setError('Credenciales incorrectas')
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-card { animation: loginFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* PANEL IZQUIERDO */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between px-8 xl:px-12 py-10 xl:py-14 overflow-hidden"
        style={{ background: 'linear-gradient(170deg, #08111f 0%, #0d1b35 40%, #111f3d 100%)' }}
      >
        {/* Círculos decorativos — más visibles con intención */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/[0.07]" />
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full border border-white/[0.05]" />
        <div className="absolute bottom-16 -left-24 w-96 h-96 rounded-full border border-white/[0.05]" />
        <div className="absolute bottom-16 -left-24 w-64 h-64 rounded-full border border-white/[0.04]" />
        <div className="absolute top-[38%] right-8 w-44 h-44 rounded-full bg-blue-500/[0.03] blur-sm" />

        {/* Logo + nombre */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            <img src="/24-UTN.png" alt="UTN" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-wide">SIDERMI</p>
            <p className="text-[11px] text-white/40">UTN — Sede Pacífico</p>
          </div>
        </div>

        {/* Tagline + módulos */}
        <div className="relative z-10 space-y-6 xl:space-y-8">
          <div>
            <h2 className="text-2xl xl:text-[28px] font-bold text-white/85 leading-tight tracking-tight">
              Gestión de matrícula
            </h2>
            <p className="text-base xl:text-lg text-white/50 font-light mt-1">centralizada y eficiente.</p>
            <div className="mt-4 xl:mt-5 w-10 h-[2px] bg-blue-400/40 rounded-full" />
          </div>

          <div className="space-y-3 xl:space-y-5 -ml-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 group/item cursor-default pl-3 pr-2 py-1 xl:py-1.5 rounded-r-xl border-l-2 border-transparent transition-all duration-300 hover:border-blue-400/50 hover:bg-white/[0.045]">
                <div className="w-6 h-6 xl:w-7 xl:h-7 rounded-lg bg-white/[0.07] border border-white/[0.10] flex items-center justify-center shrink-0 transition-colors duration-200 group-hover/item:bg-white/[0.12] group-hover/item:border-white/[0.18]">
                  <Icon size={12} className="text-blue-300/80 transition-colors duration-200 group-hover/item:text-blue-300" />
                </div>
                <div>
                  <p className="text-xs xl:text-[13px] font-semibold text-white/75 transition-colors duration-200 group-hover/item:text-white/90">{label}</p>
                  <p className="text-[10px] xl:text-[11px] text-white/35 mt-0.5 leading-relaxed transition-colors duration-200 group-hover/item:text-white/45">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-white/20">
          <Shield size={12} />
          <p className="text-[11px]">Universidad Técnica Nacional — Sede Pacífico</p>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div
        className="flex-1 flex items-center justify-center min-h-screen p-4 md:p-6 lg:p-8 overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #f4f6f9 0%, #eef1f6 100%)',
          backgroundImage: 'linear-gradient(135deg, #f4f6f9 0%, #eef1f6 100%), radial-gradient(circle, rgba(14,51,102,0.045) 1px, transparent 1px)',
          backgroundSize: 'auto, 26px 26px',
        }}
      >
        <div className="w-full max-w-[360px] md:max-w-[400px]">

          {/* Card */}
          <div className="login-card bg-white rounded-xl md:rounded-2xl px-5 py-6 md:px-8 md:py-8 lg:px-9 lg:py-10" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(15,31,61,0.10), 0 24px 60px rgba(15,31,61,0.06)' }}>

            {/* Logo + título */}
            <div className="flex flex-col items-center mb-5 md:mb-6 lg:mb-8">
              <div
                className="w-12 h-12 md:w-14 md:h-14 lg:w-[60px] lg:h-[60px] rounded-xl md:rounded-2xl bg-white flex items-center justify-center mb-3 md:mb-4 lg:mb-6"
                style={{ boxShadow: '0 6px 20px rgba(15,31,61,0.18), 0 0 0 1px rgba(15,31,61,0.11), inset 0 1px 0 rgba(255,255,255,0.9)' }}
              >
                <img src="/24-UTN.png" alt="UTN" className="w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 object-contain" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Iniciar sesión</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-1.5 text-center leading-relaxed">Ingrese sus credenciales institucionales</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-5">

              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Usuario</label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: focused === 'user' ? '#3b82f6' : '#94a3b8' }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={() => setFocused('user')}
                    onBlur={() => setFocused(null)}
                    autoComplete="username"
                    placeholder="Nombre de usuario"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm outline-none transition-all duration-200"
                    style={{
                      border: focused === 'user' ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                      boxShadow: focused === 'user' ? '0 0 0 3.5px rgba(59,130,246,0.14), inset 0 1px 3px rgba(59,130,246,0.05)' : 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Contraseña</label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: focused === 'pass' ? '#3b82f6' : '#94a3b8' }}
                  />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused(null)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 text-sm outline-none transition-all duration-200"
                    style={{
                      border: focused === 'pass' ? '1.5px solid #3b82f6' : '1.5px solid #cbd5e1',
                      boxShadow: focused === 'pass' ? '0 0 0 3.5px rgba(59,130,246,0.14), inset 0 1px 3px rgba(59,130,246,0.05)' : 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group/btn w-full py-2.5 md:py-3 lg:py-4 rounded-lg md:rounded-xl text-xs md:text-[13px] lg:text-[13.5px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6e 55%, #1d4ed8 100%)',
                    boxShadow: '0 4px 14px rgba(15,31,61,0.38), 0 8px 28px rgba(37,99,235,0.28)',
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #142D5C 0%, #1e4ba5 55%, #2563eb 100%)'
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,31,61,0.26), 0 12px 32px rgba(37,99,235,0.30)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6e 55%, #1d4ed8 100%)'
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,31,61,0.38), 0 8px 28px rgba(37,99,235,0.28)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verificando…
                    </>
                  ) : (
                    <>Ingresar <ArrowRight size={15} className="transition-transform duration-300 group-hover/btn:translate-x-1" /></>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-3">
                <Shield size={11} className="text-slate-300" />
                <p className="text-[11px] text-slate-400">Acceso seguro — Solo personal autorizado</p>
              </div>

            </form>
          </div>

          <p className="text-center text-[10px] md:text-[11px] text-slate-400/70 mt-4 md:mt-6 lg:mt-8">
            SIDERMI v1.0 — © 2026 Universidad Técnica Nacional
          </p>
        </div>
      </div>
    </div>
  )
}