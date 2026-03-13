import axios from 'axios';
import type { Student, DashboardStats, PaginatedResponse, UploadResult, UploadHistory } from '../types';

// URL relativa — Vite proxy lo redirige a :4000 en dev; en producción mismo origen
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  return '/api';
};

const API = axios.create({
  baseURL: getApiBase(),
  headers: {
    'bypass-tunnel-reminder': '1',
  },
});

// ── Interceptor: adjuntar JWT a cada request ──
API.interceptors.request.use(config => {
  const token = localStorage.getItem('utn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor: si 401, limpiar sesión ──
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('utn_token');
      localStorage.removeItem('utn_auth_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// === AUTH ===
export const loginApi = (username: string, password: string) =>
  API.post<{ token: string; user: { username: string; nombre: string; rol: string } }>('/auth/login', { username, password }).then(r => r.data);

export const getMe = () =>
  API.get<{ username: string; nombre: string; rol: string }>('/auth/me').then(r => r.data);

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
  return API.post(`/documents/${cedula}/upload/${tipoDoc}`, fd).then(r => r.data);
};

export const getDocuments = (cedula: string) =>
  API.get(`/documents/${cedula}`).then(r => r.data);

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
