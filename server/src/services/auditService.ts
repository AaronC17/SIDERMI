import AuditLog from '../models/AuditLog';
import { Request } from 'express';

interface AuditEntry {
  usuario: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: string;
  cambios?: Record<string, { antes: any; despues: any }>;
  ip?: string;
}

/**
 * Registra un evento en la bitácora de auditoría
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      usuario:   entry.usuario,
      accion:    entry.accion,
      entidad:   entry.entidad,
      entidadId: entry.entidadId || '',
      detalle:   entry.detalle || '',
      cambios:   entry.cambios,
      ip:        entry.ip || '',
    });
  } catch (err) {
    // Audit should never break the main flow
    console.error('Error registrando auditoría:', err);
  }
}

/**
 * Helper: extracts username and IP from authenticated request
 */
export function auditFromReq(req: Request) {
  return {
    usuario: req.user?.username || 'sistema',
    ip: req.ip || req.socket.remoteAddress || '',
  };
}
