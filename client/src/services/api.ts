import axios from 'axios';
import type { Student, DashboardStats, PaginatedResponse, UploadResult, UploadHistory } from '../types';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// === ESTUDIANTES ===
export const getStudents = (params?: Record<string, any>) =>
  API.get<PaginatedResponse>('/students', { params }).then(r => r.data);

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
