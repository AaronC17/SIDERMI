import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadHistory extends Document {
  fecha: Date;
  tipoArchivo: 'ASPIRANTES' | 'AVATAR' | 'CORTE_MATRICULA';
  tipoMatricula: 'ORDINARIA' | 'EXTRAORDINARIA';
  nombreArchivo: string;
  registrosTotales: number;
  registrosNuevos: number;
  registrosExistentes: number;
  registrosActualizados: number;
  corte: string;
  detalles: string;
}

const UploadHistorySchema = new Schema<IUploadHistory>({
  fecha: { type: Date, default: Date.now },
  tipoArchivo: {
    type: String,
    enum: ['ASPIRANTES', 'AVATAR', 'CORTE_MATRICULA'],
    required: true
  },
  tipoMatricula: {
    type: String,
    enum: ['ORDINARIA', 'EXTRAORDINARIA'],
    default: 'ORDINARIA'
  },
  nombreArchivo: { type: String, required: true },
  registrosTotales: { type: Number, default: 0 },
  registrosNuevos: { type: Number, default: 0 },
  registrosExistentes: { type: Number, default: 0 },
  registrosActualizados: { type: Number, default: 0 },
  corte: { type: String, default: '' },
  detalles: { type: String, default: '' },
});

export default mongoose.model<IUploadHistory>('UploadHistory', UploadHistorySchema);
