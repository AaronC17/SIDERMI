import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  usuario: string;       // username del que ejecuta la acción
  accion: string;        // LOGIN, LOGOUT, CREAR, EDITAR, ELIMINAR, IMPORTAR, EXPORTAR, NOTIFICAR, etc.
  entidad: string;       // estudiante, documento, usuario, importacion, zip, etc.
  entidadId: string;     // cédula del estudiante, id del registro, etc.
  detalle: string;       // descripción legible
  cambios?: Record<string, { antes: any; despues: any }>;
  ip?: string;
  fecha: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  usuario:   { type: String, required: true, index: true },
  accion:    { type: String, required: true, index: true },
  entidad:   { type: String, required: true, index: true },
  entidadId: { type: String, default: '' },
  detalle:   { type: String, default: '' },
  cambios:   { type: Schema.Types.Mixed, default: undefined },
  ip:        { type: String, default: '' },
  fecha:     { type: Date, default: Date.now },
});

// TTL index: keep logs for 1 year
AuditLogSchema.index({ fecha: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
