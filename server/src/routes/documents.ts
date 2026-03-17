import { Router, Request, Response } from 'express';
import fs from 'fs';
import { uploadDocument } from '../middleware/upload';
import Student from '../models/Student';
import path from 'path';
import { registrarAuditoria, auditFromReq } from '../services/auditService';
import { requireRole } from '../middleware/auth';

const router = Router();

const DOC_LABELS: Record<string, string> = {
  titulo:          'Título de Bachillerato',
  cedulaFrente:    'Cédula (Frente)',
  cedulaReverso:   'Cédula (Reverso)',
  fotoCarnet:      'Foto Carnet',
  formularioMatricula: 'Formulario de Matrícula',
  otros:           'Otros',
};

// POST /api/documents/:cedula/upload/:tipoDoc - Subir documento de un estudiante
router.post('/:cedula/upload/:tipoDoc', requireRole('Administrador', 'Registro'), uploadDocument.single('archivo'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;
    const validTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'];

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

    // Guardar referencia al archivo
    const relativePath = `${cedula}/${req.file.filename}`;
    const updateField = `documentos.${tipoDoc}`;

    await Student.updateOne(
      { cedula },
      {
        $set: {
          [`${updateField}.archivo`]: relativePath,
          [`${updateField}.fechaRevision`]: new Date(),
          // NO cambiar estado automáticamente - las compañeras verifican manualmente
        }
      }
    );

    res.json({
      success: true,
      tipoDocumento: tipoDoc,
      archivo: relativePath,
      message: 'Documento subido. Pendiente de verificación manual.',
    });

    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'SUBIR_ARCHIVO',
      entidad: 'documento',
      entidadId: cedula,
      detalle: `"${DOC_LABELS[tipoDoc] ?? tipoDoc}" subido`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:cedula - Listar documentos de un estudiante
router.get('/:cedula', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ cedula: req.params.cedula })
      .select('cedula nombre primerApellido documentos');

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({
      cedula: student.cedula,
      nombre: `${student.nombre} ${student.primerApellido}`.trim(),
      documentos: student.documentos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documents/:cedula/:tipoDoc - Quitar el archivo digital de un documento
router.delete('/:cedula/:tipoDoc', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;
    const validTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'];

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
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch { /* ignorar error de fs */ }
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
