import { Router, Request, Response } from 'express';
import fs from 'fs';
import { uploadDocument } from '../middleware/upload';
import Student from '../models/Student';
import path from 'path';
import { registrarAuditoria, auditFromReq } from '../services/auditService';
import { requireRole } from '../middleware/auth';
import { decryptFile, isEncrypted } from '../services/cryptoService';

const router = Router();

const DOC_LABELS: Record<string, string> = {
  titulo:          'Título de Bachillerato',
  cedulaFrente:    'Cédula (Frente)',
  cedulaReverso:   'Cédula (Reverso)',
  fotoCarnet:      'Foto Carnet',
  formularioMatricula: 'Formulario de Matrícula',
  otros:           'Otros',
};

// Tipos MIME para servir archivos
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Filtra información sensible de documentos según el rol del usuario
 */
function filtrarDocumentosPorRol(documentos: any, rol: string) {
  if (rol === 'Consulta') {
    // Para rol Consulta, solo mostrar estado y observación, NO la ruta del archivo
    const filtrados: any = {};
    for (const [tipo, doc] of Object.entries(documentos || {})) {
      const d = doc as any;
      filtrados[tipo] = {
        estado: d?.estado || 'NO_REVISADO',
        observacion: d?.observacion || '',
        fechaRevision: d?.fechaRevision,
        tieneArchivo: !!d?.archivo, // Solo indicar si tiene archivo, no la ruta
      };
    }
    return filtrados;
  }
  // Para Admin y Registro, devolver todo
  return documentos;
}

// POST /api/documents/:cedula/upload/:tipoDoc - Subir documento de un estudiante
router.post('/:cedula/upload/:tipoDoc', requireRole('Administrador', 'Registro'), uploadDocument.single('archivo'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;
    const validTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'];

    // Validar cédula (solo números y guiones)
    if (!/^[\d-]+$/.test(cedula)) {
      return res.status(400).json({ error: 'Cédula inválida' });
    }

    if (!validTypes.includes(tipoDoc)) {
      return res.status(400).json({ error: `Tipo de documento inválido. Use: ${validTypes.join(', ')}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const student = await Student.findOne({ cedula });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Guardar referencia al archivo (cifrado)
    const relativePath = `${cedula}/${req.file.filename}`;
    const updateField = `documentos.${tipoDoc}`;

    await Student.updateOne(
      { cedula },
      {
        $set: {
          [`${updateField}.archivo`]: relativePath,
          [`${updateField}.fechaRevision`]: new Date(),
        }
      }
    );

    res.json({
      success: true,
      tipoDocumento: tipoDoc,
      archivo: relativePath,
      cifrado: true,
      message: 'Documento subido y cifrado. Pendiente de verificación manual.',
    });

    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'SUBIR_ARCHIVO',
      entidad: 'documento',
      entidadId: cedula,
      detalle: `"${DOC_LABELS[tipoDoc] ?? tipoDoc}" subido (cifrado)`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:cedula - Listar documentos de un estudiante (filtrado por rol)
router.get('/:cedula', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.rol || 'Consulta';

    // Validar cédula
    if (!/^[\d-]+$/.test(req.params.cedula)) {
      return res.status(400).json({ error: 'Cédula inválida' });
    }

    const student = await Student.findOne({ cedula: req.params.cedula })
      .select('cedula nombre primerApellido documentos');

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({
      cedula: student.cedula,
      nombre: `${student.nombre} ${student.primerApellido}`.trim(),
      documentos: filtrarDocumentosPorRol(student.documentos, userRole),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:cedula/download/:tipoDoc - Descargar documento (Solo Admin/Registro)
router.get('/:cedula/download/:tipoDoc', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;

    // Validar cédula
    if (!/^[\d-]+$/.test(cedula)) {
      return res.status(400).json({ error: 'Cédula inválida' });
    }

    const student = await Student.findOne({ cedula }).select('documentos');
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const docInfo = (student.documentos as any)[tipoDoc];
    if (!docInfo?.archivo) {
      return res.status(404).json({ error: 'El documento no tiene archivo asociado' });
    }

    const docsDir = path.join(__dirname, '../../documents');
    const filePath = path.join(docsDir, docInfo.archivo);

    // Prevenir path traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(docsDir))) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    // Determinar tipo MIME (quitar .enc si existe)
    let originalName = path.basename(docInfo.archivo);
    if (originalName.endsWith('.enc')) {
      originalName = originalName.slice(0, -4);
    }
    const ext = path.extname(originalName).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    let fileBuffer: Buffer;

    // Descifrar si está cifrado
    if (isEncrypted(filePath)) {
      fileBuffer = decryptFile(filePath);
    } else {
      fileBuffer = fs.readFileSync(filePath);
    }

    // Registrar descarga en auditoría
    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'DESCARGAR',
      entidad: 'documento',
      entidadId: cedula,
      detalle: `"${DOC_LABELS[tipoDoc] ?? tipoDoc}" descargado`,
    });

    // Headers de seguridad
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({ error: 'Error al procesar la descarga' });
  }
});

// DELETE /api/documents/:cedula/:tipoDoc - Quitar el archivo digital de un documento
router.delete('/:cedula/:tipoDoc', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;
    const validTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'];

    // Validar cédula
    if (!/^[\d-]+$/.test(cedula)) {
      return res.status(400).json({ error: 'Cédula inválida' });
    }

    if (!validTypes.includes(tipoDoc)) {
      return res.status(400).json({ error: 'Tipo de documento inválido' });
    }

    const student = await Student.findOne({ cedula });
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const archivoActual = (student.documentos as any)[tipoDoc]?.archivo as string | undefined;

    await Student.updateOne(
      { cedula },
      {
        $unset: { [`documentos.${tipoDoc}.archivo`]: '' },
        $set: {
          [`documentos.${tipoDoc}.estado`]: 'NO_REVISADO',
          [`documentos.${tipoDoc}.observacion`]: '',
          [`documentos.${tipoDoc}.fechaRevision`]: new Date(),
        },
      }
    );

    // Borrar el archivo físico si existe
    if (archivoActual) {
      const docsDir = path.join(__dirname, '../../documents');
      const filePath = path.join(docsDir, archivoActual);

      // Verificar path traversal antes de eliminar
      const resolvedPath = path.resolve(filePath);
      if (resolvedPath.startsWith(path.resolve(docsDir))) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch { /* ignorar error de fs */ }
      }
    }

    res.json({ success: true, message: 'Archivo eliminado y estado reiniciado a NO_REVISADO' });

    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'ELIMINAR_ARCHIVO',
      entidad: 'documento',
      entidadId: cedula,
      detalle: `"${DOC_LABELS[tipoDoc] ?? tipoDoc}" eliminado`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
