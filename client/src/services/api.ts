import axios, { AxiosError } from 'axios';
import type { Student, DashboardStats, PaginatedResponse, UploadResult, UploadHistory } from '../types';

// Usar la IP actual del navegador para conectar al backend
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  const host = window.location.hostname;
  return `http://${host}:4000/api`;
};

const API = axios.create({
  baseURL: getApiBase(),
  timeout: 30000, // 30 segundos de timeout
});

const TOKEN_KEY = 'utn_token';
const USER_KEY = 'utn_auth_user';

// Control para evitar múltiples refresh simultáneos
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// ── Función para renovar token ──
const refreshToken = async (): Promise<string | null> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await axios.post(
      `${getApiBase()}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const newToken = response.data.token;
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    return newToken;
  } catch {
    return null;
  }
};

// ── Interceptor: adjuntar JWT a cada request ──
API.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor de respuesta con reintentos y refresh automático ──
API.interceptors.response.use(
  async res => {
    // Si el backend indica que debería renovar el token, hacerlo silenciosamente
    if (res.data?.shouldRefresh && !isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshToken();
      await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
    }
    return res;
  },
  async (err: AxiosError<{ error?: string; code?: string }>) => {
    const originalRequest = err.config as any;

    // Error de red o timeout - reintentar hasta 2 veces
    if (!err.response && originalRequest && !originalRequest._retry) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return API(originalRequest);
      }
    }

    // Error 401 - Token expirado o inválido
    if (err.response?.status === 401 && originalRequest) {
      const errorCode = err.response.data?.code;

      // Token expirado - intentar refresh
      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        // Si ya hay un refresh en progreso, esperar
        if (isRefreshing && refreshPromise) {
          const newToken = await refreshPromise;
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return API(originalRequest);
          }
        }

        // Intentar refresh
        isRefreshing = true;
        refreshPromise = refreshToken();
        const newToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      }

      // Si el refresh falló o el token es inválido, hacer logout
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

// === AUTH ===
export const loginApi = (username: string, password: string) =>
  API.post<{ token: string; user: { username: string; nombre: string; rol: string } }>('/auth/login', { username, password }).then(r => r.data);

export const getMe = () =>
  API.get<{ username: string; nombre: string; rol: string; shouldRefresh?: boolean }>('/auth/me').then(r => r.data);

export const refreshTokenApi = () =>
  API.post<{ token: string; user: { username: string; nombre: string; rol: string } }>('/auth/refresh').then(r => r.data);

export const getUsers = () =>
  API.get<any[]>('/auth/users').then(r => r.data);

export const createUser = (data: { username: string; nombre: string; password: string; rol: string }) =>
  API.post('/auth/users', data).then(r => r.data);

export const updateUserApi = (username: string, data: Record<string, any>) =>
  API.put(`/auth/users/${username}`, data).then(r => r.data);

export const deleteUserApi = (username: string) =>
  API.delete(`/auth/users/${username}`).then(r => r.data);

// === AUDITORÍA ===
export const getAuditLogs = (params?: Record<string, any>) =>
  API.get('/audit', { params }).then(r => r.data);

export const getStudentTimeline = (cedula: string) =>
  API.get(`/audit/estudiante/${cedula}`).then(r => r.data);

// === ESTUDIANTES ===
export const getStudents = (params?: Record<string, any>) =>
  API.get<PaginatedResponse>('/students', { params }).then(r => r.data);

// Obtiene todos los estudiantes (aspirantes originales) sin paginar (hasta 2000)
export const getAllAspirants = () =>
  API.get<PaginatedResponse>('/students', { params: { limit: 2000, sort: 'primerApellido' } })
    .then(r => r.data.students);

export const getStudent = (cedula: string) =>
  API.get<Student>(`/students/${cedula}`).then(r => r.data);

export const updateStudent = (cedula: string, data: Partial<Student>) =>
  API.put<Student>(`/students/${cedula}`, data).then(r => r.data);

export const updateDocumentos = (cedula: string, documentos: Record<string, any>) =>
  API.put<Student>(`/students/${cedula}/documentos`, { documentos }).then(r => r.data);

export const notificarEstudiante = (cedula: string, horasRestantes?: number) =>
  API.post(`/students/${cedula}/notificar`, { horasRestantes }).then(r => r.data);

export const notificarMasivo = () =>
  API.post('/students/notificar-masivo').then(r => r.data);

export const deleteStudent = (cedula: string) =>
  API.delete(`/students/${cedula}`).then(r => r.data);

// === UPLOADS ===
export const uploadAspirantes = (file: File) => {
  const fd = new FormData();
  fd.append('archivo', file);
  return API.post<UploadResult>('/uploads/aspirantes', fd).then(r => r.data);
};

export const uploadCorte = (file: File, tipoMatricula: string, corte: string) => {
  const fd = new FormData();
  fd.append('archivo', file);
  fd.append('tipoMatricula', tipoMatricula);
  fd.append('corte', corte);
  return API.post<UploadResult>('/uploads/corte', fd).then(r => r.data);
};

export const uploadAvatar = (file: File, tipoMatricula: string) => {
  const fd = new FormData();
  fd.append('archivo', file);
  fd.append('tipoMatricula', tipoMatricula);
  return API.post<UploadResult>('/uploads/avatar', fd).then(r => r.data);
};

export const uploadAuto = (file: File, tipoMatricula: string, corte: string) => {
  const fd = new FormData();
  fd.append('archivo', file);
  fd.append('tipoMatricula', tipoMatricula);
  fd.append('corte', corte);
  return API.post<UploadResult>('/uploads/auto', fd).then(r => r.data);
};

export const getUploadHistory = () =>
  API.get<UploadHistory[]>('/uploads/historial').then(r => r.data);

export const deleteUploadHistory = (id: string) =>
  API.delete(`/uploads/historial/${id}`).then(r => r.data);

// === DOCUMENTOS ===
export const uploadDocument = (cedula: string, tipoDoc: string, file: File) => {
  const fd = new FormData();
  fd.append('archivo', file);
  return API.post<{ success: boolean; archivo: string; cifrado: boolean }>(`/documents/${cedula}/upload/${tipoDoc}`, fd).then(r => r.data);
};

export const deleteDocument = (cedula: string, tipoDoc: string) =>
  API.delete(`/documents/${cedula}/${tipoDoc}`).then(r => r.data);

export const getDocuments = (cedula: string) =>
  API.get(`/documents/${cedula}`).then(r => r.data);

/**
 * Descarga un documento de un estudiante (requiere rol Admin o Registro)
 * El archivo se descifra en el servidor antes de enviarlo
 */
export const downloadDocument = async (cedula: string, tipoDoc: string) => {
  const response = await API.get(`/documents/${cedula}/download/${tipoDoc}`, {
    responseType: 'blob',
  });

  // Obtener el nombre del archivo del header Content-Disposition
  const contentDisposition = response.headers['content-disposition'];
  let filename = `${tipoDoc}_${cedula}`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?(.+?)"?$/);
    if (match) filename = match[1];
  }

  // Crear enlace de descarga
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// === ESTADÍSTICAS ===
export const getDashboard = () =>
  API.get<DashboardStats>('/stats/dashboard').then(r => r.data);

export const getPendientes = () =>
  API.get('/stats/pendientes').then(r => r.data);

export const getPorDocumento = (tipo: string) =>
  API.get(`/stats/por-documento/${tipo}`).then(r => r.data);

export const descargarCompletos = () =>
  API.post('/stats/descargar-completos', {}, { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expedientes_completos_${new Date().toISOString().split('T')[0]}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  });
