// Tipos compartidos del sistema de registro UTN

export interface DocumentoEstado {
  estado: 'COMPLETO' | 'INCOMPLETO' | 'FALTANTE' | 'NO_REVISADO';
  archivo?: string;
  observacion?: string;
  fechaRevision?: string;
}

export interface Student {
  _id: string;
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  correoElectronico: string;
  telefono: string;
  sexo: 'M' | 'F' | '';
  sede: string;
  codigoCarrera: string;
  codigoCarreraAvatar: string;
  codigoCarreraManual: string;
  carnet: string;
  matriculado: boolean;
  tipoMatricula: 'ORDINARIA' | 'EXTRAORDINARIA';
  corteMatricula: string;
  boleta: string;
  moneda: string;
  monto: number;
  fechaPago: string | null;
  estadoPago: string;
  tipoPago: string;
  recibo: string;
  montoPagado: number;
  citaOrdinaria: string;
  citaExtraordinaria: string;
  estadoAvatar: 'PENDIENTE' | 'ARCHIVADO' | 'LLAMAR' | 'NOTIFICADO' | 'COMPLETO';
  verificacionRegistro: boolean;
  identidad: string;
  observaciones: string;
  documentos: {
    titulo: DocumentoEstado;
    cedulaFrente: DocumentoEstado;
    cedulaReverso: DocumentoEstado;
  };
  medioContacto: string;
  fechaContactoCorreo: string | null;
  historialContactos: Array<{
    fecha: string;
    medio: string;
    detalle: string;
  }>;
  fuenteDatos: 'ASPIRANTES' | 'AVATAR' | 'SIGU' | 'MANUAL';
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
}

export interface DashboardStats {
  totalEstudiantes: number;
  porEstado: Record<string, number>;
  porTipoMatricula: Record<string, number>;
  porCarrera: Array<{ carrera: string; cantidad: number }>;
  porSexo: Array<{ sexo: string; cantidad: number }>;
  porSede: Array<{ sede: string; cantidad: number }>;
  verificacionRegistro: { verificados: number; noVerificados: number };
  matriculados: number;
  aspirantesSinMatricula: number;
  documentos: {
    titulo: { completo: number; faltante: number };
    cedulaFrente: { completo: number; faltante: number };
    cedulaReverso: { completo: number; faltante: number };
    todosCompletos: number;
    todosIncompletos: number;
  };
  ultimosUploads: UploadHistory[];
}

export interface UploadHistory {
  _id: string;
  fecha: string;
  tipoArchivo: string;
  tipoMatricula: string;
  nombreArchivo: string;
  registrosTotales: number;
  registrosNuevos: number;
  registrosExistentes: number;
  registrosActualizados: number;
  corte: string;
  detalles: string;
}

export interface UploadResult {
  success: boolean;
  archivo: string;
  registrosTotales: number;
  nuevos: number;
  existentes: number;
  actualizados: number;
  detalles?: string[];
}

export interface PaginatedResponse {
  students: Student[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}
