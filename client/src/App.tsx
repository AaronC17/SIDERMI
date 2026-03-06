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
import Users from './pages/Users';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/estudiantes" element={IS_DEMO ? <DemoLocked /> : <Students />} />
        <Route path="/cargar" element={IS_DEMO ? <DemoLocked /> : <Upload />} />
        <Route path="/estadisticas" element={IS_DEMO ? <DemoLocked /> : <Stats />} />
        <Route path="/plantillas" element={IS_DEMO ? <DemoLocked /> : <Templates />} />
        <Route path="/usuarios" element={IS_DEMO ? <DemoLocked /> : <Users />} />
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
