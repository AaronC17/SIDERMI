import mongoose, { Schema, Document } from 'mongoose';

// Estado de un documento individual del estudiante
export interface IDocumentoEstado {
  estado: 'COMPLETO' | 'INCOMPLETO' | 'FALTANTE' | 'NO_REVISADO';
  archivo?: string;        // ruta al archivo subido
  observacion?: string;
  fechaRevision?: Date;
}

// Interfaz principal del Estudiante
export interface IStudent extends Document {
  // === IDENTIFICACIÓN (cédula = ID único) ===
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  correoElectronico: string;
  telefono: string;

  // === SEXO ===
  sexo: 'M' | 'F' | '';

  // === ACADÉMICO ===
  sede: string;
  codigoCarrera: string;
  codigoCarreraAvatar: string;
  codigoCarreraManual: string;
  carnet: string;

  // === MATRÍCULA ===
  matriculado: boolean;           // true = confirmado en Avatar/corte, false = solo aspirante
  tipoMatricula: 'ORDINARIA' | 'EXTRAORDINARIA';
  corteMatricula: string;
  boleta: string;
  moneda: string;
  monto: number;
  fechaPago: Date | null;
  estadoPago: string;
  tipoPago: string;
  recibo: string;
  montoPagado: number;

  // === CITAS ===
  citaOrdinaria: string;
  citaExtraordinaria: string;

  // === ESTADO Y SEGUIMIENTO ===
  estadoAvatar: 'PENDIENTE' | 'ARCHIVADO' | 'LLAMAR' | 'NOTIFICADO' | 'COMPLETO';
  verificacionRegistro: boolean;
  identidad: string;
  observaciones: string;

  // === DOCUMENTOS ===
  documentos: {
    titulo: IDocumentoEstado;
    cedulaFrente: IDocumentoEstado;
    cedulaReverso: IDocumentoEstado;
    fotoCarnet: IDocumentoEstado;
    formularioMatricula: IDocumentoEstado;
    otros: IDocumentoEstado;
  };

  // === CONTACTO ===
  medioContacto: string;
  fechaContactoCorreo: Date | null;
  historialContactos: Array<{
    fecha: Date;
    medio: string;
    detalle: string;
  }>;

  // === FUENTE DE DATOS ===
  fuenteDatos: 'ASPIRANTES' | 'AVATAR' | 'SIGU' | 'MANUAL';

  // === METADATA ===
  fechaCreacion: Date;
  fechaActualizacion: Date;
  activo: boolean;
}

const DocumentoEstadoSchema = new Schema<IDocumentoEstado>({
  estado: {
    type: String,
    enum: ['COMPLETO', 'INCOMPLETO', 'FALTANTE', 'NO_REVISADO'],
    default: 'NO_REVISADO'
  },
  archivo: String,
  observacion: String,
  fechaRevision: Date,
}, { _id: false });

const StudentSchema = new Schema<IStudent>({
  // Identificación
  cedula: { type: String, required: true, unique: true, index: true },
  nombre: { type: String, default: '' },
  primerApellido: { type: String, default: '' },
  segundoApellido: { type: String, default: '' },
  correoElectronico: { type: String, default: '' },
  telefono: { type: String, default: '' },

  // Sexo
  sexo: { type: String, enum: ['M', 'F', ''], default: '' },

  // Académico
  sede: { type: String, default: '' },
  codigoCarrera: { type: String, default: '' },
  codigoCarreraAvatar: { type: String, default: '' },
  codigoCarreraManual: { type: String, default: '' },
  carnet: { type: String, default: '' },

  // Matrícula
  matriculado: { type: Boolean, default: false },
  tipoMatricula: {
    type: String,
    enum: ['ORDINARIA', 'EXTRAORDINARIA'],
    default: 'ORDINARIA'
  },
  corteMatricula: { type: String, default: '' },
  boleta: { type: String, default: '' },
  moneda: { type: String, default: 'COL' },
  monto: { type: Number, default: 0 },
  fechaPago: { type: Date, default: null },
  estadoPago: { type: String, default: '' },
  tipoPago: { type: String, default: '' },
  recibo: { type: String, default: '' },
  montoPagado: { type: Number, default: 0 },

  // Citas
  citaOrdinaria: { type: String, default: '' },
  citaExtraordinaria: { type: String, default: '' },

  // Estado y Seguimiento
  estadoAvatar: {
    type: String,
    enum: ['PENDIENTE', 'ARCHIVADO', 'LLAMAR', 'NOTIFICADO', 'COMPLETO'],
    default: 'PENDIENTE'
  },
  verificacionRegistro: { type: Boolean, default: false },
  identidad: { type: String, default: '' },
  observaciones: { type: String, default: '' },

  // Documentos
  documentos: {
    titulo: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
    cedulaFrente: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
    cedulaReverso: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
    fotoCarnet: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
    formularioMatricula: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
    otros: { type: DocumentoEstadoSchema, default: () => ({ estado: 'NO_REVISADO' }) },
  },

  // Contacto
  medioContacto: { type: String, default: '' },
  fechaContactoCorreo: { type: Date, default: null },
  historialContactos: [{
    fecha: Date,
    medio: String,
    detalle: String,
  }],

  // Fuente
  fuenteDatos: {
    type: String,
    enum: ['ASPIRANTES', 'AVATAR', 'SIGU', 'MANUAL'],
    default: 'MANUAL'
  },

  // Meta
  activo: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' }
});

// Índices para búsquedas frecuentes
StudentSchema.index({ estadoAvatar: 1 });
StudentSchema.index({ tipoMatricula: 1 });
StudentSchema.index({ matriculado: 1 });
StudentSchema.index({ codigoCarrera: 1 });
StudentSchema.index({ 'documentos.titulo.estado': 1 });
StudentSchema.index({ 'documentos.cedulaFrente.estado': 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
