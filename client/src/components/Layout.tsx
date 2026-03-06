import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bell,
  FileDown,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, locked: false, adminOnly: false },
  { to: '/estudiantes', icon: Users, label: 'Estudiantes', locked: true, adminOnly: false },
  { to: '/cargar', icon: Upload, label: 'Cargar Datos', locked: true, adminOnly: false },
  { to: '/plantillas', icon: FileDown, label: 'Plantillas Excel', locked: true, adminOnly: false },
  { to: '/estadisticas', icon: BarChart3, label: 'Estadísticas', locked: true, adminOnly: false },
  { to: '/usuarios', icon: UserCog, label: 'Usuarios', locked: false, adminOnly: true },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/estudiantes': 'Gestión de Estudiantes',
  '/cargar': 'Cargar Datos',
  '/plantillas': 'Generador de Plantillas',
  '/estadisticas': 'Estadísticas y Reportes',
  '/usuarios': 'Gestión de Usuarios',
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || '';

  return (
    <div className="flex min-h-screen bg-utn-surface">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══════ Sidebar ═══════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] lg:w-[250px] xl:w-[260px] bg-utn-blue flex flex-col
          transition-transform duration-200 ease-out lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-2 lg:gap-3 px-4 lg:px-5 h-[64px] lg:h-[72px] border-b border-white/[0.08]">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            <img src="/24-UTN.png" alt="UTN" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-[14px] font-extrabold text-white tracking-wide leading-none">SIDERMI</p>
            <p className="text-[8px] lg:text-[9px] text-white/50 mt-1 font-semibold tracking-wider uppercase">Sistema de Registro y Matrícula</p>
          </div>
          <button className="lg:hidden p-1 text-white/50 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 lg:py-4 px-2 lg:px-3 overflow-y-auto space-y-0.5">
          <p className="text-[8px] lg:text-[9px] uppercase tracking-[0.15em] text-white/45 font-bold px-3 mb-2">
            Menú principal
          </p>
          {NAV_ITEMS.filter(item => !item.adminOnly || user?.rol === 'Administrador').map(item => {
            const isNavLocked = IS_DEMO && item.locked;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-[13.5px] font-semibold transition-all duration-150
                   ${isActive
                    ? 'bg-white/[0.18] text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/[0.08] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 inset-y-[15%] w-[3px] bg-white rounded-r-full" />}
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-md flex items-center justify-center transition-colors
                      ${isActive ? 'bg-white/25 text-white' : 'text-white/60 group-hover:text-white'}`}>
                      <item.icon size={14} className="lg:w-4 lg:h-4" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {!isNavLocked && isActive && <ChevronRight size={14} className="text-white/40" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/[0.08] p-2 lg:p-3">
          <div className="flex items-center gap-2 lg:gap-3 px-2 py-1.5 lg:py-2">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-[10px] lg:text-xs font-bold uppercase">
              {user?.nombre?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] lg:text-[12px] font-semibold text-white/80 truncate">{user?.nombre}</p>
              <p className="text-[9px] lg:text-[10px] text-white/30">{user?.rol}</p>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════ Main content ═══════ */}
      <div className="flex-1 lg:ml-[250px] xl:ml-[260px] min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70 h-14 lg:h-16 flex items-center gap-3 lg:gap-4 px-3 lg:px-6 xl:px-8" style={{boxShadow:'0 1px 2px rgba(0,0,0,0.05), 0 2px 12px rgba(20,45,92,0.08)'}}>
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Page title (desktop) */}
          <h1 className="hidden lg:block text-base xl:text-lg font-bold text-slate-800">{pageTitle}</h1>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-400 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Sistema activo</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 md:p-4 lg:p-6 xl:p-8 max-w-[1440px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
