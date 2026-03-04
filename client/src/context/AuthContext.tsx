import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthUser {
  username: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ── Credenciales del sistema (en producción usar backend) ── */
const CREDENTIALS: Record<string, { password: string; nombre: string; rol: string }> = {
  admin: { password: 'utn2026', nombre: 'Administrador', rol: 'Administrador' },
  registro: { password: 'registro2026', nombre: 'Oficina de Registro', rol: 'Registro' },
};

const STORAGE_KEY = 'utn_auth_user';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = useCallback((username: string, password: string): boolean => {
    const cred = CREDENTIALS[username.toLowerCase().trim()];
    if (cred && cred.password === password) {
      const u: AuthUser = { username: username.toLowerCase().trim(), nombre: cred.nombre, rol: cred.rol };
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
