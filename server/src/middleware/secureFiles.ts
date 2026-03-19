import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireRole } from './auth';
import { decryptFile, isEncrypted } from '../services/cryptoService';
import { registrarAuditoria, auditFromReq } from '../services/auditService';
import Student from '../models/Student';

const router = Router();

// Extensiones y sus tipos MIME
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * GET /secure-files/documents/:cedula/:filename
 * Sirve archivos de documentos de estudiantes con autenticación y descifrado
 */
router.get(
  '/documents/:cedula/:filename',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { cedula, filename } = req.params;
      const userRole = req.user?.rol;

      // El rol Consulta NO puede descargar archivos, solo ver metadatos
      if (userRole === 'Consulta') {
        return res.status(403).json({
          error: 'El rol Consulta no tiene permisos para descargar documentos',
        });
      }

      // Verificar que el estudiante existe
      const student = await Student.findOne({ cedula }).select('cedula documentos');
      if (!student) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }

      // Verificar que el archivo solicitado corresponde a un documento del estudiante
      const documentos = student.documentos as any;
      let archivoValido = false;
      for (const tipo of Object.keys(documentos)) {
        if (documentos[tipo]?.archivo && documentos[tipo].archivo.includes(filename)) {
          archivoValido = true;
          break;
        }
      }

      if (!archivoValido) {
        return res.status(403).json({ error: 'Acceso denegado al archivo solicitado' });
      }

      // Construir ruta del archivo
      const docsDir = path.join(__dirname, '../../documents');
      const filePath = path.join(docsDir, cedula, filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      // Prevenir path traversal
      const resolvedPath = path.resolve(filePath);
      const resolvedDocsDir = path.resolve(docsDir);
      if (!resolvedPath.startsWith(resolvedDocsDir)) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // Determinar tipo MIME
      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      let fileBuffer: Buffer;

      // Si el archivo está cifrado, descifrarlo
      if (isEncrypted(filePath)) {
        fileBuffer = decryptFile(filePath);
      } else {
        // Archivo no cifrado (archivos antiguos o en desarrollo)
        fileBuffer = fs.readFileSync(filePath);
      }

      // Registrar acceso en auditoría
      const { usuario, ip } = auditFromReq(req);
      registrarAuditoria({
        usuario,
        ip,
        accion: 'DESCARGAR',
        entidad: 'documento',
        entidadId: cedula,
        detalle: `Descarga de archivo: ${filename}`,
      });

      // Enviar archivo
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      // Headers de seguridad para la descarga
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      res.send(fileBuffer);
    } catch (error: any) {
      console.error('Error al servir archivo seguro:', error);
      res.status(500).json({ error: 'Error al procesar el archivo' });
    }
  }
);

/**
 * GET /secure-files/uploads/:filename
 * Sirve archivos Excel subidos (solo Admin y Registro)
 */
router.get(
  '/uploads/:filename',
  requireAuth,
  requireRole('Administrador', 'Registro'),
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;

      // Solo permitir archivos Excel
      const ext = path.extname(filename).toLowerCase();
      if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
        return res.status(403).json({ error: 'Tipo de archivo no permitido' });
      }

      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);

      // Prevenir path traversal
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      res.download(filePath);
    } catch (error: any) {
      res.status(500).json({ error: 'Error al descargar archivo' });
    }
  }
);

export default router;
