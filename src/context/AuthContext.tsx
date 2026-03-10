import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AuthUser {
  username: string;
  nombre: string;
  rol: string;
}

export interface SystemUser {
  username: string;
  password: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  systemUsers: SystemUser[];
  addUser: (u: SystemUser) => void;
  updateUser: (username: string, data: Partial<SystemUser>) => void;
  deleteUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
  systemUsers: [],
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'utn_auth_user';
const USERS_KEY   = 'utn_system_users';

const DEFAULT_USERS: SystemUser[] = [
  { username: 'admin',    password: 'utn2026',      nombre: 'Administrador',       rol: 'Administrador' },
  { username: 'registro', password: 'registro2026', nombre: 'Oficina de Registro', rol: 'Registro' },
];

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadSystemUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch { return DEFAULT_USERS; }
}

function saveSystemUsers(users: SystemUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(loadUser);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(loadSystemUsers);

  const login = useCallback((username: string, password: string): boolean => {
    const users = loadSystemUsers();
    const cred = users.find(u => u.username === username.toLowerCase().trim());
    if (cred && cred.password === password) {
      const u: AuthUser = { username: cred.username, nombre: cred.nombre, rol: cred.rol };
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

  const addUser = useCallback((newUser: SystemUser) => {
    setSystemUsers(prev => {
      const next = [...prev, { ...newUser, username: newUser.username.toLowerCase().trim() }];
      saveSystemUsers(next);
      return next;
    });
  }, []);

  const updateUser = useCallback((username: string, data: Partial<SystemUser>) => {
    setSystemUsers(prev => {
      const next = prev.map(u => u.username === username ? { ...u, ...data } : u);
      saveSystemUsers(next);
      return next;
    });
  }, []);

  const deleteUser = useCallback((username: string) => {
    setSystemUsers(prev => {
      const next = prev.filter(u => u.username !== username);
      saveSystemUsers(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, systemUsers, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}
