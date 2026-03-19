import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { loginApi, getMe, refreshTokenApi } from '../services/api';

export interface AuthUser {
  username: string;
  nombre: string;
  rol: string;
}

/** @deprecated Kept for type compatibility – Users page now uses backend API */
export interface SystemUser {
  username: string;
  password: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => false,
  logout: () => {},
  refreshSession: async () => false,
});

export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = 'utn_token';
const USER_KEY  = 'utn_auth_user';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Función para esperar con reintento exponencial
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Función para verificar sesión con reintentos
  const verifySession = useCallback(async (retries = MAX_RETRIES): Promise<AuthUser | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const userData = await getMe();
        return { username: userData.username, nombre: userData.nombre, rol: userData.rol };
      } catch (error: any) {
        // Si es un error de autenticación real (401), no reintentar
        if (error.response?.status === 401) {
          const code = error.response?.data?.code;
          // Si el token expiró, intentar refresh
          if (code === 'TOKEN_EXPIRED') {
            try {
              const refreshData = await refreshTokenApi();
              localStorage.setItem(TOKEN_KEY, refreshData.token);
              localStorage.setItem(USER_KEY, JSON.stringify(refreshData.user));
              return refreshData.user;
            } catch {
              // Refresh falló, limpiar sesión
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              return null;
            }
          }
          // Token inválido
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          return null;
        }

        // Error de red - reintentar
        if (attempt < retries - 1) {
          await delay(RETRY_DELAY * (attempt + 1));
        }
      }
    }

    // Si todos los reintentos fallaron, usar datos cached si existen
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Función para refrescar la sesión
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshData = await refreshTokenApi();
      localStorage.setItem(TOKEN_KEY, refreshData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(refreshData.user));
      setUser(refreshData.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Verificación inicial de sesión
  useEffect(() => {
    const initAuth = async () => {
      // Primero, intentar cargar usuario de cache para mostrar UI rápidamente
      const cachedUser = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (cachedUser && token) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // Cache corrupta, continuar con verificación
        }
      }

      if (!token) {
        setLoading(false);
        return;
      }

      // Verificar sesión en el servidor
      const verifiedUser = await verifySession();
      if (verifiedUser) {
        setUser(verifiedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [verifySession]);

  // Verificación periódica del token y refresh automático
  useEffect(() => {
    if (!user) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Verificar y refrescar cada 5 minutos si es necesario
    refreshIntervalRef.current = setInterval(async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const userData = await getMe();
        // Si el servidor indica que debemos refrescar, hacerlo
        if (userData.shouldRefresh) {
          await refreshSession();
        }
      } catch {
        // Error silencioso - el interceptor de axios manejará la renovación
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, refreshSession]);

  // Escuchar cambios en localStorage (otras pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          // Token eliminado en otra pestaña
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          // Token actualizado en otra pestaña
          const cachedUser = localStorage.getItem(USER_KEY);
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {
              // Ignorar
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await loginApi(username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
