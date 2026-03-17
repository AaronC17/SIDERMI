import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Upload from './pages/Upload';
import Stats from './pages/Stats';
import Templates from './pages/Templates';
import DemoLocked from './pages/DemoLocked';
import UploadDemo from './pages/UploadDemo';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function ProtectedRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const canWrite = user?.rol !== 'Consulta';
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-utn-blue/20 border-t-utn-blue rounded-full animate-spin" />
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/estudiantes" element={IS_DEMO ? <DemoLocked /> : <Students />} />
        <Route path="/cargar" element={IS_DEMO ? <UploadDemo /> : (canWrite ? <Upload /> : <Navigate to="/estudiantes" replace />)} />
        <Route path="/estadisticas" element={IS_DEMO ? <DemoLocked /> : <Stats />} />
        <Route path="/plantillas" element={IS_DEMO ? <DemoLocked /> : <Templates />} />
        <Route path="/usuarios" element={IS_DEMO ? <DemoLocked /> : <Users />} />
        <Route path="/auditoria" element={IS_DEMO ? <DemoLocked /> : <AuditLog />} />
      </Route>
    </Routes>
  );
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
